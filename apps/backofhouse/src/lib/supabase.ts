import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
})

// ── Demo venue ID (matches seed data) ──────────────────────
export const VENUE_ID = '00000000-0000-0000-0000-000000000001'

// ── TypeScript types ────────────────────────────────────────
export type Venue = {
  id: string; name: string; address: string; city: string
  phone: string; email: string; vat_number: string; plan: string
}

export type Table = {
  id: string; venue_id: string; label: string; section: string
  capacity: number; status: 'free' | 'occupied' | 'reserved' | 'cleaning'
  position_x: number; position_y: number
}

export type Customer = {
  id: string; venue_id: string; name: string; phone?: string
  email?: string; allergies?: string[]; notes?: string
  visits: number; last_visit?: string; vip: boolean
}

export type Reservation = {
  id: string; venue_id: string; table_id?: string; customer_id?: string
  customer_name: string; customer_phone?: string; pax: number
  date: string; time: string
  status: 'confirmed' | 'pending' | 'unconfirmed' | 'cancelled' | 'completed' | 'no_show'
  notes?: string; allergy_alert?: string; created_at: string
  tables?: Table; customers?: Customer
}

export type MenuCategory = { id: string; venue_id: string; name: string; sort_order: number }

export type MenuItem = {
  id: string; venue_id: string; category_id: string; name: string
  description?: string; price: number; vat_rate: number
  tag?: 'popular' | 'nuevo' | 'vegano' | 'sin_gluten' | null; available: boolean
  menu_categories?: MenuCategory
}

export type Order = {
  id: string; venue_id: string; table_id?: string; reservation_id?: string
  status: 'open' | 'sent_to_kitchen' | 'ready' | 'paid' | 'cancelled'
  subtotal: number; vat_amount: number; total: number
  split_by: number; payment_method?: string; created_at: string; closed_at?: string
  tables?: Table; order_items?: OrderItem[]
}

export type OrderItem = {
  id: string; order_id: string; menu_item_id?: string; name: string
  price: number; quantity: number; course?: string
  status: 'pending' | 'cooking' | 'ready' | 'served'; notes?: string
}

export type KitchenTicket = {
  id: string; venue_id: string; order_id: string; table_label: string
  pax: number; status: 'pending' | 'cooking' | 'ready' | 'served'
  sent_at: string; ready_at?: string; served_at?: string
  orders?: Order & { order_items: OrderItem[] }
}

export type Staff = {
  id: string; venue_id: string; name: string; role: string; pin?: string
  phone?: string; email?: string; color: string; color_bg: string
  initials: string; active: boolean
}

export type Shift = {
  id: string; venue_id: string; staff_id: string; date: string
  start_time?: string; end_time?: string
  shift_type: 'morning' | 'afternoon' | 'night' | 'off' | 'leave'; hours: number
  staff?: Staff
}

export type Clocking = {
  id: string; venue_id: string; staff_id: string
  type: 'in' | 'out' | 'break_start' | 'break_end'
  clocked_at: string; staff?: Staff
}

export type LeaveRequest = {
  id: string; venue_id: string; staff_id: string
  start_date: string; end_date: string; days?: number; reason?: string
  status: 'pending' | 'approved' | 'rejected'; created_at: string; staff?: Staff
}

export type DailySales = {
  id: string; venue_id: string; date: string
  total_revenue: number; total_orders: number; avg_ticket: number
  covers: number; table_turns: number
}
