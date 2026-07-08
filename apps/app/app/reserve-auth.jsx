/* ════ UNA MESA · Flujo de registro orientado a conversión (ES/EN) ════
   Tres estados:
   1) intro  → "Reserva tu mesa"  (ventajas, Crear cuenta / Continuar como invitado / Iniciar sesión)
   2) welcomeback → correo ya registrado
   3) ClaimSpoonsModal → tras reservar como INVITADO
*/

/* ── Market detection (self-contained copy — see home.jsx for canonical version) ── */
function raMarket() {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'uk' || q === 'en') return 'en';
    if (window.location.hostname.endsWith('.co.uk')) return 'en';
  } catch (_) {}
  return 'es';
}
const RA_LANG = raMarket();
const RA_T = {
  es: {
    benefits: [
      { spoon:true, text:'Gana Cucharas de Oro en cada reserva' },
      { text:'Recibe recomendaciones de restaurantes personalizadas con IA' },
      { text:'Guarda tus restaurantes favoritos' },
      { text:'Accede a ofertas y promociones exclusivas' },
      { text:'Reserva más rápido la próxima vez' }
    ],
    connErr: 'Error de conexión. Por favor recarga la página.',
    checkInbox: 'Revisa tu bandeja de entrada para confirmar tu cuenta y luego inicia sesión.',
    createAccountErr: 'Error al crear la cuenta. Inténtalo de nuevo.',
    badCredentials: 'Email o contraseña incorrectos.',
    confirmEmailFirst: 'Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
    signinErr: 'Error al iniciar sesión. Inténtalo de nuevo.',
    enterEmailForReset: 'Introduce tu email para resetear la contraseña.',
    resetEmailSent: 'Te hemos enviado un email para resetear tu contraseña.',
    resetEmailErr: 'Error al enviar el email de reseteo.',
    reserveTitle: 'Reserva tu mesa',
    reserveSub: 'Reserva como invitado o crea una cuenta para desbloquear ventajas exclusivas.',
    createFreeAccount: 'Crear cuenta gratis',
    continueAsGuest: 'Continuar como invitado',
    alreadyHaveAccount: '¿Ya tienes cuenta? ',
    signIn: 'Inicia sesión',
    welcomeBack: 'Bienvenido de nuevo',
    welcomeBackSub: 'Ya existe una cuenta con este correo. Inicia sesión para sumar tus Cucharas de Oro de esta reserva y acceder a tu experiencia gastronómica personalizada.',
    useOtherEmail: 'Usar otro correo',
    back: 'Atrás',
    signInTitle: 'Iniciar sesión',
    signInSub: 'Bienvenido de nuevo — inicia sesión para sumar tus Cucharas de Oro.',
    continueWithGoogle: 'Continuar con Google',
    orWithEmail: 'o con tu correo',
    emailLabel: 'Correo', passwordLabel: 'Contraseña',
    emailPh: 'tu@correo.com',
    signingIn: 'Iniciando sesión…',
    forgotPassword: '¿Olvidaste tu contraseña?',
    createAccountTitle: 'Crear cuenta gratis',
    createAccountSub: 'Únete gratis y empieza a ganar Cucharas de Oro con esta reserva.',
    nameLabel: 'Nombre', namePh: 'Tu nombre',
    creatingAccount: 'Creando cuenta…',
    claimTitle: 'Reclama tus Cucharas de Oro',
    claimSub: 'Tu reserva está confirmada. Crea tu cuenta gratis ahora y recibe 25 Cucharas de Oro de esta reserva, además de recomendaciones personalizadas y recompensas exclusivas.',
    claimCta: 'Crear cuenta y reclamar recompensas',
    maybeLater: 'Quizás más tarde',
    resetTitle: 'Elige una contraseña nueva',
    resetSub: 'Escríbela dos veces para confirmar.',
    newPasswordLabel: 'Contraseña nueva', confirmPasswordLabel: 'Confirmar contraseña',
    resetMismatch: 'Las contraseñas no coinciden.',
    resetTooShort: 'La contraseña debe tener al menos 6 caracteres.',
    resetSubmit: 'Guardar contraseña', resetSaving: 'Guardando…',
    resetGenericErr: 'No se pudo cambiar la contraseña. Pide un nuevo link e inténtalo de nuevo.',
    resetSuccess: '¡Contraseña actualizada! Ya puedes iniciar sesión con ella.',
    resetGoHome: 'Volver al inicio',
    cancelScreenLoading: 'Cancelando tu reserva…',
    cancelScreenSuccessRefunded: 'Tu reserva se canceló. El depósito se reembolsará en 5-10 días hábiles.',
    cancelScreenSuccessForfeited: 'Tu reserva se canceló. Como fue con menos de 24 horas de antelación, el depósito no es reembolsable.',
    cancelScreenInvalid: 'Este enlace no es válido.',
    cancelScreenUsed: 'Este enlace ya se usó. Si fue un error, contacta con el restaurante.',
    cancelScreenExpired: 'Este enlace ha expirado — probablemente porque la reserva ya pasó.',
    cancelScreenAlready: 'Esta reserva ya estaba cancelada.',
    cancelScreenError: 'No se pudo procesar la cancelación. Inténtalo de nuevo o contacta con el restaurante.',
  },
  en: {
    benefits: [
      { spoon:true, text:'Earn Golden Spoons on every booking' },
      { text:'Get AI-personalised restaurant recommendations' },
      { text:'Save your favourite restaurants' },
      { text:'Access exclusive offers and promotions' },
      { text:'Book faster next time' }
    ],
    connErr: 'Connection error. Please reload the page.',
    checkInbox: 'Check your inbox to confirm your account, then sign in.',
    createAccountErr: 'Error creating your account. Please try again.',
    badCredentials: 'Incorrect email or password.',
    confirmEmailFirst: 'Confirm your email before signing in. Check your inbox.',
    signinErr: 'Error signing in. Please try again.',
    enterEmailForReset: 'Enter your email to reset your password.',
    resetEmailSent: "We've sent you an email to reset your password.",
    resetEmailErr: 'Error sending the reset email.',
    reserveTitle: 'Book your table',
    reserveSub: 'Book as a guest or create an account to unlock exclusive perks.',
    createFreeAccount: 'Create free account',
    continueAsGuest: 'Continue as guest',
    alreadyHaveAccount: 'Already have an account? ',
    signIn: 'Sign in',
    welcomeBack: 'Welcome back',
    welcomeBackSub: 'An account already exists with this email. Sign in to add the Golden Spoons from this booking and access your personalised dining experience.',
    useOtherEmail: 'Use a different email',
    back: 'Back',
    signInTitle: 'Sign in',
    signInSub: 'Welcome back — sign in to add your Golden Spoons.',
    continueWithGoogle: 'Continue with Google',
    orWithEmail: 'or with your email',
    emailLabel: 'Email', passwordLabel: 'Password',
    emailPh: 'you@email.com',
    signingIn: 'Signing in…',
    forgotPassword: 'Forgot your password?',
    createAccountTitle: 'Create free account',
    createAccountSub: 'Join for free and start earning Golden Spoons with this booking.',
    nameLabel: 'Name', namePh: 'Your name',
    creatingAccount: 'Creating account…',
    claimTitle: 'Claim your Golden Spoons',
    claimSub: 'Your booking is confirmed. Create your free account now and get 25 Golden Spoons for this booking, plus personalised recommendations and exclusive rewards.',
    claimCta: 'Create account and claim rewards',
    maybeLater: 'Maybe later',
    resetTitle: 'Choose a new password',
    resetSub: 'Enter it twice to confirm.',
    newPasswordLabel: 'New password', confirmPasswordLabel: 'Confirm password',
    resetMismatch: "Passwords don't match.",
    resetTooShort: 'Password must be at least 6 characters.',
    resetSubmit: 'Save password', resetSaving: 'Saving…',
    resetGenericErr: 'Could not change your password. Request a new link and try again.',
    resetSuccess: 'Password updated! You can now sign in with it.',
    resetGoHome: 'Back to home',
    cancelScreenLoading: 'Cancelling your booking…',
    cancelScreenSuccessRefunded: 'Your booking has been cancelled. The deposit will be refunded within 5-10 business days.',
    cancelScreenSuccessForfeited: "Your booking has been cancelled. Since it was less than 24 hours in advance, the deposit isn't refundable.",
    cancelScreenInvalid: "This link isn't valid.",
    cancelScreenUsed: 'This link was already used. If this was a mistake, contact the restaurant.',
    cancelScreenExpired: 'This link has expired — likely because the booking time has already passed.',
    cancelScreenAlready: 'This booking was already cancelled.',
    cancelScreenError: 'Could not process the cancellation. Please try again or contact the restaurant.',
  }
}[RA_LANG];

