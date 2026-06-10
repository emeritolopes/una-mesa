/* ════ UNA MESA · Booking flow · Stitch design system ════ */

const STRIPE_PK      = 'pk_test_51TgPHRDK53YMaqEjST8vqddkOx4ha0Dqk9sFzAy6DV8qWgVPIyBbbwU9iwKvB3SMZqH6benb6brq1nUPpBHbiObo0083nsPCFO';
const SUPA_BASE      = 'https://rkaytcmyaaighozxatod.supabase.co/functions/v1';
const SUPA_PAY_FUNC  = SUPA_BASE + '/stripe-payment';
const SUPA_EMAIL_FUNC= SUPA_BASE + '/send-email';
const SUPA_ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYXl0Y215YWFpZ2hvenhhdG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDU2NDIsImV4cCI6MjA5NjQyMTY0Mn0.8zgAxW2q6JU_PySTQHBfBUHpxlDnz9UVLr6jm981x3s';

/* Fecha de hoy YYYY-MM-DD en zona local — evita el retroceso de día de toISOString() (UTC) en España */
const todayStr = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
})();

function BookingScreen({ rid, presetTime, presetParty, back, user, requireAuth, onConfirm }) {
  const data = window.UM_DATA;
  const r = data.find(x=>x.id===rid);

  const startStep = (presetTime && presetParty) ? 3 : (presetTime ? 2 : 0);
  const today = new Date();
  const [step,    setStep]    = useState(startStep);
  const [day,     setDay]     = useState(startStep>0 ? today : null);
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
          amount:         depositCents,   // céntimos, exactamente r.deposit_amount sin modificar
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
          console.log('[DEBUG] selectedDate raw:', day || 'hoy', 'formatted:', dateStr);
          await window.UMAuth.saveReservation({
            venue_id:          r.id,
            user_id:           user?.id || null,
            customer_name:     user ? (user.name || user.email) : 'Invitado',
            customer_phone:    null,
            pax:               party,
            date:              dateStr,
            time:              time,
            status:            'confirmed',
            notes:             null,
            payment_intent_id: payment_intent_id,
          });
        } catch (e) {
          console.warn('[UNA MESA] saveReservation:', e.message || e);
        }
      }

      /* 4 · Send confirmation email — non-fatal */
      const recipientEmail = user && user.email;
      if (recipientEmail) {
        const dayLabel = (day || today).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
        console.log('[EMAIL DEBUG]', { depositCents, deposit_amount: r.deposit_amount, r_deposit: r.deposit });
        fetch(SUPA_EMAIL_FUNC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPA_ANON_KEY },
          body: JSON.stringify({
            to:              recipientEmail,
            customer_name:   user.name || user.email,
            restaurant_name: r.name,
            date:            dayLabel,
            time:            time,
            pax:             party,
            deposit_amount:  depositCents,
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

  const confirm = () => {
    if (!user) { requireAuth(()=>stripeConfirm()); return; }
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
        days.slice(0,14).map((d,i)=>{
          const dow = d.getDay();
          const isSel = day && d.toDateString()===day.toDateString();
          return React.createElement('div',{
            key:i,
            className:'daycell'+(isSel?' on':''),
            onClick:()=>{ setDay(d); goStep(1); }
          },
            React.createElement('span',{className:'dn'}, d.getDate()),
            React.createElement('span',{className:'dw'}, dows[dow]));
        })),
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
      allTimes.length
        ? React.createElement(React.Fragment, null,
            makeTimeSection('Mediodía', r.times.lunch),
            makeTimeSection('Noche', r.times.dinner)
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
          React.createElement('span',null,'Depósito (10€ × '+party+')'),
          React.createElement('span',{className:'amt'}, deposit+'€')),
        React.createElement('div',{className:'dep-row total'},
          React.createElement('span',null,'A pagar ahora'),
          React.createElement('span',{className:'amt'}, deposit+'€'))
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
          onClick: confirm
        },
          payLoading ? React.createElement(React.Fragment, null,
            React.createElement('span', { style:{opacity:.7} }, 'Procesando…')
          ) :
          expired ? 'Tiempo agotado' :
          user    ? ('Pagar '+deposit+'€ y reservar') :
                    'Iniciar sesión y reservar'
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

  return React.createElement('div', { className:'view' },
    React.createElement('div', { className:'booking' },
      step < 4 ? Steps : null,
      React.createElement('div',{className:'bk-card'}, step<4 ? RestRow : null, body)
    )
  );
}

Object.assign(window, { BookingScreen });
