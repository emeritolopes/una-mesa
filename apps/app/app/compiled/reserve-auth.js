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
    benefits: [{
      spoon: true,
      text: 'Gana Cucharas de Oro en cada reserva'
    }, {
      text: 'Recibe recomendaciones de restaurantes personalizadas con IA'
    }, {
      text: 'Guarda tus restaurantes favoritos'
    }, {
      text: 'Accede a ofertas y promociones exclusivas'
    }, {
      text: 'Reserva más rápido la próxima vez'
    }],
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
    emailLabel: 'Correo',
    passwordLabel: 'Contraseña',
    emailPh: 'tu@correo.com',
    signingIn: 'Iniciando sesión…',
    forgotPassword: '¿Olvidaste tu contraseña?',
    createAccountTitle: 'Crear cuenta gratis',
    createAccountSub: 'Únete gratis y empieza a ganar Cucharas de Oro con esta reserva.',
    nameLabel: 'Nombre',
    namePh: 'Tu nombre',
    creatingAccount: 'Creando cuenta…',
    claimTitle: 'Reclama tus Cucharas de Oro',
    claimSub: 'Tu reserva está confirmada. Crea tu cuenta gratis ahora y recibe 25 Cucharas de Oro de esta reserva, además de recomendaciones personalizadas y recompensas exclusivas.',
    claimCta: 'Crear cuenta y reclamar recompensas',
    maybeLater: 'Quizás más tarde',
    resetTitle: 'Elige una contraseña nueva',
    resetSub: 'Escríbela dos veces para confirmar.',
    newPasswordLabel: 'Contraseña nueva',
    confirmPasswordLabel: 'Confirmar contraseña',
    resetMismatch: 'Las contraseñas no coinciden.',
    resetTooShort: 'La contraseña debe tener al menos 6 caracteres.',
    resetSubmit: 'Guardar contraseña',
    resetSaving: 'Guardando…',
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
    cancelScreenError: 'No se pudo procesar la cancelación. Inténtalo de nuevo o contacta con el restaurante.'
  },
  en: {
    benefits: [{
      spoon: true,
      text: 'Earn Golden Spoons on every booking'
    }, {
      text: 'Get AI-personalised restaurant recommendations'
    }, {
      text: 'Save your favourite restaurants'
    }, {
      text: 'Access exclusive offers and promotions'
    }, {
      text: 'Book faster next time'
    }],
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
    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailPh: 'you@email.com',
    signingIn: 'Signing in…',
    forgotPassword: 'Forgot your password?',
    createAccountTitle: 'Create free account',
    createAccountSub: 'Join for free and start earning Golden Spoons with this booking.',
    nameLabel: 'Name',
    namePh: 'Your name',
    creatingAccount: 'Creating account…',
    claimTitle: 'Claim your Golden Spoons',
    claimSub: 'Your booking is confirmed. Create your free account now and get 25 Golden Spoons for this booking, plus personalised recommendations and exclusive rewards.',
    claimCta: 'Create account and claim rewards',
    maybeLater: 'Maybe later',
    resetTitle: 'Choose a new password',
    resetSub: 'Enter it twice to confirm.',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm password',
    resetMismatch: "Passwords don't match.",
    resetTooShort: 'Password must be at least 6 characters.',
    resetSubmit: 'Save password',
    resetSaving: 'Saving…',
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
    cancelScreenError: 'Could not process the cancellation. Please try again or contact the restaurant.'
  }
}[RA_LANG];
const RESERVE_BENEFITS = RA_T.benefits;
function Benefit({
  b
}) {
  return React.createElement('li', {
    className: 'rb-row'
  }, React.createElement('span', {
    className: 'rb-ck'
  }, React.createElement(Icon, {
    name: 'check'
  })), React.createElement('span', {
    className: 'rb-tx'
  }, b.spoon ? React.createElement('span', {
    className: 'rb-spoon'
  }, React.createElement(Icon, {
    name: 'spoon'
  })) : null, b.text));
}

