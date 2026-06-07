/* ─────────────────────────────────────────────────────────────
   Una Mesa — Stocktake (inventario / control de existencias)
   ───────────────────────────────────────────────────────────── */
const STOCK_CATS = ['Carne', 'Pescado', 'Verdura', 'Despensa', 'Lácteos', 'Bodega'];
const CAT_ICON = {
  Carne: 'ti-meat', Pescado: 'ti-fish', Verdura: 'ti-leaf',
  Despensa: 'ti-basket', 'Lácteos': 'ti-milk', Bodega: 'ti-bottle',
};

/* status from qty vs par level */
function stockState(it) {
  if (it.qty <= 0) return { key: 'out', label: 'Agotado', text: 'text-red-600', bg: 'bg-red-100 text-red-700', bar: '#DC2626', row: 'bg-red-50/40' };
  if (it.qty < it.par * 0.5) return { key: 'crit', label: 'Crítico', text: 'text-red-500', bg: 'bg-red-100 text-red-600', bar: '#E0613B', row: 'bg-red-50/30' };
  if (it.qty < it.par) return { key: 'low', label: 'Bajo', text: 'text-amber-600', bg: 'bg-amber-100 text-amber-700', bar: '#F4A72E', row: '' };
  return { key: 'ok', label: 'OK', text: 'text-green-600', bg: 'bg-green-100 text-green-700', bar: '#15803D', row: '' };
}
const stepFor = (unit) => (unit === 'kg' || unit === 'L') ? 0.5 : 1;
const fmtQty = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1);

