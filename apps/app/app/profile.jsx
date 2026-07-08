/* ════ UNA MESA · Auth modal + Profile screen ════ */

/* ── Market detection (self-contained copy — see home.jsx for canonical version) ── */
function prMarket() {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'uk' || q === 'en') return 'en';
    if (window.location.hostname.endsWith('.co.uk')) return 'en';
  } catch (_) {}
  return 'es';
}
const PR_LANG = prMarket();
const PR_T = {
  es: {
    cuisines: ['Marisco','Asador','Arroces','Japonés','Tapas','Vegetariano','Brunch','Fusión','Italiano','Gallego'],
    createProfile: 'Crea tu perfil', welcomeBack: 'Bienvenido de nuevo',
    signupSub: 'Personalizamos tus recomendaciones según tu gusto y tu zona.', loginSub: 'Entra para reservar y ver tus mesas.',
    createProfileTab: 'Crear perfil', signIn: 'Iniciar sesión',
    continueWithGoogle: 'Continuar con Google',
    orCreateWithEmail: 'o crea tu perfil con email', orWithEmail: 'o con tu email',
    nameLabel: 'Nombre', namePh: 'Tu nombre',
    emailLabel: 'Email', emailPh: 'tu@email.com',
    passwordLabel: 'Contraseña',
    locationLabel: 'Ubicación', locationPh: 'Tu ciudad o barrio (p. ej. Alicante)',
    cuisinePrefsLabel: 'Preferencias culinarias',
    createProfileBtn: 'Crear perfil', enterBtn: 'Entrar',
    restaurantFallback: 'Restaurante',
    connErr: 'Error de conexión. Por favor recarga la página.',
    checkInbox: 'Revisa tu bandeja de entrada para confirmar tu cuenta y luego inicia sesión.',
    createAccountErr: 'Error al crear la cuenta. Inténtalo de nuevo.',
    badCredentials: 'Email o contraseña incorrectos.',
    confirmEmailFirst: 'Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
    signinErr: 'Error al iniciar sesión. Inténtalo de nuevo.',
    enterEmailForReset: 'Introduce tu email para resetear la contraseña.',
    resetEmailSent: 'Te hemos enviado un email para resetear tu contraseña.',
    resetEmailErr: 'Error al enviar el email de reseteo.',
    signingIn: 'Iniciando sesión…', creatingAccount: 'Creando cuenta…',
    forgotPassword: '¿Olvidaste tu contraseña?',
    tabReservas: 'Mis reservas', tabPassport: 'Pasaporte', tabFavs: 'Favoritos', tabRewards: 'Recompensas',
    upcoming: 'Próximas', history: 'Historial',
    noBookings: 'Aún no tienes reservas.', findRestaurants: 'Buscar restaurantes',
    noFavs: 'Sin favoritos todavía. Toca el corazón en cualquier restaurante.', explore: 'Explorar',
    cancelBtn: 'Cancelar',
    cancelModalTitle: '¿Cancelar esta reserva?',
    cancelModalBody: 'Si cancelas con más de 24h de antelación, el depósito se reembolsa en 5-10 días hábiles. Con menos de 24h, el depósito no se reembolsa.',
    cancelGenericErr: 'No se pudo cancelar la reserva. Inténtalo de nuevo.',
    goBack: 'Volver', yesCancel: 'Sí, cancelar',
    hello: name => '¡Hola, '+name+'!',
    loyaltyProgram: 'Programa Mesa', pts: ' pts',
    visitsToNext: n => n+' visitas para tu próxima recompensa',
    dangerZone: 'Zona de peligro', deleteAccount: 'Eliminar mi cuenta',
    deleteModalTitle: '¿Eliminar tu cuenta?',
    deleteModalBody: 'Esta acción es irreversible. Se eliminarán todos tus datos personales. Tus reservas pasadas quedarán anonimizadas.',
    deleting: 'Eliminando...', yesDelete: 'Sí, eliminar',
    days: ['dom','lun','mar','mié','jue','vie','sáb'],
    months: ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],
    today: 'Hoy', guestSingular: ' comensal', guestPlural: ' comensales',
    bookingLabel: 'Reserva', depositLabelLower: 'depósito',
  },
  en: {
    cuisines: ['Seafood','Grill','Rice dishes','Japanese','Tapas','Vegetarian','Brunch','Fusion','Italian','Galician'],
    createProfile: 'Create your profile', welcomeBack: 'Welcome back',
    signupSub: 'We personalise your recommendations based on your taste and area.', loginSub: 'Sign in to book and see your tables.',
    createProfileTab: 'Create profile', signIn: 'Sign in',
    continueWithGoogle: 'Continue with Google',
    orCreateWithEmail: 'or create your profile with email', orWithEmail: 'or with your email',
    nameLabel: 'Name', namePh: 'Your name',
    emailLabel: 'Email', emailPh: 'you@email.com',
    passwordLabel: 'Password',
    locationLabel: 'Location', locationPh: 'Your city or neighbourhood (e.g. London)',
    cuisinePrefsLabel: 'Cuisine preferences',
    createProfileBtn: 'Create profile', enterBtn: 'Enter',
    restaurantFallback: 'Restaurant',
    connErr: 'Connection error. Please reload the page.',
    checkInbox: 'Check your inbox to confirm your account, then sign in.',
    createAccountErr: 'Error creating your account. Please try again.',
    badCredentials: 'Incorrect email or password.',
    confirmEmailFirst: 'Confirm your email before signing in. Check your inbox.',
    signinErr: 'Error signing in. Please try again.',
    enterEmailForReset: 'Enter your email to reset your password.',
    resetEmailSent: "We've sent you an email to reset your password.",
    resetEmailErr: 'Error sending the reset email.',
    signingIn: 'Signing in…', creatingAccount: 'Creating account…',
    forgotPassword: 'Forgot your password?',
    tabReservas: 'My bookings', tabPassport: 'Passport', tabFavs: 'Favourites', tabRewards: 'Rewards',
    upcoming: 'Upcoming', history: 'History',
    noBookings: "You don't have any bookings yet.", findRestaurants: 'Find restaurants',
    noFavs: 'No favourites yet. Tap the heart on any restaurant.', explore: 'Explore',
    cancelBtn: 'Cancel',
    cancelModalTitle: 'Cancel this booking?',
    cancelGenericErr: 'Could not cancel the booking. Please try again.',
    cancelModalBody: 'The deposit will be refunded within 5-10 business days.',
    goBack: 'Go back', yesCancel: 'Yes, cancel',
    hello: name => 'Hi, '+name+'!',
    loyaltyProgram: 'Mesa Programme', pts: ' pts',
    visitsToNext: n => n+' visits to your next reward',
    dangerZone: 'Danger zone', deleteAccount: 'Delete my account',
    deleteModalTitle: 'Delete your account?',
    deleteModalBody: 'This action is irreversible. All your personal data will be deleted. Your past bookings will be anonymised.',
    deleting: 'Deleting...', yesDelete: 'Yes, delete',
    days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    today: 'Today', guestSingular: ' guest', guestPlural: ' guests',
    bookingLabel: 'Booking', depositLabelLower: 'deposit',
  }
}[PR_LANG];

