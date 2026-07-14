/* ─────────────────────────────────────────────────────────────
   Una Mesa — sincronización real de carta e inventario con Supabase.
   Antes, carta.jsx y stock.jsx solo vivían en localStorage (window.Store) —
   sin ningún respaldo. Este archivo carga los datos reales al entrar, y
   ofrece funciones de guardado que SIEMPRE devuelven {ok, error} —
   carta.jsx/stock.jsx solo actualizan la pantalla y muestran éxito
   DESPUÉS de confirmar que Supabase aceptó el cambio, nunca antes. Si
   falla, no se toca el estado local y se avisa del error de verdad.
   ───────────────────────────────────────────────────────────── */
(function () {
  async function loadMenuStock() {
    const venueId = window.currentVenueId;
    if (!venueId || !window.sb) return;

    try {
      const [{ data: cats }, { data: items }, { data: stock }] = await Promise.all([
        window.sb.from('menu_categories').select('*').eq('venue_id', venueId).order('sort_order'),
        window.sb.from('menu_items').select('*').eq('venue_id', venueId),
        window.sb.from('stock_items').select('*').eq('venue_id', venueId),
      ]);
      if (cats) window.Store.set('categories', cats);
      if (items) window.Store.set('menu', items);
      if (stock) window.Store.set('stock', stock);
    } catch (e) {
      console.warn('[UNA MESA] loadMenuStock:', e.message || e);
    }
  }

  async function saveMenuCategory(cat) {
    const venueId = window.currentVenueId;
    if (!venueId || !window.sb) return { ok: false, error: 'sin conexión' };
    try {
      const { error } = await window.sb.from('menu_categories').upsert({ ...cat, venue_id: venueId });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || String(e) }; }
  }

  async function saveMenuItem(item) {
    const venueId = window.currentVenueId;
    if (!venueId || !window.sb) return { ok: false, error: 'sin conexión' };
    try {
      const { error } = await window.sb.from('menu_items').upsert({ ...item, venue_id: venueId, updated_at: new Date().toISOString() });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || String(e) }; }
  }

  async function deleteMenuItem(id) {
    if (!window.sb) return { ok: false, error: 'sin conexión' };
    try {
      const { error } = await window.sb.from('menu_items').delete().eq('id', id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || String(e) }; }
  }

  async function saveStockItem(item) {
    const venueId = window.currentVenueId;
    if (!venueId || !window.sb) return { ok: false, error: 'sin conexión' };
    try {
      const { error } = await window.sb.from('stock_items').upsert({ ...item, venue_id: venueId, updated_at: new Date().toISOString() });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || String(e) }; }
  }

  async function deleteStockItem(id) {
    if (!window.sb) return { ok: false, error: 'sin conexión' };
    try {
      const { error } = await window.sb.from('stock_items').delete().eq('id', id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || String(e) }; }
  }

  window.MenuStockSync = {
    loadMenuStock, saveMenuCategory, saveMenuItem, deleteMenuItem, saveStockItem, deleteStockItem,
  };
})();