/* ── gate principal de reserva ── */
function ReserveAuthModal({
  onClose,
  onAccount,
  onGuest
}) {
  const [view, setView] = useState('intro'); // intro | signup | signin | welcomeback
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  /* clear transient state when switching views */
  const switchView = v => {
    setError('');
    setInfo('');
    setPassword('');
    setView(v);
  };
  const finishAccount = appUser => onAccount(appUser);
  const signInWithGoogle = async () => {
    await window.UMAuth.sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };
  const submitSignup = async e => {
    e.preventDefault();
    if (!window.UMAuth) {
      setError(RA_T.connErr);
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
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
    setError('');
    setInfo('');
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
    } catch (e) {
      setError(RA_T.resetEmailErr);
    }
  };
  const ErrMsg = error ? React.createElement('p', {
    style: {
      color: 'var(--coral,#FF5733)',
      fontSize: '13px',
      margin: '10px 0 0',
      lineHeight: 1.4
    }
  }, error) : null;

  /* ---- INTRO ---- */
  if (view === 'intro') return React.createElement(Modal, {
    onClose,
    max: 440
  }, React.createElement('div', {
    className: 'rb-head'
  }, React.createElement('div', {
    className: 'rb-badge'
  }, React.createElement(Icon, {
    name: 'spoon'
  })), React.createElement('h2', null, RA_T.reserveTitle), React.createElement('p', {
    className: 'msub'
  }, RA_T.reserveSub)), React.createElement('ul', {
    className: 'rb-list'
  }, RESERVE_BENEFITS.map((b, i) => React.createElement(Benefit, {
    key: i,
    b
  }))), React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    onClick: () => switchView('signup')
  }, RA_T.createFreeAccount), React.createElement('button', {
    className: 'btn btn-ghost btn-block',
    style: {
      marginTop: '10px'
    },
    onClick: onGuest
  }, RA_T.continueAsGuest), React.createElement('p', {
    className: 'rb-foot'
  }, RA_T.alreadyHaveAccount, React.createElement('button', {
    className: 'rb-link',
    onClick: () => switchView('signin')
  }, RA_T.signIn)));

  /* ---- BIENVENIDO DE NUEVO ---- */
  if (view === 'welcomeback') return React.createElement(Modal, {
    onClose,
    max: 420
  }, React.createElement('div', {
    className: 'rb-head'
  }, React.createElement('div', {
    className: 'rb-badge'
  }, React.createElement(Icon, {
    name: 'user'
  })), React.createElement('h2', null, RA_T.welcomeBack), React.createElement('p', {
    className: 'msub'
  }, RA_T.welcomeBackSub)), React.createElement('div', {
    className: 'rb-email-chip'
  }, React.createElement(Icon, {
    name: 'user'
  }), email), React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    onClick: () => switchView('signin')
  }, RA_T.signIn), React.createElement('button', {
    className: 'btn btn-ghost btn-block',
    style: {
      marginTop: '10px'
    },
    onClick: () => {
      setEmail('');
      switchView('signup');
    }
  }, RA_T.useOtherEmail));

  /* ---- INICIAR SESIÓN ---- */
  if (view === 'signin') return React.createElement(Modal, {
    onClose,
    max: 420
  }, React.createElement('button', {
    className: 'rb-back',
    onClick: () => switchView('intro')
  }, React.createElement(Icon, {
    name: 'chevL'
  }), RA_T.back), React.createElement('h2', null, RA_T.signInTitle), React.createElement('p', {
    className: 'msub'
  }, RA_T.signInSub), React.createElement('button', {
    className: 'sso-btn',
    style: {
      marginBottom: '16px'
    },
    onClick: signInWithGoogle
  }, React.createElement(Icon, {
    name: 'google'
  }), RA_T.continueWithGoogle), React.createElement('div', {
    className: 'divider'
  }, RA_T.orWithEmail), React.createElement('form', {
    onSubmit: submitSignin
  }, React.createElement('div', {
    className: 'field'
  }, React.createElement('label', null, RA_T.emailLabel), React.createElement('input', {
    type: 'email',
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: RA_T.emailPh,
    required: true,
    disabled: loading
  })), React.createElement('div', {
    className: 'field'
  }, React.createElement('label', null, RA_T.passwordLabel), React.createElement('input', {
    type: 'password',
    value: password,
    onChange: e => setPassword(e.target.value),
    placeholder: '••••••••',
    required: true,
    disabled: loading
  })), ErrMsg, info && React.createElement('p', {
    style: {
      color: '#16a34a',
      fontSize: '13px',
      margin: '10px 0 0',
      lineHeight: 1.4
    }
  }, info), React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    type: 'submit',
    style: {
      marginTop: '12px'
    },
    disabled: loading
  }, loading ? RA_T.signingIn : RA_T.signIn), React.createElement('button', {
    type: 'button',
    onClick: resetPassword,
    style: {
      background: 'none',
      border: 'none',
      color: '#D8552E',
      fontSize: 13,
      cursor: 'pointer',
      marginTop: 8,
      textDecoration: 'underline',
      padding: 0
    }
  }, RA_T.forgotPassword)));

  /* ---- CREAR CUENTA ---- */
  return React.createElement(Modal, {
    onClose,
    max: 430
  }, React.createElement('button', {
    className: 'rb-back',
    onClick: () => switchView('intro')
  }, React.createElement(Icon, {
    name: 'chevL'
  }), RA_T.back), React.createElement('h2', null, RA_T.createAccountTitle), React.createElement('p', {
    className: 'msub'
  }, RA_T.createAccountSub), React.createElement('button', {
    className: 'sso-btn',
    style: {
      marginBottom: '16px'
    },
    onClick: signInWithGoogle
  }, React.createElement(Icon, {
    name: 'google'
  }), RA_T.continueWithGoogle), React.createElement('div', {
    className: 'divider'
  }, RA_T.orWithEmail), React.createElement('form', {
    onSubmit: submitSignup
  }, React.createElement('div', {
    className: 'field'
  }, React.createElement('label', null, RA_T.nameLabel), React.createElement('input', {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: RA_T.namePh,
    required: true,
    disabled: loading
  })), React.createElement('div', {
    className: 'field'
  }, React.createElement('label', null, RA_T.emailLabel), React.createElement('input', {
    type: 'email',
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: RA_T.emailPh,
    required: true,
    disabled: loading
  })), React.createElement('div', {
    className: 'field'
  }, React.createElement('label', null, RA_T.passwordLabel), React.createElement('input', {
    type: 'password',
    value: password,
    onChange: e => setPassword(e.target.value),
    placeholder: '••••••••',
    required: true,
    minLength: 6,
    disabled: loading
  })), ErrMsg, React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    type: 'submit',
    style: {
      marginTop: '12px'
    },
    disabled: loading
  }, loading ? RA_T.creatingAccount : RA_T.createFreeAccount)), React.createElement('p', {
    className: 'rb-foot'
  }, RA_T.alreadyHaveAccount, React.createElement('button', {
    className: 'rb-link',
    onClick: () => switchView('signin')
  }, RA_T.signIn)));
}

