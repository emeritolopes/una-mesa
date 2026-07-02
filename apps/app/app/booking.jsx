/* ════ UNA MESA · Booking flow · Stitch design system ════ */

const STRIPE_PK      = 'pk_test_51TgPHRDK53YMaqEjST8vqddkOx4ha0Dqk9sFzAy6DV8qWgVPIyBbbwU9iwKvB3SMZqH6benb6brq1nUPpBHbiObo0083nsPCFO';
const SUPA_BASE      = 'https://rkaytcmyaaighozxatod.supabase.co/functions/v1';
const SUPA_PAY_FUNC  = SUPA_BASE + '/stripe-payment';
const SUPA_EMAIL_FUNC= SUPA_BASE + '/send-email';
const SUPA_ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYXl0Y215YWFpZ2hvenhhdG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDU2NDIsImV4cCI6MjA5NjQyMTY0Mn0.8zgAxW2q6JU_PySTQHBfBUHpxlDnz9UVLr6jm981x3s';

const nowMadrid = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
const madridMinutes = nowMadrid.getHours() * 60 + nowMadrid.getMinutes();
const todayMadrid = `${nowMadrid.getFullYear()}-${String(nowMadrid.getMonth()+1).padStart(2,'0')}-${String(nowMadrid.getDate()).padStart(2,'0')}`;
const todayStr = todayMadrid;

