/* ─────────────────────────────────────────────────────────────
   Una Mesa — Analytics v2
   + Comparativa vs periodo anterior
   + Tabla de reservas recientes
   + Alerta de clientes perdidos (30+ días sin reservar)
   ───────────────────────────────────────────────────────────── */
function Analytics() {
  const [range, setRange] = React.useState('7d');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [lostExpanded, setLostExpanded] = React.useState(false);

  const venueId = (() => { try { return JSON.parse(localStorage.getItem('unamesa.user')).venue_id; } catch { return null; } })();

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sb = window.sb;
        const now = new Date();
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

        // Periodo actual
        const fromCurrent = new Date(now);
        fromCurrent.setDate(fromCurrent.getDate() - days);
        const fromCurrentISO = fromCurrent.toISOString().split('T')[0];

        // Periodo anterior (para comparativa)
        const fromPrev = new Date(fromCurrent);
        fromPrev.setDate(fromPrev.getDate() - days);
        const fromPrevISO = fromPrev.toISOString().split('T')[0];

        // Reservas periodo actual
        const { data: current } = await sb
          .from('reservations')
          .select('id, date, time, pax, status, source, customer_name, customer_email, customer_phone, created_at')
          .eq('venue_id', venueId)
          .gte('date', fromCurrentISO)
          .order('created_at', { ascending: false });

        // Reservas periodo anterior
        const { data: previous } = await sb
          .from('reservations')
          .select('id, status, pax, customer_phone')
          .eq('venue_id', venueId)
          .gte('date', fromPrevISO)
          .lt('date', fromCurrentISO);

        const res = current || [];
        const prevRes = previous || [];

        // KPIs actuales
        const confirmed = res.filter(r => r.status === 'confirmed');
        const cancelled = res.filter(r => r.status === 'cancelled');
        const noShows = res.filter(r => r.status === 'no_show');
        const totalCovers = confirmed.reduce((s, r) => s + (r.pax || 0), 0);
        const noShowRate = res.length > 0 ? ((noShows.length / res.length) * 100).toFixed(1) : '0.0';

        // KPIs periodo anterior (para deltas)
        const prevConfirmed = prevRes.filter(r => r.status === 'confirmed');
        const prevCovers = prevConfirmed.reduce((s, r) => s + (r.pax || 0), 0);
        const prevNoShows = prevRes.filter(r => r.status === 'no_show');
        const prevNoShowRate = prevRes.length > 0 ? ((prevNoShows.length / prevRes.length) * 100).toFixed(1) : '0.0';

        const delta = (curr, prev) => {
          if (prev === 0) return null;
          const d = Math.round(((curr - prev) / prev) * 100);
          return d;
        };

        // Por canal
        const bySource = {
          web: res.filter(r => r.source === 'web' || !r.source),
          phone_agent: res.filter(r => r.source === 'phone_agent'),
          chat_agent: res.filter(r => r.source === 'chat_agent'),
        };

        // Horarios más populares
        const timeCounts = {};
        confirmed.forEach(r => {
          const t = (r.time || '').slice(0, 5);
          if (t) timeCounts[t] = (timeCounts[t] || 0) + 1;
        });
        const topTimes = Object.entries(timeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        // Gráfica últimos 7 días
        const byDay = {};
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const iso = d.toISOString().split('T')[0];
          const label = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()];
          last7.push({ iso, label, value: 0 });
          byDay[iso] = last7[last7.length - 1];
        }
        confirmed.forEach(r => { if (byDay[r.date]) byDay[r.date].value++; });

        // Clientes únicos
        const uniquePhones = new Set(confirmed.filter(r => r.customer_phone).map(r => r.customer_phone));
        const uniqueEmails = new Set(confirmed.filter(r => r.customer_email).map(r => r.customer_email));
        const uniqueClients = Math.max(uniquePhones.size, uniqueEmails.size);

        // Clientes recurrentes
        const phoneCounts = {};
        confirmed.forEach(r => {
          if (r.customer_phone) phoneCounts[r.customer_phone] = (phoneCounts[r.customer_phone] || 0) + 1;
        });
        const returning = Object.values(phoneCounts).filter(c => c > 1).length;

        // MEJORA 3 — Clientes perdidos (reservaron hace 30+ días y no han vuelto)
        const cutoff30 = new Date(now);
        cutoff30.setDate(cutoff30.getDate() - 30);
        const cutoff30ISO = cutoff30.toISOString().split('T')[0];

        const { data: allRes } = await sb
          .from('reservations')
          .select('customer_name, customer_email, customer_phone, date')
          .eq('venue_id', venueId)
          .eq('status', 'confirmed');

        const allConfirmed = allRes || [];

        // Encontrar clientes cuya última reserva fue hace 30+ días
        const lastResByPhone = {};
        allConfirmed.forEach(r => {
          const key = r.customer_phone || r.customer_email;
          if (!key) return;
          if (!lastResByPhone[key] || r.date > lastResByPhone[key].date) {
            lastResByPhone[key] = r;
          }
        });

        const lostClients = Object.values(lastResByPhone)
          .filter(r => r.date < cutoff30ISO)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 20);

        // MEJORA 2 — Reservas recientes (últimas 8)
        const recentReservations = res.slice(0, 8);

        setData({
          total: res.length,
          confirmed: confirmed.length,
          cancelled: cancelled.length,
          noShows: noShows.length,
          noShowRate,
          totalCovers,
          bySource,
          topTimes,
          last7,
          uniqueClients,
          returning,
          lostClients,
          recentReservations,
          deltas: {
            total: delta(res.length, prevRes.length),
            confirmed: delta(confirmed.length, prevConfirmed.length),
            covers: delta(totalCovers, prevCovers),
            noShowRate: delta(parseFloat(noShowRate), parseFloat(prevNoShowRate)),
          },
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
      setLoading(false);
    };
    load();
  }, [range]);

  const ranges = [
    { k: '7d', l: '7 días' },
    { k: '30d', l: '30 días' },
    { k: '90d', l: '90 días' },
  ];

  const sourceLabel = { web: 'Web', phone_agent: 'Agente de voz IA', chat_agent: 'Chat IA' };
  const sourceColor = { web: '#6366F1', phone_agent: '#D8552E', chat_agent: '#10B981' };
  const sourceIcon = { web: 'ti-world', phone_agent: 'ti-phone', chat_agent: 'ti-message-chatbot' };

  const statusLabel = { confirmed: 'Confirmada', cancelled: 'Cancelada', pending: 'Pendiente', no_show: 'No-show' };
  const statusClass = { confirmed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600', pending: 'bg-amber-100 text-amber-700', no_show: 'bg-gray-100 text-gray-500' };

  const DeltaBadge = ({ value }) => {
    if (value === null || value === undefined) return null;
    const up = value >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${up ? 'text-green-600' : 'text-red-500'}`}>
        <i className={`ti ${up ? 'ti-trending-up' : 'ti-trending-down'} text-[10px]`} />
        {up ? '+' : ''}{value}%
      </span>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <i className="ti ti-loader-2 animate-spin text-brand text-2xl" />
        <p className="text-xs text-gray-400">Cargando analytics…</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-sm text-gray-400">Error cargando datos</p>
    </div>
  );

  const maxBar = Math.max(...data.last7.map(d => d.value), 1);
  const totalBySource = Object.values(data.bySource).reduce((s, arr) => s + arr.length, 0) || 1;
  const rangeLabel = range === '7d' ? 'semana anterior' : range === '30d' ? 'mes anterior' : '90 días anteriores';

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-black/7 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-['Syne'] text-xl font-black text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Reservas y clientes · vs {rangeLabel}</p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {ranges.map(r => (
            <button key={r.k} onClick={() => setRange(r.k)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${range === r.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {r.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* MEJORA 1 — KPIs con deltas vs periodo anterior */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Reservas totales', value: data.total, delta: data.deltas.total, icon: 'ti-calendar', highlight: true },
            { label: 'Confirmadas', value: data.confirmed, delta: data.deltas.confirmed, icon: 'ti-circle-check', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Comensales', value: data.totalCovers, delta: data.deltas.covers, icon: 'ti-users', color: 'text-gray-900', bg: 'bg-gray-50' },
            { label: 'Tasa no-show', value: data.noShowRate + '%', delta: data.deltas.noShowRate ? -data.deltas.noShowRate : null, icon: 'ti-user-x', color: 'text-red-500', bg: 'bg-red-50' },
          ].map((k, i) => (
            <div key={i} className={`rounded-2xl p-5 relative overflow-hidden ${k.highlight ? 'bg-brand text-white' : 'bg-white border border-black/7'}`}>
              <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${k.highlight ? 'bg-white/15' : k.bg}`}>
                <i className={`ti ${k.icon} text-base ${k.highlight ? 'text-white' : k.color}`} />
              </div>
              <div className={`text-xs font-medium mb-1 ${k.highlight ? 'text-white/65' : 'text-gray-400'}`}>{k.label}</div>
              <div className={`font-['Syne'] text-3xl font-black tracking-tight ${k.highlight ? 'text-white' : 'text-gray-900'}`}>{k.value}</div>
              <div className="mt-2">
                {k.highlight
                  ? (k.delta !== null && k.delta !== undefined
                    ? <span className={`text-[10px] font-bold ${k.delta >= 0 ? 'text-white/80' : 'text-white/60'}`}>
                        {k.delta >= 0 ? '+' : ''}{k.delta}% vs {rangeLabel}
                      </span>
                    : <span className="text-[10px] text-white/50">Sin datos anteriores</span>)
                  : <DeltaBadge value={k.delta} />
                }
              </div>
            </div>
          ))}
        </div>

        {/* Gráfica + Canal */}
        <div className="grid grid-cols-[1.6fr_1fr] gap-4">
          <div className="bg-white border border-black/7 rounded-2xl p-5">
            <div className="font-['Syne'] text-sm font-black text-gray-900 mb-1">Reservas confirmadas</div>
            <div className="text-[10px] text-gray-400 mb-4">Últimos 7 días</div>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {data.last7.map((d, i) => {
                const h = Math.max(4, Math.round((d.value / maxBar) * 100));
                const isToday = i === data.last7.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                    {d.value > 0 && <span className="text-[10px] font-bold text-gray-700">{d.value}</span>}
                    <div className="w-full rounded-t-md transition-all duration-500"
                      style={{ height: h, background: isToday ? '#D8552E' : '#F6E3DB' }} />
                    <span className={`text-[10px] ${isToday ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-black/7 rounded-2xl p-5">
            <div className="font-['Syne'] text-sm font-black text-gray-900 mb-1">Canal de reserva</div>
            <div className="text-[10px] text-gray-400 mb-4">Dónde vienen tus clientes</div>
            <div className="flex flex-col gap-3">
              {Object.entries(data.bySource).map(([source, arr]) => {
                const pct = totalBySource > 0 ? Math.round((arr.length / totalBySource) * 100) : 0;
                return (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: sourceColor[source] + '20' }}>
                          <i className={`ti ${sourceIcon[source]} text-[11px]`} style={{ color: sourceColor[source] }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{sourceLabel[source]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{arr.length}</span>
                        <span className="text-[10px] text-gray-400">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: sourceColor[source] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Horarios + Clientes */}
        <div className="grid grid-cols-[1fr_1fr] gap-4">
          <div className="bg-white border border-black/7 rounded-2xl p-5">
            <div className="font-['Syne'] text-sm font-black text-gray-900 mb-1">Horarios más populares</div>
            <div className="text-[10px] text-gray-400 mb-4">Franjas con más demanda</div>
            {data.topTimes.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {data.topTimes.map(([time, count], i) => (
                  <div key={time} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${i === 0 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {i + 1}
                    </div>
                    <span className="font-['Syne'] text-lg font-black text-gray-900 flex-1">{time}</span>
                    <span className="text-xs text-gray-400">{count} reserva{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <i className="ti ti-clock text-2xl text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Sin datos para este periodo</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-black/7 rounded-2xl p-5">
            <div className="font-['Syne'] text-sm font-black text-gray-900 mb-1">Clientes</div>
            <div className="text-[10px] text-gray-400 mb-4">Nuevos y recurrentes</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Clientes únicos', value: data.uniqueClients, icon: 'ti-user', color: '#6366F1' },
                { label: 'Recurrentes', value: data.returning, icon: 'ti-repeat', color: '#10B981' },
                { label: 'Cancelaciones', value: data.cancelled, icon: 'ti-x', color: '#F59E0B' },
                { label: 'No-shows', value: data.noShows, icon: 'ti-user-x', color: '#EF4444' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3 border border-black/5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                    style={{ background: s.color + '20' }}>
                    <i className={`ti ${s.icon} text-sm`} style={{ color: s.color }} />
                  </div>
                  <div className="font-['Syne'] text-2xl font-black text-gray-900">{s.value}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MEJORA 2 — Reservas recientes */}
        <div className="bg-white border border-black/7 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-black/7 flex items-center justify-between">
            <div>
              <div className="font-['Syne'] text-sm font-black text-gray-900">Reservas recientes</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Últimas {data.recentReservations.length} reservas</div>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Cliente', 'Fecha', 'Hora', 'Pax', 'Canal', 'Estado'].map(h => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentReservations.length > 0 ? data.recentReservations.map(r => (
                <tr key={r.id} className="border-t border-black/5 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.customer_name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.date}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{(r.time || '').slice(0, 5)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.pax}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <i className={`ti ${sourceIcon[r.source] || 'ti-world'} text-[11px]`}
                        style={{ color: sourceColor[r.source] || '#6366F1' }} />
                      <span className="text-[11px] text-gray-500">{sourceLabel[r.source] || 'Web'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusClass[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[r.status] || r.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-gray-400">
                    Sin reservas en este periodo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MEJORA 3 — Clientes perdidos */}
        {data.lostClients.length > 0 && (
          <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-amber-100 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <i className="ti ti-user-off text-amber-600 text-sm" />
                </div>
                <div>
                  <div className="font-['Syne'] text-sm font-black text-gray-900">
                    {data.lostClients.length} clientes sin reservar en 30+ días
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">
                    Oportunidad de recuperación — contáctalos con una oferta
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const rows = data.lostClients
                      .map(c => `${c.customer_name || ''}\t${c.customer_email || ''}\t${c.customer_phone || ''}\t${c.date}`)
                      .join('\n');
                    const header = 'Nombre\tEmail\tTeléfono\tÚltima reserva\n';
                    const blob = new Blob([header + rows], { type: 'text/plain' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                    a.download = 'clientes-perdidos.tsv'; a.click();
                    toast('Lista exportada');
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 border border-amber-300 bg-white px-3 py-1.5 rounded-lg hover:bg-amber-50 transition">
                  <i className="ti ti-download text-xs" /> Exportar lista
                </button>
                <button
                  onClick={() => setLostExpanded(e => !e)}
                  className="text-[11px] text-gray-500 font-semibold hover:text-gray-700">
                  {lostExpanded ? 'Ocultar ▲' : 'Ver todos ▼'}
                </button>
              </div>
            </div>
            {lostExpanded && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {['Cliente', 'Teléfono', 'Email', 'Última reserva', 'Días sin reservar'].map(h => (
                      <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.lostClients.map((c, i) => {
                    const daysSince = Math.floor((new Date() - new Date(c.date + 'T12:00:00')) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={i} className="border-t border-black/5 hover:bg-amber-50/30 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.customer_name || '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{c.customer_phone || '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{c.customer_email || '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{c.date}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${daysSince > 60 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                            {daysSince} días
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* IA Insights */}
        <div className="bg-white border border-black/7 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
              <i className="ti ti-sparkles text-brand text-sm" />
            </div>
            <div>
              <div className="font-['Syne'] text-sm font-black text-gray-900">IA Insights</div>
              <div className="text-[10px] text-gray-400">Acciones recomendadas basadas en tus datos</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: 'ti-phone',
                color: '#D8552E',
                title: 'Agente de voz activo',
                body: `${data.bySource.phone_agent.length} reservas gestionadas automáticamente. Sin agente de voz, esas llamadas se habrían perdido.`,
              },
              {
                icon: data.lostClients.length > 0 ? 'ti-user-off' : 'ti-heart',
                color: data.lostClients.length > 0 ? '#F59E0B' : '#10B981',
                title: data.lostClients.length > 0
                  ? `${data.lostClients.length} clientes sin volver`
                  : 'Retención activa',
                body: data.lostClients.length > 0
                  ? 'Exporta la lista y contáctalos con una oferta. Un cliente recuperado vale más que uno nuevo.'
                  : 'Todos tus clientes recientes han vuelto. Buen trabajo.',
              },
              {
                icon: data.noShows > 0 ? 'ti-alert-triangle' : 'ti-circle-check',
                color: data.noShows > 0 ? '#F59E0B' : '#10B981',
                title: data.noShows > 0 ? `${data.noShows} no-show${data.noShows !== 1 ? 's' : ''}` : 'Sin no-shows',
                body: data.noShows > 0
                  ? 'Considera aumentar el depósito en horarios pico para reducir no-shows.'
                  : 'El depósito reembolsable está funcionando. Tasa de presentación perfecta.',
              },
            ].map((ins, i) => (
              <div key={i} className="rounded-xl p-4 border border-black/5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: ins.color + '15' }}>
                  <i className={`ti ${ins.icon} text-base`} style={{ color: ins.color }} />
                </div>
                <div className="text-xs font-bold text-gray-900 mb-1">{ins.title}</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">{ins.body}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
Object.assign(window, { Analytics });