/* ── upsell tras reservar como invitado ── */
function ClaimSpoonsModal({
  onClose,
  onCreate
}) {
  return React.createElement(Modal, {
    onClose,
    max: 430
  }, React.createElement('div', {
    className: 'rb-head'
  }, React.createElement('div', {
    className: 'rb-badge big'
  }, React.createElement(Icon, {
    name: 'spoon'
  }), React.createElement('span', {
    className: 'rb-25'
  }, '25')), React.createElement('h2', null, RA_T.claimTitle), React.createElement('p', {
    className: 'msub'
  }, RA_T.claimSub)), React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    onClick: onCreate
  }, RA_T.claimCta), React.createElement('button', {
    className: 'btn btn-ghost btn-block',
    style: {
      marginTop: '10px'
    },
    onClick: onClose
  }, RA_T.maybeLater));
}

/* ── pantalla real de "elegir contraseña nueva", tras volver del link de recuperación ── */
function ResetPasswordScreen({
  onDone
}) {
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setError('');
    if (pw1.length < 6) {
      setError(RA_T.resetTooShort);
      return;
    }
    if (pw1 !== pw2) {
      setError(RA_T.resetMismatch);
      return;
    }
    if (!window.UMAuth || !window.UMAuth.sb) {
      setError(RA_T.resetGenericErr);
      return;
    }
    setLoading(true);
    try {
      const {
        error: err
      } = await window.UMAuth.sb.auth.updateUser({
        password: pw1
      });
      if (err) throw err;
      setDone(true);
    } catch (e) {
      setError(RA_T.resetGenericErr);
    }
    setLoading(false);
  };
  if (done) {
    return React.createElement(Modal, {
      onClose: onDone,
      max: 420
    }, React.createElement('div', {
      className: 'rb-head'
    }, React.createElement('div', {
      className: 'rb-badge'
    }, React.createElement(Icon, {
      name: 'check'
    })), React.createElement('h2', null, RA_T.resetSuccess)), React.createElement('button', {
      className: 'btn btn-acc btn-block btn-lg',
      onClick: onDone
    }, RA_T.resetGoHome));
  }
  return React.createElement(Modal, {
    onClose: onDone,
    max: 420
  }, React.createElement('div', {
    className: 'rb-head'
  }, React.createElement('h2', null, RA_T.resetTitle), React.createElement('p', {
    className: 'msub'
  }, RA_T.resetSub)), React.createElement('form', {
    onSubmit: submit
  }, React.createElement('div', {
    className: 'field'
  }, React.createElement('label', null, RA_T.newPasswordLabel), React.createElement('input', {
    type: 'password',
    value: pw1,
    onChange: e => setPw1(e.target.value),
    placeholder: '••••••••',
    required: true,
    minLength: 6,
    disabled: loading,
    autoFocus: true
  })), React.createElement('div', {
    className: 'field'
  }, React.createElement('label', null, RA_T.confirmPasswordLabel), React.createElement('input', {
    type: 'password',
    value: pw2,
    onChange: e => setPw2(e.target.value),
    placeholder: '••••••••',
    required: true,
    minLength: 6,
    disabled: loading
  })), error ? React.createElement('p', {
    style: {
      color: '#dc2626',
      fontSize: 13,
      margin: '10px 0 0',
      lineHeight: 1.4
    }
  }, error) : null, React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    type: 'submit',
    style: {
      marginTop: '12px'
    },
    disabled: loading
  }, loading ? RA_T.resetSaving : RA_T.resetSubmit)));
}

