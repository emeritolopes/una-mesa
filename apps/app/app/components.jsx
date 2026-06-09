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
  lock:'M6 10V8a6 6 0 0 1 12 0v2|M5 10h14v11H5z|M12 14v3'
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
function Photo({ cz, glyph, slotId, className, style }) {
  const grad = `linear-gradient(150deg, ${cz.from}, ${cz.to})`;
  return React.createElement('div', { className:'photo '+(className||''), style:{ background:grad, ...style } },
    React.createElement('div',{className:'ph-grain'}),
    React.createElement('div',{className:'ph-art'}, React.createElement(Icon,{name:glyph||'fish'})),
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

/* ── Header · Stitch navbar (glass, wordmark, underline-active links) ── */
function Header({ go, route, user, onAuth, onProfile, theme, onTheme, onSearch }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

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
            style:{ height:'22px', width:'auto', filter:theme==='noche'?'brightness(0) invert(1)':'brightness(0)', display:'inline-block', verticalAlign:'middle', flexShrink:0 }
          })
        ),

        /* ── Links de navegación (desktop) ── */
        React.createElement('nav', { className:'hdr-links' },
          lnk('home',      'Descubrir'),
          lnk('results',   'Explorar'),
          lnk('concierge', 'Conserje IA'),
          React.createElement('a', {
            className:'hdr-link',
            href:'https://unamesa-backofhouse.com', target:'_blank', rel:'noopener'
          }, 'Para restaurantes')
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
            placeholder:'Busca restaurante, cocina o zona…'
          })
        ),

        /* ── Acciones derecha ── */
        React.createElement('div', { className:'hdr-nav' },
          React.createElement('button', {
            className:'icon-btn', title:'Buscar',
            onClick:() => { if (scrolled && inputRef.current) inputRef.current.focus(); else go('results'); }
          }, React.createElement(Icon, { name:'search' })),

          React.createElement('button', {
            className:'icon-btn', title:theme==='noche'?'Modo claro':'Modo oscuro', onClick:onTheme
          }, React.createElement(Icon, { name:theme==='noche'?'sun':'moon' })),

          user
            ? React.createElement('button', { className:'avatar-btn', onClick:onProfile },
                React.createElement('span', { className:'av' }, user.name[0].toUpperCase()),
                React.createElement('span', { className:'nm' }, user.name.split(' ')[0])
              )
            : React.createElement('button', { className:'btn btn-acc btn-sm', onClick:onAuth }, 'Crear perfil')
        ),

        /* ── Hamburger (mobile only) ── */
        React.createElement('button', {
          type:'button',
          className: 'hdr-burger' + (menuOpen ? ' open' : ''),
          onClick: () => setMenuOpen(o => !o),
          'aria-label': menuOpen ? 'Cerrar menú' : 'Abrir menú'
        },
          React.createElement('span', null),
          React.createElement('span', null),
          React.createElement('span', null)
        )
      )
    ),

    /* ── Panel de navegación móvil ── */
    React.createElement('nav', { className: 'hdr-mobile-menu' + (menuOpen ? ' open' : ''), 'aria-hidden': String(!menuOpen) },
      mlnk('home',      'Descubrir'),
      mlnk('results',   'Explorar'),
      mlnk('concierge', 'Conserje IA'),
      React.createElement('a', {
        className: 'hdr-mobile-link',
        href:'https://unamesa-backofhouse.com', target:'_blank', rel:'noopener',
        onClick: () => setMenuOpen(false)
      }, 'Para restaurantes')
    )
  );
}

/* ── Footer ── */
function Footer() {
  return React.createElement('footer', { className:'foot' },
    React.createElement('div', { className:'wrap' },
      React.createElement('div', { className:'foot-in' },
        React.createElement('span', null, '© 2026 Una Mesa · La mesa que siempre te espera'),
        React.createElement('div', { className:'foot-links' },
          React.createElement('a', { href:'https://unamesa-backofhouse.com', target:'_blank', rel:'noopener' }, 'Para restaurantes'),
          React.createElement('a', { href:'#' }, 'Ayuda'),
          React.createElement('a', { href:'#' }, 'Privacidad'),
          React.createElement('a', { href:'#' }, 'Términos')
        )
      )
    )
  );
}

Object.assign(window, { Icon, Photo, Stars, Modal, Toast, Header, Footer });
