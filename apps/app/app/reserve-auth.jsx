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
        redirectTo: window.location.origin + '/#reset-password'
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

Object.assign(window, { ReserveAuthModal, ClaimSpoonsModal });