/* ── pantalla que consume el link de cancelación de invitado — vive en la
   propia app, no en una URL cruda de Supabase, para evitar que webviews de
   clientes de correo (Gmail confirmado) muestren la respuesta como texto
   plano sin renderizar en vez de abrir una página real. ── */
function CancelBookingScreen({
  token,
  onDone
}) {
  const [state, setState] = useState('loading'); // loading | success | error
  const [code, setCode] = useState(null);
  const [refunded, setRefunded] = useState(false);
  useEffect(() => {
    if (!token) {
      setState('error');
      setCode('invalid');
      return;
    }
    fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/cancel-reservation-guest?token=' + encodeURIComponent(token)).then(r => r.json()).then(json => {
      if (json.ok) {
        setState('success');
        setRefunded(!!json.refunded);
      } else {
        setState('error');
        setCode(json.code || 'error');
      }
    }).catch(() => {
      setState('error');
      setCode('error');
    });
  }, [token]);
  const errorMsg = () => {
    switch (code) {
      case 'used':
        return RA_T.cancelScreenUsed;
      case 'expired':
        return RA_T.cancelScreenExpired;
      case 'already_cancelled':
        return RA_T.cancelScreenAlready;
      case 'invalid':
        return RA_T.cancelScreenInvalid;
      default:
        return RA_T.cancelScreenError;
    }
  };
  return React.createElement(Modal, {
    onClose: onDone,
    max: 420
  }, React.createElement('div', {
    className: 'rb-head'
  }, state === 'success' ? React.createElement('div', {
    className: 'rb-badge'
  }, React.createElement(Icon, {
    name: 'check'
  })) : null, React.createElement('h2', null, state === 'loading' ? RA_T.cancelScreenLoading : state === 'success' ? refunded ? RA_T.cancelScreenSuccessRefunded : RA_T.cancelScreenSuccessForfeited : errorMsg())), state !== 'loading' ? React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    onClick: onDone
  }, RA_T.resetGoHome) : null);
}

/* ── pantalla de autoservicio para que un restaurante complete su
   verificación de Stripe Connect con el link que Emerito le mandó por
   email — sin login, sin depender de que Emerito corra nada a mano. ── */
