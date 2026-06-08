/* ════ UNA MESA · Auth modal + Profile screen ════ */

const CUISINE_PREFS = ['Marisco','Asador','Arroces','Japonés','Tapas','Vegetariano','Brunch','Fusión','Italiano','Gallego'];

function AuthModal({ onClose, onAuth, initialMode, geoLabel }) {
  const [mode, setMode] = useState(initialMode || 'signup'); // login | signup
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState([]);
  const [loc, setLoc] = useState(geoLabel || '');
  const togglePref = p => setPrefs(s => s.includes(p) ? s.filter(x=>x!==p) : [...s, p]);
  const submit = e => {
    e.preventDefault();
    const display = mode==='signup' ? (name.trim()||'Comensal') : (email.split('@')[0]||'Comensal');
    onAuth({ name: display.charAt(0).toUpperCase()+display.slice(1), email: email||'tú@unamesa.co', prefs, location: loc });
  };
  const isSignup = mode==='signup';
  return React.createElement(Modal, { onClose, max: isSignup ? 460 : 420 },
    React.createElement('h2', null, isSignup ? 'Crea tu perfil' : 'Bienvenido de nuevo'),
    React.createElement('p', { className:'msub' }, isSignup ? 'Personalizamos tus recomendaciones según tu gusto y tu zona.' : 'Entra para reservar y ver tus mesas.'),
    React.createElement('div', { className:'seg' },
      React.createElement('button',{className:isSignup?'on':'',onClick:()=>setMode('signup')},'Crear perfil'),
      React.createElement('button',{className:!isSignup?'on':'',onClick:()=>setMode('login')},'Iniciar sesión')),
    React.createElement('div', { className:'sso' },
      React.createElement('button',{className:'sso-btn',onClick:()=>onAuth({name:'Comensal',email:'tú@gmail.com',prefs,location:loc})},
        React.createElement(Icon,{name:'google'}),'Continuar con Google')),
    React.createElement('div', { className:'divider' }, isSignup ? 'o crea tu perfil con email' : 'o con tu email'),
    React.createElement('form', { onSubmit:submit },
      isSignup?React.createElement('div',{className:'field'},
        React.createElement('label',null,'Nombre'),
        React.createElement('input',{value:name,onChange:e=>setName(e.target.value),placeholder:'Tu nombre',required:true})):null,
      React.createElement('div',{className:'field'},
        React.createElement('label',null,'Email'),
        React.createElement('input',{type:'email',value:email,onChange:e=>setEmail(e.target.value),placeholder:'tu@email.com',required:true})),
      React.createElement('div',{className:'field'},
        React.createElement('label',null,'Contraseña'),
        React.createElement('input',{type:'password',placeholder:'••••••••',required:true})),
      isSignup?React.createElement('div',{className:'field'},
        React.createElement('label',null,'Ubicación'),
        React.createElement('input',{value:loc,onChange:e=>setLoc(e.target.value),placeholder:'Tu ciudad o barrio (p. ej. Vigo)'})):null,
      isSignup?React.createElement('div',{className:'field'},
        React.createElement('label',null,'Preferencias culinarias'),
        React.createElement('div',{className:'pref-chips'},
          CUISINE_PREFS.map(p=>React.createElement('button',{
            key:p, type:'button', className:'chip'+(prefs.includes(p)?' on':''), onClick:()=>togglePref(p)
          }, p)))):null,
      React.createElement('button',{className:'btn btn-acc btn-block btn-lg',type:'submit',style:{marginTop:'8px'}},
        isSignup?'Crear perfil':'Entrar')),
    React.createElement('p',{className:'muted',style:{fontSize:'12px',textAlign:'center',marginTop:'16px'}},
      'Demo · no se envían datos reales.')
  );
}

