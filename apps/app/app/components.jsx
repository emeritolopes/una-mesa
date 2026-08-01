/* ════ UNA MESA · shared components ════ */

/* ── Icon set (monoline) ── */
const PATHS = {
  search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.3-4.3',
  pin:'M12 2a7 7 0 0 1 7 7c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 7-7Z|M12 9m-2.4 0a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0',
  star:'M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z',
  heart:'M19.5 13.5 12 21l-7.5-7.5a4.5 4.5 0 0 1 6.4-6.3l1.1 1 1.1-1a4.5 4.5 0 0 1 6.4 6.3Z',
  clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z|M12 7.5V12l3 2',
  users:'M9 8m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0|M2.5 20a6.5 6.5 0 0 1 13 0|M17 7.5a3 3 0 0 1 0 5.8|M18.5 20a6 6 0 0 0-3.5-5.4',
  cal:'M3 4h18v18H3zM3 9h18M8 2v4M16 2v4',
  check:'M20 6 9 17l-5-5',
  arrow:'M5 12h14M13 6l6 6-6 6',
  chevR:'M9 6l6 6-6 6',
  chevD:'M6 9l6 6 6-6',
  chevL:'M15 6l-6 6 6 6',
  filter:'M3 5h18M6 12h12M10 19h4',
  sparkle:'M12 3l1.9 4.8L19 9.5l-4.1 2.2L12 17l-2.9-5.3L5 9.5 10.1 7.8 12 3Z',
  close:'M6 6l12 12M18 6 6 18',
  fish:'M3 12c3-5 9-6 13-4 2 1 4 2 5 4-1 2-3 3-5 4-4 2-10 1-13-4Z|M3 12c1.5 0 3 1.5 3 3M3 12c1.5 0 3-1.5 3-3|M16 11.5h.01',
  flame:'M12 2s5 4 5 9a5 5 0 0 1-10 0c0-1.5.6-2.7 1.3-3.6C9 9 9 11 11 11c0-2 1-4 1-9Z',
  pot:'M4 9h16l-1.2 9.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 9Z|M3 9h18M9 9V6a3 3 0 0 1 6 0v3',
  leaf:'M5 21c0-9 5-15 15-15 0 9-5 15-15 15Z|M5 21c4-6 8-9 12-11',
  wine:'M8 3h8l-1 6a3 3 0 0 1-6 0L8 3Z|M12 15v5M9 21h6',
  coffee:'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z|M17 9h2.5a2 2 0 0 1 0 5H17|M7 2.5v2M11 2.5v2',
  bag:'M6 8h12l-1 13H7L6 8Z|M9 8V6a3 3 0 0 1 6 0v2',
  shield:'M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z|M9 12l2 2 4-4',
  info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z|M12 11v5|M12 7.6v.05',
  bell:'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z|M10.4 19a1.9 1.9 0 0 0 3.2 0',
  map:'M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z|M9 3v16M15 5v16',
  ticket:'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z|M13 6v12',
  card:'M3 6h18v12H3zM3 10h18',
  user:'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0|M4 21a8 8 0 0 1 16 0',
  logout:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5M21 12H9',
  sun:'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4|M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  moon:'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z',
  store:'M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0|M9 20v-5h6v5',
  google:'M21 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3a9 9 0 0 0 2.8-7.1Z|M12 21a8.8 8.8 0 0 0 6.1-2.2l-3-2.4a5.4 5.4 0 0 1-8-2.8H4v2.5A9 9 0 0 0 12 21Z|M7.1 13.6a5.3 5.3 0 0 1 0-3.4V7.7H4a9 9 0 0 0 0 8.1l3.1-2.2Z|M12 7.4a4.9 4.9 0 0 1 3.4 1.3l2.6-2.6A8.7 8.7 0 0 0 12 3.8 9 9 0 0 0 4 8.3l3.1 2.4A5.4 5.4 0 0 1 12 7.4Z',
  euro:'M16 6a6 6 0 1 0 0 12|M5 10h7M5 14h6',
  spoon:'M12 11.5c2 0 3.6-2 3.6-4.4S14 2.5 12 2.5 8.4 4.6 8.4 7s1.6 4.5 3.6 4.5Zm0 0V21',
  mail:'M3 6h18v12H3z|M3 7l9 6 9-6',
  phone:'M7 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 5 5a2 2 0 0 1 2-2Z',
  gift:'M20 12v9H4v-9|M2 7h20v5H2zM12 7v14|M12 7S10.8 3 8.5 3a2.5 2.5 0 0 0 0 5H12Zm0 0s1.2-4 3.5-4a2.5 2.5 0 0 1 0 5H12Z',
  lock:'M6 10V8a6 6 0 0 1 12 0v2|M5 10h14v11H5z|M12 14v3',
  play:'M6 4l14 8-14 8V4Z',
  share:'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7|M16 6l-4-4-4 4|M12 2v13',
  // Brand marks — filled logomarks (used with fill:'currentColor'), not
  // monoline like the rest of this set. Paths from simple-icons (MIT),
  // verified byte-for-byte against their published SVGs, not hand-drawn.
  instagram:'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
  linkedin:'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  facebook:'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  tiktok:'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'
};
function Icon({ name, className, style, fill }) {
  const raw = PATHS[name] || '';
  const parts = raw.split('|');
  return React.createElement('svg', {
    className, style, viewBox:'0 0 24 24', fill: fill || 'none',
    stroke: fill ? 'none' : 'currentColor', strokeWidth: 1.8, strokeLinecap:'round', strokeLinejoin:'round'
  }, parts.map((d,i)=>React.createElement('path',{key:i,d})));
}

