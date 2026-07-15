/* ════ UNA MESA · App root (state + routing) ════ */

/* ── Market detection (self-contained copy — see home.jsx for canonical version) ── */
function apMarket() {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'uk' || q === 'en') return 'en';
    if (window.location.hostname.endsWith('.co.uk')) return 'en';
  } catch (_) {}
  return 'es';
}
const AP_LANG = apMarket();
const AP_T = {
  es: {
    removedFav: 'Quitado de favoritos', addedFav: '♥ Guardado en favoritos',
    rewardRedeemed: cost => 'Recompensa canjeada · −'+cost+' Cucharas',
    hello: name => '¡Hola, '+name+'!',
    accountCreated: 'Cuenta creada · +25 Cucharas de Oro',
    tableConfirmedToast: name => 'Mesa confirmada en '+name,
    loggedOut: 'Sesión cerrada',
    currentLocationSentinel: 'tu ubicación actual', yourArea: 'tu zona',
    countryFallback: 'España',
  },
  en: {
    removedFav: 'Removed from favourites', addedFav: '♥ Saved to favourites',
    rewardRedeemed: cost => 'Reward redeemed · −'+cost+' Spoons',
    hello: name => 'Hi, '+name+'!',
    accountCreated: 'Account created · +25 Golden Spoons',
    tableConfirmedToast: name => 'Table confirmed at '+name,
    loggedOut: 'Logged out',
    currentLocationSentinel: 'your current location', yourArea: 'your area',
    countryFallback: 'the UK',
  }
}[AP_LANG];

/* glitch-free theme switch: one uniform crossfade applied only during the change */
function animateThemeTo(t){
  const el = document.documentElement;
  el.classList.add('theme-transition');
  clearTimeout(window.__umThemeT);
  window.__umThemeT = setTimeout(()=>el.classList.remove('theme-transition'), 420);
}