const RESERVE_BENEFITS = RA_T.benefits;

function Benefit({ b }){
  return React.createElement('li', { className:'rb-row' },
    React.createElement('span', { className:'rb-ck' }, React.createElement(Icon,{name:'check'})),
    React.createElement('span', { className:'rb-tx' },
      b.spoon ? React.createElement('span',{className:'rb-spoon'}, React.createElement(Icon,{name:'spoon'})) : null,
      b.text)
  );
}

/* ── gate principal de reserva ── */
function ReserveAuthModal({ onClose, onAccount, onGuest }){
  const [view,     setView]     = useState('intro'); // intro | signup | signin | welcomeback
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');

  /* clear transient state when switching views */
  const switchView = v => { setError(''); setInfo(''); setPassword(''); setView(v); };

  const finishAccount = appUser => onAccount(appUser);

  const signInWithGoogle = async () => {
    await window.UMAuth.sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const submitSignup = async e => {
    e.preventDefault();
    if (!window.UMAuth) {
      setError(RA_T.connErr);
      setLoading(false);
      return;
    }
    setError(''); setLoading(true);
    try {
      const appUser = await window.UMAuth.signUp(email.trim().toLowerCase(), password, name.trim());
      if (!appUser) {
        /* email confirmation required — no session yet */
        setError(RA_T.checkInbox);
        return;
      }
      finishAccount(appUser);
    } catch (err) {
      const msg = err.message || '';
      if (/already registered|already been registered/i.test(msg)) {
        switchView('welcomeback');
      } else {
        setError(msg || RA_T.createAccountErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitSignin = async e => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!window.UMAuth) {
      setError(RA_T.connErr);
      return;
    }
    setLoading(true);
    try {
      const appUser = await window.UMAuth.signIn(email.trim(), password);
      finishAccount(appUser);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError(RA_T.badCredentials);
      } else if (msg.includes('not confirmed') || msg.includes('Email not confirmed')) {
        setError(RA_T.confirmEmailFirst);
      } else {
        setError(RA_T.signinErr);
      }
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setError(RA_T.enterEmailForReset);
      return;
    }
    try {
      await window.UMAuth.sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });
      setError('');
      setInfo(RA_T.resetEmailSent);
    } catch(e) {
      setError(RA_T.resetEmailErr);
    }
  };

  const ErrMsg = error
    ? React.createElement('p', { style:{ color:'var(--coral,#FF5733)', fontSize:'13px', margin:'10px 0 0', lineHeight:1.4 } }, error)
    : null;

  /* ---- INTRO ---- */
  if (view === 'intro')
    return React.createElement(Modal, { onClose, max:440 },
      React.createElement('div', { className:'rb-head' },
        React.createElement('div', { className:'rb-badge' }, React.createElement(Icon,{name:'spoon'})),
        React.createElement('h2', null, RA_T.reserveTitle),
        React.createElement('p', { className:'msub' }, RA_T.reserveSub)),
      React.createElement('ul', { className:'rb-list' },
        RESERVE_BENEFITS.map((b,i)=>React.createElement(Benefit,{ key:i, b }))),
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:()=>switchView('signup') }, RA_T.createFreeAccount),
      React.createElement('button', { className:'btn btn-ghost btn-block', style:{marginTop:'10px'}, onClick:onGuest }, RA_T.continueAsGuest),
      React.createElement('p', { className:'rb-foot' },
        RA_T.alreadyHaveAccount,
        React.createElement('button', { className:'rb-link', onClick:()=>switchView('signin') }, RA_T.signIn))
    );

  /* ---- BIENVENIDO DE NUEVO ---- */
  if (view === 'welcomeback')
    return React.createElement(Modal, { onClose, max:420 },
      React.createElement('div', { className:'rb-head' },
        React.createElement('div', { className:'rb-badge' }, React.createElement(Icon,{name:'user'})),
        React.createElement('h2', null, RA_T.welcomeBack),
        React.createElement('p', { className:'msub' }, RA_T.welcomeBackSub)),
      React.createElement('div', { className:'rb-email-chip' }, React.createElement(Icon,{name:'user'}), email),
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:()=>switchView('signin') }, RA_T.signIn),
      React.createElement('button', { className:'btn btn-ghost btn-block', style:{marginTop:'10px'}, onClick:()=>{ setEmail(''); switchView('signup'); } }, RA_T.useOtherEmail)
    );

  /* ---- INICIAR SESIÓN ---- */
  if (view === 'signin')
    return React.createElement(Modal, { onClose, max:420 },
      React.createElement('button', { className:'rb-back', onClick:()=>switchView('intro') }, React.createElement(Icon,{name:'chevL'}), RA_T.back),
      React.createElement('h2', null, RA_T.signInTitle),
      React.createElement('p', { className:'msub' }, RA_T.signInSub),
      React.createElement('button', { className:'sso-btn', style:{marginBottom:'16px'}, onClick:signInWithGoogle },
        React.createElement(Icon,{name:'google'}), RA_T.continueWithGoogle),
      React.createElement('div', { className:'divider' }, RA_T.orWithEmail),
      React.createElement('form', { onSubmit:submitSignin },
        React.createElement('div', { className:'field' },
          React.createElement('label', null, RA_T.emailLabel),
          React.createElement('input', { type:'email', value:email, onChange:e=>setEmail(e.target.value), placeholder:RA_T.emailPh, required:true, disabled:loading })),
        React.createElement('div', { className:'field' },
          React.createElement('label', null, RA_T.passwordLabel),
          React.createElement('input', { type:'password', value:password, onChange:e=>setPassword(e.target.value), placeholder:'••••••••', required:true, disabled:loading })),
        ErrMsg,
        info && React.createElement('p', { style:{ color:'#16a34a', fontSize:'13px', margin:'10px 0 0', lineHeight:1.4 } }, info),
        React.createElement('button', { className:'btn btn-acc btn-block btn-lg', type:'submit', style:{marginTop:'12px'}, disabled:loading },
          loading ? RA_T.signingIn : RA_T.signIn),
        React.createElement('button', {
          type:'button', onClick:resetPassword,
          style:{ background:'none', border:'none', color:'#D8552E', fontSize:13, cursor:'pointer', marginTop:8, textDecoration:'underline', padding:0 }
        }, RA_T.forgotPassword))
    );

  /* ---- CREAR CUENTA ---- */
  return React.createElement(Modal, { onClose, max:430 },
    React.createElement('button', { className:'rb-back', onClick:()=>switchView('intro') }, React.createElement(Icon,{name:'chevL'}), RA_T.back),
    React.createElement('h2', null, RA_T.createAccountTitle),
    React.createElement('p', { className:'msub' }, RA_T.createAccountSub),
    React.createElement('button', { className:'sso-btn', style:{marginBottom:'16px'}, onClick:signInWithGoogle },
      React.createElement(Icon,{name:'google'}), RA_T.continueWithGoogle),
    React.createElement('div', { className:'divider' }, RA_T.orWithEmail),
    React.createElement('form', { onSubmit:submitSignup },
      React.createElement('div', { className:'field' },
        React.createElement('label', null, RA_T.nameLabel),
        React.createElement('input', { value:name, onChange:e=>setName(e.target.value), placeholder:RA_T.namePh, required:true, disabled:loading })),
      React.createElement('div', { className:'field' },
        React.createElement('label', null, RA_T.emailLabel),
        React.createElement('input', { type:'email', value:email, onChange:e=>setEmail(e.target.value), placeholder:RA_T.emailPh, required:true, disabled:loading })),
      React.createElement('div', { className:'field' },
        React.createElement('label', null, RA_T.passwordLabel),
        React.createElement('input', { type:'password', value:password, onChange:e=>setPassword(e.target.value), placeholder:'••••••••', required:true, minLength:6, disabled:loading })),
      ErrMsg,
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', type:'submit', style:{marginTop:'12px'}, disabled:loading },
        loading ? RA_T.creatingAccount : RA_T.createFreeAccount)),
    React.createElement('p', { className:'rb-foot' },
      RA_T.alreadyHaveAccount,
      React.createElement('button', { className:'rb-link', onClick:()=>switchView('signin') }, RA_T.signIn))
  );
}

