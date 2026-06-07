/* ─────────────────────────────────────────────────────────────
   Una Mesa — Ajustes (configuración del local)
   ───────────────────────────────────────────────────────────── */
const fieldCls = "w-full px-3 py-2.5 text-sm border border-black/10 rounded-xl bg-gray-50 outline-none focus:border-brand focus:bg-white transition";
const lblCls = "text-[11px] font-semibold text-gray-600 mb-1.5 block";

function Field({ label, children }) {
  return <label className="flex flex-col"><span className={lblCls}>{label}</span>{children}</label>;
}
function Row({ title, sub, children, last }) {
  return (
    <div className={`flex items-center justify-between py-4 ${last ? '' : 'border-b border-black/5'}`}>
      <div className="pr-6">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
      </div>
      {children}
    </div>
  );
}
function Card({ title, sub, children }) {
  return (
    <div className="bg-white border border-black/7 rounded-2xl overflow-hidden">
      {title && (
        <div className="px-5 py-3.5 border-b border-black/7">
          <div className="font-['Syne'] text-sm font-black text-gray-900">{title}</div>
          {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function GeneralTab({ v, set }) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Card title="Datos del local" sub="Aparecen en tickets, facturas y reservas">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-white font-['Syne'] font-black text-xl flex-shrink-0">EB</div>
          <div>
            <button className="text-xs font-semibold text-brand border border-brand/30 rounded-lg px-3 py-1.5 whitespace-nowrap hover:bg-brand/5 transition">Cambiar logo</button>
            <div className="text-[11px] text-gray-400 mt-1.5">PNG o SVG, máx. 1MB</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="Nombre del local"><input className={fieldCls} value={v.name} onChange={e => set('name', e.target.value)} /></Field></div>
          <div className="col-span-2"><Field label="Dirección"><input className={fieldCls} value={v.address} onChange={e => set('address', e.target.value)} /></Field></div>
          <Field label="Ciudad"><input className={fieldCls} value={v.city} onChange={e => set('city', e.target.value)} /></Field>
          <Field label="Código postal"><input className={fieldCls} value={v.cp} onChange={e => set('cp', e.target.value)} /></Field>
          <Field label="Teléfono"><input className={fieldCls} value={v.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Email"><input className={fieldCls} value={v.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="NIF / CIF"><input className={fieldCls} value={v.vat_number} onChange={e => set('vat_number', e.target.value)} /></Field>
        </div>
      </Card>

      <Card title="Regional">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Idioma"><select className={fieldCls} value={v.locale} onChange={e => set('locale', e.target.value)}><option value="es-ES">Español</option><option value="ca-ES">Català</option><option value="en-GB">English</option></select></Field>
          <Field label="Moneda"><select className={fieldCls} value={v.currency} onChange={e => set('currency', e.target.value)}><option value="EUR">Euro (€)</option><option value="GBP">Libra (£)</option></select></Field>
          <Field label="Zona horaria"><select className={fieldCls} value={v.timezone} onChange={e => set('timezone', e.target.value)}><option value="Europe/Madrid">Europe/Madrid</option><option value="Atlantic/Canary">Atlantic/Canary</option></select></Field>
        </div>
      </Card>
    </div>
  );
}

function ImpuestosTab() {
  const [rates, setRates] = useState([
    { id: 1, name: 'General', pct: 10, note: 'Comida y refrescos', def: true },
    { id: 2, name: 'Bebidas alcohólicas', pct: 21, note: 'Vino, cerveza, licores', def: false },
    { id: 3, name: 'Superreducido', pct: 4, note: 'Pan, leche, productos básicos', def: false },
  ]);
  const [incl, setIncl] = useState(true);
  const [service, setService] = useState(false);
  const [servicePct, setServicePct] = useState(5);
  const [tips, setTips] = useState(true);

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Card title="Tipos de IVA" sub="Se aplican a los platos según su categoría">
        <div className="flex flex-col">
          {rates.map((r, i) => (
            <div key={r.id} className={`flex items-center gap-3 py-3.5 ${i < rates.length - 1 ? 'border-b border-black/5' : ''}`}>
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center font-['Syne'] text-base font-black text-brand flex-shrink-0">{r.pct}%</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">{r.name}{r.def && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">Por defecto</span>}</div>
                <div className="text-[11px] text-gray-400">{r.note}</div>
              </div>
              <button className="text-gray-300 hover:text-gray-600 px-2"><i className="ti ti-dots-vertical" /></button>
            </div>
          ))}
          <button onClick={() => toast('Añadir tipo de IVA')} className="flex items-center gap-1.5 text-xs text-brand font-semibold mt-3 hover:underline w-fit"><i className="ti ti-plus" /> Añadir tipo</button>
        </div>
      </Card>

      <Card title="Precios y cargos">
        <Row title="Precios con IVA incluido" sub="Mostrar precios finales en carta y TPV"><Toggle on={incl} onChange={setIncl} /></Row>
        <Row title="Cargo por servicio" sub="Recargo automático en mesas">
          <div className="flex items-center gap-3">
            {service && <input className="w-16 px-2 py-1.5 text-sm border border-black/10 rounded-lg bg-gray-50 text-right outline-none focus:border-brand" value={servicePct} onChange={e => setServicePct(e.target.value)} />}
            {service && <span className="text-xs text-gray-400">%</span>}
            <Toggle on={service} onChange={setService} />
          </div>
        </Row>
        <Row title="Permitir propinas" sub="Opción de propina al cobrar" last><Toggle on={tips} onChange={setTips} /></Row>
      </Card>
    </div>
  );
}

const ACCESS = {
  Administrador: 'bg-brand/10 text-brand',
  Encargado: 'bg-purple-100 text-purple-700',
  Camarero: 'bg-blue-100 text-blue-700',
  Cocina: 'bg-amber-100 text-amber-700',
};
function UsuariosTab() {
  const D = window.DATA;
  const people = [{ id: 'admin', name: D.admin.name, email: D.admin.email, initials: D.admin.initials, color: '#D8552E', color_bg: '#F6E3DB', access: 'Administrador', role: 'Propietario' }, ...D.staff];
  const [roles, setRoles] = useState(Object.fromEntries(people.map(p => [p.id, p.access])));
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="font-['Syne'] text-sm font-black text-gray-900">Equipo</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{people.length} personas con acceso</div>
          </div>
          <button onClick={() => toast('Invitación enviada')} className="flex items-center gap-2 bg-brand text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-brand/90 transition"><i className="ti ti-user-plus" /> Invitar</button>
        </div>
        <div className="divide-y divide-black/5 -mx-1 mt-2">
          {people.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-3 px-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: p.color_bg, color: p.color }}>{p.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{p.name}</div>
                <div className="text-[11px] text-gray-400 truncate">{p.email} · {p.role}</div>
              </div>
              <select value={roles[p.id]} onChange={e => { setRoles(r => ({ ...r, [p.id]: e.target.value })); toast('Permiso actualizado'); }}
                disabled={p.id === 'admin'}
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border-0 outline-none cursor-pointer disabled:opacity-100 ${ACCESS[roles[p.id]]}`}>
                {['Administrador', 'Encargado', 'Camarero', 'Cocina'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <button className="text-gray-300 hover:text-gray-600 px-1 disabled:opacity-30" disabled={p.id === 'admin'}><i className="ti ti-dots-vertical" /></button>
            </div>
          ))}
        </div>
      </Card>
      <div className="bg-white border border-black/7 rounded-2xl p-5 max-w-3xl">
        <div className="font-['Syne'] text-sm font-black text-gray-900 mb-3">Permisos por rol</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { r: 'Administrador', d: 'Acceso total, ajustes y facturación' },
            { r: 'Encargado', d: 'Todo salvo facturación y usuarios' },
            { r: 'Camarero', d: 'Reservas, TPV y mesas' },
            { r: 'Cocina', d: 'Solo pantalla de cocina' },
          ].map(x => (
            <div key={x.r} className="bg-gray-50 rounded-xl p-3.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACCESS[x.r]}`}>{x.r}</span>
              <div className="text-[11px] text-gray-500 mt-2 leading-relaxed">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FacturacionTab() {
  const plans = [
    { k: 'esencial', name: 'Esencial', price: 29, feat: ['Reservas y TPV', '1 punto de venta', 'Soporte por email'] },
    { k: 'profesional', name: 'Profesional', price: 59, feat: ['Todo en Esencial', 'Cocina + Personal', 'Informes avanzados', 'Soporte prioritario'] },
    { k: 'grupo', name: 'Grupo', price: 99, feat: ['Todo en Profesional', 'Multi-local', 'API y exportación', 'Gestor de cuenta'] },
  ];
  const [current, setCurrent] = useState('profesional');
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="bg-brand rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <div className="text-white/65 text-xs font-medium">Plan actual</div>
          <div className="font-['Syne'] text-2xl font-black mt-0.5">Profesional</div>
          <div className="text-white/70 text-xs mt-1">Próxima factura: 1 jul 2026 · €59,00/mes</div>
        </div>
        <i className="ti ti-rosette-discount-check text-4xl text-white/30" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {plans.map(pl => {
          const on = current === pl.k;
          return (
            <div key={pl.k} className={`rounded-2xl border p-5 flex flex-col ${on ? 'border-brand ring-1 ring-brand/30 bg-white' : 'border-black/7 bg-white'}`}>
              <div className="font-['Syne'] text-base font-black text-gray-900">{pl.name}</div>
              <div className="mt-1 mb-3"><span className="font-['Syne'] text-2xl font-black text-gray-900">€{pl.price}</span><span className="text-xs text-gray-400">/mes</span></div>
              <div className="flex flex-col gap-1.5 flex-1">
                {pl.feat.map(f => <div key={f} className="flex items-start gap-1.5 text-[11px] text-gray-600"><i className="ti ti-check text-brand text-sm mt-px" />{f}</div>)}
              </div>
              <button onClick={() => { setCurrent(pl.k); toast(on ? 'Es tu plan actual' : `Cambiado a ${pl.name}`); }}
                className={`mt-4 py-2 rounded-lg text-xs font-bold transition ${on ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-brand text-white hover:bg-brand/90'}`}>
                {on ? 'Plan actual' : 'Cambiar'}
              </button>
            </div>
          );
        })}
      </div>

      <Card title="Método de pago">
        <Row title="Visa terminada en 4242" sub="Caduca 09/27" last>
          <button className="text-xs font-semibold text-brand hover:underline">Actualizar</button>
        </Row>
      </Card>

      <Card title="Facturas">
        <div className="divide-y divide-black/5 -my-1">
          {[['Jun 2026', '€59,00'], ['May 2026', '€59,00'], ['Abr 2026', '€59,00'], ['Mar 2026', '€29,00']].map(([m, a]) => (
            <div key={m} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2.5"><i className="ti ti-file-invoice text-gray-400" /><span className="text-sm text-gray-700">{m}</span></div>
              <div className="flex items-center gap-4"><span className="text-sm font-semibold text-gray-900">{a}</span><button className="text-brand hover:text-brand/70"><i className="ti ti-download text-base" /></button></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NotificacionesTab() {
  const [n, setN] = useState({ res: true, cancel: true, kitchen: false, daily: true, stock: true, staff: false });
  const set = (k) => (v) => setN(p => ({ ...p, [k]: v }));
  return (
    <div className="max-w-2xl">
      <Card title="Notificaciones" sub="Elige qué avisos quieres recibir">
        <Row title="Nueva reserva" sub="Cuando un cliente reserva online"><Toggle on={n.res} onChange={set('res')} /></Row>
        <Row title="Cancelaciones" sub="Reservas canceladas o no-show"><Toggle on={n.cancel} onChange={set('cancel')} /></Row>
        <Row title="Comandas en cocina" sub="Aviso por cada comanda enviada"><Toggle on={n.kitchen} onChange={set('kitchen')} /></Row>
        <Row title="Resumen diario" sub="Cierre de caja cada noche por email"><Toggle on={n.daily} onChange={set('daily')} /></Row>
        <Row title="Stock bajo" sub="Cuando un producto se agota"><Toggle on={n.stock} onChange={set('stock')} /></Row>
        <Row title="Fichajes del personal" sub="Entradas y salidas del equipo" last><Toggle on={n.staff} onChange={set('staff')} /></Row>
      </Card>
    </div>
  );
}

function Ajustes() {
  const D = window.DATA;
  const [tab, setTab] = useState('general');
  const [v, setV] = useState({ ...D.venue });
  const set = (k, val) => setV(p => ({ ...p, [k]: val }));

  const tabs = [
    { k: 'general', l: 'General', i: 'ti-building-store' },
    { k: 'impuestos', l: 'Impuestos', i: 'ti-receipt-tax' },
    { k: 'usuarios', l: 'Usuarios y permisos', i: 'ti-users' },
    { k: 'facturacion', l: 'Facturación', i: 'ti-credit-card' },
    { k: 'notificaciones', l: 'Notificaciones', i: 'ti-bell' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="bg-white border-b border-black/7 px-6 py-4 flex-shrink-0">
        <h1 className="font-['Syne'] text-xl font-black text-gray-900">Ajustes</h1>
        <p className="text-xs text-gray-500 mt-0.5">Configuración de {v.name}</p>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-[210px_1fr]">
        <div className="border-r border-black/7 bg-white p-3 flex flex-col gap-1">
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${tab === t.k ? 'bg-brand/10 text-brand font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <i className={`ti ${t.i} text-base opacity-80`} />{t.l}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto bg-gray-50 relative">
          <div className="p-6 pb-24">
            {tab === 'general' && <GeneralTab v={v} set={set} />}
            {tab === 'impuestos' && <ImpuestosTab />}
            {tab === 'usuarios' && <UsuariosTab />}
            {tab === 'facturacion' && <FacturacionTab />}
            {tab === 'notificaciones' && <NotificacionesTab />}
          </div>
          {(tab === 'general' || tab === 'impuestos' || tab === 'notificaciones') && (
            <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-black/7 px-6 py-3 flex items-center justify-end gap-2">
              <button className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition">Descartar</button>
              <button onClick={() => toast('Cambios guardados')} className="px-4 py-2 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition">Guardar cambios</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Ajustes });