/* ── Photo placeholder (gradient + glyph) ── */
function Photo({ cz, glyph, slotId, className, style, photoUrl }) {
  // safeCz v2 - null guard
  const safeCz = cz || { from: '#2D2420', to: '#4A3728' };
  const grad = `linear-gradient(150deg, ${safeCz.from}, ${safeCz.to})`;
  if (photoUrl) {
    return React.createElement('div', { className:'photo '+(className||''), style:{ background:grad, ...style, position:'relative', overflow:'hidden' } },
      React.createElement('img', { src:photoUrl, alt:'', style:{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' } })
    );
  }
  return React.createElement('div', { className:'photo '+(className||''), style:{ background:grad, ...style } },
    React.createElement('div',{className:'ph-grain'}),
    React.createElement('div',{className:'ph-art'}, React.createElement(Icon,{name:glyph||'spoon'})),
    slotId ? React.createElement('image-slot',{ id:slotId, shape:'rect', placeholder:'' }) : null
  );
}

/* ── Stars ── */
function Stars({ value, size }) {
  const full = Math.round(value);
  return React.createElement('span', { className:'rev-stars-sm', style:{display:'inline-flex',gap:'1px'} },
    [1,2,3,4,5].map(i => React.createElement(Icon, {
      key:i, name:'star', fill: i<=full ? 'currentColor' : 'none',
      style:{ width:size||14, height:size||14, color: i<=full ? 'var(--gold)' : 'var(--dim)', opacity: i<=full?1:.4 }
    }))
  );
}

/* ── Modal shell ── */
function Modal({ onClose, children, max }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, []);
  return React.createElement('div', { className:'modal-back', onClick:onClose },
    React.createElement('div', { className:'modal', style:max?{maxWidth:max}:null, onClick:e=>e.stopPropagation() },
      React.createElement('button', { className:'modal-x', onClick:onClose }, React.createElement(Icon,{name:'close'})),
      children
    )
  );
}

/* ── Toast ── */
function Toast({ msg }) {
  return React.createElement('div', { className:'toast'+(msg?' show':''), id:'umToast' },
    React.createElement(Icon,{name:'check'}),
    React.createElement('span', null, msg||'')
  );
}

/* ── Market detection (self-contained copy — see home.jsx for the canonical version) ── */
function cmMarket() {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'uk' || q === 'en') return 'en';
    if (window.location.hostname.endsWith('.co.uk')) return 'en';
  } catch (_) {}
  return 'es';
}
const CM_LANG = cmMarket();
const CM_T = {
  es: {
    discover:'Descubrir', explore:'Explorar', concierge:'Conserje IA', forRestaurants:'¿Tienes un restaurante?',
    searchPh:'Busca restaurante, cocina o zona…', search:'Buscar',
    lightMode:'Modo claro', darkMode:'Modo oscuro',
    myProfile:'👤  Mi perfil', logout:'→  Cerrar sesión',
    signIn:'Iniciar sesión', createProfile:'Crear perfil',
    closeMenu:'Cerrar menú', openMenu:'Abrir menú',
    footerTag:'© 2026 Una Mesa · La mesa que siempre te espera',
    help:'Ayuda', privacy:'Privacidad', terms:'Términos',
  },
  en: {
    discover:'Discover', explore:'Explore', concierge:'AI Concierge', forRestaurants:'Own a restaurant?',
    searchPh:'Search restaurant, cuisine or area…', search:'Search',
    lightMode:'Light mode', darkMode:'Dark mode',
    myProfile:'👤  My profile', logout:'→  Log out',
    signIn:'Sign in', createProfile:'Create profile',
    closeMenu:'Close menu', openMenu:'Open menu',
    footerTag:'© 2026 Una Mesa · The table that always awaits you',
    help:'Help', privacy:'Privacy', terms:'Terms',
  }
}[CM_LANG];

