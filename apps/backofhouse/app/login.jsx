/* ─────────────────────────────────────────────────────────────
   Una Mesa — Login (split screen: manager password + staff PIN)
   ───────────────────────────────────────────────────────────── */

function toAppUser(supaUser) {
  const meta = supaUser.user_metadata || {};
  const rawName = (meta.name || meta.full_name || supaUser.email.split('@')[0]).trim();
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  return { id: supaUser.id, email: supaUser.email, name, initials, role: meta.role || 'Gerente', access: 'manager' };
}
function Wordmark({ light }) {
  return (
    <div className={`font-['Syne'] font-black tracking-tight ${light ? 'text-white' : 'text-brand'}`}>
      una<span className={light ? 'text-white/55 font-bold' : 'text-gray-400 font-bold'}>mesa</span>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between w-[44%] flex-shrink-0 bg-brand overflow-hidden p-12 text-white">
      {/* soft decorative rings */}
      <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full border border-white/10" />
      <div className="absolute -right-10 -top-10 w-96 h-96 rounded-full border border-white/10" />
      <div className="absolute -left-32 bottom-10 w-80 h-80 rounded-full bg-white/[0.04]" />

      <div className="relative">
        <Logo light size={40} />
      </div>

      <div className="relative">
        <h1 className="font-['Syne'] text-4xl font-black leading-[1.1] tracking-tight max-w-sm">
          Tu local, bajo control.
        </h1>
        <p className="text-white/70 text-sm mt-4 max-w-xs leading-relaxed">
          Reservas, TPV, cocina y personal en una sola pantalla. Sin papeles, sin líos, en tiempo real.
        </p>
        <div className="flex gap-6 mt-9">
          {[
            { k: 'Reservas', i: 'ti-calendar' },
            { k: 'TPV', i: 'ti-shopping-cart' },
            { k: 'Cocina', i: 'ti-chef-hat' },
            { k: 'Personal', i: 'ti-users' },
          ].map(f => (
            <div key={f.k} className="flex flex-col items-center gap-1.5 text-white/80">
              <i className={`ti ${f.i} text-xl`} />
              <span className="text-[10px] uppercase tracking-wider font-semibold">{f.k}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-2.5 text-white/55 text-xs">
        <i className="ti ti-map-pin text-sm" />
        El Bodegón Central · Madrid · Plan Profesional
      </div>
    </div>
  );
}

function PasswordForm({ onLogin }) {
  const [email, setEmail] = useState('carlos@bodegoncentral.es');
  const [pw, setPw] = useState('demo1234');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@') || pw.length < 4) { setErr('Revisa tu correo y contraseña.'); return; }
    setErr(''); setLoading(true);
    try {
      const sb = window.sb;
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
      if (error) throw error;
      onLogin(toAppUser(data.user));
    } catch (e) {
      setErr(e.message || 'Correo o contraseña incorrectos.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-gray-600">Correo electrónico</span>
        <div className="relative">
          <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-black/10 rounded-xl bg-gray-50 outline-none focus:border-brand focus:bg-white transition"
            placeholder="tu@local.es" />
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">Contraseña</span>
          <button type="button" className="text-[11px] text-brand font-semibold hover:underline">¿Olvidaste tu contraseña?</button>
        </div>
        <div className="relative">
          <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 text-sm border border-black/10 rounded-xl bg-gray-50 outline-none focus:border-brand focus:bg-white transition"
            placeholder="••••••••" />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <i className={`ti ${show ? 'ti-eye-off' : 'ti-eye'} text-base`} />
          </button>
        </div>
      </label>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setRemember(r => !r)} className="flex items-center gap-2 text-xs text-gray-600">
          <span className={`w-4 h-4 rounded border flex items-center justify-center transition ${remember ? 'bg-brand border-brand' : 'border-black/20 bg-white'}`}>
            {remember && <i className="ti ti-check text-white text-[11px]" />}
          </span>
          Recordarme
        </button>
      </div>

      {err && <div className="text-xs text-[#E85D3A] flex items-center gap-1.5"><i className="ti ti-alert-circle" />{err}</div>}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition flex items-center justify-center gap-2 disabled:opacity-70">
        {loading ? <><i className="ti ti-loader-2 animate-spin" /> Entrando…</> : <>Entrar <i className="ti ti-arrow-right" /></>}
      </button>
    </form>
  );
}

function PinForm({ onLogin }) {
  const [staff] = useStore('staff');
  const [selId, setSelId] = useState(staff[0] && staff[0].id);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const sel = staff.find(s => s.id === selId) || staff[0];

  useEffect(() => {
    if (pin.length === 4 && sel) {
      if (pin === sel.pin) {
        setTimeout(() => onLogin(sel), 200);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(''); }, 450);
      }
    }
  }, [pin]);

  const press = (n) => { if (pin.length < 4) setPin(p => p + n); };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2">Selecciona tu perfil</div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {staff.map(s => {
            const on = sel && sel.id === s.id;
            return (
              <button key={s.id} onClick={() => { setSelId(s.id); setPin(''); }}
                className={`flex flex-col items-center gap-1.5 flex-shrink-0 w-14 transition ${on ? '' : 'opacity-55 hover:opacity-90'}`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold transition ${on ? 'ring-2 ring-brand ring-offset-2' : ''}`}
                  style={{ background: s.color_bg, color: s.color }}>{s.initials}</div>
                <span className="text-[10px] text-gray-500 truncate w-full text-center">{s.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`flex flex-col items-center gap-4 ${shake ? 'animate-shake' : ''}`}>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition ${i < pin.length ? 'bg-brand border-brand' : 'border-black/15'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {keys.map(k => (
            <button key={k} onClick={() => press(k)}
              className="aspect-square rounded-xl bg-gray-50 border border-black/5 font-['Syne'] text-xl font-bold text-gray-800 hover:bg-brand/10 hover:border-brand/30 active:scale-95 transition">
              {k}
            </button>
          ))}
          <span />
          <button onClick={() => press('0')}
            className="aspect-square rounded-xl bg-gray-50 border border-black/5 font-['Syne'] text-xl font-bold text-gray-800 hover:bg-brand/10 hover:border-brand/30 active:scale-95 transition">0</button>
          <button onClick={() => setPin(p => p.slice(0, -1))}
            className="aspect-square rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 active:scale-95 transition flex items-center justify-center">
            <i className="ti ti-backspace text-xl" />
          </button>
        </div>
        <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <i className="ti ti-info-circle" /> PIN demo de {sel ? sel.name.split(' ')[0] : ''}: <span className="font-semibold text-gray-600">{sel ? sel.pin : ''}</span>
        </div>
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  const [mode, setMode] = useState('password');
  const [checking, setChecking] = useState(!!window.sb);

  useEffect(() => {
    if (!window.sb) return;
    window.sb.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) onLogin(toAppUser(session.user));
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  if (checking) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <BrandPanel />
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Logo size={38} />
          </div>
          <h2 className="font-['Syne'] text-2xl font-black text-gray-900 tracking-tight">Bienvenido de nuevo</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">Inicia sesión para gestionar tu local.</p>

          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-6">
            {[{ k: 'password', l: 'Contraseña', i: 'ti-lock' }, { k: 'pin', l: 'PIN de equipo', i: 'ti-grid-dots' }].map(t => (
              <button key={t.k} onClick={() => setMode(t.k)}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${mode === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <i className={`ti ${t.i}`} />{t.l}
              </button>
            ))}
          </div>

          {mode === 'password' ? <PasswordForm onLogin={onLogin} /> : <PinForm onLogin={onLogin} />}

          <div className="text-center text-xs text-gray-400 mt-7">
            ¿No tienes cuenta? <button className="text-brand font-semibold hover:underline">Solicita una demo</button>
          </div>
        </div>
        <div className="text-[10px] text-gray-300 mt-8">© 2026 Una Mesa · Hecho en Madrid</div>
      </div>
    </div>
  );
}

Object.assign(window, { Login });