const CUISINE_PREFS = PR_T.cuisines;

function AuthModal({ onClose, onAuth, initialMode, geoLabel }) {
  const [mode, setMode] = useState(initialMode || 'signup'); // login | signup
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prefs, setPrefs] = useState([]);
  const [loc, setLoc] = useState(geoLabel || '');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const togglePref = p => setPrefs(s => s.includes(p) ? s.filter(x=>x!==p) : [...s, p]);

  const submit = async e => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!window.UMAuth) { setError(PR_T.connErr); return; }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const appUser = await window.UMAuth.signUp(email.trim().toLowerCase(), password, name.trim());
        if (!appUser) {
          setError(PR_T.checkInbox);
          setLoading(false);
          return;
        }
        onAuth({ ...appUser, prefs, location: loc });
      } else {
        const appUser = await window.UMAuth.signIn(email.trim(), password);
        onAuth({ ...appUser, prefs, location: loc });
      }
    } catch (err) {
      const msg = err.message || '';
      if (mode === 'signup') {
        setError(msg || PR_T.createAccountErr);
      } else if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError(PR_T.badCredentials);
      } else if (msg.includes('not confirmed') || msg.includes('Email not confirmed')) {
        setError(PR_T.confirmEmailFirst);
      } else {
        setError(PR_T.signinErr);
      }
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    setError(''); setInfo('');
    if (!email.trim()) { setError(PR_T.enterEmailForReset); return; }
    if (!window.UMAuth || !window.UMAuth.sb) { setError(PR_T.connErr); return; }
    try {
      await window.UMAuth.sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });
      setInfo(PR_T.resetEmailSent);
    } catch (e) {
      setError(PR_T.resetEmailErr);
    }
  };

  const isSignup = mode==='signup';
  return React.createElement(Modal, { onClose, max: isSignup ? 460 : 420 },
    React.createElement('h2', null, isSignup ? PR_T.createProfile : PR_T.welcomeBack),
    React.createElement('p', { className:'msub' }, isSignup ? PR_T.signupSub : PR_T.loginSub),
    React.createElement('div', { className:'seg' },
      React.createElement('button',{className:isSignup?'on':'',onClick:()=>setMode('signup')},PR_T.createProfileTab),
      React.createElement('button',{className:!isSignup?'on':'',onClick:()=>setMode('login')},PR_T.signIn)),
    React.createElement('div', { className:'sso' },
      React.createElement('button',{className:'sso-btn',onClick:()=>{
        if (window.UMAuth && window.UMAuth.sb) {
          window.UMAuth.sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
          });
        }
      }},
        React.createElement(Icon,{name:'google'}),PR_T.continueWithGoogle)),
    React.createElement('div', { className:'divider' }, isSignup ? PR_T.orCreateWithEmail : PR_T.orWithEmail),
    React.createElement('form', { onSubmit:submit },
      isSignup?React.createElement('div',{className:'field'},
        React.createElement('label',null,PR_T.nameLabel),
        React.createElement('input',{value:name,onChange:e=>setName(e.target.value),placeholder:PR_T.namePh,required:true,disabled:loading})):null,
      React.createElement('div',{className:'field'},
        React.createElement('label',null,PR_T.emailLabel),
        React.createElement('input',{type:'email',value:email,onChange:e=>setEmail(e.target.value),placeholder:PR_T.emailPh,required:true,disabled:loading})),
      React.createElement('div',{className:'field'},
        React.createElement('label',null,PR_T.passwordLabel),
        React.createElement('input',{type:'password',value:password,onChange:e=>setPassword(e.target.value),placeholder:'••••••••',required:true,minLength:isSignup?6:undefined,disabled:loading})),
      isSignup?React.createElement('div',{className:'field'},
        React.createElement('label',null,PR_T.locationLabel),
        React.createElement('input',{value:loc,onChange:e=>setLoc(e.target.value),placeholder:PR_T.locationPh})):null,
      isSignup?React.createElement('div',{className:'field'},
        React.createElement('label',null,PR_T.cuisinePrefsLabel),
        React.createElement('div',{className:'pref-chips'},
          CUISINE_PREFS.map(p=>React.createElement('button',{
            key:p, type:'button', className:'chip'+(prefs.includes(p)?' on':''), onClick:()=>togglePref(p)
          }, p)))):null,
      error ? React.createElement('p', { style:{ color:'#dc2626', fontSize:13, margin:'10px 0 0', lineHeight:1.4 } }, error) : null,
      info ? React.createElement('p', { style:{ color:'#16a34a', fontSize:13, margin:'10px 0 0', lineHeight:1.4 } }, info) : null,
      React.createElement('button',{className:'btn btn-acc btn-block btn-lg',type:'submit',style:{marginTop:'12px'},disabled:loading},
        loading ? (isSignup?PR_T.creatingAccount:PR_T.signingIn) : (isSignup?PR_T.createProfileBtn:PR_T.enterBtn)),
      !isSignup ? React.createElement('button', {
        type:'button', onClick:resetPassword,
        style:{ background:'none', border:'none', color:'#D8552E', fontSize:13, cursor:'pointer', marginTop:8, textDecoration:'underline', padding:0 }
      }, PR_T.forgotPassword) : null)
  );
}

