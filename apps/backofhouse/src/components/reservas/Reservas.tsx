import { useState } from 'react'
import { useReservations } from '../../hooks/useUnamesa'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Reservation } from '../../lib/supabase'

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada', pending: 'Pendiente',
  unconfirmed: 'Sin confirmar', cancelled: 'Cancelada', no_show: 'No show'
}
const STATUS_CLASS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  unconfirmed: 'bg-red-100 text-red-800 border-red-300',
}
const TIMES = ['13:00','13:30','14:00','14:30','15:00','20:00','20:30','21:00','21:30','22:00']

export default function Reservas() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newRes, setNewRes] = useState({ customer_name: '', customer_phone: '', pax: 2, time: '14:00', notes: '' })

  const { data: reservations, loading, createReservation, updateStatus, deleteReservation } = useReservations(selectedDate)

  // Generate week dates
  const weekStart = startOfWeek(new Date(selectedDate + 'T12:00:00'), { weekStartsOn: 1 })
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const handleCreate = async () => {
    const { error } = await createReservation({
      ...newRes, date: selectedDate,
      status: 'confirmed', pax: Number(newRes.pax)
    } as any)
    if (!error) { setShowForm(false); setNewRes({ customer_name: '', customer_phone: '', pax: 2, time: '14:00', notes: '' }) }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-black/7 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-black text-gray-900">Reservas</h1>
          <p className="text-xs text-gray-500 mt-0.5">{reservations.length} reservas · {format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM", { locale: es })}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand/90 transition">
          <i className="ti ti-plus" /> Nueva reserva
        </button>
      </div>

      {/* Calendar strip */}
      <div className="bg-white border-b border-black/7 px-6 py-3 flex items-center gap-3">
        <div className="font-['Syne'] font-bold text-sm text-gray-900 min-w-[100px]">
          {format(weekStart, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
        </div>
        <div className="flex gap-2 flex-1">
          {weekDates.map(d => {
            const dateStr = d.toISOString().split('T')[0]
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === new Date().toISOString().split('T')[0]
            return (
              <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                className={`flex-1 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all text-xs
                  ${isSelected ? 'bg-brand border-brand text-white' :
                    isToday ? 'border-brand bg-brand/5 text-brand' :
                    'border-transparent hover:bg-gray-50 text-gray-600'}`}>
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
                  {format(d, 'EEE', { locale: es })}
                </span>
                <span className="font-['Syne'] text-lg font-black leading-none">{format(d, 'd')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_320px]">

        {/* Timeline */}
        <div className="overflow-y-auto border-r border-black/7">
          {loading ? (
            <div className="p-8 text-sm text-gray-400 text-center">Cargando…</div>
          ) : (
            TIMES.map(time => {
              const slots = reservations.filter(r => r.time.slice(0,5) === time)
              return (
                <div key={time} className="flex border-b border-black/5 min-h-14">
                  <div className="w-16 flex-shrink-0 px-4 py-4 text-xs font-medium text-gray-400 border-r border-black/5">{time}</div>
                  <div className="flex-1 p-2 flex flex-wrap gap-2 content-start">
                    {slots.map(r => (
                      <div key={r.id} onClick={() => { setSelectedRes(r); setShowForm(false) }}
                        className={`rounded-lg px-3 py-2 cursor-pointer border-l-2 min-w-[140px] hover:opacity-80 transition
                          ${r.status === 'confirmed' ? 'bg-brand/8 border-brand' :
                            r.status === 'pending' ? 'bg-amber-50 border-amber-400' :
                            'bg-red-50 border-red-400'}`}>
                        <div className={`text-xs font-semibold ${r.status === 'confirmed' ? 'text-brand' : r.status === 'pending' ? 'text-amber-700' : 'text-red-700'}`}>
                          {r.customer_name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {(r as any).tables?.label ?? 'Sin mesa'} · {r.pax} pax
                          {r.allergy_alert && ' · ⚠'}
                        </div>
                      </div>
                    ))}
                    {slots.length === 0 && (
                      <span className="text-[11px] text-gray-300 py-4 px-2">Sin reservas</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Side panel */}
        <div className="overflow-y-auto p-4 flex flex-col gap-4">
          {/* Stats */}
          <div className="bg-white border border-black/7 rounded-xl p-4">
            <div className="font-['Syne'] text-sm font-bold text-gray-900 mb-3">Resumen del día</div>
            {[
              { label: 'Confirmadas', val: reservations.filter(r => r.status === 'confirmed').length, color: 'text-brand' },
              { label: 'Pendientes',  val: reservations.filter(r => r.status === 'pending').length,   color: 'text-amber-500' },
              { label: 'Sin confirmar', val: reservations.filter(r => r.status === 'unconfirmed').length, color: 'text-red-500' },
              { label: 'Total comensales', val: reservations.reduce((s, r) => s + r.pax, 0), color: 'text-gray-900' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                <span className="text-xs text-gray-500">{s.label}</span>
                <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Selected reservation detail */}
          {selectedRes && !showForm && (
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-black/7 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{selectedRes.customer_name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {selectedRes.time.slice(0,5)} · {(selectedRes as any).tables?.label ?? 'Sin mesa'} · {selectedRes.pax} pax
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_CLASS[selectedRes.status] ?? ''}`}>
                  {STATUS_LABEL[selectedRes.status]}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {selectedRes.customer_phone && (
                  <div className="flex gap-2 text-xs">
                    <i className="ti ti-phone text-gray-400" />
                    <span className="text-gray-600">{selectedRes.customer_phone}</span>
                  </div>
                )}
                {selectedRes.notes && (
                  <div className="flex gap-2 text-xs">
                    <i className="ti ti-notes text-gray-400" />
                    <span className="text-gray-600">{selectedRes.notes}</span>
                  </div>
                )}
                {selectedRes.allergy_alert && (
                  <div className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-2 py-1.5 rounded-lg">
                    <i className="ti ti-alert-triangle" /> {selectedRes.allergy_alert}
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  <button onClick={() => updateStatus(selectedRes.id, 'confirmed')}
                    className="flex-1 bg-brand text-white text-xs font-semibold py-2 rounded-lg hover:bg-brand/90 transition">
                    Confirmar
                  </button>
                  <button onClick={() => { deleteReservation(selectedRes.id); setSelectedRes(null) }}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition text-xs">
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New reservation form */}
          {showForm && (
            <div className="bg-white border-2 border-brand rounded-xl overflow-hidden">
              <div className="bg-brand px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Nueva reserva</span>
                <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white text-xs">✕</button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <input className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand"
                  placeholder="Nombre del cliente" value={newRes.customer_name}
                  onChange={e => setNewRes(p => ({ ...p, customer_name: e.target.value }))} />
                <input className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand"
                  placeholder="+34 6XX XXX XXX" value={newRes.customer_phone}
                  onChange={e => setNewRes(p => ({ ...p, customer_phone: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <select className="px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand"
                    value={newRes.time} onChange={e => setNewRes(p => ({ ...p, time: e.target.value }))}>
                    {TIMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select className="px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand"
                    value={newRes.pax} onChange={e => setNewRes(p => ({ ...p, pax: Number(e.target.value) }))}>
                    {[1,2,3,4,5,6,7,8,9,10,12].map(n => <option key={n} value={n}>{n} personas</option>)}
                  </select>
                </div>
                <input className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand"
                  placeholder="Notas / alergias" value={newRes.notes}
                  onChange={e => setNewRes(p => ({ ...p, notes: e.target.value }))} />
                <button onClick={handleCreate}
                  className="w-full bg-brand text-white text-xs font-bold py-2.5 rounded-lg hover:bg-brand/90 transition">
                  Guardar reserva
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
