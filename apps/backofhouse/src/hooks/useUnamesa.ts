import { useEffect, useState, useCallback } from 'react'
import { supabase, VENUE_ID } from '../lib/supabase'
import type {
  Table, Reservation, MenuItem, MenuCategory, Order, OrderItem,
  KitchenTicket, Staff, Shift, Clocking, LeaveRequest, DailySales
} from '../lib/supabase'

// ── Generic fetch helper ─────────────────────────────────────
function useQuery<T>(
  fetcher: () => Promise<{ data: T[] | null; error: unknown }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: result, error: err } = await fetcher()
    if (err) setError(String(err))
    else setData(result ?? [])
    setLoading(false)
  }, deps)

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, error, refetch: fetch }
}

// ── DASHBOARD ────────────────────────────────────────────────
export function useDailySales() {
  return useQuery<DailySales>(() =>
    supabase.from('daily_sales')
      .select('*')
      .eq('venue_id', VENUE_ID)
      .order('date', { ascending: true })
      .limit(7)
  )
}

export function useTodayStats() {
  const [stats, setStats] = useState({
    revenue: 0, orders: 0, avgTicket: 0, covers: 0, tableTurns: 0,
    occupiedTables: 0, totalTables: 0, activeStaff: 0, kitchenPending: 0
  })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [salesRes, tablesRes, staffRes, kitchenRes] = await Promise.all([
      supabase.from('daily_sales').select('*').eq('venue_id', VENUE_ID).eq('date', today).single(),
      supabase.from('tables').select('status').eq('venue_id', VENUE_ID),
      supabase.from('clockings').select('staff_id').eq('venue_id', VENUE_ID).eq('type', 'in')
        .gte('clocked_at', today),
      supabase.from('kitchen_tickets').select('status').eq('venue_id', VENUE_ID)
        .in('status', ['pending', 'cooking'])
    ])

    const sales = salesRes.data
    const tables = tablesRes.data ?? []
    const occupied = tables.filter(t => t.status === 'occupied').length

    setStats({
      revenue: sales?.total_revenue ?? 0,
      orders: sales?.total_orders ?? 0,
      avgTicket: sales?.avg_ticket ?? 0,
      covers: sales?.covers ?? 0,
      tableTurns: sales?.table_turns ?? 0,
      occupiedTables: occupied,
      totalTables: tables.length,
      activeStaff: staffRes.data?.length ?? 0,
      kitchenPending: kitchenRes.data?.length ?? 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { stats, loading, refetch: fetch }
}

// ── TABLES ────────────────────────────────────────────────────
export function useTables() {
  const q = useQuery<Table>(() =>
    supabase.from('tables').select('*').eq('venue_id', VENUE_ID).order('label')
  )

  const updateStatus = async (id: string, status: Table['status']) => {
    await supabase.from('tables').update({ status }).eq('id', id)
    q.refetch()
  }

  return { ...q, updateStatus }
}

// ── RESERVATIONS ─────────────────────────────────────────────
export function useReservations(date?: string) {
  const targetDate = date ?? new Date().toISOString().split('T')[0]

  const q = useQuery<Reservation>(() =>
    supabase.from('reservations')
      .select('*, tables(label, section), customers(name, vip, allergies)')
      .eq('venue_id', VENUE_ID)
      .eq('date', targetDate)
      .order('time'),
    [targetDate]
  )

  const createReservation = async (res: Omit<Reservation, 'id' | 'venue_id' | 'created_at'>) => {
    const { error } = await supabase.from('reservations').insert({ ...res, venue_id: VENUE_ID })
    if (!error) q.refetch()
    return { error }
  }

  const updateStatus = async (id: string, status: Reservation['status']) => {
    await supabase.from('reservations').update({ status }).eq('id', id)
    q.refetch()
  }

  const deleteReservation = async (id: string) => {
    await supabase.from('reservations').delete().eq('id', id)
    q.refetch()
  }

  return { ...q, createReservation, updateStatus, deleteReservation }
}

// ── MENU ──────────────────────────────────────────────────────
export function useMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const [catsRes, itemsRes] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('venue_id', VENUE_ID).order('sort_order'),
      supabase.from('menu_items').select('*, menu_categories(name)').eq('venue_id', VENUE_ID).eq('available', true)
    ])
    setCategories(catsRes.data ?? [])
    setItems(itemsRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { categories, items, loading, refetch: fetch }
}

