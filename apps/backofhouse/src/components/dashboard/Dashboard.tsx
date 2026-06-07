import { useDailySales, useTodayStats, useReservations, useKitchen } from '../../hooks/useUnamesa'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada', pending: 'Pendiente',
  unconfirmed: 'Sin confirmar', cancelled: 'Cancelada'
}
const STATUS_CLASS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  unconfirmed: 'bg-red-100 text-red-800',
}

export default function Dashboard() {
  const { stats, loading: statsLoading } = useTodayStats()
  const { data: sales } = useDailySales()
  const { data: reservations } = useReservations()
  const { data: tickets } = useKitchen()

  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })

  const chartData = sales.map(s => ({
    day: format(new Date(s.date + 'T12:00:00'), 'EEE', { locale: es }),
    ventas: s.total_revenue,
    isToday: s.date === new Date().toISOString().split('T')[0]
  }))

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-2xl font-black text-gray-900 tracking-tight">Panel de control</h1>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{today} · Servicio activo</p>
        </div>
        <button className="flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand/90 transition">
          <i className="ti ti-plus text-sm" /> Nueva reserva
        </button>
      </div>

      {/* Status bar */}
      <div className="bg-white border border-black/7 rounded-2xl px-5 py-3 grid grid-cols-5 divide-x divide-black/7">
        {[
          { dot: 'bg-green-500', label: 'Estado', value: 'Abierto' },
          { dot: 'bg-amber-400', label: 'Mesas ocupadas', value: `${stats.occupiedTables} / ${stats.totalTables}` },
          { dot: 'bg-green-500', label: 'Reservas hoy', value: `${reservations.length}` },
          { dot: stats.kitchenPending > 0 ? 'bg-red-500' : 'bg-green-500', label: 'Cocina', value: `${stats.kitchenPending} pendientes` },
          { dot: 'bg-green-500', label: 'Personal', value: `${stats.activeStaff} turnos` },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-4 first:pl-0 last:pr-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
            <div>
              <div className="text-[10px] text-gray-400">{s.label}</div>
              <div className="text-sm font-semibold text-gray-900">{statsLoading ? '…' : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Ventas hoy', value: `€${stats.revenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, icon: 'ti-currency-euro', highlight: true },
          { label: 'Reservas hoy', value: `${reservations.length}`, icon: 'ti-calendar' },
          { label: 'Ticket medio', value: `€${stats.avgTicket.toFixed(2)}`, icon: 'ti-receipt' },
          { label: 'Rotación mesas', value: `${stats.tableTurns}×`, icon: 'ti-rotate' },
        ].map((k, i) => (
          <div key={i} className={`rounded-2xl p-5 relative overflow-hidden ${k.highlight ? 'bg-brand' : 'bg-white border border-black/7'}`}>
            <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${k.highlight ? 'bg-white/15' : 'bg-gray-50'}`}>
              <i className={`ti ${k.icon} text-base ${k.highlight ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className={`text-xs font-medium mb-1 ${k.highlight ? 'text-white/65' : 'text-gray-400'}`}>{k.label}</div>
            <div className={`font-['Syne'] text-3xl font-black tracking-tight ${k.highlight ? 'text-white' : 'text-gray-900'}`}>
              {statsLoading ? '…' : k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">

        {/* Reservations table */}
        <div className="bg-white border border-black/7 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-black/7 flex items-center justify-between">
            <div>
              <div className="font-['Syne'] text-sm font-black text-gray-900">Próximas reservas</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{reservations.length} reservas hoy</div>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Cliente','Hora','Mesa','Pax','Estado'].map(h => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.slice(0, 6).map(r => (
                <tr key={r.id} className="border-t border-black/5 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.customer_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.time.slice(0,5)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{(r as any).tables?.label ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.pax}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_CLASS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-sm text-gray-400 text-center">Sin reservas para hoy</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Sales chart */}
          <div className="bg-white border border-black/7 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-['Syne'] text-sm font-black text-gray-900">Ventas esta semana</div>
              <span className="text-xs font-semibold text-brand">
                €{sales.reduce((s, d) => s + d.total_revenue, 0).toLocaleString('es-ES')}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: number) => [`€${v.toLocaleString('es-ES')}`, 'Ventas']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="ventas" fill="#E8F5F1" radius={[4,4,0,0]}
                  // Today bar highlighted
                  label={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Kitchen tickets */}
          <div className="bg-white border border-black/7 rounded-2xl overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-black/7">
              <div className="font-['Syne'] text-sm font-black text-gray-900">Cocina ahora</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{tickets.length} comandas abiertas</div>
            </div>
            <div className="divide-y divide-black/5">
              {tickets.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center font-['Syne'] text-xs font-bold text-gray-700 flex-shrink-0">
                    {String((t as any).orders?.id ?? '').slice(-2) || '—'}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">{t.table_label}</div>
                    <div className="text-[10px] text-gray-400">{t.pax} pax</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide
                    ${t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      t.status === 'cooking' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'}`}>
                    {t.status === 'pending' ? 'Pendiente' : t.status === 'cooking' ? 'En cocina' : 'Listo'}
                  </span>
                </div>
              ))}
              {tickets.length === 0 && (
                <div className="px-4 py-6 text-xs text-gray-400 text-center">Sin comandas abiertas</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