/* ── Header · Stitch navbar (glass, wordmark, underline-active links) ── */
function Header({ go, route, user, onAuth, onProfile, onLogout, theme, onTheme, onSearch }) {
  const [scrolled,   setScrolled]  = useState(false);
  const [menuOpen,   setMenuOpen]  = useState(false);
  const [avatarOpen, setAvatarOpen] = React.useState(false);
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  React.useEffect(() => {
    if (!avatarOpen) return;
    const close = () => setAvatarOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [avatarOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submit = e => { e.preventDefault(); if (q.trim()) onSearch(q.trim()); };
  const v = route && route.view ? route.view : route;

  const lnk = (view, label) => React.createElement('a', {
    className: 'hdr-link' + (v === view ? ' on' : ''),
    onClick: () => go(view)
  }, label);

  /* mobile nav link — closes menu on tap */
  const mlnk = (view, label) => React.createElement('button', {
    className: 'hdr-mobile-link' + (v === view ? ' on' : ''),
    onClick: () => { go(view); setMenuOpen(false); }
  }, label);

  return React.createElement('header', { className:'hdr' },
    React.createElement('div', { className:'wrap' },
      React.createElement('div', { className:'hdr-in' },

        /* ── Logo ── */
        React.createElement('div', { className:'brand', onClick:()=>{ go('home'); setMenuOpen(false); } },
          React.createElement('img', {
            src:'./una-mesa-logo.svg',
            alt:'Una Mesa',
            style:{ height:'36px', width:'auto', filter:theme==='noche'?'brightness(0) invert(1)':'brightness(0)', display:'inline-block', verticalAlign:'middle', flexShrink:0 }
          })
        ),

        /* ── Links de navegación (desktop) ── */
        React.createElement('nav', { className:'hdr-links' },
          lnk('home',      CM_T.discover),
          lnk('results',   CM_T.explore),
          lnk('concierge', CM_T.concierge)
        ),

        /* ── Barra de búsqueda scroll ── */
        React.createElement('form', {
          className: 'hdr-search' + (scrolled ? ' show' : ''),
          onSubmit: submit, role:'search', 'aria-hidden': String(!scrolled)
        },
          React.createElement(Icon, { name:'search' }),
          React.createElement('input', {
            ref: inputRef,
            value:q, onChange:e=>setQ(e.target.value), tabIndex:scrolled?0:-1,
            placeholder:CM_T.searchPh
          })
        ),

        /* ── Acciones derecha ── */
        React.createElement('div', { className:'hdr-nav' },
          React.createElement('button', {
            className:'icon-btn', title:CM_T.search,
            onClick:() => { if (scrolled && inputRef.current) inputRef.current.focus(); else go('results'); }
          }, React.createElement(Icon, { name:'search' })),

          React.createElement('button', {
            className:'icon-btn', title:theme==='noche'?CM_T.lightMode:CM_T.darkMode, onClick:onTheme
          }, React.createElement(Icon, { name:theme==='noche'?'sun':'moon' })),

          user
            ? React.createElement('div', { style:{ position:'relative' } },
                React.createElement('button', {
                  className:'avatar-btn',
                  onClick: e => { e.stopPropagation(); setAvatarOpen(o => !o); }
                },
                  React.createElement('span', { className:'av' }, formatName(user)[0].toUpperCase()),
                  React.createElement('span', { className:'nm' }, formatName(user).split(' ')[0])
                ),
                avatarOpen && React.createElement('div', {
                  style:{
                    position:'absolute', top:'calc(100% + 8px)', right:0,
                    background:'var(--bg-2)',
                    border:'1px solid var(--line)',
                    borderRadius:12,
                    boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
                    minWidth:200, zIndex:999, overflow:'hidden'
                  }
                },
                  React.createElement('button', {
                    style:{ width:'100%', padding:'12px 16px', textAlign:'left', background:'transparent', border:'none', cursor:'pointer', fontSize:14, color:'var(--text)' },
                    onClick: () => { setAvatarOpen(false); onProfile(); }
                  }, CM_T.myProfile),
                  React.createElement('div', { style:{ height:1, background:'var(--line)', margin:'0 12px' } }),
                  React.createElement('button', {
                    style:{ width:'100%', padding:'12px 16px', textAlign:'left', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#D8552E' },
                    onClick: () => { setAvatarOpen(false); onLogout(); }
                  }, CM_T.logout)
                )
              )
            : React.createElement(React.Fragment, null,
                React.createElement('button', { className:'btn btn-ghost btn-sm hdr-signin', onClick:()=>onAuth('login') }, CM_T.signIn),
                React.createElement('button', { className:'btn btn-acc btn-sm', onClick:()=>onAuth('register') }, CM_T.createProfile)
              )
        ),

        /* ── Hamburger (mobile only) ── */
        React.createElement('button', {
          type:'button',
          className: 'hdr-burger' + (menuOpen ? ' open' : ''),
          onClick: () => setMenuOpen(o => !o),
          'aria-label': menuOpen ? CM_T.closeMenu : CM_T.openMenu
        },
          React.createElement('span', null),
          React.createElement('span', null),
          React.createElement('span', null)
        )
      )
    ),

    /* ── Panel de navegación móvil ── */
    React.createElement('nav', { className: 'hdr-mobile-menu' + (menuOpen ? ' open' : ''), 'aria-hidden': String(!menuOpen) },
      mlnk('home',      CM_T.discover),
      mlnk('results',   CM_T.explore),
      mlnk('concierge', CM_T.concierge)
    )
  );
}

/* ── Footer ── */
const SOCIAL_LINKS = [
  { name:'instagram', href:'https://www.instagram.com/unamesagroup/', label:'Instagram' },
  // Public company page, not /admin/dashboard/ — that one requires a logged-in
  // LinkedIn admin session and would 404/redirect-to-login for any visitor.
  { name:'linkedin', href:'https://www.linkedin.com/company/138484148/', label:'LinkedIn' },
  { name:'facebook', href:'https://www.facebook.com/profile.php?id=61592830190355', label:'Facebook' },
  { name:'tiktok', href:'https://www.tiktok.com/@unamesagroup', label:'TikTok' },
];
function Footer() {
  return React.createElement('footer', { className:'foot' },
    React.createElement('div', { className:'wrap' },
      React.createElement('div', { className:'foot-in' },
        React.createElement('span', null, CM_T.footerTag),
        React.createElement('div', { className:'foot-social' },
          SOCIAL_LINKS.map(s => React.createElement('a', {
            key:s.name, href:s.href, target:'_blank', rel:'noopener noreferrer',
            'aria-label':s.label, title:s.label
          }, React.createElement(Icon, { name:s.name, fill:'currentColor', style:{ width:18, height:18 } })))
        ),
        React.createElement('div', { className:'foot-links' },
          React.createElement('a', { href:'/restaurants' }, CM_T.forRestaurants),
          React.createElement('a', { href:'#' }, CM_T.help),
          React.createElement('a', { href:'#' }, CM_T.privacy),
          React.createElement('a', { href:'#' }, CM_T.terms)
        )
      )
    )
  );
}

Object.assign(window, { Icon, Photo, Stars, Modal, Toast, Header, Footer });