function StockItemModal({ onSave, onClose }) {
  const [f, setF] = useState({ name: '', category: 'Carne', unit: 'kg', qty: '', par: '', cost: '' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const input = "w-full px-3 py-2.5 text-sm border border-black/10 rounded-xl bg-gray-50 outline-none focus:border-brand focus:bg-white transition";
  const lbl = "text-[11px] font-semibold text-gray-600 mb-1.5 block";
  const submit = () => {
    if (!f.name.trim()) { toast('Indica el nombre'); return; }
    onSave({ id: 'sk' + Date.now(), name: f.name.trim(), category: f.category, unit: f.unit, qty: Number(f.qty) || 0, par: Number(f.par) || 0, cost: Number(f.cost) || 0 });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-black/7 flex items-center justify-between">
          <div className="font-['Syne'] text-base font-black text-gray-900">Nuevo artículo</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><i className="ti ti-x" /></button>
        </div>
        <div className="p-5 flex flex-col gap-3.5">
          <div><label className={lbl}>Nombre</label><input className={input} value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Solomillo de buey" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Categoría</label><select className={input} value={f.category} onChange={e => set('category', e.target.value)}>{STOCK_CATS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className={lbl}>Unidad</label><select className={input} value={f.unit} onChange={e => set('unit', e.target.value)}>{['kg', 'L', 'ud', 'bot'].map(u => <option key={u}>{u}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Existencias</label><input className={input} inputMode="decimal" value={f.qty} onChange={e => set('qty', e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" /></div>
            <div><label className={lbl}>Stock mín.</label><input className={input} inputMode="decimal" value={f.par} onChange={e => set('par', e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" /></div>
            <div><label className={lbl}>Coste/ud €</label><input className={input} inputMode="decimal" value={f.cost} onChange={e => set('cost', e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" /></div>
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-black/10 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition">Añadir artículo</button>
        </div>
      </div>
    </div>
  );
}

function Stocktake() {
  const [stock, setStock] = useStore('stock');
  const [cat, setCat] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState('');

  const adjust = (id, delta) => setStock(arr => arr.map(s => s.id === id ? { ...s, qty: Math.max(0, Math.round((s.qty + delta) * 10) / 10) } : s));
  const setQty = (id, v) => setStock(arr => arr.map(s => s.id === id ? { ...s, qty: Math.max(0, Number(v) || 0) } : s));
  const remove = (id) => { setStock(arr => arr.filter(s => s.id !== id)); toast('Artículo eliminado'); };
  const addItem = (it) => { setStock(arr => [...arr, it]); setShowAdd(false); toast(it.name + ' añadido'); };
  const restock = (id) => setStock(arr => arr.map(s => s.id === id ? { ...s, qty: s.par } : s));

  const visible = stock.filter(s => (cat === 'all' || s.category === cat) && (!query || s.name.toLowerCase().includes(query.toLowerCase())));
  const lowItems = stock.filter(s => s.qty < s.par);
  const totalValue = stock.reduce((t, s) => t + s.qty * s.cost, 0);
  const cats = STOCK_CATS.filter(c => stock.some(s => s.category === c));

  // group visible by category for the table
  const grouped = {};
  visible.forEach(s => { (grouped[s.category] = grouped[s.category] || []).push(s); });
  const groupKeys = STOCK_CATS.filter(c => grouped[c]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {showAdd && <StockItemModal onSave={addItem} onClose={() => setShowAdd(false)} />}
      <div className="bg-white border-b border-black/7 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-black text-gray-900">Inventario</h1>
          <p className="text-xs text-gray-500 mt-0.5">{stock.length} artículos · {lowItems.length} por reponer</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap hover:bg-brand/90 transition"><i className="ti ti-plus" /> Nuevo artículo</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Artículos', val: stock.length, sub: 'en inventario', color: 'text-gray-900' },
            { label: 'Stock bajo', val: lowItems.length, sub: 'bajo mínimo', color: lowItems.length ? 'text-amber-600' : 'text-green-600' },
            { label: 'Agotados', val: stock.filter(s => s.qty <= 0).length, sub: 'sin existencias', color: 'text-red-500' },
            { label: 'Valor de stock', val: eur0(totalValue), sub: 'a precio de coste', color: 'text-gray-900' },
          ].map(k => (
            <div key={k.label} className="bg-white border border-black/7 rounded-xl p-4"><div className="text-[10px] text-gray-400 font-medium">{k.label}</div><div className={`font-['Syne'] text-2xl font-black mt-1 ${k.color}`}>{k.val}</div><div className="text-[10px] text-gray-400 mt-0.5">{k.sub}</div></div>
          ))}
        </div>

        {/* Low stock banner */}
        {lowItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0"><i className="ti ti-alert-triangle text-lg" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-amber-800">Reposición recomendada</div>
              <div className="text-[11px] text-amber-700 truncate">{lowItems.slice(0, 5).map(s => s.name).join(' · ')}{lowItems.length > 5 ? ` +${lowItems.length - 5} más` : ''}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setCat('all')} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${cat === 'all' ? 'bg-brand text-white border-brand' : 'text-gray-500 border-black/10 hover:border-brand hover:text-brand'}`}>Todo</button>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${cat === c ? 'bg-brand text-white border-brand' : 'text-gray-500 border-black/10 hover:border-brand hover:text-brand'}`}>
              <i className={`ti ${CAT_ICON[c] || 'ti-box'}`} />{c}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar artículo…" className="pl-9 pr-3 py-1.5 text-xs border border-black/10 rounded-lg bg-white outline-none focus:border-brand w-52" />
          </div>
        </div>

        {/* Inventory table */}
        <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50">
              <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-left">Artículo</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-2.5 text-left w-44">Nivel</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-2.5 text-center w-44">Existencias</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-2.5 text-center w-20">Estado</th>
              <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-2.5 text-right w-24">Valor</th>
              <th className="w-16"></th>
            </tr></thead>
            <tbody>
              {groupKeys.map(gk => (
                <React.Fragment key={gk}>
                  <tr className="bg-gray-50/60"><td colSpan={6} className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><i className={`ti ${CAT_ICON[gk] || 'ti-box'}`} /> {gk}</td></tr>
                  {grouped[gk].map(s => {
                    const st = stockState(s);
                    const pct = Math.min(100, Math.round((s.qty / (s.par || 1)) * 100));
                    return (
                      <tr key={s.id} className={`border-t border-black/5 hover:bg-gray-50 transition group ${st.row}`}>
                        <td className="px-5 py-3"><div className="text-xs font-semibold text-gray-900">{s.name}</div><div className="text-[10px] text-gray-400">mín. {fmtQty(s.par)} {s.unit} · {eur(s.cost)}/{s.unit}</div></td>
                        <td className="py-3 pr-4">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: st.bar }} /></div>
                          <div className="text-[9px] text-gray-400 mt-1">{pct}% del mínimo</div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => adjust(s.id, -stepFor(s.unit))} className="w-6 h-6 rounded-lg border border-black/10 bg-white text-gray-500 hover:bg-brand hover:text-white hover:border-brand transition text-sm leading-none flex items-center justify-center">−</button>
                            <div className="flex items-baseline gap-1 w-16 justify-center">
                              <input value={fmtQty(s.qty)} onChange={e => setQty(s.id, e.target.value.replace(/[^\d.]/g, ''))} className="w-9 text-center text-xs font-bold text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-brand" />
                              <span className="text-[10px] text-gray-400">{s.unit}</span>
                            </div>
                            <button onClick={() => adjust(s.id, stepFor(s.unit))} className="w-6 h-6 rounded-lg border border-black/10 bg-white text-gray-500 hover:bg-brand hover:text-white hover:border-brand transition text-sm leading-none flex items-center justify-center">+</button>
                          </div>
                        </td>
                        <td className="py-3 text-center"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${st.bg}`}>{st.label}</span></td>
                        <td className="py-3 pr-5 text-right text-xs font-semibold text-gray-700">{eur(s.qty * s.cost)}</td>
                        <td className="pr-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            {s.qty < s.par && <button onClick={() => restock(s.id)} title="Reponer al mínimo" className="w-7 h-7 rounded-lg text-brand hover:bg-brand/10 flex items-center justify-center"><i className="ti ti-refresh text-sm" /></button>}
                            <button onClick={() => remove(s.id)} title="Eliminar" className="w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"><i className="ti ti-trash text-sm" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {visible.length === 0 && <tr><td colSpan={6} className="text-center text-gray-300 text-sm py-12">Sin artículos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Stocktake });