/* ── upsell tras reservar como invitado ── */
function ClaimSpoonsModal({ onClose, onCreate }){
  return React.createElement(Modal, { onClose, max:430 },
    React.createElement('div', { className:'rb-head' },
      React.createElement('div', { className:'rb-badge big' },
        React.createElement(Icon,{name:'spoon'}),
        React.createElement('span',{className:'rb-25'},'25')),
      React.createElement('h2', null, RA_T.claimTitle),
      React.createElement('p', { className:'msub' }, RA_T.claimSub)),
    React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:onCreate }, RA_T.claimCta),
    React.createElement('button', { className:'btn btn-ghost btn-block', style:{marginTop:'10px'}, onClick:onClose }, RA_T.maybeLater)
  );
}

/* ── pantalla real de "elegir contraseña nueva", tras volver del link de recuperación ── */
function ResetPasswordScreen({ onDone }){
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (pw1.length < 6) { setError(RA_T.resetTooShort); return; }
    if (pw1 !== pw2) { setError(RA_T.resetMismatch); return; }
    if (!window.UMAuth || !window.UMAuth.sb) { setError(RA_T.resetGenericErr); return; }
    setLoading(true);
    try {
      const { error: err } = await window.UMAuth.sb.auth.updateUser({ password: pw1 });
      if (err) throw err;
      setDone(true);
    } catch (e) {
      setError(RA_T.resetGenericErr);
    }
    setLoading(false);
  };

  if (done) {
    return React.createElement(Modal, { onClose: onDone, max:420 },
      React.createElement('div', { className:'rb-head' },
        React.createElement('div', { className:'rb-badge' }, React.createElement(Icon,{name:'check'})),
        React.createElement('h2', null, RA_T.resetSuccess)),
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:onDone }, RA_T.resetGoHome)
    );
  }

  return React.createElement(Modal, { onClose: onDone, max:420 },
    React.createElement('div', { className:'rb-head' },
      React.createElement('h2', null, RA_T.resetTitle),
      React.createElement('p', { className:'msub' }, RA_T.resetSub)),
    React.createElement('form', { onSubmit: submit },
      React.createElement('div', { className:'field' },
        React.createElement('label', null, RA_T.newPasswordLabel),
        React.createElement('input', { type:'password', value:pw1, onChange:e=>setPw1(e.target.value), placeholder:'••••••••', required:true, minLength:6, disabled:loading, autoFocus:true })),
      React.createElement('div', { className:'field' },
        React.createElement('label', null, RA_T.confirmPasswordLabel),
        React.createElement('input', { type:'password', value:pw2, onChange:e=>setPw2(e.target.value), placeholder:'••••••••', required:true, minLength:6, disabled:loading })),
      error ? React.createElement('p', { style:{ color:'#dc2626', fontSize:13, margin:'10px 0 0', lineHeight:1.4 } }, error) : null,
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', type:'submit', style:{marginTop:'12px'}, disabled:loading },
        loading ? RA_T.resetSaving : RA_T.resetSubmit))
  );
}

