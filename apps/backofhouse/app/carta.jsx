/* ─────────────────────────────────────────────────────────────
   Una Mesa — Carta (gestión de menú / platos)
   ───────────────────────────────────────────────────────────── */
function Carta() {
  const [cats, setCats] = useStore('categories');
  const [items, setItems] = useStore('menu');
  const [activeCat, setActiveCat] = useState('c1');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // item object being edited, or 'new', or null

  useEffect(() => { window.MenuStockSync?.loadMenuStock(); }, []);
  useEffect(() => {
    if (cats.length && !cats.some(c => c.id === activeCat)) setActiveCat(cats[0].id);
  }, [cats]);

  const blank = { id: null, category_id: activeCat, name: '', description: '', price: '', vat_rate: 10, tag: null, available: true, sold: 0, allergens: [], subcategory: '' };

  const countFor = (cid) => items.filter(i => i.category_id === cid).length;
  const BSUBS = [
    { key: 'agua',      label: 'Agua y Zumos',  icon: 'ti-droplet' },
    { key: 'refrescos', label: 'Refrescos',      icon: 'ti-cup' },
    { key: 'cervezas',  label: 'Cervezas',       icon: 'ti-beer' },
    { key: 'vinos',     label: 'Vinos y Cavas',  icon: 'ti-bottle' },
    { key: 'cocteleria',label: 'Coctelería',     icon: 'ti-glass-full' },
    { key: 'calientes', label: 'Calientes',      icon: 'ti-coffee' },
  ];
  const isBebidas = (cats.find(c => c.id === activeCat)?.name || '').toLowerCase() === 'bebidas';
  const filtered = items.filter(i => i.category_id === activeCat && (!search || i.name.toLowerCase().includes(search.toLowerCase())));

  // group bebidas by subcategory
  const bebidasGroups = BSUBS.map(s => ({
    ...s,
    items: filtered.filter(i => (i.subcategory || 'otros') === s.key),
  })).filter(g => g.items.length > 0);
  const otrosItems = filtered.filter(i => !i.subcategory && isBebidas);
  if (otrosItems.length) bebidasGroups.push({ key: 'otros', label: 'Otros', icon: 'ti-dots', items: otrosItems });

  const toggleAvail = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const updated = { ...item, available: !item.available };
    const res = await window.MenuStockSync?.saveMenuItem(updated);
    if (!res || !res.ok) { toast('No se pudo guardar: ' + (res?.error || 'error desconocido')); return; }
    setItems(arr => arr.map(i => i.id === id ? updated : i));
  };

  const addCategory = async () => {
    const cat = { id: crypto.randomUUID(), name: 'Categoría ' + (cats.length + 1), sort_order: cats.length + 1 };
    const res = await window.MenuStockSync?.saveMenuCategory(cat);
    if (!res || !res.ok) { toast('No se pudo crear la categoría: ' + (res?.error || 'error desconocido')); return; }
    setCats(arr => [...arr, cat]);
    setActiveCat(cat.id);
    toast('Categoría añadida');
  };

  const save = async (form) => {
    if (!form.name.trim() || !form.price) { toast('Completa nombre y precio'); return; }
    const clean = { ...form, price: Number(form.price) };
    const isNew = !form.id;
    const withId = isNew ? { ...clean, id: crypto.randomUUID() } : clean;
    const res = await window.MenuStockSync?.saveMenuItem(withId);
    if (!res || !res.ok) { toast('No se pudo guardar el plato: ' + (res?.error || 'error desconocido')); return; }
    if (isNew) {
      setItems(arr => [...arr, withId]);
      toast('Plato añadido a la carta');
    } else {
      setItems(arr => arr.map(i => i.id === form.id ? withId : i));
      toast('Plato actualizado');
    }
    setEditing(null);
  };

  const remove = async (id) => {
    const res = await window.MenuStockSync?.deleteMenuItem(id);
    if (!res || !res.ok) { toast('No se pudo eliminar: ' + (res?.error || 'error desconocido')); return; }
    setItems(arr => arr.filter(i => i.id !== id));
    setEditing(null);
    toast('Plato eliminado');
  };

  const totalAvail = items.filter(i => i.available).length;
  const avgPrice = items.reduce((s, i) => s + i.price, 0) / items.length;
  const topSeller = [...items].sort((a, b) => b.sold - a.sold)[0];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-black/7 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-['Syne'] text-xl font-black text-gray-900">Carta</h1>
          <p className="text-xs text-gray-500 mt-0.5">{items.length} platos · {totalAvail} disponibles · {cats.length} categorías</p>
        </div>
        <button onClick={() => setEditing({ ...blank })}
          className="flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap hover:bg-brand/90 transition">
          <i className="ti ti-plus" /> Nuevo plato
        </button>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-[180px_1fr_300px]">
        {/* Category rail */}
        <div className="border-r border-black/7 bg-white overflow-y-auto p-3 flex flex-col gap-1">
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-2 pt-1 pb-1.5">Categorías</div>
          {cats.map(c => {
            const on = activeCat === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCat(c.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${on ? 'bg-brand/10 text-brand font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>{c.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${on ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>{countFor(c.id)}</span>
              </button>
            );
          })}
          <button onClick={addCategory} className="flex items-center gap-1.5 px-3 py-2 mt-1 rounded-lg text-xs text-gray-400 hover:text-brand hover:bg-gray-50 transition">
            <i className="ti ti-plus" /> Nueva categoría
          </button>
        </div>

        {/* Dish list */}
        <div className="overflow-y-auto bg-gray-50">
          <div className="sticky top-0 bg-gray-50 px-4 py-3 border-b border-black/5 z-10">
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-black/10 rounded-lg bg-white outline-none focus:border-brand"
                placeholder={`Buscar en ${cats.find(c => c.id === activeCat)?.name}…`} />
            </div>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {isBebidas ? (
              bebidasGroups.map(group => (
                <div key={group.key}>
                  <div className="flex items-center gap-2 px-1 pt-2 pb-1.5">
                    <i className={`ti ${group.icon} text-brand text-sm`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{group.label}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">{group.items.length}</span>
                  </div>
                  {group.items.map(item => {
                    const isSel = editing && editing.id === item.id;
                    return (
                      <div key={item.id} onClick={() => setEditing({ ...item })}
                        className={`group bg-white rounded-xl border px-4 py-3 flex items-center gap-3 cursor-pointer transition ${isSel ? 'border-brand ring-1 ring-brand/30' : 'border-black/7 hover:border-brand/40'} ${!item.available ? 'opacity-60' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
                            <Tag tag={item.tag} />
                            {!item.available && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Agotado</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1"><span className="text-[11px] text-gray-400 truncate">{item.description}</span></div>
                          {item.allergens && item.allergens.length > 0 && <div className="mt-2"><AllergenChips keys={item.allergens} size="sm" /></div>}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0"><i className="ti ti-flame text-amber-400" /> {item.sold}</div>
                        <div className="font-['Syne'] text-base font-black text-brand w-16 text-right flex-shrink-0">{eur(item.price)}</div>
                        <div onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 flex-shrink-0"><Toggle on={item.available} onChange={() => toggleAvail(item.id)} size="sm" /></div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              filtered.map(item => {
              const isSel = editing && editing.id === item.id;
              return (
                <div key={item.id} onClick={() => setEditing({ ...item })}
                  className={`group bg-white rounded-xl border px-4 py-3 flex items-center gap-3 cursor-pointer transition ${isSel ? 'border-brand ring-1 ring-brand/30' : 'border-black/7 hover:border-brand/40'} ${!item.available ? 'opacity-60' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
                      <Tag tag={item.tag} />
                      {!item.available && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Agotado</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400 truncate">{item.description}</span>
                    </div>
                    {item.allergens && item.allergens.length > 0 && <div className="mt-2"><AllergenChips keys={item.allergens} size="sm" /></div>}
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                    <i className="ti ti-flame text-amber-400" /> {item.sold}
                  </div>
                  <div className="font-['Syne'] text-base font-black text-brand w-16 text-right flex-shrink-0">{eur(item.price)}</div>
                  <div onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 flex-shrink-0">
                    <Toggle on={item.available} onChange={() => toggleAvail(item.id)} size="sm" />
                  </div>
                </div>
              );
            })
            )}
            {filtered.length === 0 && <div className="text-center text-xs text-gray-400 py-12">Sin platos en esta categoría</div>}
          </div>
        </div>

        {/* Right: editor or summary */}
        <div className="border-l border-black/7 bg-white overflow-y-auto">
          {editing ? (
            <DishEditor key={editing.id || 'new'} form={editing} cats={cats} onSave={save} onCancel={() => setEditing(null)} onDelete={remove} />
          ) : (
            <div className="p-4 flex flex-col gap-4">
              <div className="font-['Syne'] text-sm font-black text-gray-900">Resumen de la carta</div>
              {[
                { label: 'Platos totales', val: items.length, color: 'text-gray-900' },
                { label: 'Disponibles', val: totalAvail, color: 'text-brand' },
                { label: 'Agotados', val: items.length - totalAvail, color: 'text-[#E85D3A]' },
                { label: 'Precio medio', val: eur(avgPrice), color: 'text-gray-900' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className={`font-['Syne'] text-lg font-black ${s.color}`}>{s.val}</span>
                </div>
              ))}
              <div className="bg-amber-50 rounded-xl p-3.5 mt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5 whitespace-nowrap"><i className="ti ti-flame" /> Más vendido</div>
                <div className="text-sm font-semibold text-gray-900 mt-2">{topSeller.name}</div>
                <div className="text-[11px] text-gray-500">{topSeller.sold} unidades esta semana</div>
              </div>
              <div className="text-[11px] text-gray-400 leading-relaxed flex gap-2 mt-1">
                <i className="ti ti-info-circle mt-0.5" />
                <span>Selecciona un plato para editarlo, o cambia su disponibilidad con el interruptor. Los cambios se reflejan al instante en el TPV.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DishEditor({ form, cats, onSave, onCancel, onDelete }) {
  const [f, setF] = useState(form);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isNew = !f.id;
  const tags = [{ v: null, l: 'Ninguna' }, { v: 'popular', l: 'Popular' }, { v: 'nuevo', l: 'Nuevo' }, { v: 'vegano', l: 'Vegano' }, { v: 'sin_gluten', l: 'Sin gluten' }];

  const input = "w-full px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand focus:bg-white transition";
  const lbl = "text-[11px] font-semibold text-gray-600 mb-1.5 block";

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3.5 border-b border-black/7 flex items-center justify-between">
        <div className="font-['Syne'] text-sm font-black text-gray-900">{isNew ? 'Nuevo plato' : 'Editar plato'}</div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><i className="ti ti-x" /></button>
      </div>
      <div className="p-4 flex flex-col gap-3.5 flex-1">
        <div>
          <label className={lbl}>Nombre</label>
          <input className={input} value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Croquetas caseras" />
        </div>
        <div>
          <label className={lbl}>Descripción</label>
          <textarea className={input + ' resize-none h-16'} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Ingredientes, ración…" />
        </div>
        <div>
          <label className={lbl}>Categoría</label>
          <select className={input} value={f.category_id} onChange={e => set('category_id', e.target.value)}>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {f.category_id === 'c4' && (
          <div>
            <label className={lbl}>Subcategoría de bebida</label>
            <select className={input} value={f.subcategory || ''} onChange={e => set('subcategory', e.target.value)}>
              <option value="">Sin subcategoría</option>
              <option value="agua">Agua y Zumos</option>
              <option value="refrescos">Refrescos</option>
              <option value="cervezas">Cervezas</option>
              <option value="vinos">Vinos y Cavas</option>
              <option value="cocteleria">Coctelería</option>
              <option value="calientes">Calientes</option>
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Precio (€)</label>
            <input className={input} type="number" step="0.10" value={f.price} onChange={e => set('price', e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <label className={lbl}>IVA</label>
            <select className={input} value={f.vat_rate} onChange={e => set('vat_rate', Number(e.target.value))}>
              <option value={10}>10% · General</option>
              <option value={21}>21% · Bebidas alc.</option>
              <option value={4}>4% · Superreducido</option>
            </select>
          </div>
        </div>
        <div>
          <label className={lbl}>Etiqueta</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <button key={t.l} onClick={() => set('tag', t.v)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition ${f.tag === t.v ? 'bg-brand text-white border-brand' : 'border-black/10 text-gray-500 hover:border-brand'}`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Alérgenos</label>
          <AllergenPicker value={f.allergens || []} onChange={v => set('allergens', v)} />
        </div>
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
          <div>
            <div className="text-xs font-semibold text-gray-700">Disponible</div>
            <div className="text-[10px] text-gray-400">Visible en el TPV</div>
          </div>
          <Toggle on={f.available} onChange={v => set('available', v)} />
        </div>
      </div>
      <div className="p-4 border-t border-black/7 flex flex-col gap-2">
        <button onClick={() => onSave(f)} className="w-full py-2.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition">
          {isNew ? 'Añadir a la carta' : 'Guardar cambios'}
        </button>
        {!isNew && (
          <button onClick={() => onDelete(f.id)} className="w-full py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1.5">
            <i className="ti ti-trash" /> Eliminar plato
          </button>
        )}
      </div>
    </div>
  );
}
Object.assign(window, { Carta });
