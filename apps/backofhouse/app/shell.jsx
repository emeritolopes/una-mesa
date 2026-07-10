/* ─────────────────────────────────────────────────────────────
   Una Mesa — app shell: Sidebar + auth + router
   ───────────────────────────────────────────────────────────── */

function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'noche'
  );
  const apply = (next) => {
    const el = document.documentElement;
    el.classList.add('theme-transition');
    clearTimeout(window.__themeT);
    window.__themeT = setTimeout(() => el.classList.remove('theme-transition'), 420);
    el.setAttribute('data-theme', next);
    try { localStorage.setItem('um-theme', next); } catch(e) {}
    setDark(next === 'noche');
  };
  const toggle = () => apply(dark ? 'crema' : 'noche');
  return (
    <button onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}
      className="w-full flex items-center gap-2.5 px-2 py-2 text-sm rounded-lg transition text-gray-500 hover:text-gray-900 hover:bg-gray-50">
      <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'} text-base opacity-80`} />
      <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
    </button>
  );
}
const NAV_GROUPS = [
  { title: 'Principal', items: [
    { to: 'panel', icon: 'ti-layout-dashboard', label: 'Panel' },
    { to: 'reservas', icon: 'ti-calendar', label: 'Reservas' },
    { to: 'tpv', icon: 'ti-shopping-cart', label: 'TPV' },
    { to: 'cocina', icon: 'ti-chef-hat', label: 'Cocina' },
  ] },
  { title: 'Gestión', items: [
    { to: 'carta', icon: 'ti-book-2', label: 'Carta' },
    { to: 'stock', icon: 'ti-building-warehouse', label: 'Inventario' },
    { to: 'personal', icon: 'ti-users', label: 'Personal' },
    { to: 'informes', icon: 'ti-chart-bar', label: 'Informes' },
    { to: 'analytics', icon: 'ti-chart-dots', label: 'Analytics' },
  ] },
];

