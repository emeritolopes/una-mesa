/* ─────────────────────────────────────────────────────────────
   Una Mesa — Panel (dashboard)
   ───────────────────────────────────────────────────────────── */
function Panel({ go }) {
  const D = window.DATA;
  const [supaRes, setSupaRes] = useState(null);
  const today = new Date().toLocaleDateString('en-CA');

  const loadReservations = () => {
    if (!window.sb) return;
    window.sb
      .from('reservations')
      .select('*')
      .eq('date', today)
      .neq('status', 'cancelled')
      .order('time', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.warn('[BOH] panel:', error.message); return; }
        setSupaRes(data || []);
      })
      .catch(e => console.warn('[BOH] panel:', e.message));
  };

  useEffect(() => {
    loadReservations();
    const interval = setInterval(loadReservations, 30000);
    return () => clearInterval(interval);
  }, [today]);

  /* null = not yet loaded (show mock); [] or [...] = Supabase answered (use it) */
  const liveReservations = supaRes !== null ? supaRes : D.reservations;
  const todaySales = D.dailySales[D.dailySales.length - 1];
  const occupied = D.tables.filter(t => t.status === 'occupied').length;
  const kitchenPending = D.kitchen.filter(t => t.status === 'pending' || t.status === 'cooking').length;
  const activeStaff = Object.values(D.clockState).filter(s => s === 'in').length;

  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const t = D.today;
  const todayStr = `${days[t.getDay()]} ${t.getDate()} de ${months[t.getMonth()]}`;

  const chartData = D.dailySales.map(s => {
    const d = new Date(s.date + 'T12:00:00');
    return { label: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()], value: s.total_revenue };
  });
  const weekTotal = D.dailySales.reduce((s, d) => s + d.total_revenue, 0);

  const STATUS_LABEL = { confirmed: 'Confirmada', pending: 'Pendiente', unconfirmed: 'Sin confirmar' };
  const STATUS_CLASS = { confirmed: 'bg-green-100 text-green-800', pending: 'bg-amber-100 text-amber-800', unconfirmed: 'bg-red-100 text-red-800' };

  const statusBar = [
    { dot: 'bg-green-500', label: 'Estado', value: 'Abierto' },
    { dot: 'bg-amber-400', label: 'Mesas ocupadas', value: `${occupied} / ${D.tables.length}` },
    { dot: 'bg-green-500', label: 'Reservas hoy', value: `${liveReservations.length}` },
    { dot: kitchenPending > 0 ? 'bg-red-500' : 'bg-green-500', label: 'Cocina', value: `${kitchenPending} pendientes` },
    { dot: 'bg-green-500', label: 'Personal', value: `${activeStaff} en turno` },
  ];

  const kpis = [
    { label: 'Ventas hoy', value: eur(todaySales.total_revenue), icon: 'ti-currency-euro', highlight: true },
    { label: 'Reservas hoy', value: `${liveReservations.length}`, icon: 'ti-calendar' },
    { label: 'Ticket medio', value: eur(todaySales.avg_ticket), icon: 'ti-receipt' },
    { label: 'Rotación mesas', value: `${todaySales.table_turns}×`, icon: 'ti-rotate' },
  ];

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-2xl font-black text-gray-900 tracking-tight">Panel de control</h1>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{todayStr} · Servicio activo</p>
        </div>
        <button onClick={() => go('reservas')} className="flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand/90 transition">
          <i className="ti ti-plus text-sm" /> Nueva reserva
        </button>
      </div>

      <div className="bg-white border border-black/7 rounded-2xl px-5 py-3 grid grid-cols-5 divide-x divide-black/7">
        {statusBar.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-4 first:pl-0 last:pr-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
            <div>
              <div className="text-[10px] text-gray-400">{s.label}</div>
              <div className="text-sm font-semibold text-gray-900">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className={`rounded-2xl p-5 relative overflow-hidden ${k.highlight ? 'bg-brand' : 'bg-white border border-black/7'}`}>
            <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${k.highlight ? 'bg-white/15' : 'bg-gray-50'}`}>
              <i className={`ti ${k.icon} text-base ${k.highlight ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className={`text-xs font-medium mb-1 ${k.highlight ? 'text-white/65' : 'text-gray-400'}`}>{k.label}</div>
            <div className={`font-['Syne'] text-3xl font-black tracking-tight ${k.highlight ? 'text-white' : 'text-gray-900'}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="bg-white border border-black/7 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-black/7 flex items-center justify-between">
            <div>
              <div className="font-['Syne'] text-sm font-black text-gray-900">Próximas reservas</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{liveReservations.length} reservas hoy</div>
            </div>
            <button onClick={() => go('reservas')} className="text-[11px] text-brand font-semibold hover:underline">Ver todas</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Cliente', 'Hora', 'Mesa', 'Pax', 'Estado'].map(h => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liveReservations.slice(0, 6).map(r => (
                <tr key={r.id} className="border-t border-black/5 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.customer_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.time.slice(0, 5)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.table || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.pax}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_CLASS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-black/7 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-['Syne'] text-sm font-black text-gray-900">Ventas esta semana</div>
              <span className="text-xs font-semibold text-brand">{eur0(weekTotal)}</span>
            </div>
            <BarChart data={chartData} height={90} />
          </div>

          <div className="bg-white border border-black/7 rounded-2xl overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-black/7 flex items-center justify-between">
              <div>
                <div className="font-['Syne'] text-sm font-black text-gray-900">Cocina ahora</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{D.kitchen.length} comandas abiertas</div>
              </div>
              <button onClick={() => go('cocina')} className="text-[11px] text-brand font-semibold hover:underline">Abrir</button>
            </div>
            <div className="divide-y divide-black/5">
              {D.kitchen.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center font-['Syne'] text-xs font-bold text-gray-700 flex-shrink-0">
                    {t.id.slice(-2)}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">{t.table_label}</div>
                    <div className="text-[10px] text-gray-400">{t.pax} pax</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide
                    ${t.status === 'pending' ? 'bg-amber-100 text-amber-700' : t.status === 'cooking' ? 'bg-brand/10 text-brand' : 'bg-green-100 text-green-700'}`}>
                    {t.status === 'pending' ? 'Pendiente' : t.status === 'cooking' ? 'En cocina' : 'Listo'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Panel });