// ── ORDERS ────────────────────────────────────────────────────
export function useOrders() {
  const q = useQuery<Order>(() =>
    supabase.from('orders')
      .select('*, tables(label), order_items(*)')
      .eq('venue_id', VENUE_ID)
      .in('status', ['open', 'sent_to_kitchen', 'ready'])
      .order('created_at', { ascending: false })
  )

  const createOrder = async (tableId: string) => {
    const { data, error } = await supabase.from('orders')
      .insert({ venue_id: VENUE_ID, table_id: tableId, status: 'open' })
      .select().single()
    if (!error) q.refetch()
    return { data, error }
  }

  const addItem = async (orderId: string, item: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>) => {
    // Check if item already exists in order
    const { data: existing } = await supabase.from('order_items')
      .select('*').eq('order_id', orderId).eq('name', item.name).single()

    if (existing) {
      await supabase.from('order_items')
        .update({ quantity: existing.quantity + item.quantity })
        .eq('id', existing.id)
    } else {
      await supabase.from('order_items').insert({ ...item, order_id: orderId })
    }
    q.refetch()
  }

  const updateItemQty = async (itemId: string, qty: number) => {
    if (qty <= 0) {
      await supabase.from('order_items').delete().eq('id', itemId)
    } else {
      await supabase.from('order_items').update({ quantity: qty }).eq('id', itemId)
    }
    q.refetch()
  }

  const sendToKitchen = async (orderId: string, tableLabel: string, pax: number) => {
    await supabase.from('orders').update({ status: 'sent_to_kitchen' }).eq('id', orderId)
    await supabase.from('kitchen_tickets').insert({
      venue_id: VENUE_ID, order_id: orderId, table_label: tableLabel,
      pax, status: 'pending'
    })
    q.refetch()
  }

  const closeOrder = async (orderId: string, paymentMethod: string) => {
    const { data: items } = await supabase.from('order_items')
      .select('price, quantity').eq('order_id', orderId)

    const subtotal = (items ?? []).reduce((s, i) => s + i.price * i.quantity, 0)
    const vat = subtotal * 0.10
    const total = subtotal + vat

    await supabase.from('orders').update({
      status: 'paid', payment_method: paymentMethod,
      subtotal, vat_amount: vat, total, closed_at: new Date().toISOString()
    }).eq('id', orderId)

    q.refetch()
  }

  return { ...q, createOrder, addItem, updateItemQty, sendToKitchen, closeOrder }
}

// ── KITCHEN ───────────────────────────────────────────────────
export function useKitchen() {
  const q = useQuery<KitchenTicket>(() =>
    supabase.from('kitchen_tickets')
      .select('*, orders(*, order_items(*))')
      .eq('venue_id', VENUE_ID)
      .not('status', 'eq', 'served')
      .order('sent_at')
  )

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('kitchen_tickets')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'kitchen_tickets',
        filter: `venue_id=eq.${VENUE_ID}`
      }, () => q.refetch())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const advanceStatus = async (id: string, currentStatus: string) => {
    const next: Record<string, string> = {
      pending: 'cooking', cooking: 'ready', ready: 'served'
    }
    const newStatus = next[currentStatus] ?? 'served'
    const updates: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'ready') updates.ready_at = new Date().toISOString()
    if (newStatus === 'served') updates.served_at = new Date().toISOString()
    await supabase.from('kitchen_tickets').update(updates).eq('id', id)
    q.refetch()
  }

  const updateItemStatus = async (itemId: string, done: boolean) => {
    await supabase.from('order_items')
      .update({ status: done ? 'ready' : 'cooking' }).eq('id', itemId)
    q.refetch()
  }

  return { ...q, advanceStatus, updateItemStatus }
}

// ── STAFF ─────────────────────────────────────────────────────
export function useStaff() {
  return useQuery<Staff>(() =>
    supabase.from('staff').select('*').eq('venue_id', VENUE_ID).eq('active', true).order('name')
  )
}

export function useShifts(weekStart: string) {
  return useQuery<Shift>(() =>
    supabase.from('shifts')
      .select('*, staff(*)')
      .eq('venue_id', VENUE_ID)
      .gte('date', weekStart)
      .lt('date', new Date(new Date(weekStart).getTime() + 7 * 86400000).toISOString().split('T')[0])
      .order('date'),
    [weekStart]
  )
}

export function useClockings() {
  const today = new Date().toISOString().split('T')[0]

  const q = useQuery<Clocking>(() =>
    supabase.from('clockings')
      .select('*, staff(*)')
      .eq('venue_id', VENUE_ID)
      .gte('clocked_at', today)
      .order('clocked_at', { ascending: false }),
    [today]
  )

  const clockIn = async (staffId: string) => {
    await supabase.from('clockings').insert({ venue_id: VENUE_ID, staff_id: staffId, type: 'in' })
    q.refetch()
  }

  const clockOut = async (staffId: string) => {
    await supabase.from('clockings').insert({ venue_id: VENUE_ID, staff_id: staffId, type: 'out' })
    q.refetch()
  }

  return { ...q, clockIn, clockOut }
}

export function useLeaveRequests() {
  const q = useQuery<LeaveRequest>(() =>
    supabase.from('leave_requests')
      .select('*, staff(*)')
      .eq('venue_id', VENUE_ID)
      .order('created_at', { ascending: false })
  )

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('leave_requests').update({ status }).eq('id', id)
    q.refetch()
  }

  return { ...q, updateStatus }
}
