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

/* semilla + lectura del conjunto de correos "registrados" (demo) */
function knownEmails(){
  try {
    const seed = ['ana@unamesa.co','carlos@unamesa.co','demo@unamesa.co'];
    const saved = JSON.parse(localStorage.getItem('um-registered')||'[]');
    return new Set([...seed, ...saved].map(e=>e.toLowerCase()));
  } catch(e){ return new Set(['demo@unamesa.co']); }
}
function rememberEmail(email){
  try {
    const saved = JSON.parse(localStorage.getItem('um-registered')||'[]');
    if (!saved.map(e=>e.toLowerCase()).includes(email.toLowerCase())){
      saved.push(email); localStorage.setItem('um-registered', JSON.stringify(saved));
    }
  } catch(e){}
}

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
  const [view, setView] = useState('intro'); // intro | signup | signin | welcomeback
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const finishAccount = (displayName, mail) => {
    const nm = (displayName||mail.split('@')[0]||'Comensal');
    rememberEmail(mail);
    onAccount({ name: nm.charAt(0).toUpperCase()+nm.slice(1), email: mail });
  };

  const submitSignup = e => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (knownEmails().has(mail)) { setView('welcomeback'); return; }
    finishAccount(name, mail);
  };
  const submitSignin = e => {
    e.preventDefault();
    finishAccount(name, email.trim()||'tu@unamesa.co');
  };

  /* ---- INTRO ---- */
  if (view === 'intro')
    return React.createElement(Modal, { onClose, max:440 },
      React.createElement('div', { className:'rb-head' },
        React.createElement('div', { className:'rb-badge' }, React.createElement(Icon,{name:'spoon'})),
        React.createElement('h2', null, 'Reserva tu mesa'),
        React.createElement('p', { className:'msub' }, 'Reserva como invitado o crea una cuenta para desbloquear ventajas exclusivas.')),
      React.createElement('ul', { className:'rb-list' },
        RESERVE_BENEFITS.map((b,i)=>React.createElement(Benefit,{ key:i, b }))),
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:()=>setView('signup') }, 'Crear cuenta gratis'),
      React.createElement('button', { className:'btn btn-ghost btn-block', style:{marginTop:'10px'}, onClick:onGuest }, 'Continuar como invitado'),
      React.createElement('p', { className:'rb-foot' },
        '¿Ya tienes cuenta? ',
        React.createElement('button', { className:'rb-link', onClick:()=>setView('signin') }, 'Inicia sesión'))
    );

  /* ---- BIENVENIDO DE NUEVO ---- */
  if (view === 'welcomeback')
    return React.createElement(Modal, { onClose, max:420 },
      React.createElement('div', { className:'rb-head' },
        React.createElement('div', { className:'rb-badge' }, React.createElement(Icon,{name:'user'})),
        React.createElement('h2', null, 'Bienvenido de nuevo'),
        React.createElement('p', { className:'msub' }, 'Ya existe una cuenta con este correo. Inicia sesión para sumar tus Cucharas de Oro de esta reserva y acceder a tu experiencia gastronómica personalizada.')),
      React.createElement('div', { className:'rb-email-chip' }, React.createElement(Icon,{name:'user'}), email),
      React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:()=>setView('signin') }, 'Iniciar sesión'),
      React.createElement('button', { className:'btn btn-ghost btn-block', style:{marginTop:'10px'}, onClick:()=>{ setEmail(''); setView('signup'); } }, 'Usar otro correo')
    );

  /* ---- INICIAR SESIÓN ---- */
  if (view === 'signin')
    return React.createElement(Modal, { onClose, max:420 },
      React.createElement('button', { className:'rb-back', onClick:()=>setView('intro') }, React.createElement(Icon,{name:'chevL'}), 'Atrás'),
      React.createElement('h2', null, 'Iniciar sesión'),
      React.createElement('p', { className:'msub' }, 'Bienvenido de nuevo — inicia sesión para sumar tus Cucharas de Oro.'),
      React.createElement('button',{className:'sso-btn',style:{marginBottom:'16px'},onClick:()=>finishAccount('Tú','tu@gmail.com')},
        React.createElement(Icon,{name:'google'}),'Continuar con Google'),
      React.createElement('div',{className:'divider'},'o con tu correo'),
      React.createElement('form', { onSubmit:submitSignin },
        React.createElement('div',{className:'field'},
          React.createElement('label',null,'Correo'),
          React.createElement('input',{type:'email',value:email,onChange:e=>setEmail(e.target.value),placeholder:'tu@correo.com',required:true})),
        React.createElement('div',{className:'field'},
          React.createElement('label',null,'Contraseña'),
          React.createElement('input',{type:'password',placeholder:'••••••••',required:true})),
        React.createElement('button',{className:'btn btn-acc btn-block btn-lg',type:'submit',style:{marginTop:'4px'}},'Iniciar sesión'))
    );

  /* ---- CREAR CUENTA ---- */
  return React.createElement(Modal, { onClose, max:430 },
    React.createElement('button', { className:'rb-back', onClick:()=>setView('intro') }, React.createElement(Icon,{name:'chevL'}), 'Atrás'),
    React.createElement('h2', null, 'Crear cuenta gratis'),
    React.createElement('p', { className:'msub' }, 'Únete gratis y empieza a ganar Cucharas de Oro con esta reserva.'),
    React.createElement('button',{className:'sso-btn',style:{marginBottom:'16px'},onClick:()=>finishAccount('Tú','tu@gmail.com')},
      React.createElement(Icon,{name:'google'}),'Continuar con Google'),
    React.createElement('div',{className:'divider'},'o con tu correo'),
    React.createElement('form', { onSubmit:submitSignup },
      React.createElement('div',{className:'field'},
        React.createElement('label',null,'Nombre'),
        React.createElement('input',{value:name,onChange:e=>setName(e.target.value),placeholder:'Tu nombre',required:true})),
      React.createElement('div',{className:'field'},
        React.createElement('label',null,'Correo'),
        React.createElement('input',{type:'email',value:email,onChange:e=>setEmail(e.target.value),placeholder:'tu@correo.com',required:true})),
      React.createElement('div',{className:'field'},
        React.createElement('label',null,'Contraseña'),
        React.createElement('input',{type:'password',placeholder:'••••••••',required:true})),
      React.createElement('button',{className:'btn btn-acc btn-block btn-lg',type:'submit',style:{marginTop:'4px'}},'Crear cuenta gratis')),
    React.createElement('p', { className:'rb-foot' },
      '¿Ya tienes cuenta? ',
      React.createElement('button', { className:'rb-link', onClick:()=>setView('signin') }, 'Inicia sesión'))
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