function App() {
  const [restaurants, setRestaurants] = useState(window.UM_DATA);
  const [route, setRoute] = useState(() => {
    try {
      const saved = sessionStorage.getItem('um-route');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed?.view === 'profile') return { view:'home', rid:null, query:'', presetTime:null };
      return parsed || { view:'home', rid:null, query:'', presetTime:null };
    } catch(e) { return { view:'home', rid:null, query:'', presetTime:null }; }
  });
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('um-theme');
      return (saved && saved !== 'dark') ? saved : 'crema';
    } catch(e) { return 'crema'; }
  });
  const [user, setUser] = useState(null);
  const [favs, setFavs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [authOpen, setAuthOpen] = useState(null); // null | 'login' | 'register'
  const [reserveGate, setReserveGate] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [cancelToken, setCancelToken] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('cancel_token'); } catch (_) { return null; }
  });
  const [connectToken, setConnectToken] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('connect_token'); } catch (_) { return null; }
  });
  const [connectJustDone] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('done') === '1'; } catch (_) { return false; }
  });
  const [adminVenues, setAdminVenues] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('admin') === 'venues'; } catch (_) { return false; }
  });
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

  const [noRealRestaurants, setNoRealRestaurants] = useState(false);

  /* load real restaurants from Supabase; keep mock data as fallback ONLY on
     a genuine fetch failure (null) — never when the query worked and
     simply found zero real restaurants for this city (empty array), since
     that case needs an honest "coming soon" state, not fictional data. */
  useEffect(() => {
    if (!window.loadRestaurants) return;
    window.loadRestaurants().then(rows => {
      if (rows === null) return; // fallo técnico real — se queda el catálogo de respaldo
      if (rows.length) {
        window.UM_DATA = rows;
        setRestaurants(rows);
      } else {
        window.UM_DATA = [];
        setRestaurants([]);
        setNoRealRestaurants(true);
      }
    });
  }, []);

  /* sync auth state with Supabase session (handles page reload + sign-in/out) */
  const wasSignedInRef = useRef(false);
  useEffect(() => {
    if (!window.UMAuth) return;
    const sub = window.UMAuth.onAuthStateChange((event, appUser) => {
      if (event === 'PASSWORD_RECOVERY') {
        // El usuario volvió de un link de "olvidé mi contraseña" — Supabase ya
        // le dio una sesión temporal solo para este propósito; mostramos el
        // formulario para que elija una nueva, en vez de tratarlo como login normal.
        setResetPwOpen(true);
        return;
      }
      if (appUser) {
        setUser(appUser);
        // Supabase dispara 'SIGNED_IN' no solo en un login real, sino también
        // al volver a la pestaña y revalidar en segundo plano la MISMA sesión
        // — sin este chequeo, cambiar de pestaña y volver te mandaba de vuelta
        // al perfil sin importar dónde estuvieras (por ejemplo, viendo la
        // ficha de un restaurante). Solo navegamos si de verdad no había
        // sesión antes de este evento — un login genuino, no una revalidación.
        if (event === 'SIGNED_IN' && !wasSignedInRef.current) {
          setRoute({ view:'profile', rid:null, query:'', presetTime:null });
        }
        wasSignedInRef.current = true;
      } else {
        // No hay sesión real de Supabase — ni en SIGNED_OUT explícito, ni en
        // INITIAL_SESSION al cargar la página si el token ya expiró o nunca
        // existió. Nunca dejamos un `user` optimista de localStorage sin
        // corregir: eso fue justo lo que produjo una reserva real a nombre
        // de una sesión fantasma ("Comensal") en vez del usuario logueado.
        setUser(null);
        wasSignedInRef.current = false;
      }
    });
    return () => sub && sub.unsubscribe();
  }, []);

  /* geolocation — sort nearby restaurants by distance, manual fallback */
  useEffect(()=>{
    if(!('geolocation' in navigator)){ setGeo({status:'denied',label:'',ref:{x:50,y:50}}); return; }
    navigator.geolocation.getCurrentPosition(
      pos=> {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setGeo({status:'granted',label:AP_T.currentLocationSentinel,ref:{x:50,y:50},lat,lng});
        
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then(r => r.json())
          .then(d => {
            const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
            if (city) setGeo(g => ({ ...g, label: city }));
          })
          .catch(() => {});
      },
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

  /* browser back/forward button support */
  useEffect(() => {
    const onPopState = (e) => {
      if (e.state?.route) {
        setRoute(e.state.route);
      } else {
        setRoute({ view: 'home', rid: null, query: '', presetTime: null });
      }
    };
    window.addEventListener('popstate', onPopState);
    window.history.replaceState({ route: { view: 'home', rid: null, query: '', presetTime: null } }, '', '#home');
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const toggleTheme = () => { const next = theme==='noche'?'crema':'noche'; animateThemeTo(next); try{localStorage.setItem('um-theme',next);}catch(e){} setTheme(next); };
  const go = (view, params={}) => {
    const newRoute = { view, rid:null, query:'', presetTime:null, ...params };
    setRoute(newRoute);
    try { sessionStorage.setItem('um-route', JSON.stringify(newRoute)); } catch(e) {}
    window.history.pushState({ route: newRoute }, '', `#${view}`);
  };
  const goWithGuard = view => go(view);
  const openRest = rid => setRoute({ view:'detail', rid, query:route.query, presetTime:null });
  const search = q => setRoute(r=>({ ...r, view:'results', query:q }));
  const askConcierge = q => setRoute(r=>({ ...r, view:'concierge', query:q||'' }));
  const startBook = (rid, t, party, date) => {
    setRoute({ view:'booking', rid, query:route.query, presetTime:t, presetParty: party||null, presetDate: date||null });
  };
  const toggleFav = rid => {
    setFavs(f => {
      const has = f.includes(rid);
      flash(has ? AP_T.removedFav : AP_T.addedFav);
      return has ? f.filter(x=>x!==rid) : [...f, rid];
    });
  };
  const requireAuth = cb => { pendingRef.current = cb; setReserveGate(true); };
  const awardSpoons = n => { setSpoons(s=>{ const t=s+n; try{localStorage.setItem('um-spoons',String(t));}catch(e){} return t; }); };
  const redeemReward = cost => { let ok=false; setSpoons(s=>{ if(s>=cost){ ok=true; const t=s-cost; try{localStorage.setItem('um-spoons',String(t));}catch(e){} return t; } return s; }); if(ok) flash(AP_T.rewardRedeemed(cost)); return ok; };
  const onAuth = u => {
    setUser(u); setAuthOpen(null); setReserveGate(false);
    flash(AP_T.hello(formatName(u).split(' ')[0]));
    if (pendingRef.current) { const cb = pendingRef.current; pendingRef.current=null; setTimeout(cb, 60); }
  };
  /* reservation gate outcomes */
  const gateCreateAccount = u => { awardSpoons(25); flash(AP_T.accountCreated); onAuth(u); };
  const gateGuest = () => {
    setReserveGate(false);
    const cb = pendingRef.current; pendingRef.current=null;
    if (cb) cb();
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#profile' && !user) {
        window.location.hash = '#home';
      }
    }, { once: true });
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
    flash(AP_T.tableConfirmedToast(booking.name));
    if (booking.member) awardSpoons(25);
  };
  onConfirm._goProfile = () => go('profile');

  const logout = () => {
    if (window.UMAuth) window.UMAuth.signOut().catch(() => {});
    setUser(null); go('home'); flash(AP_T.loggedOut);
  };

  let screen;
  if (route.view==='home')
    screen = React.createElement(window.HomeScreen, { go, openRest, search, askConcierge, favs, toggleFav, startBook, geo, setManualLocation, noRealRestaurants });
  else if (route.view==='concierge')
    screen = React.createElement(window.ConciergeScreen, { initialQuery:route.query, openRest, favs, toggleFav, startBook, go, user });
  else if (route.view==='results')
    screen = React.createElement(window.ResultsScreen, { query:route.query, openRest, favs, toggleFav, startBook, geoLabel: geo.label && geo.label !== AP_T.currentLocationSentinel ? geo.label : AP_T.yourArea, geo });
  else if (route.view==='detail')
    screen = React.createElement(window.DetailScreen, { rid:route.rid, back:()=>go('results'), favs, toggleFav, startBook });
  else if (route.view==='booking')
    screen = React.createElement(window.BookingScreen, { rid:route.rid, presetTime:route.presetTime, presetParty:route.presetParty, presetDate:route.presetDate, back:()=>go('home'), user, requireAuth, onConfirm });
  else if (route.view==='profile') {
    if (!user) { go('home'); screen = null; }
    else screen = React.createElement(window.ProfileScreen, { user, bookings, favs, data: restaurants, openRest, toggleFav, startBook, go: goWithGuard, spoons, onRedeem:redeemReward });
  }

  return React.createElement('div', { className:'app' },
    React.createElement(window.Header, {
      go: goWithGuard, route:route.view, user,
      onAuth:(mode)=>setAuthOpen(mode||'register'),
      onProfile:()=>go('profile'),
      onLogout: logout,
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
    authOpen ? React.createElement(window.AuthModal, { onClose:()=>setAuthOpen(null), onAuth, geoLabel: geo.label===AP_T.currentLocationSentinel ? AP_T.countryFallback : geo.label, initialMode:authOpen }) : null,
    resetPwOpen ? React.createElement(window.ResetPasswordScreen, { onDone:()=>{ setResetPwOpen(false); go('home'); } }) : null,
    cancelToken ? React.createElement(window.CancelBookingScreen, { token:cancelToken, onDone:()=>{
      setCancelToken(null);
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('cancel_token');
        window.history.replaceState({}, '', url.toString());
      } catch (_) {}
      go('home');
    } }) : null,
    connectToken ? React.createElement(window.StripeConnectScreen, { token:connectToken, justDone:connectJustDone, onDone:()=>{
      setConnectToken(null);
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('connect_token');
        window.history.replaceState({}, '', url.toString());
      } catch (_) {}
      go('home');
    } }) : null,
    adminVenues ? React.createElement(window.AdminCreateVenueScreen, { onDone:()=>{
      setAdminVenues(false);
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        window.history.replaceState({}, '', url.toString());
      } catch (_) {}
      go('home');
    } }) : null,
    React.createElement(window.Toast, { msg:toast })
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
