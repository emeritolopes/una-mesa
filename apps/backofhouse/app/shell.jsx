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
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white text-xs font-bold font-['Syne'] flex-shrink-0">EB</div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-900 truncate">El Bodegón Central</div>
          <div className="text-[10px] text-gray-400">Restaurante · Madrid</div>
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
  ajustes: () => <Ajustes />,
};

function App() {
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
  const logout = () => {
    if (window.BOH_SB) window.BOH_SB.auth.signOut().catch(() => {});
    setUser(null);
    localStorage.removeItem('unamesa.user');
  };

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
