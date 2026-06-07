import { useState } from 'react'
import { useStaff, useClockings, useLeaveRequests, useShifts } from '../../hooks/useUnamesa'
import { format, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

const SHIFT_STYLE: Record<string, string> = {
  morning:   'bg-brand/10 text-brand border-brand/20',
  afternoon: 'bg-amber-100 text-amber-700 border-amber-200',
  night:     'bg-purple-100 text-purple-700 border-purple-200',
  off:       'bg-gray-50 text-gray-400 border-gray-200',
  leave:     'bg-red-50 text-red-500 border-red-200',
}
const SHIFT_LABEL: Record<string, string> = {
  morning: '09–17h', afternoon: '13–19h', night: '20–02h', off: 'Libre', leave: 'Baja'
}

export default function Personal() {
  const [tab, setTab] = useState<'turnos' | 'fichajes' | 'vacaciones'>('turnos')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(weekStart + 'T12:00:00'), i))

  const { data: staff } = useStaff()
  const { data: clockings, clockIn, clockOut } = useClockings()
  const { data: leaveRequests, updateStatus: updateLeave } = useLeaveRequests()
  const { data: shifts } = useShifts(weekStart)

  const getStaffStatus = (staffId: string) => {
    const staffClockings = clockings
      .filter(c => c.staff_id === staffId)
      .sort((a, b) => new Date(b.clocked_at).getTime() - new Date(a.clocked_at).getTime())
    const last = staffClockings[0]
    if (!last) return 'out'
    if (last.type === 'in') return 'in'
    if (last.type === 'break_start') return 'break'
    return 'out'
  }

  const getShift = (staffId: string, date: string) => {
    return shifts.find(s => s.staff_id === staffId && s.date === date)
  }

  const getClockInTime = (staffId: string) => {
    const entry = clockings.find(c => c.staff_id === staffId && c.type === 'in')
    return entry ? new Date(entry.clocked_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-black/7 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-black text-gray-900">Personal</h1>
          <p className="text-xs text-gray-500 mt-0.5">{staff.length} empleados · {clockings.filter(c=>c.type==='in').length} fichados hoy</p>
        </div>
        <button className="flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand/90 transition">
          <i className="ti ti-plus" /> Nuevo empleado
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-black/7 px-6">
        {(['turnos', 'fichajes', 'vacaciones'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition capitalize
              ${tab === t ? 'text-brand border-brand' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
            {t === 'turnos' ? 'Turnos semanales' : t === 'fichajes' ? 'Fichajes de hoy' : 'Vacaciones'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* TURNOS */}
        {tab === 'turnos' && (
          <div className="flex flex-col gap-5">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'En turno hoy', val: staff.filter(s => getStaffStatus(s.id) === 'in').length, sub: 'trabajando ahora', color: 'text-brand' },
                { label: 'Horas esta semana', val: shifts.reduce((s,sh)=>s+Number(sh.hours),0) + 'h', sub: 'total equipo', color: 'text-gray-900' },
                { label: 'Coste laboral hoy', val: '—', sub: 'estimado s/ tarifa', color: 'text-gray-900' },
                { label: 'Bajas activas', val: leaveRequests.filter(l=>l.status==='approved').length, sub: 'aprobadas', color: 'text-red-500' },
              ].map(k => (
                <div key={k.label} className="bg-white border border-black/7 rounded-xl p-4">
                  <div className="text-[10px] text-gray-400 font-medium">{k.label}</div>
                  <div className={`font-['Syne'] text-2xl font-black mt-1 ${k.color}`}>{k.val}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Rota table */}
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-black/7 flex items-center justify-between">
                <div className="font-['Syne'] text-sm font-black text-gray-900">Turnos semanales</div>
                <div className="text-xs text-gray-400">
                  {format(weekDates[0], 'd MMM', { locale: es })} – {format(weekDates[6], 'd MMM', { locale: es })}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-left min-w-[160px]">Empleado</th>
                      {weekDates.map(d => (
                        <th key={d.toISOString()} className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-2.5 text-center min-w-[70px]">
                          {format(d, 'EEE d', { locale: es })}
                        </th>
                      ))}
                      <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(s => {
                      const totalHours = shifts.filter(sh => sh.staff_id === s.id).reduce((t,sh)=>t+Number(sh.hours),0)
                      return (
                        <tr key={s.id} className="border-t border-black/5 hover:bg-gray-50 transition">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                style={{ background: s.color_bg, color: s.color }}>{s.initials}</div>
                              <div>
                                <div className="text-xs font-semibold text-gray-900">{s.name}</div>
                                <div className="text-[10px] text-gray-400">{s.role}</div>
                              </div>
                            </div>
                          </td>
                          {weekDates.map(d => {
                            const dateStr = d.toISOString().split('T')[0]
                            const shift = getShift(s.id, dateStr)
                            const type = shift?.shift_type ?? 'off'
                            return (
                              <td key={dateStr} className="py-2 px-1 text-center">
                                <span className={`text-[9px] font-semibold px-2 py-1 rounded-lg border inline-block ${SHIFT_STYLE[type]}`}>
                                  {SHIFT_LABEL[type]}
                                </span>
                              </td>
                            )
                          })}
                          <td className="px-5 py-3 text-xs font-semibold text-gray-500 text-right">{totalHours}h</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FICHAJES */}
        {tab === 'fichajes' && (
          <div className="grid grid-cols-[1fr_320px] gap-4">
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-black/7">
                <div className="font-['Syne'] text-sm font-black text-gray-900">Fichajes en tiempo real</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                </div>
              </div>
              <div className="divide-y divide-black/5">
                {staff.map(s => {
                  const status = getStaffStatus(s.id)
                  const clockTime = getClockInTime(s.id)
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: s.color_bg, color: s.color }}>{s.initials}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{s.name}</div>
                        <div className="text-[10px] text-gray-400">{s.role} · Entrada: {clockTime}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                        ${status === 'in' ? 'bg-green-100 text-green-700' :
                          status === 'break' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'}`}>
                        {status === 'in' ? 'Trabajando' : status === 'break' ? 'Descanso' : 'Sin fichar'}
                      </span>
                      <div className="flex gap-1.5">
                        <button onClick={() => clockIn(s.id)}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition font-semibold">
                          Entrada
                        </button>
                        <button onClick={() => clockOut(s.id)}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 border border-black/10 hover:bg-gray-100 transition font-semibold">
                          Salida
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-black/7 rounded-xl p-4">
                <div className="font-['Syne'] text-sm font-black text-gray-900 mb-3">Resumen</div>
                {[
                  { label: 'Trabajando', val: staff.filter(s=>getStaffStatus(s.id)==='in').length, color: 'text-brand' },
                  { label: 'En descanso', val: staff.filter(s=>getStaffStatus(s.id)==='break').length, color: 'text-amber-500' },
                  { label: 'Sin fichar', val: staff.filter(s=>getStaffStatus(s.id)==='out').length, color: 'text-gray-400' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-2 border-b border-black/5 last:border-0">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VACACIONES */}
        {tab === 'vacaciones' && (
          <div className="grid grid-cols-[1fr_320px] gap-4">
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-black/7">
                <div className="font-['Syne'] text-sm font-black text-gray-900">Solicitudes de ausencia</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {leaveRequests.filter(l=>l.status==='pending').length} pendientes de aprobación
                </div>
              </div>
              {leaveRequests.length === 0 ? (
                <div className="px-5 py-8 text-sm text-gray-400 text-center">Sin solicitudes pendientes</div>
              ) : (
                <div className="divide-y divide-black/5">
                  {leaveRequests.map(req => {
                    const s = (req as any).staff
                    return (
                      <div key={req.id} className="flex items-center gap-3 px-5 py-3.5">
                        {s && (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ background: s.color_bg, color: s.color }}>{s.initials}</div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{s?.name ?? 'Empleado'}</div>
                          <div className="text-[10px] text-gray-400">
                            {req.start_date} – {req.end_date}
                            {req.days ? ` · ${req.days} días` : ''}
                            {req.reason ? ` · ${req.reason}` : ''}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full
                          ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            'bg-amber-100 text-amber-700'}`}>
                          {req.status === 'approved' ? 'Aprobada' : req.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                        </span>
                        {req.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => updateLeave(req.id, 'approved')}
                              className="w-7 h-7 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition flex items-center justify-center">
                              <i className="ti ti-check text-sm" />
                            </button>
                            <button onClick={() => updateLeave(req.id, 'rejected')}
                              className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition flex items-center justify-center">
                              <i className="ti ti-x text-sm" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Days remaining */}
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-4 py-3.5 border-b border-black/7">
                <div className="font-['Syne'] text-sm font-black text-gray-900">Días disponibles 2026</div>
                <div className="text-[10px] text-gray-400">30 días por empleado</div>
              </div>
              <div className="divide-y divide-black/5">
                {staff.map(s => {
                  const used = leaveRequests
                    .filter(l => l.staff_id === s.id && l.status === 'approved')
                    .reduce((t, l) => t + (l.days ?? 0), 0)
                  const pct = Math.round((used / 30) * 100)
                  return (
                    <div key={s.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{ background: s.color_bg, color: s.color }}>{s.initials}</div>
                          <span className="text-xs font-medium text-gray-900">{s.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{used}/30</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pct > 70 ? '#E85D3A' : pct > 40 ? '#F4A72E' : '#1A6B55' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
