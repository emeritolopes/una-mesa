/* ─────────────────────────────────────────────────────────────
   Una Mesa — Informes (analítica de ventas)
   ───────────────────────────────────────────────────────────── */
function Informes() {
  const D = window.DATA;
  const [range, setRange] = useState('7d');

  const week = D.dailySales;
  const todayS = week[week.length - 1];
  const weekRevenue = week.reduce((s, d) => s + d.total_revenue, 0);
  const weekOrders = week.reduce((s, d) => s + d.total_orders, 0);
  const weekCovers = week.reduce((s, d) => s + d.covers, 0);

  // period summary + deltas
  const periods = {
    hoy: { revenue: todayS.total_revenue, orders: todayS.total_orders, avg: todayS.avg_ticket, covers: todayS.covers, d: [8.2, 5.1, 2.9, 6.0], sub: 'vs. ayer' },
    '7d': { revenue: weekRevenue, orders: weekOrders, avg: weekRevenue / weekOrders, covers: weekCovers, d: [12.4, 9.7, 2.4, 11.0], sub: 'vs. semana anterior' },
    '30d': { revenue: Math.round(weekRevenue * 4.31), orders: Math.round(weekOrders * 4.31), avg: weekRevenue / weekOrders + 0.4, covers: Math.round(weekCovers * 4.31), d: [18.6, 15.2, 3.1, 16.4], sub: 'vs. mes anterior' },
  };
  const p = periods[range];

  // main chart adapts to range
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const chartData = range === 'hoy'
    ? D.hourly.map(h => ({ label: h.hour, value: h.value }))
    : range === '7d'
      ? week.map(s => ({ label: dayNames[new Date(s.date + 'T12:00:00').getDay()], value: s.total_revenue }))
      : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((l, i) => ({ label: l, value: Math.round(weekRevenue * [0.92, 1.05, 0.98, 1.36][i]) }));

  // category revenue from sold * price
  const catColors = { c1: '#D8552E', c2: '#0369A1', c3: '#7C3AED', c4: '#B45309' };
  const mult = range === 'hoy' ? 0.16 : range === '7d' ? 1 : 4.31;
  const catRows = D.categories.map(c => {
    const rev = D.menu.filter(m => m.category_id === c.id).reduce((s, m) => s + m.sold * m.price, 0) * mult;
    return { label: c.name, value: Math.round(rev), color: catColors[c.id], display: eur0(Math.round(rev)) };
  }).sort((a, b) => b.value - a.value);

  // top platos
  const topItems = [...D.menu].sort((a, b) => b.sold - a.sold).slice(0, 6).map(m => ({
    ...m, units: Math.round(m.sold * mult), revenue: Math.round(m.sold * m.price * mult),
  }));
  const maxUnits = Math.max(...topItems.map(t => t.units));

  // payments scaled
  const payTotal = D.payments.reduce((s, x) => s + x.value, 0);
  const paySegs = D.payments.map((x, i) => ({ ...x, color: ['#D8552E', '#0369A1', '#7C3AED'][i] }));

  // ─── Reservas KPIs ───────────────────────────────────────────
  const [reservations] = useStore('reservations');
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);
  const inRange = (iso) => { const d = new Date(iso + 'T12:00:00'); return d >= weekStart && d <= weekEnd; };
  const weekRes = reservations.filter(r => inRange(r.date));
  const totalRes = range === 'hoy' ? reservations.filter(r => r.date === D.iso(now)).length
    : range === '7d' ? weekRes.length
    : Math.round(weekRes.length * 4.31);
  const noShows = weekRes.filter(r => r.status === 'no_show').length;
  const noShowRate = weekRes.length > 0 ? ((noShows / weekRes.length) * 100).toFixed(1) : '0.0';
  const timeCounts = {};
  weekRes.forEach(r => { const t = r.time.slice(0,5); timeCounts[t] = (timeCounts[t]||0) + 1; });
  const topTimes = Object.entries(timeCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);

  const resKpiDelta = range === 'hoy' ? '+5.2%' : range === '7d' ? '+9.4%' : '+14.8%';
  const noShowDelta = range === 'hoy' ? '-0.4%' : range === '7d' ? '-1.8%' : '-2.3%';

  const intFmt = (n) => Math.round(n).toLocaleString('es-ES');
  const kpis = [
    { label: 'Ingresos', raw: p.revenue, fmt: eur0, icon: 'ti-currency-euro', delta: p.d[0], highlight: true },
    { label: 'Pedidos', raw: p.orders, fmt: intFmt, icon: 'ti-receipt', delta: p.d[1] },
    { label: 'Ticket medio', raw: p.avg, fmt: (n) => eur(n), icon: 'ti-coin', delta: p.d[2] },
    { label: 'Comensales', raw: p.covers, fmt: intFmt, icon: 'ti-users', delta: p.d[3] },
  ];

  const ranges = [{ k: 'hoy', l: 'Hoy' }, { k: '7d', l: '7 días' }, { k: '30d', l: '30 días' }];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-black/7 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-['Syne'] text-xl font-black text-gray-900">Informes</h1>
          <p className="text-xs text-gray-500 mt-0.5">Análisis de ventas y rendimiento · {p.sub}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {ranges.map(r => (
              <button key={r.k} onClick={() => setRange(r.k)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${range === r.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {r.l}
              </button>
            ))}
          </div>
          <button onClick={() => toast('Informe exportado (PDF)')} className="flex items-center gap-2 border border-black/10 text-gray-700 text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-gray-50 transition">
            <i className="ti ti-download" /> Exportar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {/* KPIs — re-mount (and re-animate) when range changes */}
        <div key={range} className="grid grid-cols-4 gap-3">
          {kpis.map((k, i) => (
            <div key={i} className={`rounded-2xl p-5 relative overflow-hidden ${k.highlight ? 'bg-brand text-white' : 'bg-white border border-black/7'}`}>
              <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${k.highlight ? 'bg-white/15' : 'bg-gray-50'}`}>
                <i className={`ti ${k.icon} text-base ${k.highlight ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className={`text-xs font-medium mb-1 ${k.highlight ? 'text-white/65' : 'text-gray-400'}`}>{k.label}</div>
              <CountUp value={k.raw} fmt={k.fmt} className={`font-['Syne'] text-3xl font-black tracking-tight block ${k.highlight ? 'text-white' : 'text-gray-900'}`} />
              <div className="mt-2">
                {k.highlight
                  ? <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-white/85"><i className="ti ti-trending-up text-xs" />+{k.delta}% {p.sub}</span>
                  : <Delta value={k.delta} />}
              </div>
            </div>
          ))}
        </div>

        {/* Reservas KPIs */}
        <div key={'res-' + range} className="grid grid-cols-3 gap-3">
          {/* Reservas esta semana */}
          <div className="rounded-2xl p-5 relative overflow-hidden bg-white border border-black/7">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50">
              <i className="ti ti-calendar-event text-base text-gray-400" />
            </div>
            <div className="text-xs font-medium mb-1 text-gray-400">Reservas {range === 'hoy' ? 'hoy' : range === '7d' ? 'esta semana' : 'este mes'}</div>
            <CountUp value={totalRes} fmt={intFmt} className="font-['Syne'] text-3xl font-black tracking-tight block text-gray-900" />
            <div className="mt-2">
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                <i className="ti ti-trending-up text-xs" />{resKpiDelta} vs. {range === 'hoy' ? 'ayer' : range === '7d' ? 'semana anterior' : 'mes anterior'}
              </span>
            </div>
          </div>

          {/* Tasa de no-shows */}
          <div className="rounded-2xl p-5 relative overflow-hidden bg-white border border-black/7">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50">
              <i className="ti ti-user-x text-base text-gray-400" />
            </div>
            <div className="text-xs font-medium mb-1 text-gray-400">Tasa de no-shows</div>
            <div className="font-['Syne'] text-3xl font-black tracking-tight text-gray-900">{noShowRate}%</div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                <i className="ti ti-trending-down text-xs" />{noShowDelta} vs. {range === 'hoy' ? 'ayer' : range === '7d' ? 'semana anterior' : 'mes anterior'}
              </span>
            </div>
          </div>

          {/* Horarios más populares */}
          <div className="rounded-2xl p-5 relative overflow-hidden bg-white border border-black/7">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50">
              <i className="ti ti-clock text-base text-gray-400" />
            </div>
            <div className="text-xs font-medium mb-3 text-gray-400">Horarios más populares</div>
            {topTimes.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {topTimes.map(([time, count], i) => (
                  <div key={time} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black flex-shrink-0 ${i === 0 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>{i+1}</div>
                      <span className="font-['Syne'] text-base font-black text-gray-900">{time}</span>
                    </div>
                    <span className="text-[11px] text-gray-400">{count} reservas</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 mt-2">Sin datos para este periodo</div>
            )}
          </div>
        </div>

        {/* Main trend chart */}
        <div className="bg-white border border-black/7 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-['Syne'] text-sm font-black text-gray-900">Evolución de ventas</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{range === 'hoy' ? 'Por franja horaria' : range === '7d' ? 'Últimos 7 días' : 'Últimas 4 semanas'}</div>
            </div>
            <div className="text-right">
              <div className="font-['Syne'] text-xl font-black text-brand">{eur0(p.revenue)}</div>
              <div className="text-[10px] text-gray-400">total del periodo</div>
            </div>
          </div>
          <BarChart key={range} data={chartData} height={170} highlightLast={range !== 'hoy'} />
        </div>

        {/* Category + payments */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-4">
          <div className="bg-white border border-black/7 rounded-2xl p-5">
            <div className="font-['Syne'] text-sm font-black text-gray-900 mb-4">Ventas por categoría</div>
            <HBars key={range} rows={catRows} />
          </div>
          <div className="bg-white border border-black/7 rounded-2xl p-5">
            <div className="font-['Syne'] text-sm font-black text-gray-900 mb-4">Métodos de pago</div>
            <div className="flex items-center gap-5">
              <Donut key={range} segments={paySegs} centerLabel={eur0(payTotal * mult)} centerSub="cobrado" />
              <div className="flex flex-col gap-2.5 flex-1">
                {paySegs.map(s => (
                  <div key={s.method} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-gray-600 flex-1">{s.method}</span>
                    <span className="text-xs font-bold text-gray-900">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top dishes + hourly */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-4">
          <div className="bg-white border border-black/7 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/7 flex items-center justify-between">
              <div className="font-['Syne'] text-sm font-black text-gray-900">Platos más vendidos</div>
              <div className="text-[10px] text-gray-400">unidades · ingresos</div>
            </div>
            <div className="divide-y divide-black/5">
              {topItems.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-['Syne'] text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{t.name}</div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5 max-w-[200px]">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${(t.units / maxUnits) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{eur0(t.revenue)}</div>
                    <div className="text-[10px] text-gray-400">{t.units} uds.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-black/7 rounded-2xl p-5 flex flex-col">
            <div className="font-['Syne'] text-sm font-black text-gray-900 mb-1">Ventas por franja</div>
            <div className="text-[10px] text-gray-400 mb-4">Comida (13-16h) · Cena (20-23h)</div>
            <div className="flex-1 flex items-end">
              <BarChart key={'h' + range} data={D.hourly.map(h => ({ label: h.hour, value: h.value }))} height={150} highlightLast={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Informes });