function Sidebar({ view, go, user, onLogout }) {
  return (
    <aside className="w-52 bg-white border-r border-black/7 flex flex-col h-screen flex-shrink-0">
      <div className="px-5 py-5 border-b border-black/7">
        <div className="flex items-center gap-2.5">
          <LogoBadge size={34} />
          <div>
            <div className="font-['Syne'] font-black text-lg text-brand tracking-tight leading-none">una<span className="text-gray-400 font-bold">mesa</span></div>
            <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Gestión de local</div>
          </div>
        </div>
      </div>

      <div className="mx-3 my-3 bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white text-xs font-bold font-['Syne'] flex-shrink-0">{user.initials || 'R'}</div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-900 truncate">{user.venue_name || 'Restaurante'}</div>
          <div className="text-[10px] text-gray-400">Restaurante{user.venue_city ? ` · ${user.venue_city}` : ''}</div>
        </div>
      </div>

      <nav className="flex-1 py-1 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.title}>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-5 pt-3 pb-1">{group.title}</div>
            {group.items.map(n => {
              const active = view === n.to;
              return (
                <button key={n.to} onClick={() => go(n.to)}
                  className={`w-full flex items-center gap-2.5 px-5 py-2 text-sm transition-all relative text-left
                    ${active ? 'text-brand font-medium bg-brand/10 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-brand before:rounded-r' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                  <i className={`ti ${n.icon} text-base opacity-80`} />{n.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-black/7 flex flex-col gap-1">
        <ThemeToggle />
        <button onClick={() => go('ajustes')}
          className={`w-full flex items-center gap-2.5 px-2 py-2 text-sm rounded-lg transition ${view === 'ajustes' ? 'text-brand font-medium bg-brand/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
          <i className="ti ti-settings text-base opacity-80" /> Ajustes
        </button>
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group">
          <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand flex-shrink-0">{user.initials}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-gray-900 truncate">{user.name}</div>
            <div className="text-[10px] text-gray-400 truncate">{user.role || user.access || 'Usuario'}</div>
          </div>
          <button onClick={onLogout} title="Cerrar sesión" className="text-gray-300 hover:text-[#E85D3A] transition flex-shrink-0"><i className="ti ti-logout text-base" /></button>
        </div>
      </div>
    </aside>
  );
}

const SCREENS = {
  panel: (go) => <Panel go={go} />,
  reservas: () => <Reservas />,
  tpv: () => <TPV />,
  cocina: () => <Cocina />,
  carta: () => <Carta />,
  stock: () => <Stocktake />,
  personal: () => <Personal />,
  informes: () => <Informes />,
  analytics: () => <Analytics />,
  ajustes: () => <Ajustes />,
};

/* ── pantalla de confirmación de no-show — vive dentro de backofhouse
   porque las funciones Edge de Supabase no pueden servir HTML renderizable
   en el dominio compartido *.supabase.co. Se comprueba ANTES del login:
   un encargado puede hacer clic en el link del email sin tener sesión
   iniciada en ese momento. ── */
function NoShowConfirmScreen({ token }) {
  const [state, setState] = useState('loading'); // loading | confirm | success | error
  const [code, setCode] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/mark-noshow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, execute: false }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.ok) { setDetails(json); setState('confirm'); }
        else { setCode(json.code); setState('error'); }
      })
      .catch(() => { setCode('error'); setState('error'); });
  }, [token]);

  const confirm = () => {
    setState('loading');
    fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/mark-noshow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, execute: true }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.ok) setState('success');
        else { setCode(json.code); setState('error'); }
      })
      .catch(() => { setCode('error'); setState('error'); });
  };

  const errorMsg = () => ({
    used: 'Este enlace ya se usó. Si fue un error, contacta con Una Mesa.',
    expired: 'Este enlace ha expirado.',
    unprocessable: 'El depósito de esta reserva ya fue procesado antes.',
    invalid: 'Este enlace no es válido.',
  }[code] || 'No se pudo procesar. Inténtalo de nuevo o contacta con Una Mesa.');

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#FAF6F0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,.07)' }}>
        {state === 'loading' && <p style={{ fontSize: 14, color: '#777' }}>Cargando…</p>}

        {state === 'confirm' && details && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 20, marginBottom: 8 }}>¿Confirmar no-show?</h1>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>{details.customer_name} · {details.date} · {(details.time || '').slice(0, 5)} · {details.pax} pax</p>
            <p style={{ fontSize: 14, color: '#777', lineHeight: 1.6, marginBottom: 24 }}>
              Al confirmar, el depósito se cobrará de forma <strong>irreversible</strong>. Úsalo solo si el cliente no se presentó.
            </p>
            <button onClick={confirm} style={{ width: '100%', background: '#D8552E', color: '#fff', border: 'none', padding: 14, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Sí, marcar como no-show y cobrar depósito
            </button>
          </>
        )}

        {state === 'success' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h1 style={{ fontSize: 20, marginBottom: 8 }}>No-show registrado</h1>
            <p style={{ fontSize: 14, color: '#777' }}>La reserva se marcó como no-show y el depósito ha sido cobrado.</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 20, marginBottom: 8 }}>No se pudo procesar</h1>
            <p style={{ fontSize: 14, color: '#777' }}>{errorMsg()}</p>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [noshowToken] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('noshow_token'); } catch (e) { return null; }
  });
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('unamesa.user')); } catch { return null; } });
  const [view, setView] = useState(() => localStorage.getItem('unamesa.view') || 'panel');

  const go = useCallback((v) => { setView(v); localStorage.setItem('unamesa.view', v); }, []);

  // cross-tab theme sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'um-theme' || !e.newValue) return;
      const el = document.documentElement;
      el.classList.add('theme-transition');
      clearTimeout(window.__themeT);
      window.__themeT = setTimeout(() => el.classList.remove('theme-transition'), 420);
      el.setAttribute('data-theme', e.newValue);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  const login = (u) => { setUser(u); localStorage.setItem('unamesa.user', JSON.stringify(u)); go('panel'); };
  const logout = () => { window.sb?.auth?.signOut(); setUser(null); localStorage.removeItem('unamesa.user'); };

  if (noshowToken) return <><NoShowConfirmScreen token={noshowToken} /><ToastHost /></>;
  if (!user) return <><Login onLogin={login} /><ToastHost /></>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <Sidebar view={view} go={go} user={user} onLogout={logout} />
      <main className="flex-1 overflow-y-auto">
        {(SCREENS[view] || SCREENS.panel)(go)}
      </main>
      <ToastHost />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
