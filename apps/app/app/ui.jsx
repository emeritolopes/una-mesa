/* ─────────────────────────────────────────────────────────────
   Una Mesa — shared UI primitives + lightweight charts
   ───────────────────────────────────────────────────────────── */
const eur = (n, dec = 2) => '€' + Number(n).toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const eur0 = (n) => '€' + Number(n).toLocaleString('es-ES', { maximumFractionDigits: 0 });

const TAG_CLASS = {
  popular: 'bg-amber-100 text-amber-700',
  nuevo: 'bg-brand/10 text-brand',
  vegano: 'bg-green-100 text-green-700',
  sin_gluten: 'bg-blue-100 text-blue-700',
};
const TAG_LABEL = { popular: 'Popular', nuevo: 'Nuevo', vegano: 'Vegano', sin_gluten: 'Sin gluten' };

function Tag({ tag }) {
  if (!tag) return null;
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${TAG_CLASS[tag] || 'bg-gray-100 text-gray-500'}`}>{TAG_LABEL[tag] || tag}</span>;
}

/* Allergen catalog map (from DATA) + chip renderers ------------------------- */
const ALLERGEN_MAP = Object.fromEntries((window.DATA.ALLERGENS || []).map(a => [a.key, a]));

/* Read-only row of allergen chips (icon when available, else 2-letter code) */
function AllergenChips({ keys, size = 'sm', max }) {
  if (!keys || !keys.length) return null;
  const list = max ? keys.slice(0, max) : keys;
  const extra = max ? keys.length - list.length : 0;
  const d = size === 'xs' ? 18 : size === 'md' ? 26 : 22;
  const fs = size === 'xs' ? 'text-[11px]' : size === 'md' ? 'text-base' : 'text-[13px]';
  const cs = size === 'xs' ? 'text-[8px]' : size === 'md' ? 'text-[10px]' : 'text-[9px]';
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {list.map(k => {
        const a = ALLERGEN_MAP[k]; if (!a) return null;
        return (
          <span key={k} title={a.label}
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{ width: d, height: d, background: a.color + '26', color: a.color, border: '1.5px solid ' + a.color + '66' }}>
            {a.icon ? <i className={`ti ${a.icon} ${fs}`} /> : <span className={`${cs} font-extrabold tracking-tight leading-none`}>{a.code}</span>}
          </span>
        );
      })}
      {extra > 0 && <span className="text-gray-400 font-bold text-[11px]">+{extra}</span>}
    </div>
  );
}

/* Selectable allergen grid for the dish editor */
function AllergenPicker({ value = [], onChange }) {
  const sel = new Set(value);
  const toggle = (k) => { const n = new Set(sel); n.has(k) ? n.delete(k) : n.add(k); onChange([...n]); };
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {(window.DATA.ALLERGENS || []).map(a => {
        const on = sel.has(a.key);
        return (
          <button key={a.key} type="button" onClick={() => toggle(a.key)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition text-left"
            style={on
              ? { background: a.color + '1A', borderColor: a.color, color: a.color }
              : { borderColor: 'rgba(0,0,0,0.1)', color: '#6b7280' }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={on ? { background: a.color, color: '#fff' } : { background: a.color + '24', color: a.color }}>
              {a.icon ? <i className={`ti ${a.icon} text-[11px]`} /> : <span className="text-[8px] font-bold">{a.code}</span>}
            </span>
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

/* Brand mark — plate + fork & knife. Inherits currentColor. */
function LogoMark({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} role="img" aria-label="Una Mesa">
      <circle cx="24" cy="25" r="10.5" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="24" cy="25" r="4.4" fill="currentColor" fillOpacity="0.22" />
      {/* fork */}
      <path d="M10 6v7.5a3 3 0 0 0 6 0V6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 16.5V42" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* knife */}
      <path d="M37 6c2.6 1.4 3.4 6.2 3.4 10.6 0 3.2-1.4 4.6-3.4 4.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36.8 21.4V42" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* Logo badge — the Una Mesa app icon (rounded orange tile) */
function LogoBadge({ size = 36, rounded = 'rounded-xl' }) {
  return (
    <img src="app/una-mesa-logo.png" alt="Una Mesa" className={`${rounded} flex-shrink-0 block object-contain`} style={{ width: size, height: size }} />
  );
}

/* Word + mark lockup */
function Logo({ light = false, badge = true, size = 36 }) {
  return (
    <div className="flex items-center gap-2.5">
      {badge && (light
        ? <div className="rounded-xl bg-white flex items-center justify-center flex-shrink-0 p-1" style={{ width: size, height: size }}><img src="app/una-mesa-logo.png" alt="Una Mesa" className="w-full h-full object-contain rounded-lg" /></div>
        : <LogoBadge size={size} />)}
      <div className={`font-['Syne'] font-black tracking-tight leading-none ${light ? 'text-white' : 'text-brand'}`} style={{ fontSize: size * 0.6 }}>
        una<span className={light ? 'text-white/55 font-bold' : 'text-gray-400 font-bold'}>mesa</span>
      </div>
    </div>
  );
}

/* Clean toggle — left-positioned knob (no transform conflicts), brand accent */
function Toggle({ on, onChange, size = 'md', disabled = false }) {
  const d = size === 'sm' ? { w: 34, h: 20, k: 14, p: 3 } : { w: 44, h: 26, k: 20, p: 3 };
  const x = on ? d.w - d.k - d.p : d.p;
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      className={`relative rounded-full transition-colors duration-200 flex-shrink-0 outline-none ${on ? 'bg-brand' : 'bg-gray-300'} ${disabled ? 'opacity-50' : ''}`}
      style={{ width: d.w, height: d.h }}>
      <span className="absolute rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-all duration-200"
        style={{ width: d.k, height: d.k, left: x, top: '50%', transform: 'translateY(-50%)' }} />
    </button>
  );
}

/* Toast — global event based */
function ToastHost() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    let t;
    const handler = (e) => { setMsg(e.detail); clearTimeout(t); t = setTimeout(() => setMsg(''), 2200); };
    window.addEventListener('um-toast', handler);
    return () => { window.removeEventListener('um-toast', handler); clearTimeout(t); };
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-toast">
      <i className="ti ti-circle-check text-brand text-sm" />{msg}
    </div>
  );
}
const toast = (m) => window.dispatchEvent(new CustomEvent('um-toast', { detail: m }));

/* Count-up number — animates from 0 → value on mount / when value changes */
function useCountUp(target, dur = 750) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf, start, done = false;
    const from = 0, to = Number(target) || 0;
    const tick = (ts) => {
      if (start == null) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick); else done = true;
    };
    raf = requestAnimationFrame(tick);
    // safety: guarantee final value lands even if rAF is throttled (background tab)
    const safety = setTimeout(() => { if (!done) setVal(to); }, dur + 450);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [target, dur]);
  return val;
}
function CountUp({ value, fmt = (n) => Math.round(n).toLocaleString('es-ES'), dur = 750, className }) {
  const v = useCountUp(value, dur);
  return <span className={className}>{fmt(v)}</span>;
}

/* mount flag for grow-in animations */
function useMounted(delay = 40) {
  const [m, setM] = useState(false);
  useEffect(() => { const t = setTimeout(() => setM(true), delay); return () => clearTimeout(t); }, []);
  return m;
}

/* Vertical bar chart — bars grow from 0 on mount */
function BarChart({ data, height = 120, accent = '#D8552E', soft = '#F6E3DB', valueFmt = eur0, highlightLast = true, animate = true }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const [hover, setHover] = useState(-1);
  const grown = useMounted(60);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const full = Math.max(4, Math.round((d.value / max) * (height - 22)));
        const h = animate && !grown ? 0 : full;
        const isHi = highlightLast && i === data.length - 1;
        const active = hover === i;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 relative"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}>
            {active && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full bg-gray-900 text-white text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap z-10">
                {valueFmt(d.value)}
              </div>
            )}
            <div className="w-full rounded-t-md" style={{
              height: h,
              background: active ? accent : (isHi ? accent : soft),
              transition: 'height .6s cubic-bezier(.22,1,.36,1), background .2s',
              transitionDelay: `${i * 45}ms`,
            }} />
            <span className={`text-[10px] ${isHi ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Horizontal labelled progress bars — widths grow from 0 on mount */
function HBars({ rows, accent = '#D8552E', animate = true }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  const grown = useMounted(60);
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-700">{r.label}</span>
            <span className="text-xs font-bold text-gray-900 font-['Syne']">{r.display ?? eur0(r.value)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: `${animate && !grown ? 0 : (r.value / max) * 100}%`,
              background: r.color || accent,
              transition: 'width .7s cubic-bezier(.22,1,.36,1)',
              transitionDelay: `${i * 60}ms`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Donut ring — sweeps in on mount */
function Donut({ segments, size = 130, stroke = 16, centerLabel, centerSub, animate = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const grown = useMounted(80);
  let offset = 0;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECE4D6" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const shown = animate && !grown ? 0 : len;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color}
            strokeWidth={stroke} strokeDasharray={`${shown} ${c - shown}`} strokeDashoffset={-offset} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray .8s cubic-bezier(.22,1,.36,1)', transitionDelay: `${i * 120}ms` }} />;
          offset += len;
          return el;
        })}
      </svg>
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-['Syne'] text-xl font-black text-gray-900 leading-none">{centerLabel}</div>
          {centerSub && <div className="text-[10px] text-gray-400 mt-0.5">{centerSub}</div>}
        </div>
      )}
    </div>
  );
}

/* Delta chip for KPIs */
function Delta({ value }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${up ? 'text-brand' : 'text-[#E85D3A]'}`}>
      <i className={`ti ${up ? 'ti-trending-up' : 'ti-trending-down'} text-xs`} />{up ? '+' : ''}{value}%
    </span>
  );
}

Object.assign(window, { eur, eur0, Tag, AllergenChips, AllergenPicker, ALLERGEN_MAP, TAG_CLASS, TAG_LABEL, Toggle, ToastHost, toast, BarChart, HBars, Donut, Delta, LogoMark, LogoBadge, Logo, CountUp, useCountUp, useMounted });
