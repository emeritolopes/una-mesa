/* ─────────────────────────────────────────────────────────────
   Una Mesa — Analytics
   Datos reales de Supabase: reservas, canales, clientes, no-shows
   ───────────────────────────────────────────────────────────── */
function Analytics() {
  const [range, setRange] = React.useState('7d');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const venueId = '00000000-0000-0000-0000-000000000001';

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sb = window.sb;

        // Calcular rango de fechas
        const now = new Date();
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const from = new Date(now);
        from.setDate(from.getDate() - days);
        const fromISO = from.toISOString().split('T')[0];

        // Traer todas las reservas del rango
        const { data: reservations } = await sb
          .from('reservations')
          .select('id, date, time, pax, status, source, customer_name, customer_email, customer_phone, created_at')
          .eq('venue_id', venueId)
          .gte('date', fromISO)
          .order('date', { ascending: false });

        const res = reservations || [];

        // KPIs
        const confirmed = res.filter(r => r.status === 'confirmed');
        const cancelled = res.filter(r => r.status === 'cancelled');
        const noShows = res.filter(r => r.status === 'no_show');
        const totalCovers = confirmed.reduce((s, r) => s + (r.pax || 0), 0);
        const noShowRate = res.length > 0 ? ((noShows.length / res.length) * 100).toFixed(1) : '0.0';

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

        // Reservas por día (últimos 7 días para gráfica)
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
        confirmed.forEach(r => {
          if (byDay[r.date]) byDay[r.date].value++;
        });

        // Clientes únicos
        const uniqueEmails = new Set(confirmed.filter(r => r.customer_email).map(r => r.customer_email));
        const uniquePhones = new Set(confirmed.filter(r => r.customer_phone).map(r => r.customer_phone));
        const uniqueClients = Math.max(uniqueEmails.size, uniquePhones.size);

        // Clientes con más de 1 reserva (recurrentes)
        const phoneCounts = {};
        confirmed.forEach(r => {
          if (r.customer_phone) phoneCounts[r.customer_phone] = (phoneCounts[r.customer_phone] || 0) + 1;
        });
        const returning = Object.values(phoneCounts).filter(c => c > 1).length;

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

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-black/7 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-['Syne'] text-xl font-black text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Reservas y clientes gestionados por Una Mesa</p>
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

        {/* KPIs principales */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Reservas totales', value: data.total, icon: 'ti-calendar', highlight: true },
            { label: 'Confirmadas', value: data.confirmed, icon: 'ti-circle-check', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Comensales', value: data.totalCovers, icon: 'ti-users', color: 'text-gray-900', bg: 'bg-gray-50' },
            { label: 'Tasa no-show', value: data.noShowRate + '%', icon: 'ti-user-x', color: 'text-red-500', bg: 'bg-red-50' },
          ].map((k, i) => (
            <div key={i} className={`rounded-2xl p-5 relative overflow-hidden ${k.highlight ? 'bg-brand text-white' : 'bg-white border border-black/7'}`}>
              <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${k.highlight ? 'bg-white/15' : k.bg}`}>
                <i className={`ti ${k.icon} text-base ${k.highlight ? 'text-white' : k.color}`} />
              </div>
              <div className={`text-xs font-medium mb-1 ${k.highlight ? 'text-white/65' : 'text-gray-400'}`}>{k.label}</div>
              <div className={`font-['Syne'] text-3xl font-black tracking-tight ${k.highlight ? 'text-white' : 'text-gray-900'}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Gráfica de reservas por día + Canal de origen */}
        <div className="grid grid-cols-[1.6fr_1fr] gap-4">

          {/* Reservas por día */}
          <div className="bg-white border border-black/7 rounded-2xl p-5">
            <div className="font-['Syne'] text-sm font-black text-gray-900 mb-1">Reservas confirmadas</div>
            <div className="text-[10px] text-gray-400 mb-4">Últimos 7 días</div>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {data.last7.map((d, i) => {
                const h = Math.max(4, Math.round((d.value / maxBar) * 100));
                const isToday = i === data.last7.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                    {d.value > 0 && (
                      <span className="text-[10px] font-bold text-gray-700">{d.value}</span>
                    )}
                    <div className="w-full rounded-t-md transition-all duration-500"
                      style={{ height: h, background: isToday ? '#D8552E' : '#F6E3DB' }} />
                    <span className={`text-[10px] ${isToday ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canal de origen */}
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

          {/* Horarios más populares */}
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

          {/* Clientes */}
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
                body: `${data.bySource.phone_agent.length} reservas gestionadas automáticamente sin intervención humana.`,
              },
              {
                icon: data.noShows > 0 ? 'ti-alert-triangle' : 'ti-circle-check',
                color: data.noShows > 0 ? '#F59E0B' : '#10B981',
                title: data.noShows > 0 ? `${data.noShows} no-show${data.noShows !== 1 ? 's' : ''} detectado${data.noShows !== 1 ? 's' : ''}` : 'Sin no-shows',
                body: data.noShows > 0
                  ? 'El depósito reembolsable está reduciendo cancelaciones. Considera aumentarlo en horarios pico.'
                  : 'El sistema de depósito está funcionando correctamente.',
              },
              {
                icon: data.returning > 0 ? 'ti-heart' : 'ti-users',
                color: '#6366F1',
                title: data.returning > 0 ? `${data.returning} clientes recurrentes` : 'Construyendo base de clientes',
                body: data.returning > 0
                  ? 'Tienes clientes que repiten. Considera crear una oferta especial para fidelizarlos.'
                  : 'Con más reservas tendrás datos para identificar clientes recurrentes.',
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