/* ── pantalla que consume el link de cancelación de invitado — vive en la
   propia app, no en una URL cruda de Supabase, para evitar que webviews de
   clientes de correo (Gmail confirmado) muestren la respuesta como texto
   plano sin renderizar en vez de abrir una página real. ── */
function CancelBookingScreen({ token, onDone }){
  const [state, setState] = useState('loading'); // loading | success | error
  const [code, setCode] = useState(null);
  const [refunded, setRefunded] = useState(false);

  useEffect(() => {
    if (!token) { setState('error'); setCode('invalid'); return; }
    fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/cancel-reservation-guest?token=' + encodeURIComponent(token))
      .then(r => r.json())
      .then(json => {
        if (json.ok) { setState('success'); setRefunded(!!json.refunded); }
        else { setState('error'); setCode(json.code || 'error'); }
      })
      .catch(() => { setState('error'); setCode('error'); });
  }, [token]);

  const errorMsg = () => {
    switch (code) {
      case 'used': return RA_T.cancelScreenUsed;
      case 'expired': return RA_T.cancelScreenExpired;
      case 'already_cancelled': return RA_T.cancelScreenAlready;
      case 'invalid': return RA_T.cancelScreenInvalid;
      default: return RA_T.cancelScreenError;
    }
  };

  return React.createElement(Modal, { onClose: onDone, max:420 },
    React.createElement('div', { className:'rb-head' },
      state === 'success'
        ? React.createElement('div', { className:'rb-badge' }, React.createElement(Icon,{name:'check'}))
        : null,
      React.createElement('h2', null,
        state === 'loading' ? RA_T.cancelScreenLoading
        : state === 'success' ? (refunded ? RA_T.cancelScreenSuccessRefunded : RA_T.cancelScreenSuccessForfeited)
        : errorMsg()
      )
    ),
    state !== 'loading' ? React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:onDone }, RA_T.resetGoHome) : null
  );
}

Object.assign(window, { ReserveAuthModal, ClaimSpoonsModal, ResetPasswordScreen, CancelBookingScreen });
