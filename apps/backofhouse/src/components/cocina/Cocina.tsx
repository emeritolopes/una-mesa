import { useState, useEffect } from 'react'
import { useKitchen } from '../../hooks/useUnamesa'
import type { KitchenTicket } from '../../lib/supabase'

const STATUS_LABEL: Record<string, string> = { pending: 'Pendiente', cooking: 'En cocina', ready: 'Listo', served: 'Servido' }

function formatTime(sentAt: string) {
  const diff = Math.floor((Date.now() - new Date(sentAt).getTime()) / 1000)
  const m = Math.floor(diff / 60), s = diff % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function TicketCard({ ticket, onAdvance, onItemToggle }: {
  ticket: KitchenTicket
  onAdvance: (id: string, status: string) => void
  onItemToggle: (itemId: string, done: boolean) => void
}) {
  const [elapsed, setElapsed] = useState(formatTime(ticket.sent_at))
  const elapsedSecs = Math.floor((Date.now() - new Date(ticket.sent_at).getTime()) / 1000)
  const isUrgent = elapsedSecs > 900 && ticket.status !== 'ready'

  useEffect(() => {
    if (ticket.status === 'ready') return
    const iv = setInterval(() => setElapsed(formatTime(ticket.sent_at)), 1000)
    return () => clearInterval(iv)
  }, [ticket.sent_at, ticket.status])

  const items = (ticket as any).orders?.order_items ?? []
  const urgClass = ticket.status === 'ready' ? 'border-green-500/40 bg-[#0A1810]' :
    isUrgent ? 'border-red-500/60 bg-[#1A0A08]' :
    ticket.status === 'cooking' ? 'border-blue-400/35 bg-[#0E1520]' :
    'border-amber-400/35 bg-[#1A1608]'

  const numColor = ticket.status === 'ready' ? 'text-green-400' :
    isUrgent ? 'text-red-400' :
    ticket.status === 'cooking' ? 'text-blue-400' : 'text-amber-400'

  const timerColor = numColor
  const pillBg = ticket.status === 'ready' ? 'bg-green-400/10 text-green-400 border-green-400/30' :
    isUrgent ? 'bg-red-400/20 text-red-400 border-red-400/50' :
    ticket.status === 'cooking' ? 'bg-blue-400/10 text-blue-400 border-blue-400/30' :
    'bg-amber-400/10 text-amber-400 border-amber-400/30'

  const btnLabel = { pending: 'Iniciar', cooking: 'Listo', ready: 'Servido', urgent: 'Listo' }
  const nextStatus = isUrgent ? 'urgent' : ticket.status

  return (
    <div className={`rounded-2xl border flex flex-col overflow-hidden ${urgClass} ${isUrgent ? 'animate-pulse-border' : ''}`}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/6">
        <div className={`font-['Syne'] text-xl font-black ${numColor}`}>
          #{String(ticket.id).slice(-4).toUpperCase()}
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-white/80">{ticket.table_label}</div>
          <div className="text-[10px] text-white/35">{ticket.pax} pax</div>
        </div>
      </div>

      <div className="px-4 py-2.5 flex items-center justify-between">
        <div>
          <div className={`font-['Syne'] text-2xl font-black tracking-wide ${timerColor}`}>
            {ticket.status === 'ready' ? '✓' : elapsed}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-white/30">tiempo</div>
        </div>
        <span className={`text-[9px] font-bold px-3 py-1 rounded-full border uppercase tracking-wide ${pillBg}`}>
          {isUrgent ? 'URGENTE' : STATUS_LABEL[ticket.status]}
        </span>
      </div>

      <div className="px-4 pb-3 flex-1 flex flex-col gap-1.5">
        {items.map((item: any) => (
          <div key={item.id} className="flex items-baseline gap-2 cursor-pointer" onClick={() => onItemToggle(item.id, item.status !== 'ready')}>
            <span className="font-['Syne'] text-sm font-bold text-white/40 min-w-[18px]">{item.quantity}×</span>
            <span className={`text-xs ${item.status === 'ready' || item.status === 'served' ? 'line-through text-white/25' : 'text-white/80'}`}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      <div className="px-3 pb-3 flex gap-2">
        <button className="flex-1 py-2 rounded-xl text-[11px] font-semibold border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition">
          Problema
        </button>
        <button onClick={() => onAdvance(ticket.id, ticket.status)}
          className="flex-1 py-2 rounded-xl text-[11px] font-semibold bg-brand/20 border border-brand/40 text-green-400 hover:bg-brand/35 transition">
          {btnLabel[nextStatus as keyof typeof btnLabel] ?? 'Avanzar'}
        </button>
      </div>
    </div>
  )
}

export default function Cocina() {
  const { data: tickets, loading, advanceStatus, updateItemStatus } = useKitchen()
  const [filter, setFilter] = useState('all')
  const [clock, setClock] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setClock([now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2,'0')).join(':'))
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])

  const filtered = tickets.filter(t => {
    if (filter === 'all') return true
    const isUrgent = Math.floor((Date.now() - new Date(t.sent_at).getTime()) / 1000) > 900
    if (filter === 'cooking') return t.status === 'cooking' || isUrgent
    return t.status === filter
  })

  const pending  = tickets.filter(t => t.status === 'pending').length
  const cooking  = tickets.filter(t => t.status === 'cooking').length
  const ready    = tickets.filter(t => t.status === 'ready').length

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0F1410] text-white">
      {/* Topbar */}
      <div className="px-6 py-3.5 flex items-center justify-between border-b border-white/6 bg-[#141C18] flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-['Syne'] text-xl font-black text-white">Cocina</div>
          <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">En directo</span>
          </div>
        </div>
        <div className="flex gap-5">
          {[
            { val: pending, label: 'Pendientes', color: 'text-amber-400' },
            { val: cooking, label: 'En cocina', color: 'text-blue-400' },
            { val: ready,   label: 'Listos',    color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`font-['Syne'] text-2xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/30">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-6 py-2.5 flex items-center gap-2 border-b border-white/6 flex-shrink-0">
        {[
          { key: 'all',     label: 'Todas' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'cooking', label: 'En cocina' },
          { key: 'ready',   label: 'Listos' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition
              ${filter === f.key
                ? f.key === 'pending' ? 'bg-amber-400/15 text-amber-400 border-amber-400/40'
                  : f.key === 'cooking' ? 'bg-blue-400/15 text-blue-400 border-blue-400/40'
                  : f.key === 'ready'   ? 'bg-green-400/15 text-green-400 border-green-400/40'
                  : 'bg-white/8 text-white border-white/25'
                : 'text-white/35 border-white/10 hover:text-white/70'}`}>
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="font-['Syne'] text-xl font-bold text-white/40 tracking-widest">{clock}</div>
      </div>

      {/* Tickets grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="text-white/30 text-sm text-center mt-16">Cargando comandas…</div>
        ) : filtered.length === 0 ? (
          <div className="text-white/20 text-sm text-center mt-16">Sin comandas activas</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {filtered.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onAdvance={advanceStatus}
                onItemToggle={updateItemStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