function ProfileScreen({ user, bookings, favs, data, openRest, toggleFav, startBook, go, spoons, onRedeem }) {
  const [tab, setTab] = useState('reservas');
  const now = Date.now();
  const upcoming = bookings.filter(b=>b.status==='up');
  const past = bookings.filter(b=>b.status==='past');
  const favList = data.filter(r=>favs.includes(r.id));
  const points = Math.min(100, bookings.length*18 + favs.length*4);
  const visits = bookings.length;
  const toNext = Math.max(0, 5 - (visits%5||0));

  const BookingRow = (b, isPast) => React.createElement('div', { key:b.id, className:'booking-row' },
    React.createElement(Photo,{cz:b.cz,glyph:b.glyph}),
    React.createElement('div',{className:'br-main'},
      React.createElement('div',{className:'br-name'},b.name),
      React.createElement('div',{className:'br-meta'}, (b.dayLabel||'Hoy')+' · '+b.time+' · '+b.party+(b.party===1?' comensal':' comensales')),
      React.createElement('div',{className:'br-meta',style:{marginTop:'2px'}},'Reserva '+b.id+' · depósito '+b.deposit+'€')),
    React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}},
      React.createElement('span',{className:'br-status '+(isPast?'st-past':'st-up')}, isPast?'Completada':'Confirmada'),
      React.createElement('button',{className:'btn btn-soft btn-sm',onClick:()=>openRest(b.rid)}, isPast?'Reservar otra vez':'Ver restaurante')));

  let panel;
  if (tab==='reservas') {
    panel = (upcoming.length||past.length)
      ? React.createElement('div', null,
          upcoming.length?React.createElement('div',null,
            React.createElement('div',{className:'prof-sec-label'},'Próximas'),
            upcoming.map(b=>BookingRow(b,false))):null,
          past.length?React.createElement('div',{style:{marginTop:'22px'}},
            React.createElement('div',{className:'prof-sec-label'},'Historial'),
            past.map(b=>BookingRow(b,true))):null)
      : React.createElement('div',{className:'empty'},
          React.createElement(Icon,{name:'cal'}),
          React.createElement('p',null,'Aún no tienes reservas.'),
          React.createElement('button',{className:'btn btn-acc',style:{marginTop:'14px'},onClick:()=>go('home')},'Buscar restaurantes'));
  } else if (tab==='favoritos') {
    panel = favList.length
      ? React.createElement('div',{className:'rgrid'},
          favList.map(r=>React.createElement(RestaurantCard,{key:r.id,r,fav:true,onFav:toggleFav,onOpen:openRest,onBook:startBook})))
      : React.createElement('div',{className:'empty'},
          React.createElement(Icon,{name:'heart'}),
          React.createElement('p',null,'Sin favoritos todavía. Toca el corazón en cualquier restaurante.'),
          React.createElement('button',{className:'btn btn-acc',style:{marginTop:'14px'},onClick:()=>go('results')},'Explorar'));
  } else if (tab==='pasaporte') {
    panel = React.createElement('div', null,
      React.createElement(window.GastroPassport, { data, bookings, openRest, go }),
      React.createElement('div',{style:{marginTop:'22px'}}, React.createElement(window.PalateAI, { user, data, bookings, favs })));
  } else if (tab==='fidelidad') {
    panel = React.createElement(window.RewardsMarket, { spoons, onRedeem });
  }

  return React.createElement('div', { className:'view' },
    React.createElement('div', { className:'wrap' },
      React.createElement('div', { className:'prof-hero' },
        React.createElement('div',{className:'prof-av'}, user.name[0].toUpperCase()),
        React.createElement('div',null,
          React.createElement('div',{className:'prof-name display'}, '¡Hola, '+user.name.split(' ')[0]+'!'),
          React.createElement('div',{className:'prof-mail'}, user.email)),
        React.createElement('div',{className:'loyalty'},
          React.createElement('div',{className:'ll'},'Programa Mesa'),
          React.createElement('div',{className:'lv'}, points+' pts'),
          React.createElement('div',{className:'lbar'},React.createElement('i',{style:{width:Math.max(8,points)+'%'}})),
          React.createElement('div',{className:'lnext'}, toNext+' visitas para tu próxima recompensa'))
      ),
      React.createElement('div', { className:'tabs' },
        React.createElement('div',{className:'tab'+(tab==='reservas'?' on':''),onClick:()=>setTab('reservas')},'Mis reservas'),
        React.createElement('div',{className:'tab'+(tab==='pasaporte'?' on':''),onClick:()=>setTab('pasaporte')},'Pasaporte'),
        React.createElement('div',{className:'tab'+(tab==='favoritos'?' on':''),onClick:()=>setTab('favoritos')},'Favoritos'),
        React.createElement('div',{className:'tab'+(tab==='fidelidad'?' on':''),onClick:()=>setTab('fidelidad')},'Recompensas')),
      panel
    )
  );
}

Object.assign(window, { AuthModal, ProfileScreen });
