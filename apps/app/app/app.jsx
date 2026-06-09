/* ════ UNA MESA · App root (state + routing) ════ */

/* glitch-free theme switch: one uniform crossfade applied only during the change */
function animateThemeTo(t){
  const el = document.documentElement;
  el.classList.add('theme-transition');
  clearTimeout(window.__umThemeT);
  window.__umThemeT = setTimeout(()=>el.classList.remove('theme-transition'), 420);
}

function App() {
  const [restaurants, setRestaurants] = useState(window.UM_DATA);
  const [route, setRoute] = useState({ view:'home', rid:null, query:'', presetTime:null });
  const [theme, setTheme] = useState(()=>{ try{return localStorage.getItem('um-theme')||'crema';}catch(e){return 'crema';} });
  const [user, setUser] = useState(null);
  const [favs, setFavs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [authOpen, setAuthOpen] = useState(null); // null | 'login' | 'register'
  const [reserveGate, setReserveGate] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [spoons, setSpoons] = useState(0);
  const [toast, setToast] = useState('');
  const [geo, setGeo] = useState({ status:'idle', label:'', ref:{x:50,y:50} });
  const pendingRef = useRef(null);
  const toastTimer = useRef(null);

  /* persistence */
  useEffect(() => {
    try {
      const t = localStorage.getItem('um-theme'); if (t) setTheme(t);
      const u = localStorage.getItem('um-app-user'); if (u) setUser(JSON.parse(u));
      const f = localStorage.getItem('um-app-favs'); if (f) setFavs(JSON.parse(f));
      const b = localStorage.getItem('um-app-bookings'); if (b) setBookings(JSON.parse(b));
      const sp = localStorage.getItem('um-spoons'); if (sp) setSpoons(parseInt(sp,10)||0);
    } catch(e){}
    /* sync dark/light across all Una Mesa pages (live, multi-tab) */
    const onStorage = e => { if (e.key === 'um-theme' && e.newValue) { animateThemeTo(e.newValue); document.documentElement.setAttribute('data-theme', e.newValue); setTheme(e.newValue); } };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(()=>{ document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(()=>{ try{localStorage.setItem('um-app-favs',JSON.stringify(favs));}catch(e){} }, [favs]);
  useEffect(()=>{ try{localStorage.setItem('um-app-bookings',JSON.stringify(bookings));}catch(e){} }, [bookings]);
  useEffect(()=>{ try{ user?localStorage.setItem('um-app-user',JSON.stringify(user)):localStorage.removeItem('um-app-user'); }catch(e){} }, [user]);

  /* scroll to top on view change */
  useEffect(()=>{ window.scrollTo(0,0); }, [route.view, route.rid]);

  /* load real restaurants from Supabase; keep mock data as fallback */
  useEffect(() => {
    if (!window.loadRestaurants) return;
    window.loadRestaurants().then(rows => {
      if (rows && rows.length) {
        window.UM_DATA = rows;
        setRestaurants(rows);
      }
    });
  }, []);

  /* sync auth state with Supabase session (handles page reload + sign-in/out) */
  useEffect(() => {
    if (!window.UMAuth) return;
    const sub = window.UMAuth.onAuthStateChange((event, appUser) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (appUser) {
        setUser(appUser);
      }
    });
    return () => sub && sub.unsubscribe();
  }, []);

  /* geolocation — sort nearby restaurants by distance, manual fallback */
  useEffect(()=>{
    if(!('geolocation' in navigator)){ setGeo({status:'denied',label:'',ref:{x:50,y:50}}); return; }
    navigator.geolocation.getCurrentPosition(
      ()=> setGeo({status:'granted',label:'tu ubicación actual',ref:{x:50,y:50}}),
      ()=> setGeo(g=>({...g,status:'denied'})),
      { timeout:8000, maximumAge:600000 }
    );
  }, []);
  const setManualLocation = (text)=> setGeo({ status:'manual', label:text, ref: window.UM_GEOCODE(text) });

  const flash = msg => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(''), 2200);
  };

  const toggleTheme = () => { const next = theme==='noche'?'crema':'noche'; animateThemeTo(next); try{localStorage.setItem('um-theme',next);}catch(e){} setTheme(next); };
  const go = view => setRoute(r=>({ ...r, view }));
  const openRest = rid => setRoute({ view:'detail', rid, query:route.query, presetTime:null });
  const search = q => setRoute(r=>({ ...r, view:'results', query:q }));
  const askConcierge = q => setRoute(r=>({ ...r, view:'concierge', query:q||'' }));
  const startBook = (rid, t, party) => {
    setRoute({ view:'booking', rid, query:route.query, presetTime:t, presetParty: party||null });
  };
  const toggleFav = rid => {
    setFavs(f => {
      const has = f.includes(rid);
      flash(has ? 'Quitado de favoritos' : '♥ Guardado en favoritos');
      return has ? f.filter(x=>x!==rid) : [...f, rid];
    });
  };
  const requireAuth = cb => { pendingRef.current = cb; setReserveGate(true); };
  const awardSpoons = n => { setSpoons(s=>{ const t=s+n; try{localStorage.setItem('um-spoons',String(t));}catch(e){} return t; }); };
  const redeemReward = cost => { let ok=false; setSpoons(s=>{ if(s>=cost){ ok=true; const t=s-cost; try{localStorage.setItem('um-spoons',String(t));}catch(e){} return t; } return s; }); if(ok) flash('Recompensa canjeada · −'+cost+' Cucharas'); return ok; };
  const onAuth = u => {
    setUser(u); setAuthOpen(null); setReserveGate(false);
    flash('¡Hola, '+formatName(u).split(' ')[0]+'!');
    if (pendingRef.current) { const cb = pendingRef.current; pendingRef.current=null; setTimeout(cb, 60); }
  };
  /* reservation gate outcomes */
  const gateCreateAccount = u => { awardSpoons(25); flash('Cuenta creada · +25 Cucharas de Oro'); onAuth(u); };
  const gateGuest = () => {
    setReserveGate(false);
    const cb = pendingRef.current; pendingRef.current=null;
    if (cb) cb();
    setTimeout(()=>setClaimOpen(true), 400);
  };
  const claimCreate = () => {
    setClaimOpen(false);
    pendingRef.current = null;
    awardSpoons(25);
    setAuthOpen('register');
  };
  const onConfirm = booking => {
    setBookings(b => [booking, ...b]);
    flash('Mesa confirmada en '+booking.name);
    if (booking.member) awardSpoons(25);
  };
  onConfirm._goProfile = () => go('profile');

  const logout = () => {
    if (window.UMAuth) window.UMAuth.signOut().catch(() => {});
    setUser(null); go('home'); flash('Sesión cerrada');
  };

  let screen;
  if (route.view==='home')
    screen = React.createElement(window.HomeScreen, { go, openRest, search, askConcierge, favs, toggleFav, startBook, geo, setManualLocation });
  else if (route.view==='concierge')
    screen = React.createElement(window.ConciergeScreen, { initialQuery:route.query, openRest, favs, toggleFav, startBook, go });
  else if (route.view==='results')
    screen = React.createElement(window.ResultsScreen, { query:route.query, openRest, favs, toggleFav, startBook });
  else if (route.view==='detail')
    screen = React.createElement(window.DetailScreen, { rid:route.rid, back:()=>go('results'), favs, toggleFav, startBook });
  else if (route.view==='booking')
    screen = React.createElement(window.BookingScreen, { rid:route.rid, presetTime:route.presetTime, presetParty:route.presetParty, back:()=>go('home'), user, requireAuth, onConfirm });
  else if (route.view==='profile')
    screen = React.createElement(window.ProfileScreen, { user, bookings, favs, data: restaurants, openRest, toggleFav, startBook, go, spoons, onRedeem:redeemReward });

  return React.createElement('div', { className:'app' },
    React.createElement(window.Header, {
      go, route:route.view, user,
      onAuth:(mode)=>setAuthOpen(mode||'register'),
      onProfile:()=>go('profile'),
      theme, onTheme:toggleTheme,
      onSearch:search
    }),
    screen,
    React.createElement(window.Footer, null),
    reserveGate ? React.createElement(window.ReserveAuthModal, {
      onClose:()=>{ setReserveGate(false); pendingRef.current=null; },
      onAccount:gateCreateAccount, onGuest:gateGuest }) : null,
    claimOpen ? React.createElement(window.ClaimSpoonsModal, {
      onClose:()=>setClaimOpen(false), onCreate:claimCreate }) : null,
    authOpen ? React.createElement(window.AuthModal, { onClose:()=>setAuthOpen(null), onAuth, geoLabel: geo.label==='tu ubicación actual' ? 'Vigo' : geo.label, initialMode:authOpen }) : null,
    React.createElement(window.Toast, { msg:toast }),
    /* logout affordance when on profile */
    (user && route.view==='profile') ? React.createElement('div',{style:{position:'fixed',bottom:'20px',right:'20px',zIndex:50}},
      React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:logout},
        React.createElement(window.Icon,{name:'logout'}),'Cerrar sesión')) : null
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
