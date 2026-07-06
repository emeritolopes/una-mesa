/* ════ UNA MESA · Booking flow · Stitch design system ════ */

/* ── Market detection (self-contained copy — see home.jsx for canonical version) ── */
function bkMarket() {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'uk' || q === 'en') return 'en';
    if (window.location.hostname.endsWith('.co.uk')) return 'en';
  } catch (_) {}
  return 'es';
}
const BK_LANG = bkMarket();
const BK_T = {
  es: {
    notFound: 'Restaurante no encontrado.',
    dows: ['D','L','M','X','J','V','S'], today: 'Hoy',
    dowRowHeader: ['L','M','X','J','V','S','D'],
    cancel: 'Cancelar', continue_: 'Continuar', back: 'Atrás',
    whatDay: '¿Qué día?', chooseDate: 'Elige la fecha de tu reserva.',
    whatTime: '¿A qué hora?', realtimeAvail: ' · disponibilidad en tiempo real',
    lunch: 'Mediodía', dinner: 'Noche', lastSlots: 'Últimas',
    noSlotsForDay: 'Sin horarios para ese día.',
    howMany: '¿Cuántos sois?', numGuests: 'Número de comensales.',
    guestSingular: 'comensal', guestPlural: 'comensales',
    largeGroupNote: 'Para grupos grandes podemos avisar al restaurante con antelación.',
    confirmSecure: 'Confirma y asegura tu mesa',
    depositIntro: 'Un pequeño depósito que se descuenta de tu cuenta final.',
    depositWhyTitle: '¿Por qué un depósito?',
    depositWhyBody1: 'Porque "reservo y ya si eso aparezco" se había convertido en deporte nacional. Tranqui, no es un peaje: se ',
    depositWhyBold: 'descuenta del total',
    depositWhyBody2: ' de tu cuenta al final. Solo lo pierdes si decides hacerte el fantasma y dejar la mesa vacía.',
    timeUp: 'Se acabó el tiempo de reserva. ', chooseAgain: 'Vuelve a elegir la hora', toSecure: ' para asegurar tu mesa.', retry: 'Reintentar',
    holdPre: 'Guardamos tu mesa durante ', holdPost: ' minutos. Completa el depósito antes de que acabe.',
    day: 'Día', hour: 'Hora', guests: 'Comensales', stepDate: 'Fecha',
    depositRow: (dep,party,sym) => 'Depósito ('+sym+dep+' × '+party+')',
    payingNow: 'A pagar ahora',
    shieldNote: 'No es un cargo extra: se descuenta del total de tu cuenta. Solo se retiene si dejas la mesa vacía sin avisar.',
    howNotify: '¿Cómo quieres recibir la confirmación?', email: 'Correo', sms: 'SMS',
    paymentMethod: 'Método de pago', card: 'Tarjeta', bizum: 'Bizum',
    cardData: 'Datos de la tarjeta', postalCode: 'Cód. postal',
    processing: 'Procesando…', timeExpired: 'Tiempo agotado',
    payAndBook: (dep,sym) => 'Pagar '+sym+dep+' y reservar', continueAsGuest: 'Continuar como invitado',
    tableConfirmed: '¡Mesa confirmada!',
    seeYouAt: (name,method) => 'Te esperamos en '+name+'. Te hemos enviado los detalles por '+method+'.',
    viaSms: 'SMS', viaEmail: 'correo electrónico',
    reservation: 'Reserva', restaurant: 'Restaurante', dayTime: 'Día y hora',
    deposit: 'Depósito', depositNote: (dep,sym) => sym+dep+' — se descuenta del total al llegar.',
    confirmation: 'Confirmación', bySms: 'Por SMS', byEmail: 'Por correo electrónico',
    backHome: 'Volver al inicio', seeMyBookings: 'Ver mis reservas',
    guestDataTitle: 'Datos para tu reserva',
    guestDataBody: 'Necesitamos tus datos para enviarte la confirmación y el link de pago del depósito.',
    fullName: 'Nombre completo *', emailField: 'Email *', phoneOptional: 'Teléfono (opcional)',
    confirmBooking: 'Confirmar reserva',
    genericPayError: 'Error al procesar el pago. Inténtalo de nuevo.',
    pastTimeError: 'No puedes reservar para una hora que ya ha pasado. Por favor elige una hora futura.',
    payInitError: 'No se pudo iniciar el pago',
    dateLocale: 'es-ES', billingCountry: 'ES',
  },
  en: {
    notFound: 'Restaurant not found.',
    dows: ['S','M','T','W','T','F','S'], today: 'Today',
    dowRowHeader: ['M','T','W','T','F','S','S'],
    cancel: 'Cancel', continue_: 'Continue', back: 'Back',
    whatDay: 'What day?', chooseDate: 'Choose your booking date.',
    whatTime: 'What time?', realtimeAvail: ' · real-time availability',
    lunch: 'Lunch', dinner: 'Dinner', lastSlots: 'Almost full',
    noSlotsForDay: 'No time slots for that day.',
    howMany: 'How many of you?', numGuests: 'Number of guests.',
    guestSingular: 'guest', guestPlural: 'guests',
    largeGroupNote: 'For large groups we can give the restaurant advance notice.',
    confirmSecure: 'Confirm and secure your table',
    depositIntro: 'A small deposit that gets deducted from your final bill.',
    depositWhyTitle: 'Why a deposit?',
    depositWhyBody1: 'Because "I\'ll book and maybe show up" had become a national sport. Don\'t worry, it\'s not a toll: it gets ',
    depositWhyBold: 'deducted from your total',
    depositWhyBody2: ' at the end. You only lose it if you decide to ghost and leave the table empty.',
    timeUp: 'Your booking time ran out. ', chooseAgain: 'Choose a time again', toSecure: ' to secure your table.', retry: 'Retry',
    holdPre: 'We\'re holding your table for ', holdPost: ' minutes. Complete the deposit before it runs out.',
    day: 'Day', hour: 'Time', guests: 'Guests', stepDate: 'Date',
    depositRow: (dep,party,sym) => 'Deposit ('+sym+dep+' × '+party+')',
    payingNow: 'Due now',
    shieldNote: 'Not an extra charge: it\'s deducted from your total bill. It\'s only withheld if you leave the table empty without notice.',
    howNotify: 'How would you like to receive confirmation?', email: 'Email', sms: 'SMS',
    paymentMethod: 'Payment method', card: 'Card', bizum: 'Bizum',
    cardData: 'Card details', postalCode: 'Postal code',
    processing: 'Processing…', timeExpired: 'Time expired',
    payAndBook: (dep,sym) => 'Pay '+sym+dep+' and book', continueAsGuest: 'Continue as guest',
    tableConfirmed: 'Table confirmed!',
    seeYouAt: (name,method) => 'See you at '+name+'. We\'ve sent the details by '+method+'.',
    viaSms: 'SMS', viaEmail: 'email',
    reservation: 'Booking', restaurant: 'Restaurant', dayTime: 'Day and time',
    deposit: 'Deposit', depositNote: (dep,sym) => sym+dep+' — deducted from the total on arrival.',
    confirmation: 'Confirmation', bySms: 'By SMS', byEmail: 'By email',
    backHome: 'Back to home', seeMyBookings: 'See my bookings',
    guestDataTitle: 'Your booking details',
    guestDataBody: 'We need your details to send you the confirmation and the deposit payment link.',
    fullName: 'Full name *', emailField: 'Email *', phoneOptional: 'Phone (optional)',
    confirmBooking: 'Confirm booking',
    genericPayError: 'Error processing payment. Please try again.',
    pastTimeError: 'You can\'t book a time that has already passed. Please choose a future time.',
    payInitError: 'Could not start payment',
    dateLocale: 'en-GB', billingCountry: 'GB' /* TODO: assumes GB cardholder — revisit if EU cards need to work on the UK domain too */,
  }
}[BK_LANG];

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

  if (!r) return React.createElement('div',{className:'wrap',style:{padding:'60px 0'}},BK_T.notFound);

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
  const dows   = BK_T.dows;
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
  const deposit      = depositCents / 100;   // unidades de la moneda del restaurante, para mostrar en UI y email
  const curSym       = window.UM_CURRENCY_SYMBOL ? window.UM_CURRENCY_SYMBOL(r.currency) : '€'; // símbolo real del restaurante, no del mercado del comensal

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
          restaurant_id:  r.id,
          user_id:        user?.id || '',
          reservation_id: reservationCode,
          party,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || BK_T.payInitError);

      const { client_secret, payment_intent_id } = json;

      /* 2 · Confirm card with Stripe.js (result: requires_capture — card not charged yet) */
      const { error } = await cardElRef.current.stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElRef.current.cardNumber,
          billing_details: { address: { postal_code: postalCode, country: BK_T.billingCountry } },
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
            deposit_status:    'pending',
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

                const dayLabel2 = (day || today).toLocaleDateString(BK_T.dateLocale, { weekday:'long', day:'numeric', month:'long' });
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
                    lang:            BK_LANG,
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
        const dayLabel = (day || today).toLocaleDateString(BK_T.dateLocale, { weekday:'long', day:'numeric', month:'long' });
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
            lang:            BK_LANG,
          }),
        }).catch(e => console.warn('[UNA MESA] send-email:', e.message));
      }

      /* 5 · Authorization OK → finalise booking */
      finish(payment_intent_id, reservationCode);

    } catch (err) {
      setPayError(err.message || BK_T.genericPayError);
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
      setPayError(BK_T.pastTimeError);
      return;
    }
    stripeConfirm();
  };

  /* ════ Numbered step indicator ════ */
  const stepDefs = [BK_T.stepDate, BK_T.hour, BK_T.guests, BK_T.deposit];
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
          }, t, st==='few' ? React.createElement('span',{className:'tag'},BK_T.lastSlots) : null))
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
      React.createElement('div',{className:'bk-h'},BK_T.whatDay),
      React.createElement('div',{className:'bk-sub'},BK_T.chooseDate),
      React.createElement('div',{className:'dow-row'},
        BK_T.dowRowHeader.map((d,i)=>React.createElement('span',{key:i},d))),
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
        React.createElement('button',{className:'btn btn-ghost',onClick:back},BK_T.cancel),
        React.createElement('button',{className:'btn btn-acc',disabled:!day,onClick:()=>goStep(1)},BK_T.continue_))
    );

  /* ── Step 1 · Time picker ── */
  } else if (step===1) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},BK_T.whatTime),
      React.createElement('div',{className:'bk-sub'},
        (day?(dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)):BK_T.today)+BK_T.realtimeAvail),
      filteredTimes.length
        ? React.createElement(React.Fragment, null,
            makeTimeSection(BK_T.lunch, filteredLunch),
            makeTimeSection(BK_T.dinner, filteredDinner)
          )
        : React.createElement('p',{className:'muted'},BK_T.noSlotsForDay),
      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:()=>goStep(0)},BK_T.back),
        React.createElement('button',{className:'btn btn-acc',disabled:!time,onClick:()=>goStep(2)},BK_T.continue_))
    );

  /* ── Step 2 · Party size ── */
  } else if (step===2) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},BK_T.howMany),
      React.createElement('div',{className:'bk-sub'},BK_T.numGuests),
      React.createElement('div',{className:'partyrow'},
        React.createElement('button',{className:'party-btn',onClick:()=>setParty(Math.max(1,party-1))},'−'),
        React.createElement('div',null,
          React.createElement('div',{className:'party-n display'},party),
          React.createElement('div',{className:'party-lbl'}, party===1?BK_T.guestSingular:BK_T.guestPlural)),
        React.createElement('button',{className:'party-btn',onClick:()=>setParty(Math.min(12,party+1))},'+')
      ),
      party>=9 ? React.createElement('p',{className:'muted',style:{textAlign:'center',fontSize:'13.5px'}},
        BK_T.largeGroupNote) : null,
      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:()=>goStep(1)},BK_T.back),
        React.createElement('button',{className:'btn btn-acc',onClick:()=>goStep(3)},BK_T.continue_))
    );

  /* ── Step 3 · Deposit & payment ── */
  } else if (step===3) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},BK_T.confirmSecure),
      React.createElement('div',{className:'bk-sub dep-sub'},
        BK_T.depositIntro,
        React.createElement('span',{className:'info-tip',tabIndex:0},
          React.createElement(Icon,{name:'info'}),
          React.createElement('span',{className:'info-pop'},
            React.createElement('b',null,BK_T.depositWhyTitle),
            BK_T.depositWhyBody1,
            React.createElement('b',null,BK_T.depositWhyBold),
            BK_T.depositWhyBody2))),

      /* Countdown */
      expired
        ? React.createElement('div',{className:'hold-timer expired'},
            React.createElement(Icon,{name:'clock'}),
            React.createElement('span',null,BK_T.timeUp,
              React.createElement('b',null,BK_T.chooseAgain),BK_T.toSecure),
            React.createElement('button',{className:'hold-retry',
              onClick:()=>{ setHold(360); setExpired(false); goStep(1); }},BK_T.retry))
        : React.createElement('div',{className:'hold-timer'+(holdLow?' low':'')},
            React.createElement(Icon,{name:'clock'}),
            React.createElement('span',null,BK_T.holdPre,
              React.createElement('b',{className:'hold-count'}, mmss(hold)),BK_T.holdPost)),

      /* Booking summary */
      React.createElement('div',{className:'dep-box'},
        React.createElement('div',{className:'dep-row'},
          React.createElement('span',null,BK_T.day),
          React.createElement('span',{style:{fontWeight:700}},
            day?(dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)):BK_T.today)),
        React.createElement('div',{className:'dep-row'},
          React.createElement('span',null,BK_T.hour),
          React.createElement('span',{style:{fontWeight:700}}, time||'—')),
        React.createElement('div',{className:'dep-row'},
          React.createElement('span',null,BK_T.guests),
          React.createElement('span',{style:{fontWeight:700}}, party)),
        React.createElement('div',{className:'dep-row'},
          React.createElement('span',null,BK_T.depositRow(deposit,party,curSym)),
          React.createElement('span',{className:'amt'}, curSym+(deposit * party))),
        React.createElement('div',{className:'dep-row total'},
          React.createElement('span',null,BK_T.payingNow),
          React.createElement('span',{className:'amt'}, curSym+(deposit * party)))
      ),

      /* Shield note */
      React.createElement('div',{className:'bw-dep',style:{marginBottom:'16px'}},
        React.createElement(Icon,{name:'shield'}),
        React.createElement('span',null,BK_T.shieldNote)),

      /* Notification method */
      React.createElement('p',{className:'bk-section-label'},BK_T.howNotify),
      React.createElement('div',{className:'pay-methods',style:{marginBottom:'18px'}},
        React.createElement('button',{className:'pay-m'+(notify==='email'?' on':''),onClick:()=>setNotify('email')},
          React.createElement(Icon,{name:'mail'}),BK_T.email),
        React.createElement('button',{className:'pay-m'+(notify==='sms'?' on':''),onClick:()=>setNotify('sms')},
          React.createElement(Icon,{name:'phone'}),BK_T.sms)),

      /* Payment method — Bizum is Spain-only, hidden for the English market */
      React.createElement('p',{className:'bk-section-label'},BK_T.paymentMethod),
      React.createElement('div',{className:'pay-methods'},
        React.createElement('button',{className:'pay-m'+(pay==='card'?' on':''),onClick:()=>setPay('card')},
          React.createElement(Icon,{name:'card'}),BK_T.card),
        BK_LANG === 'es' ? React.createElement('button',{className:'pay-m'+(pay==='bizum'?' on':''),onClick:()=>setPay('bizum')},
          React.createElement(Icon,{name:'euro'}),BK_T.bizum) : null),

      /* ── Stripe card elements (separate fields + Spanish postal code) ── */
      pay === 'card' ? React.createElement('div', { style:{marginTop:'18px'} },
        React.createElement('p', { className:'bk-section-label' }, BK_T.cardData),
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
            placeholder:BK_T.postalCode,
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
        React.createElement('button',{className:'btn btn-ghost',onClick:()=>goStep(2),disabled:payLoading},BK_T.back),
        React.createElement('button',{
          className:'btn btn-acc',
          style:{flex:1},
          disabled: expired || payLoading,
          onClick: handleConfirm
        },
          payLoading ? React.createElement(React.Fragment, null,
            React.createElement('span', { style:{opacity:.7} }, BK_T.processing)
          ) :
          expired ? BK_T.timeExpired :
          user    ? BK_T.payAndBook(deposit,curSym) :
                    BK_T.continueAsGuest
        ))
    );

  /* ── Step 4 · Confirmation ── */
  } else {
    body = React.createElement('div', { className:'confirm-card' },
      React.createElement('div',{className:'confirm-ico'},
        React.createElement(Icon,{name:'check'})),
      React.createElement('h2',{className:'display'},BK_T.tableConfirmed),
      React.createElement('p',{className:'muted',style:{marginBottom:'4px'}},
        BK_T.seeYouAt(r.name, notify==='sms'?BK_T.viaSms:BK_T.viaEmail)),
      React.createElement('div',{className:'confirm-detail'},
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},BK_T.reservation),
          React.createElement('span',{className:'v'},confCode)),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},BK_T.restaurant),
          React.createElement('span',{className:'v'},r.name)),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},BK_T.dayTime),
          React.createElement('span',{className:'v'},
            (day?(dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)):BK_T.today)+' · '+time)),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},BK_T.guests),
          React.createElement('span',{className:'v'}, party)),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},BK_T.deposit),
          React.createElement('span',{className:'v',style:{color:'var(--accent)'}}, BK_T.depositNote(deposit,curSym))),
        React.createElement('div',{className:'cd-row'},
          React.createElement('span',{className:'k'},BK_T.confirmation),
          React.createElement('span',{className:'v'}, notify==='sms'?BK_T.bySms:BK_T.byEmail))
      ),
      React.createElement('div',{className:'bk-actions',style:{justifyContent:'center'}},
        React.createElement('button',{className:'btn btn-ghost',onClick:back},BK_T.backHome),
        React.createElement('button',{className:'btn btn-acc',
          onClick:()=>onConfirm._goProfile&&onConfirm._goProfile()},BK_T.seeMyBookings))
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
      React.createElement('h3', { style: { fontWeight: 800, fontSize: 17, marginBottom: 6, marginTop: 0 } }, BK_T.guestDataTitle),
      React.createElement('p', { style: { fontSize: 13, color: '#6B7280', marginBottom: 20 } },
        BK_T.guestDataBody
      ),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        React.createElement('input', {
          type: 'text', placeholder: BK_T.fullName, value: guestName,
          onChange: e => setGuestName(e.target.value),
          style: { padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none' }
        }),
        React.createElement('input', {
          type: 'email', placeholder: BK_T.emailField, value: guestEmail,
          onChange: e => setGuestEmail(e.target.value),
          style: { padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none' }
        }),
        React.createElement('input', {
          type: 'tel', placeholder: BK_T.phoneOptional, value: guestPhone,
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
        }, BK_T.confirmBooking),
        React.createElement('button', {
          onClick: () => setShowGuestForm(false),
          style: { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer' }
        }, BK_T.cancel)
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
