/* ─────────────────────────────────────────────────────────────
   Una Mesa — persistent shared store
   Holds all mutable collections outside React so edits survive
   navigation between screens, and mirrors to localStorage so they
   survive a full reload. Cross-module reactive (Carta → TPV, etc).
   ───────────────────────────────────────────────────────────── */
(function () {
  const KEY  = 'unamesa.store.v7';
  const DKEY = 'unamesa.store.seeddate';
  const D    = window.DATA;
  const todayISO = D.iso(D.today);

  // If the seed date has drifted (different calendar day), wipe the store
  // so reservations always start on today's date.
  try {
    const seeded = localStorage.getItem(DKEY);
    if (seeded && seeded !== todayISO) localStorage.removeItem(KEY);
    localStorage.setItem(DKEY, todayISO);
  } catch(e) {}

  const seed = () => JSON.parse(JSON.stringify({
    menu: D.menu,
    categories: D.categories,
    tables: D.tables,
    orders: D.orders,
    reservations: D.reservations,
    kitchen: D.kitchen,
    kitchenHistory: D.kitchenHistory,
    stock: D.stock,
    staff: D.staff,
    rotaPattern: D.rotaPattern,
    leave: D.leave,
    clockState: D.clockState,
  }));

  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state || typeof state !== 'object') state = seed();

  // Re-base kitchen timers to "now" on every boot using stored offset (seconds elapsed)
  const now = Date.now();
  if (Array.isArray(state.kitchen)) {
    state.kitchen.forEach(t => { if (typeof t.offset === 'number') t.sent_at = new Date(now - t.offset * 1000).toISOString(); });
  }

  const listeners = new Set();
  let saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }, 120);
  }
  function emit() { listeners.forEach(fn => fn()); }

  const Store = {
    get(key) { return state[key]; },
    set(key, value) {
      state[key] = typeof value === 'function' ? value(state[key]) : value;
      persist(); emit();
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { state = seed(); persist(); emit(); },
  };

  window.Store = Store;

  // Hook: const [items, setItems] = useStore('menu')  — setItems accepts value or updater fn
  window.useStore = function useStore(key) {
    const [, force] = React.useState(0);
    React.useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
    const set = React.useCallback((v) => Store.set(key, v), [key]);
    return [Store.get(key), set];
  };
})();