function mapSupaBooking(r) {
  const today = new Date().toLocaleDateString('en-CA');
  const isPast = r.date < today || r.status === 'cancelled';
  const d = new Date(r.date + 'T12:00:00');
  const MONTHS = PR_T.months;
  const DAYS = PR_T.days;
  const depositPerPerson = r.deposit_amount ?? r.venues?.deposit_amount ?? 1000; // céntimos por persona; 1000 solo si de verdad falta el dato
  const currency = (r.venues?.currency || 'eur').toLowerCase();
  return {
    rawId:           r.id,
    id:              r.id.toString().slice(0, 8).toUpperCase(),
    rid:             r.venue_id,
    name:            r.venues?.name || PR_T.restaurantFallback,
    cz:              { from: '#2D2420', to: '#4A3728' },
    glyph:           'spoon',
    dayLabel:        `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
    time:            (r.time || '').slice(0, 5),
    party:           r.pax,
    deposit:         (depositPerPerson * r.pax) / 100,
    depositCents:    depositPerPerson * r.pax,
    currency:        currency,
    paymentIntentId: r.payment_intent_id || null,
    userId:          r.user_id || null,
    status:          isPast ? 'past' : 'up',
    rawStatus:       r.status,
    isCancellable:   ['confirmed', 'pending'].includes(r.status),
  };
}

function ProfileScreen({ user, bookings, favs, data, openRest, toggleFav, startBook, go, spoons, onRedeem }) {
  const [tab, setTab] = useState('reservas');
  const [supaBookings, setSupaBookings] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!window.UMAuth?.sb) { setSupaBookings([]); return; }
    const sb = window.UMAuth.sb;
    async function load() {
      try {
        const { data: { user: authUser } } = await sb.auth.getUser();

        let query = sb.from('reservations')
          .select('*, venues(name, address, photo_url, cuisine, deposit_amount, currency)')
          .in('status', ['confirmed', 'unconfirmed', 'pending'])
          .order('date', { ascending: false });

        if (authUser?.id) {
          query = query.or(`user_id.eq.${authUser.id},customer_name.ilike.%${user.name}%`);
        } else {
          query = query.ilike('customer_name', `%${user.name}%`);
        }

        const { data, error } = await query;
        if (error) { console.warn('[UNA MESA] loadBookings:', error.message); setSupaBookings([]); return; }
        setSupaBookings((data || []).map(mapSupaBooking));
      } catch(e) {
        console.warn('[UNA MESA] loadBookings:', e.message);
        setSupaBookings([]);
      }
    }
    load();
  }, [user]);

  const doCancel = async (booking) => {
    const b = booking || cancelTarget;
    if (!b || cancelBusy) return;
    setCancelBusy(true);
    setCancelError('');

    const sb = window.UMAuth.sb;

    /* Cancelar — cancel-reservation verifica que la reserva sea tuya (o de tu
       restaurante), aplica la política de 24h con la zona horaria real del
       venue, resuelve Stripe (cancela o reembolsa según corresponda), registra
       la cancelación, y manda el email — todo server-side, en una sola llamada
       autoritativa. Ya no hace falta ningún paso adicional desde el cliente. */
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/cancel-reservation', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + (session?.access_token || ''),
      },
      body: JSON.stringify({ reservation_id: b.rawId, lang: PR_LANG }),
    });
    const json = await res.json();
    if (!res.ok) {
      console.warn('[UNA MESA] cancel-reservation:', json.error);
      setCancelError(json.error || PR_T.cancelGenericErr);
      setCancelBusy(false);
      return;
    }

    /* Update local UI */
    setSupaBookings(prev => prev.filter(x => x.rawId !== b.rawId));
    setCancelTarget(null);
    setCancelBusy(false);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      if (!window.UMAuth?.sb) {
        console.error('No hay sesión activa');
        setDeleting(false);
        return;
      }
      const { data: { session } } = await window.UMAuth.sb.auth.getSession();
      if (!session?.access_token) {
        console.error('No hay sesión activa');
        setDeleting(false);
        return;
      }

      const res = await fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
      });

      if (res.ok) {
        localStorage.clear();
        window.location.href = '/';
      } else {
        const err = await res.json();
        console.error('Error:', err);
      }
    } catch(e) {
      console.error('Error eliminando cuenta:', e);
    }
    setDeleting(false);
  };

  const now = Date.now();
  const activeBookings = supaBookings !== null ? supaBookings : bookings;
  const upcoming = activeBookings.filter(b=>b.status==='up');
  const past = activeBookings.filter(b=>b.status==='past');
  const favList = data.filter(r=>favs.includes(r.id));
  const points = Math.min(100, bookings.length*18 + favs.length*4);
  const visits = bookings.length;
  const toNext = Math.max(0, 5 - (visits%5||0));

  const BookingRow = (b, isPast) => {
    return React.createElement('div', { key:b.id, className:'booking-row' },
    React.createElement('div', { className:'booking-thumb', style:{ width:56, height:56, borderRadius:12, background:'linear-gradient(150deg, #2D2420, #4A3728)', flexShrink:0 } }),
    React.createElement('div',{className:'br-main'},
      React.createElement('div',{className:'br-name'},b.name),
      React.createElement('div',{className:'br-meta'}, (b.dayLabel||PR_T.today)+' · '+b.time+' · '+b.party+(b.party===1?PR_T.guestSingular:PR_T.guestPlural)),
      React.createElement('div',{className:'br-meta',style:{marginTop:'2px'}},PR_T.bookingLabel+' '+b.id+' · '+PR_T.depositLabelLower+' '+(window.UM_CURRENCY_SYMBOL?window.UM_CURRENCY_SYMBOL(b.currency):'€')+b.deposit)),
    React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}},
      React.createElement('span',{className:'br-status '+(isPast?'st-past':'st-up')}, isPast?'Completada':'Confirmada'),
      React.createElement('button',{className:'btn btn-soft btn-sm',onClick:()=>openRest(b.rid)}, isPast?'Reservar otra vez':'Ver restaurante'),
      !isPast && b.isCancellable
        ? React.createElement('button',{
            className:'btn btn-sm',
            style:{color:'#E85D3A',background:'transparent',border:'1px solid rgba(232,93,58,0.4)',borderRadius:'8px',padding:'4px 12px',fontSize:'12px',cursor:'pointer',lineHeight:'1.5'},
            onClick:()=>{ setCancelError(''); setCancelTarget(b); }
          },PR_T.cancelBtn)
        : null
    ));
  };

  const cancelModal = cancelTarget && React.createElement('div', {
    style: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }
  },
    React.createElement('div', {
      style: {
        background: '#FAF6F0', borderRadius: 16, padding: 32,
        maxWidth: 400, width: '90%', textAlign: 'center'
      }
    },
      React.createElement('h3', { style: { fontFamily: 'Playfair Display', marginBottom: 12 } }, PR_T.cancelModalTitle),
      React.createElement('p', { style: { color: '#666', marginBottom: 24, fontSize: 14 } },
        PR_T.cancelModalBody
      ),
      React.createElement('div', { style: { display: 'flex', gap: 12, justifyContent: 'center' } },
        React.createElement('button', {
          onClick: () => setCancelTarget(null),
          style: { padding: '10px 24px', borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer' }
        }, PR_T.goBack),
        React.createElement('button', {
          onClick: () => { doCancel(cancelTarget); setCancelTarget(null); },
          style: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#FF5733', color: 'white', cursor: 'pointer' }
        }, PR_T.yesCancel)
      )
    )
  );

  let panel;
  if (tab==='reservas') {
    panel = (upcoming.length||past.length)
      ? React.createElement('div', null,
          upcoming.length?React.createElement('div',null,
            React.createElement('div',{className:'prof-sec-label'},PR_T.upcoming),
            upcoming.map(b=>BookingRow(b,false))):null,
          past.length?React.createElement('div',{style:{marginTop:'22px'}},
            React.createElement('div',{className:'prof-sec-label'},PR_T.history),
            past.map(b=>BookingRow(b,true))):null)
      : React.createElement('div',{className:'empty'},
          React.createElement(Icon,{name:'cal'}),
          React.createElement('p',null,PR_T.noBookings),
          React.createElement('button',{className:'btn btn-acc',style:{marginTop:'14px'},onClick:()=>go('results')},PR_T.findRestaurants));
  } else if (tab==='favoritos') {
    panel = favList.length
      ? React.createElement('div',{className:'rgrid'},
          favList.map(r=>React.createElement(RestaurantCard,{key:r.id,r,fav:true,onFav:toggleFav,onOpen:openRest,onBook:startBook})))
      : React.createElement('div',{className:'empty'},
          React.createElement(Icon,{name:'heart'}),
          React.createElement('p',null,PR_T.noFavs),
          React.createElement('button',{className:'btn btn-acc',style:{marginTop:'14px'},onClick:()=>go('results')},PR_T.explore));
  } else if (tab==='pasaporte') {
    panel = React.createElement('div', null,
      React.createElement(window.GastroPassport, { data, bookings, openRest, go }),
      React.createElement('div',{style:{marginTop:'22px'}}, React.createElement(window.PalateAI, { user, data, bookings, favs })));
  } else if (tab==='fidelidad') {
    panel = React.createElement(window.RewardsMarket, { spoons, onRedeem });
  }

  const handleDeleteClick = () => setShowDeleteModal(true);

  const deleteModal = showDeleteModal && React.createElement('div', {
    style: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999, padding: '16px'
    }
  },
    React.createElement('div', {
      style: {
        background: '#fff', borderRadius: '20px', padding: '28px 24px',
        maxWidth: '340px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }
    },
      React.createElement('div', {
        style: { width: 44, height: 44, borderRadius: '12px', background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }
      },
        React.createElement('i', { className: 'ti ti-trash', style: { color: '#EF4444', fontSize: 20 } })
      ),
      React.createElement('h3', {
        style: { fontWeight: 800, fontSize: 16, color: '#111', marginBottom: 8 }
      }, PR_T.deleteModalTitle),
      React.createElement('p', {
        style: { fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }
      }, PR_T.deleteModalBody),
      React.createElement('div', { style: { display: 'flex', gap: 10 } },
        React.createElement('button', {
          onClick: () => setShowDeleteModal(false),
          style: {
            flex: 1, padding: '12px', borderRadius: '12px',
            border: '1.5px solid #E5E7EB', background: '#fff',
            fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer'
          }
        }, PR_T.cancelBtn),
        React.createElement('button', {
          onClick: deleteAccount,
          disabled: deleting,
          style: {
            flex: 1, padding: '12px', borderRadius: '12px',
            border: 'none', background: '#EF4444',
            fontSize: 13, fontWeight: 700, color: '#fff',
            cursor: deleting ? 'not-allowed' : 'pointer',
            opacity: deleting ? 0.6 : 1
          }
        }, deleting ? PR_T.deleting : PR_T.yesDelete)
      )
    )
  );

  return React.createElement(React.Fragment, null,
    cancelModal,
    deleteModal,
    React.createElement('div', { className:'view' },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'prof-hero' },
          React.createElement('div',{className:'prof-av'}, formatName(user)[0].toUpperCase()),
          React.createElement('div',null,
            React.createElement('div',{className:'prof-name display'}, PR_T.hello(formatName(user).split(' ')[0])),
            React.createElement('div',{className:'prof-mail'}, user.email)),
          React.createElement('div',{className:'loyalty', style:{marginTop:60}},
            React.createElement('div',{className:'ll'},PR_T.loyaltyProgram),
            React.createElement('div',{className:'lv'}, points+PR_T.pts),
            React.createElement('div',{className:'lbar'},React.createElement('i',{style:{width:Math.max(8,points)+'%'}})),
            React.createElement('div',{className:'lnext'}, PR_T.visitsToNext(toNext)))
        ),
        React.createElement('div', { className:'tabs' },
          React.createElement('div',{className:'tab'+(tab==='reservas'?' on':''),onClick:()=>setTab('reservas')},PR_T.tabReservas),
          React.createElement('div',{className:'tab'+(tab==='pasaporte'?' on':''),onClick:()=>setTab('pasaporte')},PR_T.tabPassport),
          React.createElement('div',{className:'tab'+(tab==='favoritos'?' on':''),onClick:()=>setTab('favoritos')},PR_T.tabFavs),
          React.createElement('div',{className:'tab'+(tab==='fidelidad'?' on':''),onClick:()=>setTab('fidelidad')},PR_T.tabRewards)),
        panel,
        React.createElement('div', { style: { marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #FEE2E2' } },
          React.createElement('p', { style: { fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' } }, PR_T.dangerZone),
          React.createElement('button', {
            onClick: handleDeleteClick,
            style: { fontSize: '14px', color: '#EF4444', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }
          }, PR_T.deleteAccount)
        )
      )
    )
  );
}

Object.assign(window, { AuthModal, ProfileScreen });
// cache bust Thu 11 Jun 2026 01:11:17 BST