function BookingScreen({ rid, presetTime, presetParty, presetDate, back, user, requireAuth, onConfirm }) {
  const data = window.UM_DATA;
  const r = data.find(x=>x.id===rid);

  const startStep = (presetTime && presetParty) ? 3 : (presetTime ? 2 : 0);
  const today = new Date();
  // Parse presetDate (YYYY-MM-DD) at noon local time to avoid UTC-midnight timezone shift
  const initialDay = presetDate ? new Date(presetDate + 'T12:00:00') : (startStep > 0 ? today : null);
  const [step,    setStep]    = useState(startStep);
  const [day,     setDay]     = useState(initialDay);
  const [time,    setTime]    = useState(presetTime || null);
  const [party,   setParty]   = useState(presetParty || 2);
  const [pay,     setPay]     = useState('card');
  const [notify,  setNotify]  = useState('email');
  const [confCode,setConfCode]= useState('');
  const [hold,    setHold]    = useState(360);
  const [expired, setExpired] = useState(false);

  /* ── Stripe state ── */
  const [payLoading, setPayLoading] = useState(false);
  const [payError,   setPayError]   = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [guestName,  setGuestName]  = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const cardNumberRef = useRef(null); // DOM div for Stripe cardNumber element
  const cardExpiryRef = useRef(null); // DOM div for Stripe cardExpiry element
  const cardCvcRef    = useRef(null); // DOM div for Stripe cardCvc element
  const cardElRef     = useRef(null); // { stripe, cardNumber } — live objects

  if (!r) return React.createElement('div',{className:'wrap',style:{padding:'60px 0'}},'Restaurante no encontrado.');

  /* ── Countdown timer ── */
  React.useEffect(()=>{
    if (step!==3) return;
    if (expired) return;
    if (hold<=0){ setExpired(true); return; }
    const id = setTimeout(()=>setHold(h=>h-1), 1000);
    return ()=>clearTimeout(id);
  }, [step, hold, expired]);

  /* ── Mount Stripe card element when step 3 + card method is active ── */
  React.useEffect(() => {
    if (step !== 3 || pay !== 'card') return;
    if (!window.Stripe) return;

    let card = null;
    let mounted = false;

    const mount = () => {
      if (!cardNumberRef.current || !cardExpiryRef.current || !cardCvcRef.current || mounted) return;
      const isDark   = document.documentElement.getAttribute('data-theme') === 'noche';
      const stripe   = window.Stripe(STRIPE_PK);
      const elements = stripe.elements();
      const stripeStyle = {
        style: {
          base: {
            fontSize: '15px',
            fontFamily: '"Manrope", sans-serif',
            color: isDark ? '#FAFAFA' : '#121212',
            '::placeholder': { color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(18,18,18,.35)' },
          },
          invalid: { color: '#FF5733' },
        },
      };
      const cardNumber = elements.create('cardNumber', stripeStyle);
      const cardExpiry = elements.create('cardExpiry', stripeStyle);
      const cardCvc    = elements.create('cardCvc',    stripeStyle);
      cardNumber.mount(cardNumberRef.current);
      cardExpiry.mount(cardExpiryRef.current);
      cardCvc.mount(cardCvcRef.current);
      card = { cardNumber, cardExpiry, cardCvc };
      cardElRef.current = { stripe, cardNumber };
      mounted = true;
    };

    const raf = requestAnimationFrame(mount);
    return () => {
      cancelAnimationFrame(raf);
      if (card && mounted) {
        try { card.cardNumber.unmount(); card.cardExpiry.unmount(); card.cardCvc.unmount(); } catch (_) {}
        cardElRef.current = null;
      }
    };
  }, [step, pay]);

  const mmss   = s => Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  const holdLow = hold<=60;
  const dows   = ['D','L','M','X','J','V','S'];
  const days   = Array.from({length:14},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()+i); return d; });
  const allTimes = [...(r.times.lunch||[]), ...(r.times.dinner||[])];

  // Filtra slots pasados si la fecha seleccionada es hoy (timezone Madrid)
  const selectedDate = day
    ? `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`
    : todayStr;
  const isToday = selectedDate === todayMadrid;
  const passFilter = ([t]) => { const [h,m] = t.split(':').map(Number); return (h*60+m) > madridMinutes+30; };
  const filteredLunch  = isToday ? (r.times.lunch ||[]).filter(passFilter) : (r.times.lunch ||[]);
  const filteredDinner = isToday ? (r.times.dinner||[]).filter(passFilter) : (r.times.dinner||[]);
  const filteredTimes  = [...filteredLunch, ...filteredDinner];
  /* Depósito fijo por reserva — deposit_amount viene en céntimos de Supabase (1000 = 10€) */
  const depositCents = r.deposit_amount || (r.deposit ? r.deposit * 100 : 1000);
  const deposit      = depositCents / 100;   // euros, para mostrar en UI y email

  const goStep = n => { setPayError(''); setStep(n); };

  const finish = (paymentIntentId, code) => {
    const id = code || 'UM-'+Math.random().toString(36).slice(2,7).toUpperCase();
    setConfCode(id);
    const booking = {
      id, rid:r.id, name:r.name, cz:r.cz, glyph:r.glyph, area:r.area,
      day:      day ? day.toISOString() : today.toISOString(),
      dayLabel: day ? (dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)) : 'Hoy',
      time, party, deposit, status:'up', created:Date.now(), member:!!user, notify,
      paymentIntentId: paymentIntentId || null,
    };
    onConfirm(booking);
    setStep(4);
  };

  /* ── Stripe payment orchestration ── */
  const stripeConfirm = async () => {
    /* non-card methods: skip Stripe for now */
    if (pay !== 'card' || !window.Stripe || !cardElRef.current) {
      finish(null);
      return;
    }

    const reservationCode = 'UM-'+Math.random().toString(36).slice(2,7).toUpperCase();
    setPayError('');
    setPayLoading(true);

    try {
      /* 1 · Create PaymentIntent via Edge Function (authorize only — manual capture) */
      const res = await fetch(SUPA_PAY_FUNC, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + SUPA_ANON_KEY,
        },
        body: JSON.stringify({
          amount:         depositCents * party,   // céntimos × personas
          currency:       'eur',
          restaurant_id:  r.id,
          user_id:        user?.id || '',
          reservation_id: reservationCode,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo iniciar el pago');

      const { client_secret, payment_intent_id } = json;

      /* 2 · Confirm card with Stripe.js (result: requires_capture — card not charged yet) */
      const { error } = await cardElRef.current.stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElRef.current.cardNumber,
          billing_details: { address: { postal_code: postalCode, country: 'ES' } },
        },
      });

      if (error) throw new Error(error.message);

      /* 3 · Save reservation to Supabase — non-fatal if it fails */
      if (window.UMAuth && window.UMAuth.saveReservation) {
        try {
          const dateStr = day ? `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}` : todayStr;
          const savedReservation = await window.UMAuth.saveReservation({
            venue_id:          r.id,
            user_id:           user?.id || null,
            customer_name:     user ? (user.name || user.email) : guestName,
            customer_phone:    user ? null : guestPhone || null,
            customer_email:    user ? (user.email || null) : guestEmail || null,
            pax:               party,
            date:              dateStr,
            time:              time,
            status:            'confirmed',
            notes:             null,
            payment_intent_id: payment_intent_id,
          });

          // Crear/actualizar perfil del cliente — non-fatal
          const ucName  = user ? (user.name || user.email) : guestName;
          const ucEmail = user ? (user.email || null) : guestEmail || null;
          const ucPhone = user ? null : guestPhone || null;
          if (ucName || ucEmail) {
            try {
              await window.UMAuth.sb.functions.invoke('upsert-customer', {
                body: {
                  venue_id:       r.id,
                  reservation_id: savedReservation?.id || null,
                  customer_name:  ucName,
                  customer_phone: ucPhone,
                  customer_email: ucEmail,
                }
              });
            } catch(e) { console.warn('upsert-customer:', e.message); }
          }

          // Generar token no-show y enviar email al restaurante — non-fatal, fire-and-forget
          if (savedReservation?.id) {
            (async () => {
              try {
                const { data: token, error: tokenErr } = await window.UMAuth.sb
                  .rpc('generate_noshow_token', { p_reservation_id: savedReservation.id });
                if (tokenErr) { console.warn('[UNA MESA] noshow-token:', tokenErr.message); return; }

                const { data: venue } = await window.UMAuth.sb
                  .from('venues').select('email, name').eq('id', r.id).single();
                if (!venue?.email || !token) return;

                const dayLabel2 = (day || today).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
                const noshowUrl = SUPA_BASE + '/mark-noshow?token=' + token;
                fetch(SUPA_EMAIL_FUNC, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPA_ANON_KEY },
                  body: JSON.stringify({
                    to:              venue.email,
                    customer_name:   user ? (user.name || user.email) : guestName,
                    restaurant_name: r.name,
                    date:            dayLabel2,
                    time,
                    pax:             party,
                    deposit_amount:  depositCents,
                    noshow_url:      noshowUrl,
                  }),
                }).catch(e => console.warn('[UNA MESA] restaurant-email:', e.message));
              } catch(e) { console.warn('[UNA MESA] noshow-flow:', e.message || e); }
            })();
          }
        } catch (e) {
          console.warn('[UNA MESA] saveReservation:', e.message || e);
        }
      }

      /* 4 · Send confirmation email — non-fatal */
      const recipientEmail = user ? user.email : guestEmail;
      if (recipientEmail) {
        const dayLabel = (day || today).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
        fetch(SUPA_EMAIL_FUNC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPA_ANON_KEY },
          body: JSON.stringify({
            to:              recipientEmail,
            customer_name:   user ? (user.name || user.email) : guestName,
            restaurant_name: r.name,
            date:            dayLabel,
            time:            time,
            pax:             party,
            deposit_amount:  depositCents,
            menu_url:        r.menu_url || 'https://www.elbodegonalicante.com/wp-content/uploads/2026/05/carta_el_bodegon_english.pdf',
          }),
        }).catch(e => console.warn('[UNA MESA] send-email:', e.message));
      }

      /* 5 · Authorization OK → finalise booking */
      finish(payment_intent_id, reservationCode);

    } catch (err) {
      setPayError(err.message || 'Error al procesar el pago. Inténtalo de nuevo.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!user && (!guestEmail || !guestName)) {
      setShowGuestForm(true);
      return;
    }
    // Validar que la fecha y hora no son en el pasado
    const nowCheck = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    const requestedDT = new Date(`${selectedDate}T${(time||'').slice(0,5)}:00`);
    if (requestedDT < nowCheck) {
      setPayError('No puedes reservar para una hora que ya ha pasado. Por favor elige una hora futura.');
      return;
    }
    stripeConfirm();
  };

  /* ════ Numbered step indicator ════ */
  const stepDefs = ['Fecha','Hora','Personas','Depósito'];
  const Steps = React.createElement('div', { className:'bk-steps' },
    stepDefs.map((label, i) => React.createElement(React.Fragment, { key:i },
      i > 0 ? React.createElement('div', {
        className:'bk-step-line' + (i <= step ? ' done' : '')
      }) : null,
      React.createElement('div', {
        className:'bk-step-item' + (i < step ? ' done' : i === step ? ' active' : '')
      },
        React.createElement('div', { className:'bk-step-dot' },
          i < step
            ? React.createElement(Icon, {name:'check', style:{width:13,height:13}})
            : String(i+1)
        ),
        React.createElement('span', { className:'bk-step-lbl' }, label)
      )
    ))
  );

  /* ════ Restaurant summary row ════ */
  const RestRow = React.createElement('div', { className:'bk-rest' },
    React.createElement(Photo,{cz:r.cz,glyph:r.glyph}),
    React.createElement('div',null,
      React.createElement('div',{className:'bn'},r.name),
      React.createElement('div',{className:'bm'},r.cuisine+' · '+r.area)));

  /* helper: render a labelled block of time pills */
  const makeTimeSection = (label, times) => times && times.length > 0
    ? React.createElement('div', null,
        React.createElement('p', {className:'bk-time-section'}, label),
        React.createElement('div', {className:'timegrid'},
          times.map(([t,st],i) => React.createElement('button', {
            key:i,
            className:'timecell'+(time===t?' on':'')+(st==='full'?' full':''),
            disabled: st==='full',
            onClick: ()=>{ setTime(t); goStep(2); }
          }, t, st==='few' ? React.createElement('span',{className:'tag'},'Últimas') : null))
        )
      )
    : null;

  /* ════════════════════
     STEP BODIES
  ════════════════════ */
  let body;

  /* ── Step 0 · Date picker ── */
  if (step===0) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},'¿Qué día?'),
      React.createElement('div',{className:'bk-sub'},'Elige la fecha de tu reserva.'),
      React.createElement('div',{className:'dow-row'},
        ['L','M','X','J','V','S','D'].map(d=>React.createElement('span',{key:d},d))),
      React.createElement('div',{className:'daygrid'},
        (() => {
          const firstDow = days[0].getDay();
          const offset = (firstDow + 6) % 7;
          const blanks = Array.from({ length: offset }, (_, i) =>
            React.createElement('div', { key: 'b' + i, style: { visibility: 'hidden' } })
          );
          return [...blanks, ...days.slice(0,14).map((d,i)=>{
            const dow = d.getDay();
            const isSel = day && d.toDateString()===day.toDateString();
            return React.createElement('div',{
              key:i,
              className:'daycell'+(isSel?' on':''),
              onClick:()=>{ setDay(d); goStep(1); }
            },
              React.createElement('span',{className:'dn'}, d.getDate()),
              React.createElement('span',{className:'dw'}, dows[dow]));
          })];
        })()
      ),
      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:back},'Cancelar'),
        React.createElement('button',{className:'btn btn-acc',disabled:!day,onClick:()=>goStep(1)},'Continuar'))
    );

  /* ── Step 1 · Time picker ── */
  } else if (step===1) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},'¿A qué hora?'),
      React.createElement('div',{className:'bk-sub'},
        (day?(dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)):'Hoy')+' · disponibilidad en tiempo real'),
      filteredTimes.length
        ? React.createElement(React.Fragment, null,
            makeTimeSection('Mediodía', filteredLunch),
            makeTimeSection('Noche', filteredDinner)
          )
        : React.createElement('p',{className:'muted'},'Sin horarios para ese día.'),
      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:()=>goStep(0)},'Atrás'),
        React.createElement('button',{className:'btn btn-acc',disabled:!time,onClick:()=>goStep(2)},'Continuar'))
    );

  /* ── Step 2 · Party size ── */
  } else if (step===2) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},'¿Cuántos sois?'),
      React.createElement('div',{className:'bk-sub'},'Número de comensales.'),
      React.createElement('div',{className:'partyrow'},
        React.createElement('button',{className:'party-btn',onClick:()=>setParty(Math.max(1,party-1))},'−'),
        React.createElement('div',null,
          React.createElement('div',{className:'party-n display'},party),
          React.createElement('div',{className:'party-lbl'}, party===1?'comensal':'comensales')),
        React.createElement('button',{className:'party-btn',onClick:()=>setParty(Math.min(12,party+1))},'+')
      ),
      party>=9 ? React.createElement('p',{className:'muted',style:{textAlign:'center',fontSize:'13.5px'}},
        'Para grupos grandes podemos avisar al restaurante con antelación.') : null,
      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:()=>goStep(1)},'Atrás'),
        React.createElement('button',{className:'btn btn-acc',onClick:()=>goStep(3)},'Continuar'))
    );

  /* ── Step 3 · Deposit & payment ── */
  } else if (step===3) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},'Confirma y asegura tu mesa'),
      React.createElement('div',{className:'bk-sub dep-sub'},
        'Un pequeño depósito que se descuenta de tu cuenta final.',
        React.createElement('span',{className:'info-tip',tabIndex:0},
          React.createElement(Icon,{name:'info'}),
          React.createElement('span',{className:'info-pop'},
            React.createElement('b',null,'¿Por qué un depósito?'),
            'Porque "reservo y ya si eso aparezco" se había convertido en deporte nacional. Tranqui, no es un peaje: se ',
            React.createElement('b',null,'descuenta del total'),
            ' de tu cuenta al final. Solo lo pierdes si decides hacerte el fantasma y dejar la mesa vacía.'))),

      /* Countdown */
      expired
        ? React.createElement('div',{className:'hold-timer expired'},
            React.createElement(Icon,{name:'clock'}),
            React.createElement('span',null,'Se acabó el tiempo de reserva. ',
              React.createElement('b',null,'Vuelve a elegir la hora'),' para asegurar tu mesa.'),
            React.createElement('button',{className:'hold-retry',
              onClick:()=>{ setHold(360); setExpired(false); goStep(1); }},'Reintentar'))
        : React.createElement('div',{className:'hold-timer'+(holdLow?' low':'')},
            React.createElement(Icon,{name:'clock'}),
            React.createElement('span',null,'Guardamos tu mesa durante ',
              React.createElement('b',{className:'hold-count'}, mmss(hold)),' minutos. Completa el depósito antes de que acabe.')),

      /* Booking summary */
      React.createElement('div',{className:'dep-box'},
        React.createElement('div',{className:'dep-row'},
          React.createElement('span',null,'Día'),
          React.createElement('span',{style:{fontWeight:700}},
            day?(dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)):'Hoy')),
        React.createElement('div',{className:'dep-row'},
          React.createElement('span',null,'Hora'),
          React.createElement('span',{style:{fontWeight:700}}, time||'—')),
        React.createElement('div',{className:'dep-row'},
          React.createElement('span',null,'Comensales'),
          React.createElement('span',{style:{fontWeight:700}}, party)),
        React.createElement('div',{className:'dep-row'},
          React.createElement('span',null,'Depósito ('+deposit+'€ × '+party+')'),
          React.createElement('span',{className:'amt'}, (deposit * party)+'€')),
        React.createElement('div',{className:'dep-row total'},
          React.createElement('span',null,'A pagar ahora'),
          React.createElement('span',{className:'amt'}, (deposit * party)+'€'))
      ),

      /* Shield note */
      React.createElement('div',{className:'bw-dep',style:{marginBottom:'16px'}},
        React.createElement(Icon,{name:'shield'}),
        React.createElement('span',null,
          'No es un cargo extra: se descuenta del total de tu cuenta. Solo se retiene si dejas la mesa vacía sin avisar.')),

      /* Notification method */
      React.createElement('p',{className:'bk-section-label'},'¿Cómo quieres recibir la confirmación?'),
      React.createElement('div',{className:'pay-methods',style:{marginBottom:'18px'}},
        React.createElement('button',{className:'pay-m'+(notify==='email'?' on':''),onClick:()=>setNotify('email')},
          React.createElement(Icon,{name:'mail'}),'Correo'),
        React.createElement('button',{className:'pay-m'+(notify==='sms'?' on':''),onClick:()=>setNotify('sms')},
          React.createElement(Icon,{name:'phone'}),'SMS')),

      /* Payment method */
      React.createElement('p',{className:'bk-section-label'},'Método de pago'),
      React.createElement('div',{className:'pay-methods'},
        React.createElement('button',{className:'pay-m'+(pay==='card'?' on':''),onClick:()=>setPay('card')},
          React.createElement(Icon,{name:'card'}),'Tarjeta'),
        React.createElement('button',{className:'pay-m'+(pay==='bizum'?' on':''),onClick:()=>setPay('bizum')},
          React.createElement(Icon,{name:'euro'}),'Bizum')),

      /* ── Stripe card elements (separate fields + Spanish postal code) ── */
      pay === 'card' ? React.createElement('div', { style:{marginTop:'18px'} },
        React.createElement('p', { className:'bk-section-label' }, 'Datos de la tarjeta'),
        /* Card number */
        React.createElement('div', {
          ref: cardNumberRef,
          style:{ padding:'12px 14px', border:'1.5px solid var(--bdr)', borderRadius:'10px', background:'var(--surface)', minHeight:'42px' }
        }),
        /* Expiry · CVC · Postal code — row */
        React.createElement('div', { style:{ display:'flex', gap:'10px', marginTop:'10px' } },
          React.createElement('div', {
            ref: cardExpiryRef,
            style:{ flex:'1 1 0', padding:'12px 14px', border:'1.5px solid var(--bdr)', borderRadius:'10px', background:'var(--surface)', minHeight:'42px' }
          }),
          React.createElement('div', {
            ref: cardCvcRef,
            style:{ flex:'1 1 0', padding:'12px 14px', border:'1.5px solid var(--bdr)', borderRadius:'10px', background:'var(--surface)', minHeight:'42px' }
          }),
          React.createElement('input', {
            type:'text', inputMode:'numeric', maxLength:5, pattern:'[0-9]{5}',
            placeholder:'Cód. postal',
            value: postalCode,
            onChange: e => setPostalCode(e.target.value.replace(/\D/g,'').slice(0,5)),
            style:{
              flex:'1 1 0', minWidth:0, padding:'12px 14px',
              border:'1.5px solid var(--bdr)', borderRadius:'10px', background:'var(--surface)',
              color:'var(--ink)', font:'15px "Manrope",sans-serif', outline:'none', boxSizing:'border-box',
            }
          })
        )
      ) : null,

      /* Payment error */
      payError ? React.createElement('p', {
        style:{ color:'var(--coral,#FF5733)', fontSize:'13px', margin:'10px 0 0', lineHeight:1.4 }
      }, payError) : null,

      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:()=>goStep(2),disabled:payLoading},'Atrás'),
        React.createElement('button',{
          className:'btn btn-acc',
          style:{flex:1},
          disabled: expired || payLoading,
          onClick: handleConfirm
        },
          payLoading ? React.createElement(React.Fragment, null,
            React.createElement('span', { style:{opacity:.7} }, 'Procesando…')
          ) :
          expired ? 'Tiempo agotado' :
          user    ? ('Pagar '+deposit+'€ y reservar') :
                    'Continuar como invitado'
        ))
    );

  /* ── Step 4 · Confirmation ── */
  } else {
    body = React.createElement('div', { className:'confirm-card' },
      React.createElement('div',{className:'confirm-ico'},
        React.createElement(Icon,{name:'check'})),
      React.createElement('h2',{className:'display'},'¡Mesa confirmada!'),
      React.createElement('p',{className:'muted',style:{marginBottom:'4px'}},
        'Te esperamos en '+r.name+'. Te hemos enviado los detalles por '+(notify==='sms'?'SMS':'correo electrónico')+'.'),
      React.createElement('div',{className:'confirm-detail'},
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},'Reserva'),
          React.createElement('span',{className:'v'},confCode)),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},'Restaurante'),
          React.createElement('span',{className:'v'},r.name)),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},'Día y hora'),
          React.createElement('span',{className:'v'},
            (day?(dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)):'Hoy')+' · '+time)),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},'Comensales'),
          React.createElement('span',{className:'v'}, party)),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},'Depósito'),
          React.createElement('span',{className:'v',style:{color:'var(--accent)'}}, deposit+'€ — se descuenta del total al llegar.')),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},'Confirmación'),
          React.createElement('span',{className:'v'}, notify==='sms'?'Por SMS':'Por correo electrónico'))
      ),
      React.createElement('div',{className:'bk-actions',style:{justifyContent:'center'}},
        React.createElement('button',{className:'btn btn-ghost',onClick:back},'Volver al inicio'),
        React.createElement('button',{className:'btn btn-acc',
          onClick:()=>onConfirm._goProfile&&onConfirm._goProfile()},'Ver mis reservas'))
    );
  }

  const guestForm = showGuestForm && React.createElement('div', {
    style: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999, padding: 16
    }
  },
    React.createElement('div', {
      style: { background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 360, width: '100%' }
    },
      React.createElement('h3', { style: { fontWeight: 800, fontSize: 17, marginBottom: 6, marginTop: 0 } }, 'Datos para tu reserva'),
      React.createElement('p', { style: { fontSize: 13, color: '#6B7280', marginBottom: 20 } },
        'Necesitamos tus datos para enviarte la confirmación y el link de pago del depósito.'
      ),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        React.createElement('input', {
          type: 'text', placeholder: 'Nombre completo *', value: guestName,
          onChange: e => setGuestName(e.target.value),
          style: { padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none' }
        }),
        React.createElement('input', {
          type: 'email', placeholder: 'Email *', value: guestEmail,
          onChange: e => setGuestEmail(e.target.value),
          style: { padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none' }
        }),
        React.createElement('input', {
          type: 'tel', placeholder: 'Teléfono (opcional)', value: guestPhone,
          onChange: e => setGuestPhone(e.target.value),
          style: { padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none' }
        }),
        React.createElement('button', {
          onClick: () => {
            if (!guestName.trim() || !guestEmail.trim()) return;
            setShowGuestForm(false);
            stripeConfirm();
          },
          style: {
            padding: '14px', borderRadius: 12, background: '#D8552E',
            color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 4
          }
        }, 'Confirmar reserva'),
        React.createElement('button', {
          onClick: () => setShowGuestForm(false),
          style: { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer' }
        }, 'Cancelar')
      )
    )
  );

  return React.createElement('div', { className:'view' },
    guestForm,
    React.createElement('div', { className:'booking' },
      step < 4 ? Steps : null,
      React.createElement('div',{className:'bk-card'}, step<4 ? RestRow : null, body)
    )
  );
}

Object.assign(window, { BookingScreen });
