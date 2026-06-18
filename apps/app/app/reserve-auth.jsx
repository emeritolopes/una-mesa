/* ════ UNA MESA · Flujo de registro orientado a conversión (ES) ════
   Tres estados:
   1) intro  → "Reserva tu mesa"  (ventajas, Crear cuenta / Continuar como invitado / Iniciar sesión)
   2) welcomeback → correo ya registrado
   3) ClaimSpoonsModal → tras reservar como INVITADO
*/

const RESERVE_BENEFITS = [
  { spoon:true, text:'Gana Cucharas de Oro en cada reserva' },
  { text:'Recibe recomendaciones de restaurantes personalizadas con IA' },
  { text:'Guarda tus restaurantes favoritos' },
  { text:'Accede a ofertas y promociones exclusivas' },
  { text:'Reserva más rápido la próxima vez' }
];

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

  const submitSignup = async e => {
    e.preventDefault();
    /* fallback to demo mode if Supabase is not loaded */
    if (!window.UMAuth) {
      finishAccount({ name: (name.trim() || email.split('@')[0] || 'Comensal'), email: email.trim() });
      return;
    }
    setError(''); setLoading(true);
    try {
      const appUser = await window.UMAuth.signUp(email.trim().toLowerCase(), password, name.trim());
      if (!appUser) {
        /* email confirmation required — no session yet */
        setError('Revisa tu bandeja de entrada para confirmar tu cuenta y luego inicia sesión.');
        return;
      }
      finishAccount(appUser);
    } catch (err) {
      const msg = err.message || '';
      if (/already registered|already been registered/i.test(msg)) {
        switchView('welcomeback');
      } else {
        setError(msg || 'Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitSignin = async e => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!window.UMAuth) {
      setError('Error de conexión. Por favor recarga la página.');
      return;
    }
    setLoading(true);
    try {
      const appUser = await window.UMAuth.signIn(email.trim(), password);
      finishAccount(appUser);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError('Email o contraseña incorrectos.');
      } else if (msg.includes('not confirmed') || msg.includes('Email not confirmed')) {
        setError('Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setError('Introduce tu email para resetear la contraseña.');
      return;
    }
    try {
      await window.UMAuth.sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://app.unamesa.co/#reset-password'
      });
      setError('');
      setInfo('Te hemos enviado un email para resetear tu contraseña.');
    } catch(e) {
      setError('Error al enviar el email de reseteo.');
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
        React.createElement('h2', null, 'Reserva tu mesa'),
        React.createElement('p', { className:'msub' }, 'Reserva como invitado o crea una cuenta para desbloquear ventajas exclusivas.')),
      React.createElement('ul', { className:'rb-list' },
        RESERVE_BENEFITS.map((b,i)=>React.createElement(Benefit,{ key:i, b }))),
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:()=>switchView('signup') }, 'Crear cuenta gratis'),
      React.createElement('button', { className:'btn btn-ghost btn-block', style:{marginTop:'10px'}, onClick:onGuest }, 'Continuar como invitado'),
      React.createElement('p', { className:'rb-foot' },
        '¿Ya tienes cuenta? ',
        React.createElement('button', { className:'rb-link', onClick:()=>switchView('signin') }, 'Inicia sesión'))
    );

  /* ---- BIENVENIDO DE NUEVO ---- */
  if (view === 'welcomeback')
    return React.createElement(Modal, { onClose, max:420 },
      React.createElement('div', { className:'rb-head' },
        React.createElement('div', { className:'rb-badge' }, React.createElement(Icon,{name:'user'})),
        React.createElement('h2', null, 'Bienvenido de nuevo'),
        React.createElement('p', { className:'msub' }, 'Ya existe una cuenta con este correo. Inicia sesión para sumar tus Cucharas de Oro de esta reserva y acceder a tu experiencia gastronómica personalizada.')),
      React.createElement('div', { className:'rb-email-chip' }, React.createElement(Icon,{name:'user'}), email),
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:()=>switchView('signin') }, 'Iniciar sesión'),
      React.createElement('button', { className:'btn btn-ghost btn-block', style:{marginTop:'10px'}, onClick:()=>{ setEmail(''); switchView('signup'); } }, 'Usar otro correo')
    );

  /* ---- INICIAR SESIÓN ---- */
  if (view === 'signin')
    return React.createElement(Modal, { onClose, max:420 },
      React.createElement('button', { className:'rb-back', onClick:()=>switchView('intro') }, React.createElement(Icon,{name:'chevL'}), 'Atrás'),
      React.createElement('h2', null, 'Iniciar sesión'),
      React.createElement('p', { className:'msub' }, 'Bienvenido de nuevo — inicia sesión para sumar tus Cucharas de Oro.'),
      React.createElement('button', { className:'sso-btn', style:{marginBottom:'16px'}, onClick:()=>finishAccount({name:'Tú',email:'tu@gmail.com'}) },
        React.createElement(Icon,{name:'google'}), 'Continuar con Google'),
      React.createElement('div', { className:'divider' }, 'o con tu correo'),
      React.createElement('form', { onSubmit:submitSignin },
        React.createElement('div', { className:'field' },
          React.createElement('label', null, 'Correo'),
          React.createElement('input', { type:'email', value:email, onChange:e=>setEmail(e.target.value), placeholder:'tu@correo.com', required:true, disabled:loading })),
        React.createElement('div', { className:'field' },
          React.createElement('label', null, 'Contraseña'),
          React.createElement('input', { type:'password', value:password, onChange:e=>setPassword(e.target.value), placeholder:'••••••••', required:true, disabled:loading })),
        ErrMsg,
        info && React.createElement('p', { style:{ color:'#16a34a', fontSize:'13px', margin:'10px 0 0', lineHeight:1.4 } }, info),
        React.createElement('button', { className:'btn btn-acc btn-block btn-lg', type:'submit', style:{marginTop:'12px'}, disabled:loading },
          loading ? 'Iniciando sesión…' : 'Iniciar sesión'),
        React.createElement('button', {
          type:'button', onClick:resetPassword,
          style:{ background:'none', border:'none', color:'#D8552E', fontSize:13, cursor:'pointer', marginTop:8, textDecoration:'underline', padding:0 }
        }, '¿Olvidaste tu contraseña?'))
    );

  /* ---- CREAR CUENTA ---- */
  return React.createElement(Modal, { onClose, max:430 },
    React.createElement('button', { className:'rb-back', onClick:()=>switchView('intro') }, React.createElement(Icon,{name:'chevL'}), 'Atrás'),
    React.createElement('h2', null, 'Crear cuenta gratis'),
    React.createElement('p', { className:'msub' }, 'Únete gratis y empieza a ganar Cucharas de Oro con esta reserva.'),
    React.createElement('button', { className:'sso-btn', style:{marginBottom:'16px'}, onClick:()=>finishAccount({name:'Tú',email:'tu@gmail.com'}) },
      React.createElement(Icon,{name:'google'}), 'Continuar con Google'),
    React.createElement('div', { className:'divider' }, 'o con tu correo'),
    React.createElement('form', { onSubmit:submitSignup },
      React.createElement('div', { className:'field' },
        React.createElement('label', null, 'Nombre'),
        React.createElement('input', { value:name, onChange:e=>setName(e.target.value), placeholder:'Tu nombre', required:true, disabled:loading })),
      React.createElement('div', { className:'field' },
        React.createElement('label', null, 'Correo'),
        React.createElement('input', { type:'email', value:email, onChange:e=>setEmail(e.target.value), placeholder:'tu@correo.com', required:true, disabled:loading })),
      React.createElement('div', { className:'field' },
        React.createElement('label', null, 'Contraseña'),
        React.createElement('input', { type:'password', value:password, onChange:e=>setPassword(e.target.value), placeholder:'••••••••', required:true, minLength:6, disabled:loading })),
      ErrMsg,
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', type:'submit', style:{marginTop:'12px'}, disabled:loading },
        loading ? 'Creando cuenta…' : 'Crear cuenta gratis')),
    React.createElement('p', { className:'rb-foot' },
      '¿Ya tienes cuenta? ',
      React.createElement('button', { className:'rb-link', onClick:()=>switchView('signin') }, 'Inicia sesión'))
  );
}

/* ── upsell tras reservar como invitado ── */
function ClaimSpoonsModal({ onClose, onCreate }){
  return React.createElement(Modal, { onClose, max:430 },
    React.createElement('div', { className:'rb-head' },
      React.createElement('div', { className:'rb-badge big' },
        React.createElement(Icon,{name:'spoon'}),
        React.createElement('span',{className:'rb-25'},'25')),
      React.createElement('h2', null, 'Reclama tus Cucharas de Oro'),
      React.createElement('p', { className:'msub' }, 'Tu reserva está confirmada. Crea tu cuenta gratis ahora y recibe 25 Cucharas de Oro de esta reserva, además de recomendaciones personalizadas y recompensas exclusivas.')),
    React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:onCreate }, 'Crear cuenta y reclamar recompensas'),
    React.createElement('button', { className:'btn btn-ghost btn-block', style:{marginTop:'10px'}, onClick:onClose }, 'Quizás más tarde')
  );
}

Object.assign(window, { ReserveAuthModal, ClaimSpoonsModal });
