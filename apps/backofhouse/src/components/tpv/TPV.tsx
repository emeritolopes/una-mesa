import { useState } from 'react'
import { useTables, useMenu, useOrders } from '../../hooks/useUnamesa'
import type { Table, MenuItem, Order, OrderItem } from '../../lib/supabase'

const TAG_CLASS: Record<string, string> = {
  popular: 'bg-amber-100 text-amber-700',
  nuevo: 'bg-brand/10 text-brand',
  vegano: 'bg-green-100 text-green-700',
}

export default function TPV() {
  const { data: tables, updateStatus: updateTableStatus } = useTables()
  const { categories, items: menuItems } = useMenu()
  const { data: orders, createOrder, addItem, updateItemQty, sendToKitchen, closeOrder } = useOrders()

  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [activeCat, setActiveCat] = useState<string>('')
  const [splitBy, setSplitBy] = useState(1)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')

  const activeCategory = activeCat || categories[0]?.id || ''

  // Find open order for selected table
  const currentOrder = selectedTable
    ? orders.find(o => o.table_id === selectedTable.id && o.status === 'open')
    : null
  const orderItems: OrderItem[] = (currentOrder as any)?.order_items ?? []

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const vat = subtotal * 0.10
  const total = subtotal + vat

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const handleSelectTable = async (table: Table) => {
    setSelectedTable(table)
    setSplitBy(1)
    // Create order if none exists
    const existing = orders.find(o => o.table_id === table.id && o.status === 'open')
    if (!existing && table.status !== 'free') return
  }

  const handleAddItem = async (item: MenuItem) => {
    if (!selectedTable) { showToast('Selecciona una mesa primero'); return }
    let orderId = currentOrder?.id
    if (!orderId) {
      const { data } = await createOrder(selectedTable.id)
      orderId = data?.id
      await updateTableStatus(selectedTable.id, 'occupied')
    }
    if (!orderId) return
    await addItem(orderId, {
      menu_item_id: item.id, name: item.name, price: item.price,
      quantity: 1, status: 'pending',
      course: (item as any).menu_categories?.name ?? ''
    })
    showToast(`+ ${item.name}`)
  }

  const handleSendToKitchen = async () => {
    if (!currentOrder || !selectedTable) return
    await sendToKitchen(currentOrder.id, selectedTable.label, 0)
    showToast('Comanda enviada a cocina')
  }

  const handleCharge = async (method: string) => {
    if (!currentOrder) return
    await closeOrder(currentOrder.id, method)
    await updateTableStatus(selectedTable!.id, 'free')
    setSelectedTable(null)
    showToast('Cobro completado')
  }

  const filteredItems = menuItems.filter(i =>
    i.category_id === activeCategory &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase()))
  )

  const STATUS_STYLE: Record<string, string> = {
    free:     'bg-white border-black/10 text-gray-400',
    occupied: 'bg-brand/10 border-brand text-brand',
    reserved: 'bg-amber-50 border-amber-400 text-amber-700',
    cleaning: 'bg-gray-100 border-gray-300 text-gray-500',
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Tables */}
      <div className="w-56 flex-shrink-0 bg-gray-50 border-r border-black/7 flex flex-col overflow-hidden">
        <div className="px-4 py-3 bg-white border-b border-black/7">
          <div className="font-['Syne'] text-sm font-black text-gray-900">Sala</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{tables.filter(t=>t.status==='occupied').length} ocupadas</div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 content-start">
          {tables.map(t => {
            const order = orders.find(o => o.table_id === t.id && o.status === 'open')
            const isSelected = selectedTable?.id === t.id
            return (
              <button key={t.id} onClick={() => handleSelectTable(t)}
                className={`rounded-xl py-2.5 px-1 flex flex-col items-center gap-0.5 border-2 transition-all text-xs hover:scale-105
                  ${isSelected ? 'bg-brand border-brand' : STATUS_STYLE[t.status]}`}>
                <span className={`font-['Syne'] text-sm font-black ${isSelected ? 'text-white' : ''}`}>
                  {t.label.replace('Mesa ', '')}
                </span>
                <span className={`text-[9px] ${isSelected ? 'text-white/70' : ''}`}>
                  {t.status === 'free' ? 'Libre' : t.capacity + ' pax'}
                </span>
                {order && (
                  <span className={`text-[9px] font-semibold ${isSelected ? 'text-white/80' : 'text-brand'}`}>
                    €{order.total?.toFixed(0) ?? '0'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border-r border-black/7">
        <div className="px-4 py-3 border-b border-black/7">
          <div className="font-['Syne'] text-sm font-black text-gray-900">Carta</div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {selectedTable ? `Añadiendo a ${selectedTable.label}` : 'Selecciona una mesa'}
          </div>
        </div>
        <div className="flex gap-0 border-b border-black/7 overflow-x-auto">
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all
                ${activeCategory === c.id ? 'text-brand border-brand' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="px-3 py-2 border-b border-black/7">
          <input className="w-full px-3 py-1.5 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand"
            placeholder="Buscar plato..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
          {filteredItems.map(item => (
            <button key={item.id} onClick={() => handleAddItem(item)}
              className="bg-gray-50 rounded-xl p-3 text-left border border-transparent hover:border-brand hover:bg-brand/5 transition-all active:scale-95 flex flex-col gap-1">
              <div className="text-xs font-semibold text-gray-900 leading-snug">{item.name}</div>
              <div className="text-[10px] text-gray-400 leading-snug">{item.description}</div>
              <div className="text-sm font-black text-brand font-['Syne'] mt-1">€{item.price.toFixed(2)}</div>
              {item.tag && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${TAG_CLASS[item.tag] ?? ''}`}>
                  {item.tag}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Order panel */}
      <div className="w-72 flex-shrink-0 bg-white flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-black/7">
          <div className="font-['Syne'] text-sm font-black text-gray-900">
            {selectedTable?.label ?? 'Sin mesa'}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {selectedTable ? (currentOrder ? 'Pedido activo' : 'Nuevo pedido') : 'Selecciona una mesa'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <i className="ti ti-shopping-cart text-3xl mb-2" />
              <span className="text-xs">Sin productos</span>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {orderItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">{item.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateItemQty(item.id, item.quantity - 1)}
                      className="w-5 h-5 rounded border border-black/10 bg-gray-50 text-xs flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition">−</button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateItemQty(item.id, item.quantity + 1)}
                      className="w-5 h-5 rounded border border-black/10 bg-gray-50 text-xs flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition">+</button>
                  </div>
                  <div className="text-xs font-bold text-gray-900 min-w-[40px] text-right">
                    €{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-black/7 p-4 flex flex-col gap-3">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>IVA (10%)</span><span>€{vat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-['Syne'] text-lg font-black text-gray-900 border-t border-black/7 pt-2">
            <span>Total</span>
            <span>€{(total / splitBy).toFixed(2)}{splitBy > 1 ? ` ×${splitBy}` : ''}</span>
          </div>

          {/* Split */}
          <div className="grid grid-cols-4 gap-1.5">
            {[1,2,3,4].map(n => (
              <button key={n} onClick={() => setSplitBy(n)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition
                  ${splitBy === n ? 'bg-brand text-white border-brand' : 'border-black/10 text-gray-500 hover:border-brand hover:text-brand'}`}>
                {n === 1 ? '1' : `÷${n}`}
              </button>
            ))}
          </div>

          <button onClick={handleSendToKitchen} disabled={!currentOrder}
            className="w-full py-2.5 rounded-lg border border-black/10 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-40 flex items-center justify-center gap-2">
            <i className="ti ti-chef-hat" /> Enviar a cocina
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleCharge('card')} disabled={!currentOrder}
              className="py-2.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition disabled:opacity-40 flex items-center justify-center gap-1.5">
              <i className="ti ti-credit-card" /> Tarjeta
            </button>
            <button onClick={() => handleCharge('cash')} disabled={!currentOrder}
              className="py-2.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition disabled:opacity-40 flex items-center justify-center gap-1.5">
              <i className="ti ti-coins" /> Efectivo
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