function StripeConnectScreen({
  token,
  justDone,
  onDone
}) {
  const [state, setState] = useState(justDone ? 'done' : 'loading'); // loading | redirecting | done | error
  const [code, setCode] = useState(null);
  const [restaurantName, setRestaurantName] = useState(null);
  useEffect(() => {
    if (justDone) return; // ya terminaste el formulario — no volver a pedir un link nuevo
    if (!token) {
      setState('error');
      setCode('invalid');
      return;
    }
    fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/stripe-connect-self-onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token
      })
    }).then(r => r.json()).then(json => {
      if (json.ok && json.onboarding_url) {
        setRestaurantName(json.restaurant_name);
        setState('redirecting');
        window.location.href = json.onboarding_url;
      } else {
        setState('error');
        setCode(json.code || 'error');
        setRestaurantName(json.restaurant_name || null);
      }
    }).catch(() => {
      setState('error');
      setCode('error');
    });
  }, [token, justDone]);
  const errorMsg = () => {
    switch (code) {
      case 'expired':
        return 'Este enlace ha expirado — contacta con Una Mesa para uno nuevo.';
      case 'already_connected':
        return `${restaurantName || 'Este restaurante'} ya completó su verificación de pagos.`;
      case 'invalid':
        return 'Este enlace no es válido.';
      default:
        return 'No se pudo procesar. Inténtalo de nuevo o contacta con Una Mesa.';
    }
  };
  return React.createElement(Modal, {
    onClose: onDone,
    max: 420
  }, React.createElement('div', {
    className: 'rb-head'
  }, React.createElement('h2', null, state === 'loading' ? 'Cargando…' : state === 'redirecting' ? `Llevándote a Stripe para ${restaurantName || 'tu restaurante'}…` : state === 'done' ? '¡Gracias! Estamos verificando tus datos.' : errorMsg()), state === 'done' ? React.createElement('p', {
    style: {
      fontSize: 14,
      color: '#777',
      marginTop: 8
    }
  }, 'Puede tardar unos minutos. Si necesitas completar algo más, te avisaremos por email.') : null), state === 'error' || state === 'done' ? React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    onClick: onDone
  }, 'Volver al inicio') : null);
}

/* ── pantalla de alta de restaurantes para admin — reemplaza el INSERT de
   SQL a mano que hacíamos por cada restaurante nuevo. Usa la sesión activa
   directamente, sin pedir ningún JWT copiado a mano. ── */
