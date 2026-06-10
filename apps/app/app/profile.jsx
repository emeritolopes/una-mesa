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
    const display = mode==='signup' ? (name.trim()||'Comensal') : formatName({ name:'', email:email.trim() });
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

function mapSupaBooking(r) {
  const today = new Date().toLocaleDateString('en-CA');
  const isPast = r.date < today || r.status === 'cancelled';
  const d = new Date(r.date + 'T12:00:00');
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const DAYS = ['dom','lun','mar','mié','jue','vie','sáb'];
  return {
    rawId:           r.id,
    id:              r.id.toString().slice(0, 8).toUpperCase(),
    rid:             r.venue_id,
    name:            r.venues?.name || 'Restaurante',
    cz:              null,
    glyph:           null,
    dayLabel:        `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
    time:            (r.time || '').slice(0, 5),
    party:           r.pax,
    deposit:         r.pax * 10,
    depositCents:    r.pax * 1000,
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

  useEffect(() => {
    async function loadBookings() {
      console.log('[PROFILE] loadBookings start');
      if (!window.UMAuth?.sb) { setSupaBookings([]); return; }
      try {
        const { data: { user: authUser } } = await window.UMAuth.sb.auth.getUser();
        console.log('[PROFILE] authUser:', authUser?.id, authUser?.email);
        if (!authUser) { setSupaBookings([]); return; }
        const emailPrefix = authUser.email.split('@')[0];
        const { data: rows, error } = await window.UMAuth.sb
          .from('reservations')
          .select('*, venues(name, address, cuisine)')
          .or(`user_id.eq.${authUser.id},customer_name.ilike.%${emailPrefix}%`)
          .order('date', { ascending: false });
        console.log('[PROFILE] rows from Supabase:', rows?.length, rows);
        if (error) { console.warn('[UNA MESA] loadBookings:', error.message); setSupaBookings([]); return; }
        setSupaBookings((rows || []).map(mapSupaBooking));
      } catch(e) {
        console.log('[PROFILE] ERROR:', e.message);
        setSupaBookings([]);
      }
    }
    loadBookings();
  }, []);

  const doCancel = async () => {
    const b = cancelTarget;
    if (!b || cancelBusy) return;
    setCancelBusy(true);
    setCancelError('');
    try {
      const sb = window.UMAuth.sb;

      /* 1 · Refund via Stripe Edge Function — non-fatal */
      if (b.paymentIntentId) {
        try {
          await sb.functions.invoke('stripe-refund', {
            body: { payment_intent_id: b.paymentIntentId },
          });
        } catch(e) {
          console.warn('[UNA MESA] stripe-refund:', e.message);
        }
      }

      /* 2 · Mark reservation cancelled */
      const { error: updateErr } = await sb
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', b.rawId);
      if (updateErr) throw updateErr;

      /* 3 · Log cancellation record — non-fatal */
      try {
        await sb.from('cancellations').insert([{
          reservation_id: b.rawId,
          user_id:        b.userId,
          reason:         'user_cancelled',
          refund_amount:  b.depositCents,
        }]);
      } catch(e) {
        console.warn('[UNA MESA] cancellations insert:', e.message);
      }

      /* 4 · Update local UI */
      setSupaBookings(prev => prev.map(x =>
        x.rawId === b.rawId ? { ...x, status: 'past', isCancellable: false } : x
      ));
      setCancelTarget(null);
    } catch(e) {
      setCancelError(e.message || 'Error al cancelar. Inténtalo de nuevo.');
    } finally {
      setCancelBusy(false);
    }
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
    console.log('[CANCEL DEBUG]', { id: b.id, status: b.status, rawStatus: b.rawStatus, isCancellable: b.isCancellable, isPast: isPast });
    return React.createElement('div', { key:b.id, className:'booking-row' },
    React.createElement(Photo,{cz:b.cz,glyph:b.glyph}),
    React.createElement('div',{className:'br-main'},
      React.createElement('div',{className:'br-name'},b.name),
      React.createElement('div',{className:'br-meta'}, (b.dayLabel||'Hoy')+' · '+b.time+' · '+b.party+(b.party===1?' comensal':' comensales')),
      React.createElement('div',{className:'br-meta',style:{marginTop:'2px'}},'Reserva '+b.id+' · depósito '+b.deposit+'€')),
    React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}},
      React.createElement('span',{className:'br-status '+(isPast?'st-past':'st-up')}, isPast?'Completada':'Confirmada'),
      React.createElement('button',{className:'btn btn-soft btn-sm',onClick:()=>openRest(b.rid)}, isPast?'Reservar otra vez':'Ver restaurante'),
      !isPast && b.isCancellable
        ? React.createElement('button',{
            className:'btn btn-sm',
            style:{color:'#E85D3A',background:'transparent',border:'1px solid rgba(232,93,58,0.4)',borderRadius:'8px',padding:'4px 12px',fontSize:'12px',cursor:'pointer',lineHeight:'1.5'},
            onClick:()=>{ setCancelError(''); setCancelTarget(b); }
          },'Cancelar')
        : null
    ));
  };

  const cancelModal = cancelTarget
    ? React.createElement('div',{
        style:{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'},
        onClick:()=>{ if(!cancelBusy) setCancelTarget(null); }
      },
        React.createElement('div',{
          style:{background:'#fff',borderRadius:'20px',padding:'28px 24px',maxWidth:'380px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.18)'},
          onClick:e=>e.stopPropagation()
        },
          React.createElement('div',{style:{width:'44px',height:'44px',borderRadius:'50%',background:'#FEF2F0',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px',fontSize:'22px'}},'⚠️'),
          React.createElement('h2',{style:{margin:'0 0 8px',fontSize:'18px',fontWeight:'800',color:'#121212'}},'¿Cancelar esta reserva?'),
          React.createElement('p',{style:{margin:'0 0 4px',fontSize:'14px',color:'#666',lineHeight:'1.5'}},
            cancelTarget.name+' · '+cancelTarget.dayLabel+' a las '+cancelTarget.time),
          React.createElement('p',{style:{margin:'12px 0 0',fontSize:'13px',color:'#888',lineHeight:'1.55'}},
            'Si cancelas con más de 24h de antelación recuperas el depósito íntegro ('+cancelTarget.deposit+'€).'),
          cancelError ? React.createElement('p',{style:{margin:'12px 0 0',fontSize:'13px',color:'#E85D3A'}},cancelError) : null,
          React.createElement('div',{style:{display:'flex',gap:'10px',marginTop:'20px'}},
            React.createElement('button',{
              className:'btn btn-soft btn-block',
              disabled:cancelBusy,
              onClick:()=>setCancelTarget(null)
            },'Volver'),
            React.createElement('button',{
              className:'btn btn-block',
              style:{background:'#E85D3A',color:'#fff',opacity:cancelBusy?0.7:1},
              disabled:cancelBusy,
              onClick:doCancel
            }, cancelBusy ? 'Cancelando…' : 'Sí, cancelar reserva')
          )
        )
      )
    : null;

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

  return React.createElement(React.Fragment, null,
    cancelModal,
    React.createElement('div', { className:'view' },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'prof-hero' },
          React.createElement('div',{className:'prof-av'}, formatName(user)[0].toUpperCase()),
          React.createElement('div',null,
            React.createElement('div',{className:'prof-name display'}, '¡Hola, '+formatName(user).split(' ')[0]+'!'),
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
    )
  );
}

Object.assign(window, { AuthModal, ProfileScreen });