function AdminCreateVenueScreen({
  onDone
}) {
  const [mode, setMode] = useState('picker'); // picker | create | edit
  const [venueList, setVenueList] = useState(null); // null = not loaded yet
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: 'Madrid',
    phone: '',
    email: '',
    cuisine: '',
    neighborhood: '',
    description: '',
    photo_urls: [],
    deposit: '10.00',
    capacity: '50',
    lunch_start: '13:00',
    lunch_end: '16:00',
    dinner_start: '20:00',
    dinner_end: '23:00'
  });
  const [state, setState] = useState('form'); // form | loading | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [viewCounts, setViewCounts] = useState(null);
  const [editingArchived, setEditingArchived] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const uploadOneFile = async (file, token) => {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/upload-venue-photo', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_base64: base64,
        content_type: file.type
      })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'No se pudo subir la foto');
    return json.url;
  };
  const handlePhotoFiles = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPhotoError('');
    const remaining = 10 - form.photo_urls.length;
    if (remaining <= 0) {
      setPhotoError('Ya tienes 10 fotos — quita alguna antes de subir más.');
      return;
    }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) setPhotoError(`Solo se subieron ${remaining} — el máximo es 10 fotos.`);
    setPhotoUploading(true);
    try {
      const {
        data
      } = await window.UMAuth.sb.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        setPhotoError('No hay sesión iniciada.');
        setPhotoUploading(false);
        return;
      }
      for (const file of toUpload) {
        try {
          const url = await uploadOneFile(file, token);
          setForm(f => ({
            ...f,
            photo_urls: [...f.photo_urls, url]
          }));
        } catch (err) {
          setPhotoError(err.message || String(err));
        }
      }
    } finally {
      setPhotoUploading(false);
      e.target.value = ''; // permite volver a elegir el mismo archivo si hace falta
    }
  };
  const removePhoto = idx => {
    setForm(f => ({
      ...f,
      photo_urls: f.photo_urls.filter((_, i) => i !== idx)
    }));
  };
  const startEdit = async () => {
    setMode('edit');
    if (venueList === null) {
      try {
        const sb = window.UMAuth.sb;
        const {
          data
        } = await sb.from('venues').select('id,name,city,address,phone,email,cuisine,neighborhood,description,deposit_amount,capacity,photo_urls,times,archived').order('name');
        setVenueList(data || []);
      } catch (e) {
        setVenueList([]);
      }
    }
  };
  const slotsToRange = slots => {
    if (!slots || !slots.length) return null;
    const start = slots[0][0];
    const [lh, lm] = slots[slots.length - 1][0].split(':').map(Number);
    let endM = lm + 30,
      endH = lh;
    if (endM >= 60) {
      endH++;
      endM -= 60;
    }
    const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    return {
      start,
      end
    };
  };
  const pickVenue = v => {
    setEditingId(v.id);
    setEditingArchived(!!v.archived);
    setViewCounts(null);
    window.UMAuth.sb.from('venue_view_counts').select('*').eq('venue_id', v.id).maybeSingle().then(({
      data
    }) => setViewCounts(data || {
      total_views: 0,
      views_last_7_days: 0,
      views_last_30_days: 0
    }));
    const lunch = slotsToRange(v.times?.lunch) || {
      start: '13:00',
      end: '16:00'
    };
    const dinner = slotsToRange(v.times?.dinner) || {
      start: '20:00',
      end: '23:00'
    };
    setForm({
      name: v.name || '',
      address: v.address || '',
      city: v.city || 'Madrid',
      phone: v.phone || '',
      email: v.email || '',
      cuisine: v.cuisine || '',
      neighborhood: v.neighborhood || '',
      description: v.description || '',
      photo_urls: v.photo_urls || [],
      deposit: ((v.deposit_amount ?? 1000) / 100).toFixed(2),
      capacity: String(v.capacity ?? 50),
      lunch_start: lunch.start,
      lunch_end: lunch.end,
      dinner_start: dinner.start,
      dinner_end: dinner.end
    });
  };
  const toggleArchived = async () => {
    setArchiveLoading(true);
    try {
      const {
        data
      } = await window.UMAuth.sb.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        setErrorMsg('No hay sesión iniciada.');
        setArchiveLoading(false);
        return;
      }
      const res = await fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/update-venue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          venue_id: editingId,
          archived: !editingArchived
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'No se pudo cambiar el estado');
        setArchiveLoading(false);
        return;
      }
      setEditingArchived(!editingArchived);
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setArchiveLoading(false);
    }
  };
  const submit = async () => {
    if (!form.name.trim()) {
      setErrorMsg('Falta el nombre');
      setState('error');
      return;
    }
    setState('loading');
    try {
      const {
        data
      } = await window.UMAuth.sb.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        setErrorMsg('No hay sesión iniciada — inicia sesión con tu cuenta de admin primero.');
        setState('error');
        return;
      }
      const isEdit = mode === 'edit' && editingId;
      const url = isEdit ? 'https://rkaytcmyaaighozxatod.supabase.co/functions/v1/update-venue' : 'https://rkaytcmyaaighozxatod.supabase.co/functions/v1/create-venue';
      const payload = {
        ...(isEdit ? {
          venue_id: editingId
        } : {}),
        name: form.name,
        address: form.address,
        city: form.city,
        phone: form.phone,
        email: form.email,
        cuisine: form.cuisine,
        neighborhood: form.neighborhood,
        description: form.description,
        photo_urls: form.photo_urls,
        deposit_amount: Math.round(Number(form.deposit) * 100) || 1000,
        capacity: Number(form.capacity) || 50,
        lunch_start: form.lunch_start,
        lunch_end: form.lunch_end,
        dinner_start: form.dinner_start,
        dinner_end: form.dinner_end
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'Error desconocido');
        setState('error');
        return;
      }
      setResult(json);
      setState('done');
    } catch (e) {
      setErrorMsg(e.message || String(e));
      setState('error');
    }
  };
  const copyLink = () => {
    navigator.clipboard?.writeText(result.self_service_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    marginBottom: 12
  };
  const labelStyle = {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    display: 'block'
  };
  const showForm = state === 'form' && (mode === 'create' || mode === 'edit' && editingId);
  return React.createElement(Modal, {
    onClose: onDone,
    max: 480
  }, React.createElement('div', {
    className: 'rb-head'
  }, React.createElement('h2', null, state === 'done' ? mode === 'edit' ? '¡Restaurante actualizado!' : '¡Restaurante creado!' : mode === 'picker' ? 'Restaurantes' : mode === 'edit' && !editingId ? 'Elige un restaurante' : mode === 'edit' ? `Editando: ${form.name}` : 'Nuevo restaurante')), mode === 'edit' && editingId && viewCounts && React.createElement('p', {
    style: {
      fontSize: 13,
      color: '#888',
      marginTop: -8,
      marginBottom: 16
    }
  }, `👁 ${viewCounts.total_views} visitas en total · ${viewCounts.views_last_7_days} en los últimos 7 días · ${viewCounts.views_last_30_days} en los últimos 30`), mode === 'edit' && editingId && React.createElement('button', {
    onClick: () => {
      if (!editingArchived && !confirm('¿Archivar este restaurante? Dejará de verse en la web para los comensales — su historial de reservas no se toca, y puedes reactivarlo cuando quieras desde aquí mismo.')) return;
      toggleArchived();
    },
    disabled: archiveLoading,
    style: {
      width: '100%',
      padding: '10px',
      borderRadius: 8,
      border: '1px solid ' + (editingArchived ? '#2e7d32' : '#c0392b'),
      background: '#fff',
      color: editingArchived ? '#2e7d32' : '#c0392b',
      marginBottom: 16,
      cursor: 'pointer',
      fontWeight: 600
    }
  }, archiveLoading ? 'Procesando…' : editingArchived ? 'Reactivar restaurante' : 'Archivar restaurante (ocultar de la web)'), mode === 'picker' && React.createElement('div', null, React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    onClick: () => setMode('create'),
    style: {
      marginBottom: 10
    }
  }, 'Crear restaurante nuevo'), React.createElement('button', {
    className: 'btn btn-block btn-lg',
    onClick: startEdit,
    style: {
      background: '#f3f3f3'
    }
  }, 'Editar restaurante existente')), mode === 'edit' && !editingId && React.createElement('div', null, venueList === null && React.createElement('p', {
    style: {
      color: '#777'
    }
  }, 'Cargando…'), venueList && venueList.length === 0 && React.createElement('p', {
    style: {
      color: '#777'
    }
  }, 'No hay restaurantes todavía.'), venueList && venueList.map(v => React.createElement('button', {
    key: v.id,
    onClick: () => pickVenue(v),
    style: {
      width: '100%',
      textAlign: 'left',
      padding: '12px 14px',
      borderRadius: 8,
      border: '1px solid #eee',
      background: v.archived ? '#f5f5f5' : '#fff',
      marginBottom: 8,
      cursor: 'pointer',
      color: v.archived ? '#999' : '#000'
    }
  }, `${v.name} — ${v.city}${v.archived ? ' (archivado)' : ''}`))), showForm && React.createElement('div', null, React.createElement('label', {
    style: labelStyle
  }, 'Nombre'), React.createElement('input', {
    style: inputStyle,
    value: form.name,
    onChange: set('name')
  }), React.createElement('label', {
    style: labelStyle
  }, 'Ciudad'), React.createElement('select', {
    style: inputStyle,
    value: form.city,
    onChange: set('city')
  }, React.createElement('option', {
    value: 'Madrid'
  }, 'Madrid'), React.createElement('option', {
    value: 'London'
  }, 'London')), React.createElement('label', {
    style: labelStyle
  }, 'Dirección'), React.createElement('input', {
    style: inputStyle,
    value: form.address,
    onChange: set('address')
  }), React.createElement('label', {
    style: labelStyle
  }, 'Teléfono'), React.createElement('input', {
    style: inputStyle,
    value: form.phone,
    onChange: set('phone')
  }), React.createElement('label', {
    style: labelStyle
  }, 'Email'), React.createElement('input', {
    style: inputStyle,
    value: form.email,
    onChange: set('email')
  }), React.createElement('label', {
    style: labelStyle
  }, 'Cocina (ej. Mediterránea)'), React.createElement('input', {
    style: inputStyle,
    value: form.cuisine,
    onChange: set('cuisine')
  }), React.createElement('label', {
    style: labelStyle
  }, 'Barrio'), React.createElement('input', {
    style: inputStyle,
    value: form.neighborhood,
    onChange: set('neighborhood')
  }), React.createElement('label', {
    style: labelStyle
  }, 'Descripción'), React.createElement('input', {
    style: inputStyle,
    value: form.description,
    onChange: set('description')
  }), React.createElement('label', {
    style: labelStyle
  }, `Fotos del restaurante (${form.photo_urls.length}/10)`), form.photo_urls.length ? React.createElement('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8
    }
  }, form.photo_urls.map((url, idx) => React.createElement('div', {
    key: idx,
    style: {
      position: 'relative',
      width: 80,
      height: 80
    }
  }, React.createElement('img', {
    src: url,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: 8
    }
  }), React.createElement('button', {
    onClick: () => removePhoto(idx),
    type: 'button',
    style: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      background: '#c0392b',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      fontSize: 12,
      lineHeight: '22px',
      padding: 0
    }
  }, '✕')))) : null, React.createElement('input', {
    type: 'file',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: true,
    style: {
      ...inputStyle,
      padding: 8
    },
    onChange: handlePhotoFiles,
    disabled: photoUploading || form.photo_urls.length >= 10
  }), photoUploading ? React.createElement('p', {
    style: {
      fontSize: 12,
      color: '#888',
      marginBottom: 12
    }
  }, 'Subiendo…') : null, photoError ? React.createElement('p', {
    style: {
      fontSize: 12,
      color: '#c0392b',
      marginBottom: 12
    }
  }, photoError) : null, React.createElement('label', {
    style: labelStyle
  }, 'Horario de comida'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 12
    }
  }, React.createElement('input', {
    style: {
      ...inputStyle,
      marginBottom: 0
    },
    type: 'time',
    value: form.lunch_start,
    onChange: set('lunch_start')
  }), React.createElement('input', {
    style: {
      ...inputStyle,
      marginBottom: 0
    },
    type: 'time',
    value: form.lunch_end,
    onChange: set('lunch_end')
  })), React.createElement('label', {
    style: labelStyle
  }, 'Horario de cena'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 12
    }
  }, React.createElement('input', {
    style: {
      ...inputStyle,
      marginBottom: 0
    },
    type: 'time',
    value: form.dinner_start,
    onChange: set('dinner_start')
  }), React.createElement('input', {
    style: {
      ...inputStyle,
      marginBottom: 0
    },
    type: 'time',
    value: form.dinner_end,
    onChange: set('dinner_end')
  })), React.createElement('label', {
    style: labelStyle
  }, `Depósito (${form.city === 'London' ? '£' : '€'} por comensal)`), React.createElement('input', {
    style: inputStyle,
    type: 'number',
    step: '0.01',
    value: form.deposit,
    onChange: set('deposit')
  }), React.createElement('label', {
    style: labelStyle
  }, 'Capacidad'), React.createElement('input', {
    style: inputStyle,
    type: 'number',
    value: form.capacity,
    onChange: set('capacity')
  }), React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    onClick: submit
  }, mode === 'edit' ? 'Guardar cambios' : 'Crear restaurante')), state === 'loading' && React.createElement('p', null, 'Creando…'), state === 'error' && React.createElement('div', null, React.createElement('p', {
    style: {
      color: '#c0392b',
      marginBottom: 16
    }
  }, errorMsg), React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    onClick: () => setState('form')
  }, 'Volver a intentar')), state === 'done' && result && mode === 'edit' && React.createElement('div', null, React.createElement('p', {
    style: {
      fontSize: 14,
      color: '#2e7d32',
      marginBottom: 16
    }
  }, `✅ ${result.venue?.name || 'Restaurante'} actualizado correctamente.`), React.createElement('button', {
    className: 'btn btn-block btn-lg',
    onClick: onDone,
    style: {
      background: '#f3f3f3'
    }
  }, 'Cerrar')), state === 'done' && result && mode !== 'edit' && React.createElement('div', null, React.createElement('p', {
    style: {
      fontSize: 14,
      color: '#777',
      marginBottom: 16
    }
  }, `Moneda: ${result.currency.toUpperCase()} · Zona horaria: ${result.timezone}`), result.email_sent ? React.createElement('p', {
    style: {
      fontSize: 14,
      color: '#2e7d32',
      marginBottom: 16
    }
  }, '✅ Email de invitación enviado al restaurante.') : React.createElement('p', {
    style: {
      fontSize: 14,
      color: '#c0392b',
      marginBottom: 16
    }
  }, '⚠️ No se pudo enviar el email — copia el link y mándalo tú a mano.'), React.createElement('label', {
    style: labelStyle
  }, 'Link para el restaurante (conectar pagos)'), React.createElement('input', {
    style: {
      ...inputStyle,
      fontSize: 12
    },
    readOnly: true,
    value: result.self_service_url,
    onClick: e => e.target.select()
  }), React.createElement('button', {
    className: 'btn btn-acc btn-block btn-lg',
    onClick: copyLink,
    style: {
      marginBottom: 10
    }
  }, copied ? '¡Copiado!' : 'Copiar link'), React.createElement('button', {
    className: 'btn btn-block btn-lg',
    onClick: onDone,
    style: {
      background: '#f3f3f3'
    }
  }, 'Cerrar')));
}
Object.assign(window, {
  ReserveAuthModal,
  ClaimSpoonsModal,
  ResetPasswordScreen,
  CancelBookingScreen,
  StripeConnectScreen,
  AdminCreateVenueScreen
});