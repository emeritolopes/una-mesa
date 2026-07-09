/* ─────────────────────────────────────────────────────────────
   Una Mesa — modules: Reservas · TPV · Cocina · Personal
   All state lives in the persistent Store (survives navigation + reload)
   ───────────────────────────────────────────────────────────── */

function mapSupaRes(r) {
  return {
    id:             String(r.id),
    customer_name:  r.customer_name || 'Cliente',
    customer_phone: r.customer_phone || '',
    pax:            Number(r.pax) || 2,
    time:           r.time || '14:00:00',
    date:           r.date || '',
    status:         r.status || 'confirmed',
    table:          r.table_label || r.table || '',
    notes:          r.notes || '',
    allergy_alert:  '',
    customer_id:    r.customer_id || null,
    customer_email: r.customer_email || null,
  };
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DSHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DCAP = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const fmtDM = (d) => `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
const STAFF_COLORS = [
  { color: '#D8552E', color_bg: '#F6E3DB' },
  { color: '#7C3AED', color_bg: '#EDE9FE' },
  { color: '#0369A1', color_bg: '#DBEAFE' },
  { color: '#B45309', color_bg: '#FEF3C7' },
  { color: '#15803D', color_bg: '#DCFCE7' },
];

/* ========================= TIMELINE VIEW ========================= */
function TimelineView({ reservations, tables }) {
  const HOUR_START = 12, HOUR_END = 24, COL_W = 72, ROW_H = 48;
  const DINING_MIN = 90;
  const toMin = (t) => { const [h, m] = (t || '00:00').split(':').map(Number); return h * 60 + m; };
  const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  const tableLabels = tables.map(t => t.label);
  const unassigned = reservations.filter(r => !r.table);

  const nowMin = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  const nowLeft = (nowMin - HOUR_START * 60) / 60 * COL_W;
  const showNow = nowMin >= HOUR_START * 60 && nowMin <= HOUR_END * 60;

  return (
    <div className="overflow-auto h-full bg-gray-50">
      <div style={{ minWidth: HOURS.length * COL_W + 140 }}>
        {/* Header — hours */}
        <div className="flex sticky top-0 z-20 bg-white border-b border-black/7 shadow-sm">
          <div style={{ width: 140, flexShrink: 0 }} className="border-r border-black/7 flex items-center px-3 py-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mesa</span>
          </div>
          {HOURS.map(h => (
            <div key={h} style={{ width: COL_W, flexShrink: 0 }} className="text-[10px] font-semibold text-gray-400 text-center py-2 border-r border-black/5">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Table rows */}
        <div className="relative">
          {/* "Ahora" indicator */}
          {showNow && (
            <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: 140 + nowLeft }}>
              <div className="w-px h-full bg-brand/60" />
              <div className="absolute top-1 -translate-x-1/2 bg-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                {String(new Date().getHours()).padStart(2,'0')}:{String(new Date().getMinutes()).padStart(2,'0')}
              </div>
            </div>
          )}

          {tableLabels.map((label, ri) => {
            const tableRes = reservations.filter(r => r.table === label);
            return (
              <div key={label} className="flex border-b border-black/5 hover:bg-white/60 transition" style={{ height: ROW_H }}>
                <div style={{ width: 140, flexShrink: 0 }} className="border-r border-black/7 px-3 flex items-center">
                  <span className="text-xs font-medium text-gray-700 truncate">{label}</span>
                </div>
                <div className="flex-1 relative">
                  {/* Hour grid lines */}
                  {HOURS.map((h, i) => (
                    <div key={h} className="absolute top-0 bottom-0 border-r border-black/5" style={{ left: i * COL_W, width: COL_W }} />
                  ))}
                  {/* Half-hour lines */}
                  {HOURS.map((h, i) => (
                    <div key={'h'+h} className="absolute top-0 bottom-0 border-r border-black/[0.03]" style={{ left: i * COL_W + COL_W / 2 }} />
                  ))}
                  {/* Reservation bars */}
                  {tableRes.map(r => {
                    const startMin = toMin(r.time.slice(0, 5));
                    const left = Math.max(0, (startMin - HOUR_START * 60) / 60 * COL_W);
                    const width = Math.max(24, DINING_MIN / 60 * COL_W);
                    const cls = r.status === 'confirmed'
                      ? 'bg-brand/15 border-brand/40 text-brand'
                      : r.status === 'no_show'
                      ? 'bg-red-100 border-red-300 text-red-600'
                      : 'bg-gray-100 border-gray-300 text-gray-600';
                    return (
                      <div key={r.id}
                        className={`absolute top-1.5 bottom-1.5 rounded-lg border px-2 flex items-center gap-1.5 overflow-hidden ${cls}`}
                        style={{ left, width }}
                        title={`${r.customer_name} · ${r.time.slice(0,5)} · ${r.pax} pax${r.notes ? ' · '+r.notes : ''}`}>
                        <span className="text-[10px] font-semibold truncate">{r.customer_name}</span>
                        <span className="text-[9px] opacity-60 whitespace-nowrap flex-shrink-0">{r.pax}p</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Unassigned row */}
          {unassigned.length > 0 && (
            <div className="flex border-t border-dashed border-black/10" style={{ minHeight: ROW_H }}>
              <div style={{ width: 140, flexShrink: 0 }} className="border-r border-black/7 px-3 flex items-center">
                <span className="text-[11px] font-medium text-gray-400 italic">Sin mesa</span>
              </div>
              <div className="flex-1 flex flex-wrap gap-1.5 items-center px-3 py-2">
                {unassigned.map(r => (
                  <span key={r.id} className="text-[10px] bg-white border border-black/10 text-gray-600 px-2 py-1 rounded-full font-medium">
                    {r.customer_name} {r.time.slice(0,5)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================= RESERVAS ========================= */
function GapModal({ info, onClose }) {
  if (!info) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-50 px-5 py-4 flex items-center gap-3 border-b border-blue-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><i className="ti ti-info-circle text-xl" /></div>
          <div>
            <div className="font-['Syne'] text-base font-black text-blue-700">Aviso de disponibilidad</div>
            <div className="text-[11px] text-blue-400">{info.table}</div>
          </div>
        </div>
        <div className="p-5 text-sm text-gray-600 leading-relaxed">
          La siguiente reserva en <span className="font-semibold text-gray-900">{info.table}</span> es a las <span className="font-semibold text-gray-900">{info.nextTime}</span>. Tienes <span className="font-semibold text-gray-900">{info.gapStr}</span> de margen — la mesa se reserva por 2 horas.
        </div>
        <div className="p-5 pt-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-black/10 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={info.onConfirm} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition">OK, proceder</button>
        </div>
      </div>
    </div>
  );
}

function ClashAlert({ info, onClose }) {
  if (!info) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="bg-red-50 px-5 py-4 flex items-center gap-3 border-b border-red-100">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0"><i className="ti ti-alert-triangle text-xl" /></div>
          <div>
            <div className="font-['Syne'] text-base font-black text-red-700">Mesa ya reservada</div>
            <div className="text-[11px] text-red-500">Solapamiento de horario</div>
          </div>
        </div>
        <div className="p-5 text-sm text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-900">{info.table}</span> ya está ocupada por <span className="font-semibold text-gray-900">{info.name}</span> a las <span className="font-semibold text-gray-900">{info.time}</span>. Cada reserva mantiene la mesa durante 1h 45min.
        </div>
        <div className="p-5 pt-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition">Entendido</button>
        </div>
      </div>
    </div>
  );
}

function MonthCalendar({ anchorDate, selectedISO, todayISO, countOn, onPick, onClose }) {
  const D = window.DATA;
  const [view, setView] = useState(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
  const y = view.getFullYear(), m = view.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const wd = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full mt-2 z-50 w-[280px] bg-white border border-black/10 rounded-2xl shadow-xl p-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2 px-1">
          <button onClick={() => setView(new Date(y, m - 1, 1))} className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center"><i className="ti ti-chevron-left" /></button>
          <div className="font-['Syne'] text-sm font-black text-gray-900 capitalize">{MONTHS[m]} {y}</div>
          <button onClick={() => setView(new Date(y, m + 1, 1))} className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center"><i className="ti ti-chevron-right" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {wd.map((w, i) => <div key={i} className="text-[9px] font-bold text-gray-400 text-center py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const iso = D.iso(new Date(y, m, day));
            const isSel = iso === selectedISO; const isToday = iso === todayISO; const cnt = countOn(iso);
            return (
              <button key={i} onClick={() => onPick(iso)}
                className={`aspect-square rounded-lg text-xs font-medium flex flex-col items-center justify-center relative transition
                  ${isSel ? 'bg-brand text-white' : isToday ? 'bg-brand/10 text-brand font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                {day}
                {cnt > 0 && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-brand'}`} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Reservas() {
  const D = window.DATA;
  const todayISO = D.iso(D.today);
  const [list, setList] = useStore('reservations');
  const [tables] = useStore('tables');
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [selectedRes, setSelectedRes] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showMonth, setShowMonth] = useState(false);
  const [clashInfo, setClashInfo] = useState(null);
  const [gapModal, setGapModal] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [quickTipModal, setQuickTipModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null); // reservation pending delete confirmation
  const [viewMode, setViewMode] = useState('lista'); // 'lista' | 'timeline'
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const nowMin = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  const isToday = selectedDate === todayISO;
  const isPastTime = (t) => isToday && toMin(t) < nowMin;
  const futureTimes = D.TIMES.filter(t => !isPastTime(t));
  // default new booking time = first future slot
  const defaultTime = futureTimes[0] || '14:00';
  const [nr, setNr] = useState({ customer_name: '', customer_phone: '', pax: 2, time: defaultTime, notes: '', table: '' });
  const [customerProfile, setCustomerProfile] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({});
  const [customerHistory, setCustomerHistory] = useState([]);
  const stripRef = useRef(null);

  /* Load all reservations from Supabase on mount */
  useEffect(() => {
    async function load() {
      if (!window.sb) return;
      try {
        const { data, error } = await window.sb
          .from('reservations')
          .select('*')
          .neq('status', 'cancelled')
          .order('date', { ascending: true });
        if (error) { console.warn('[BOH] loadReservations:', error.message); return; }
        setList((data || []).map(mapSupaRes));
      } catch(e) {
        console.warn('[BOH] loadReservations:', e.message);
      }
    }
    load();
  }, []);

  /* Load customer profile + history when selected reservation changes */
  useEffect(() => {
    setCustomerProfile(null);
    setCustomerHistory([]);
    if (!selectedRes?.customer_id) return;
    window.sb
      .from('customers')
      .select('*')
      .eq('id', selectedRes.customer_id)
      .single()
      .then(({ data }) => { if (data) setCustomerProfile(data); });
    window.sb
      .from('reservations')
      .select('date, time, pax, status, notes')
      .eq('customer_id', selectedRes.customer_id)
      .order('date', { ascending: false })
      .limit(8)
      .then(({ data }) => { if (data) setCustomerHistory(data); });
  }, [selectedRes?.id]);

  /* Init form when profile loads */
  useEffect(() => {
    if (customerProfile) {
      setCustomerForm({
        notes: customerProfile.notes || '',
        allergies: (customerProfile.allergies || []).join(', '),
        vip: customerProfile.vip || false
      });
      setEditingCustomer(false);
    }
  }, [customerProfile]);

  const STATUS_LABEL = { confirmed: 'Confirmada', unconfirmed: 'Sin confirmar', no_show: 'No show', completed: 'Completada', cancelled: 'Cancelada' };
  const STATUS_CLASS = { confirmed: 'bg-green-100 text-green-800 border-green-300', unconfirmed: 'bg-gray-100 text-gray-600 border-gray-300', no_show: 'bg-red-100 text-red-700 border-red-200', completed: 'bg-blue-100 text-blue-700 border-blue-300', cancelled: 'bg-gray-100 text-gray-500 border-gray-300' };

  const sel = new Date(selectedDate + 'T12:00:00');
  // Strip shows today + future days of the selected month only
  const daysInMonth = new Date(sel.getFullYear(), sel.getMonth() + 1, 0).getDate();
  const today0 = new Date(todayISO + 'T12:00:00');
  const stripDays = Array.from({ length: daysInMonth }, (_, i) => new Date(sel.getFullYear(), sel.getMonth(), i + 1))
    .filter(d => d >= today0 || D.iso(d) === todayISO);
  const countOn = (iso) => list.filter(r => r.date === iso).length;
  const reservations = [...list.filter(r => r.date === selectedDate)].sort((a, b) => a.time.localeCompare(b.time));
  const scrollStrip = (dir) => { if (stripRef.current) stripRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' }); };

  // scroll strip to today on first mount, then to selectedDate on change
  useEffect(() => {
    if (!stripRef.current) return;
    const idx = stripDays.findIndex(d => D.iso(d) === selectedDate);
    if (idx < 0) return;
    const left = Math.max(0, idx * 66 - 20);
    if (selectedDate === todayISO) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (stripRef.current) stripRef.current.scrollLeft = 0;
        });
      });
    } else {
      stripRef.current.scrollTo({ left, behavior: 'smooth' });
    }
  }, [selectedDate]);

  // Tables are held for 2 hours; two bookings clash if their windows overlap
  const DINING_MIN = 90;
  const tableClash = (date, time, table, ignoreId) => {
    if (!table) return null;
    const s = toMin(time.slice(0, 5)), e = s + DINING_MIN;
    return list.find(r => r.id !== ignoreId && r.date === date && r.table === table
      && s < toMin(r.time.slice(0, 5)) + DINING_MIN && toMin(r.time.slice(0, 5)) < e) || null;
  };
  // next booking on a table AFTER the given time
  const nextBookingOn = (date, time, table) => {
    if (!table) return null;
    const s = toMin(time.slice(0, 5));
    return list
      .filter(r => r.date === date && r.table === table && toMin(r.time.slice(0, 5)) > s)
      .sort((a, b) => toMin(a.time.slice(0, 5)) - toMin(b.time.slice(0, 5)))[0] || null;
  };
  const tableOptions = tables.map(t => t.label);
  const capOf = (label) => { const t = tables.find(x => x.label === label); return t ? t.capacity : null; };

  const saveCustomer = async () => {
    if (!customerProfile?.id) return;
    const allergiesArr = customerForm.allergies
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);
    await window.sb.from('customers').update({
      notes: customerForm.notes || null,
      allergies: allergiesArr,
      vip: customerForm.vip
    }).eq('id', customerProfile.id);
    setCustomerProfile(prev => ({ ...prev, notes: customerForm.notes, allergies: allergiesArr, vip: customerForm.vip }));
    setEditingCustomer(false);
  };

  const create = (skipTip = false) => {
    if (!nr.customer_name.trim()) { toast('Indica el nombre'); return; }
    if (isPastTime(nr.time)) { toast('No puedes reservar en el pasado'); return; }
    const clash = tableClash(selectedDate, nr.time, nr.table);
    if (clash) { setClashInfo({ table: nr.table, name: clash.customer_name, time: clash.time.slice(0, 5) }); return; }
    if (!skipTip && nr.table) {
      const next = nextBookingOn(selectedDate, nr.time, nr.table);
      if (next) {
        const gap = toMin(next.time.slice(0, 5)) - toMin(nr.time);
        if (gap >= 90 && gap < 150) {
          setQuickTipModal({ table: nr.table, nextTime: next.time.slice(0, 5), onConfirm: () => { setQuickTipModal(null); create(true); } });
          return;
        }
      }
    }
    const cap = capOf(nr.table);
    if (cap && Number(nr.pax) > cap) { toast(`${nr.table} admite máximo ${cap} comensales`); return; }
    const rec = { id: 'r' + Date.now(), ...nr, pax: Number(nr.pax), time: nr.time + ':00', status: 'confirmed', allergy_alert: '', date: selectedDate };
    setList(arr => [...arr, rec]);
    setShowForm(false); setNr({ customer_name: '', customer_phone: '', pax: 2, time: defaultTime, notes: '', table: '' });
    toast('Reserva guardada');
  };
  const patch = async (id, fields) => {
    setList(arr => arr.map(r => r.id === id ? { ...r, ...fields } : r));
    setSelectedRes(s => s && s.id === id ? { ...s, ...fields } : s);
    if (window.sb) {
      try {
        const { error } = await window.sb.from('reservations').update(fields).eq('id', id);
        if (error) console.warn('[BOH] patch reservation:', error.message);
      } catch(e) {
        console.warn('[BOH] patch reservation:', e.message);
      }
    }
  };
  const authHeader = async () => {
    const { data } = await window.sb.auth.getSession();
    return 'Bearer ' + (data?.session?.access_token || '');
  };
  const del = async (id) => {
    try {
      const res = await fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/cancel-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': await authHeader() },
        body: JSON.stringify({ reservation_id: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || 'No se pudo cancelar la reserva');
        return;
      }
    } catch (e) {
      toast('No se pudo cancelar la reserva');
      return;
    }
    setList(arr => arr.filter(r => r.id !== id));
    setSelectedRes(null);
    setConfirmDel(null);
    toast('Reserva cancelada');
  };
  /* completed / no_show — captura el depósito de verdad vía Stripe, no un
     simple cambio de etiqueta. Antes, los botones de esta pantalla hacían
     un update directo a la tabla que nunca tocaba Stripe — el depósito se
     quedaba retenido para siempre porque auto-capture excluye status
     no_show/completed asumiendo que ya se procesaron. */
  const markStatus = async (id, status) => {
    try {
      const res = await fetch('https://rkaytcmyaaighozxatod.supabase.co/functions/v1/mark-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': await authHeader() },
        body: JSON.stringify({ reservation_id: id, status }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || 'No se pudo actualizar la reserva');
        return;
      }
      patch(id, { status: json.status, deposit_status: json.deposit_status });
      toast(status === 'no_show' ? 'Marcada como no show — depósito cobrado' : 'Marcada como completada — depósito cobrado');
    } catch (e) {
      toast('No se pudo actualizar la reserva');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ClashAlert info={clashInfo} onClose={() => setClashInfo(null)} />
      {confirmDel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="bg-red-50 px-5 py-4 flex items-center gap-3 border-b border-red-100">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0"><i className="ti ti-trash text-xl" /></div>
              <div>
                <div className="font-['Syne'] text-base font-black text-red-700">¿Eliminar reserva?</div>
                <div className="text-[11px] text-red-400">Esta acción no se puede deshacer</div>
              </div>
            </div>
            <div className="p-5 text-sm text-gray-600 leading-relaxed">
              Vas a eliminar la reserva de <span className="font-semibold text-gray-900">{confirmDel.customer_name}</span>{confirmDel.table ? <> en <span className="font-semibold text-gray-900">{confirmDel.table}</span></> : null} a las <span className="font-semibold text-gray-900">{confirmDel.time.slice(0, 5)}</span>. ¿Estás seguro?
            </div>
            <div className="p-5 pt-0 flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl border border-black/10 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={() => del(confirmDel.id)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
      {quickTipModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setQuickTipModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-50 px-5 py-4 flex items-center gap-3 border-b border-blue-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><i className="ti ti-clock text-xl" /></div>
              <div>
                <div className="font-['Syne'] text-base font-black text-blue-700">Mesa con tiempo limitado</div>
                <div className="text-[11px] text-blue-400">{quickTipModal.table}</div>
              </div>
            </div>
            <div className="p-5 text-sm text-gray-600 leading-relaxed">
              La siguiente reserva en <span className="font-semibold text-gray-900">{quickTipModal.table}</span> es a las <span className="font-semibold text-gray-900">{quickTipModal.nextTime}</span>. Puedes ofrecer esta mesa por <span className="font-semibold text-gray-900">1 hora</span>.
            </div>
            <div className="p-5 pt-0 flex gap-2">
              <button onClick={() => setQuickTipModal(null)} className="flex-1 py-2.5 rounded-xl border border-black/10 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={quickTipModal.onConfirm} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition">OK, reservar</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border-b border-black/7 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-black text-gray-900">Reservas</h1>
          <p className="text-xs text-gray-500 mt-0.5">{reservations.length} reservas · {fmtDM(sel)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[['lista','ti-list','Lista'],['timeline','ti-layout-columns','Timeline']].map(([m,ic,lb]) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${viewMode===m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <i className={`ti ${ic} text-sm`} />{lb}
              </button>
            ))}
          </div>
          <button onClick={() => { setShowForm(true); setSelectedRes(null); setShowMonth(false); }} className="flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap hover:bg-brand/90 transition">
            <i className="ti ti-plus" /> Nueva reserva
          </button>
        </div>
      </div>

      {/* Scrollable date strip */}
      <div className="bg-white border-b border-black/7 px-4 py-3 flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <button onClick={() => setShowMonth(s => !s)} className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap border transition ${showMonth ? 'bg-brand text-white border-brand' : 'border-black/10 text-gray-600 hover:border-brand hover:text-brand'}`}>
            <i className="ti ti-calendar-month" /> Ver mes
          </button>
          {showMonth && (
            <MonthCalendar anchorDate={sel} selectedISO={selectedDate} todayISO={todayISO} countOn={countOn}
              onPick={(iso) => { setSelectedDate(iso); setSelectedRes(null); setShowForm(false); setShowMonth(false); }}
              onClose={() => setShowMonth(false)} />
          )}
        </div>
        <div className="text-xs font-bold text-gray-700 capitalize whitespace-nowrap px-1 flex-shrink-0" style={{ minWidth: 70 }}>{MONTHS[sel.getMonth()].slice(0, 3)} {sel.getFullYear()}</div>
        <button onClick={() => scrollStrip(-1)} className="w-8 h-8 rounded-lg border border-black/10 text-gray-500 hover:bg-gray-50 hover:text-brand transition flex items-center justify-center flex-shrink-0"><i className="ti ti-chevron-left" /></button>
        <div ref={stripRef} className="flex gap-2 overflow-x-auto flex-1 scroll-smooth no-scrollbar">
          {stripDays.map(d => {
            const ds = D.iso(d); const isSel = ds === selectedDate; const isToday = ds === todayISO; const cnt = countOn(ds);
            return (
              <button key={ds} onClick={() => { setSelectedDate(ds); setSelectedRes(null); setShowForm(false); }}
                className={`flex-shrink-0 w-[58px] h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all relative
                  ${isSel ? 'bg-brand border-brand text-white' : isToday ? 'border-brand bg-brand/5 text-brand' : 'border-black/8 hover:bg-gray-50 text-gray-600'}`}>
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">{DSHORT[d.getDay()]}</span>
                <span className="font-['Syne'] text-lg font-black leading-none">{d.getDate()}</span>
                {cnt > 0 && <span className={`text-[8px] font-bold px-1 rounded-full ${isSel ? 'bg-white/25 text-white' : 'bg-brand/15 text-brand'}`}>{cnt}</span>}
              </button>
            );
          })}
        </div>
        <button onClick={() => scrollStrip(1)} className="w-8 h-8 rounded-lg border border-black/10 text-gray-500 hover:bg-gray-50 hover:text-brand transition flex items-center justify-center flex-shrink-0"><i className="ti ti-chevron-right" /></button>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_320px]">
        <div className="overflow-hidden border-r border-black/7 flex flex-col">
          {viewMode === 'timeline' && (
            <TimelineView reservations={reservations} tables={tables} />
          )}
          {viewMode === 'lista' && <div className="overflow-y-auto flex-1">{D.TIMES.map(time => {
            const slots = reservations.filter(r => r.time.slice(0, 5) === time);
            const past = isPastTime(time);
            const isNowSlot = isToday && toMin(time) <= nowMin && nowMin < toMin(time) + 30;
            return (
              <div key={time} className={`flex border-b border-black/5 min-h-14 relative ${past ? 'opacity-40' : ''}`}>
                {isNowSlot && (
                  <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${((nowMin - toMin(time)) / 30) * 100}%` }}>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0 ml-[3.5rem]" />
                      <div className="flex-1 h-px bg-brand opacity-70" />
                      <span className="text-[9px] font-bold text-brand pr-2 flex-shrink-0">{String(new Date().getHours()).padStart(2,'0')}:{String(new Date().getMinutes()).padStart(2,'0')}</span>
                    </div>
                  </div>
                )}
                <div className="w-16 flex-shrink-0 px-4 py-4 text-xs font-medium text-gray-400 border-r border-black/5">{time}</div>
                <div className="flex-1 p-2 flex flex-wrap gap-2 content-start">
                  {slots.map(r => (
                    <div key={r.id} onClick={() => { setSelectedRes(r); setShowForm(false); }}
                      className={`rounded-lg px-3 py-2 cursor-pointer border-l-2 min-w-[140px] hover:opacity-80 transition
                        ${r.status === 'confirmed' ? 'bg-brand/8 border-brand' : r.status === 'no_show' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'}`}>
                      <div className={`text-xs font-semibold ${r.status === 'confirmed' ? 'text-brand' : r.status === 'no_show' ? 'text-red-500 line-through' : 'text-gray-500'}`}>{r.customer_name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{r.table || 'Sin mesa'} · {r.pax} pax</div>
                    </div>
                  ))}
                  {slots.length === 0 && <span className="text-[11px] text-gray-300 py-4 px-2">Sin reservas</span>}
                </div>
              </div>
            );
          })}</div>}
        </div>

        <div className="overflow-y-auto min-h-0 p-4 flex flex-col gap-4">
          <div className="bg-white border border-black/7 rounded-xl p-4">
            <div className="font-['Syne'] text-sm font-bold text-gray-900 mb-3">Resumen del día</div>
            {[
              { label: 'Confirmadas', val: reservations.filter(r => r.status === 'confirmed').length, color: 'text-brand' },
              { label: 'Sin confirmar', val: reservations.filter(r => r.status === 'unconfirmed').length, color: 'text-gray-500' },
              { label: 'No show', val: reservations.filter(r => r.status === 'no_show').length, color: 'text-red-500' },
              { label: 'Total comensales', val: reservations.reduce((s, r) => s + r.pax, 0), color: 'text-gray-900' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                <span className="text-xs text-gray-500">{s.label}</span><span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
              </div>
            ))}
          </div>

          {selectedRes && !showForm && (
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-black/7 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 truncate">{selectedRes.customer_name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{selectedRes.time.slice(0, 5)} · {selectedRes.pax} pax</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 whitespace-nowrap ${STATUS_CLASS[selectedRes.status] || ''}`}>{STATUS_LABEL[selectedRes.status]}</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {selectedRes.customer_phone && <div className="flex gap-2 text-xs"><i className="ti ti-phone text-gray-400" /><span className="text-gray-600">{selectedRes.customer_phone}</span></div>}
                {selectedRes.notes && <div className="flex gap-2 text-xs"><i className="ti ti-notes text-gray-400" /><span className="text-gray-600">{selectedRes.notes}</span></div>}
                {selectedRes.allergy_alert && <div className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-2 py-1.5 rounded-lg"><i className="ti ti-alert-triangle" /> {selectedRes.allergy_alert}</div>}
                {customerProfile && (
                  <div className="mt-1 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">👤 Perfil del cliente</p>
                      <button
                        onClick={() => editingCustomer ? saveCustomer() : setEditingCustomer(true)}
                        className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + (editingCustomer ? 'bg-green-500 text-white' : 'bg-orange-200 text-orange-700')}
                      >{editingCustomer ? '✓ Guardar' : 'Editar'}</button>
                    </div>
                    {!editingCustomer && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-400">Visitas</p>
                          <p className="text-sm font-bold text-gray-800">{customerProfile.visits || 1}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Última visita</p>
                          <p className="text-sm font-bold text-gray-800">{customerProfile.last_visit || '—'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-400">Alergias</p>
                          <p className={'text-sm font-bold ' + (customerProfile.allergies?.length ? 'text-red-600' : 'text-gray-400')}>{customerProfile.allergies?.join(', ') || 'Ninguna'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-400">Notas</p>
                          <p className="text-sm text-gray-700">{customerProfile.notes || '—'}</p>
                        </div>
                        {customerProfile.vip && (
                          <div className="col-span-2 mt-1">
                            <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-full">⭐ Cliente VIP</span>
                          </div>
                        )}
                      </div>
                    )}
                    {editingCustomer && (
                      <div className="flex flex-col gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-0.5">Alergias (separadas por coma)</label>
                          <input
                            type="text"
                            value={customerForm.allergies}
                            onChange={e => setCustomerForm(p => ({ ...p, allergies: e.target.value }))}
                            placeholder="gluten, marisco, frutos secos..."
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-0.5">Notas del restaurante</label>
                          <textarea
                            value={customerForm.notes}
                            onChange={e => setCustomerForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Prefiere mesa junto a la ventana..."
                            rows={2}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand resize-none"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customerForm.vip}
                            onChange={e => setCustomerForm(p => ({ ...p, vip: e.target.checked }))}
                            className="accent-brand"
                          />
                          <span className="text-xs text-gray-600">⭐ Marcar como VIP</span>
                        </label>
                        <button
                          onClick={() => setEditingCustomer(false)}
                          className="text-[10px] text-gray-400 hover:text-gray-600 text-left"
                        >Cancelar</button>
                      </div>
                    )}
                  </div>
                )}
                {selectedRes?.customer_id && !customerProfile && (
                  <div className="mt-1 p-3 bg-gray-50 rounded-xl text-xs text-gray-400">Cargando perfil...</div>
                )}
                {customerHistory.length > 0 && (
                  <div className="mt-1 rounded-xl border border-black/7 overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-black/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Historial de visitas</span>
                      {(() => { const ns = customerHistory.filter(r => r.status === 'no_show').length; return ns > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{ns} no show{ns>1?'s':''}</span>
                      ); })()}
                    </div>
                    <div className="divide-y divide-black/5">
                      {customerHistory.map((r, i) => (
                        <div key={i} className={`flex items-center gap-2 px-3 py-2 ${r.status==='no_show' ? 'bg-red-50/40' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-gray-800">{r.date} · {r.time.slice(0,5)}</div>
                            <div className="text-[10px] text-gray-400">{r.pax} pax{r.notes ? ' · '+r.notes : ''}</div>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            r.status==='completed' ? 'bg-green-100 text-green-700'
                            : r.status==='no_show' ? 'bg-red-100 text-red-600'
                            : r.status==='cancelled' ? 'bg-gray-100 text-gray-400'
                            : 'bg-gray-100 text-gray-500'}`}>
                            {r.status==='completed'?'Asistió':r.status==='no_show'?'No show':r.status==='cancelled'?'Cancelada':'Sin conf.'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Editable: table + comensales + hora */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 whitespace-nowrap"><i className="ti ti-armchair text-gray-400" /> Mesa asignada</span>
                  <select value={selectedRes.table || ''} onChange={e => {
                      const v = e.target.value;
                      const clash = tableClash(selectedRes.date, selectedRes.time, v, selectedRes.id);
                      if (clash) { setClashInfo({ table: v, name: clash.customer_name, time: clash.time.slice(0, 5) }); return; }
                      const cap = capOf(v);
                      if (cap && selectedRes.pax > cap) { toast(`${v} admite máximo ${cap} comensales`); return; }
                      patch(selectedRes.id, { table: v }); toast(v ? 'Mesa asignada' : 'Mesa liberada');
                    }}
                    className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand focus:bg-white transition">
                    <option value="">Sin asignar</option>
                    {tableOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 whitespace-nowrap"><i className="ti ti-users text-gray-400" /> Comensales</span>
                    <div className="flex items-center border border-black/10 rounded-lg bg-gray-50 overflow-hidden">
                      <button onClick={() => patch(selectedRes.id, { pax: Math.max(1, selectedRes.pax - 1) })} className="px-2.5 py-2 text-gray-500 hover:bg-brand hover:text-white transition text-sm leading-none">−</button>
                      <span className="flex-1 text-center text-xs font-bold text-gray-900">{selectedRes.pax}</span>
                      <button onClick={() => {
                          const cap = capOf(selectedRes.table);
                          if (cap && selectedRes.pax + 1 > cap) { toast(`${selectedRes.table} admite máximo ${cap} comensales`); return; }
                          patch(selectedRes.id, { pax: selectedRes.pax + 1 });
                        }} className="px-2.5 py-2 text-gray-500 hover:bg-brand hover:text-white transition text-sm leading-none">+</button>
                    </div>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 whitespace-nowrap"><i className="ti ti-clock text-gray-400" /> Hora</span>
                    <select value={selectedRes.time.slice(0, 5)} onChange={e => {
                        const v = e.target.value;
                        const clash = tableClash(selectedRes.date, v, selectedRes.table, selectedRes.id);
                        if (clash) { setClashInfo({ table: selectedRes.table, name: clash.customer_name, time: clash.time.slice(0, 5) }); return; }
                        patch(selectedRes.id, { time: v + ':00' }); toast('Hora actualizada');
                      }}
                      className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand focus:bg-white transition">
                      {D.TIMES.map(t => <option key={t} value={t} disabled={isPastTime(t)}>{t}{isPastTime(t) ? ' — pasado' : ''}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex gap-2 mt-1">
                  {selectedRes.status !== 'confirmed'
                    ? <button onClick={() => { patch(selectedRes.id, { status: 'confirmed' }); toast('Reserva confirmada'); }} className="flex-1 bg-brand text-white text-xs font-semibold py-2 rounded-lg hover:bg-brand/90 transition">Confirmar</button>
                    : (
                      <div className="flex-1 relative">
                        <button onClick={() => setShowStatusMenu(v => !v)} className="w-full border border-black/10 text-gray-600 text-xs font-semibold py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1">
                          Marcar sin confirmar <i className={`ti ti-chevron-${showStatusMenu ? 'up' : 'down'} text-[10px]`} />
                        </button>
                        {showStatusMenu && (
                          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden z-20">
                            <button onClick={() => { patch(selectedRes.id, { status: 'unconfirmed' }); setShowStatusMenu(false); toast('Marcada sin confirmar'); }} className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></span> Sin confirmar
                            </button>
                            <button onClick={() => { markStatus(selectedRes.id, 'no_show'); setShowStatusMenu(false); }} className="w-full text-left px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-black/5">
                              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span> No show
                            </button>
                            <button onClick={() => { markStatus(selectedRes.id, 'completed'); setShowStatusMenu(false); }} className="w-full text-left px-3 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-t border-black/5">
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span> Completada
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  <button onClick={() => setConfirmDel(selectedRes)} className="px-3 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition text-xs"><i className="ti ti-trash" /></button>
                </div>
              </div>
            </div>
          )}

          {showForm && (
            <div className="bg-white border-2 border-brand rounded-xl overflow-hidden">
              <div className="bg-brand px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Nueva reserva · {fmtDM(sel)}</span>
                <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white text-xs">✕</button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <input className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand" placeholder="Nombre del cliente" value={nr.customer_name} onChange={e => setNr(p => ({ ...p, customer_name: e.target.value }))} />
                <input className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand" placeholder="+34 6XX XXX XXX" value={nr.customer_phone} onChange={e => setNr(p => ({ ...p, customer_phone: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <select className="px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand" value={nr.time} onChange={e => setNr(p => ({ ...p, time: e.target.value }))}>{futureTimes.map(t => <option key={t} value={t}>{t}</option>)}</select>
                  <select className="px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand" value={nr.pax} onChange={e => setNr(p => ({ ...p, pax: Number(e.target.value) }))}>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14].map(n => <option key={n} value={n}>{n} personas</option>)}</select>
                </div>
                <select className="px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand" value={nr.table} onChange={e => setNr(p => ({ ...p, table: e.target.value }))}>
                  <option value="">Asignar mesa (opcional)</option>
                  {tables.map(t => <option key={t.label} value={t.label} disabled={Number(nr.pax) > t.capacity}>{t.label} · {t.capacity}p{Number(nr.pax) > t.capacity ? ' — insuficiente' : ''}</option>)}
                </select>
                {(() => { const cap = capOf(nr.table); return cap && Number(nr.pax) > cap && (
                  <div className="flex items-start gap-1.5 bg-amber-50 text-amber-700 text-[11px] font-semibold px-2.5 py-2 rounded-lg"><i className="ti ti-users mt-px" /> <span>{nr.table} admite máximo {cap} comensales — elige otra mesa o reduce el grupo</span></div>
                ); })()}
                <input className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand" placeholder="Notas / alergias" value={nr.notes} onChange={e => setNr(p => ({ ...p, notes: e.target.value }))} />
                {(() => { const c = tableClash(selectedDate, nr.time, nr.table); return c && (
                  <div className="flex items-start gap-1.5 bg-red-50 text-red-600 text-[11px] font-semibold px-2.5 py-2 rounded-lg"><i className="ti ti-alert-triangle mt-px" /> <span>{nr.table} ya está reservada — {c.customer_name} a las {c.time.slice(0, 5)}</span></div>
                ); })()}
                <button onClick={() => create()} disabled={!!tableClash(selectedDate, nr.time, nr.table) || (() => { const c = capOf(nr.table); return c && Number(nr.pax) > c; })()} className="w-full bg-brand text-white text-xs font-bold py-2.5 rounded-lg hover:bg-brand/90 transition disabled:opacity-40 disabled:hover:bg-brand">Guardar reserva</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================= TPV ========================= */
function TableEditModal({ table, onSave, onClose }) {
  const [label, setLabel] = useState(table.label || '');
  const [capacity, setCapacity] = useState(table.capacity || 4);
  const isNew = !table.id;
  const inp = "w-full px-3 py-2.5 text-sm border border-black/10 rounded-xl bg-gray-50 outline-none focus:border-brand transition";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-black/7 flex items-center justify-between">
          <div className="font-['Syne'] text-base font-black text-gray-900">{isNew ? 'Nueva mesa' : `Editar ${table.label}`}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><i className="ti ti-x" /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1.5">Nombre de la mesa</label>
            <input className={inp} value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej. Mesa 5" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1.5">Capacidad (personas)</label>
            <div className="flex items-center border border-black/10 rounded-xl bg-gray-50 overflow-hidden">
              <button onClick={() => setCapacity(c => Math.max(1, c - 1))} className="px-4 py-3 text-gray-500 hover:bg-brand hover:text-white transition text-lg leading-none font-bold flex-shrink-0">−</button>
              <span className="flex-1 text-center font-['Syne'] text-lg font-black text-gray-900">{capacity}</span>
              <button onClick={() => setCapacity(c => c + 1)} className="px-4 py-3 text-gray-500 hover:bg-brand hover:text-white transition text-lg leading-none font-bold flex-shrink-0">+</button>
            </div>
            <div className="text-[10px] text-gray-400 mt-1.5 text-center">{capacity} persona{capacity !== 1 ? 's' : ''} sentadas</div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-black/10 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={() => label.trim() && onSave({ label: label.trim(), capacity })} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition disabled:opacity-40" disabled={!label.trim()}>{isNew ? 'Añadir mesa' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}

function TPV() {
  const D = window.DATA;
  const [tables, setTables] = useStore('tables');
  const [ordersMap, setOrdersMap] = useStore('orders');
  const [menu] = useStore('menu');
  const [kitchen, setKitchen] = useStore('kitchen');
  const [selId, setSelId] = useState(null);
  const [activeCat, setActiveCat] = useState('c1');
  const [activeSub, setActiveSub] = useState(null);
  const [splitBy, setSplitBy] = useState(1);
  const [search, setSearch] = useState('');
  const [excludeAllergens, setExcludeAllergens] = useState(new Set());
  const toggleAllergen = (key) => setExcludeAllergens(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const [manage, setManage] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [floorPlan, setFloorPlan] = useState(() => { try { return localStorage.getItem('unamesa.floorplan') || null; } catch(e) { return null; } });
  const [showFloor, setShowFloor] = useState(false);
  const floorRef = useRef(null);

  const selectedTable = tables.find(t => t.id === selId) || null;
  const items = (selId && ordersMap[selId]) || [];
  const kitchenForTable = selectedTable ? kitchen.filter(t => t.table_label === selectedTable.label) : [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const vat = subtotal * 0.10;
  const total = subtotal + vat;

  const STATUS_STYLE = { free: 'bg-white border-black/10 text-gray-400', occupied: 'bg-brand/10 border-brand text-brand', reserved: 'bg-amber-50 border-amber-400 text-amber-700', cleaning: 'bg-gray-100 border-gray-300 text-gray-500' };
  const TAG = { popular: 'bg-amber-100 text-amber-700', nuevo: 'bg-brand/10 text-brand', vegano: 'bg-green-100 text-green-700' };

  const addItem = (item) => {
    if (!selId) { toast('Selecciona una mesa primero'); return; }
    setOrdersMap(m => {
      const cur = m[selId] ? [...m[selId]] : [];
      const ex = cur.find(i => i.name === item.name);
      let next;
      if (ex) next = cur.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i);
      else next = [...cur, { id: 'oi' + Date.now(), name: item.name, price: item.price, quantity: 1 }];
      return { ...m, [selId]: next };
    });
    if (selectedTable && selectedTable.status === 'free') setTables(ts => ts.map(t => t.id === selId ? { ...t, status: 'occupied' } : t));
    toast('+ ' + item.name);
  };
  const setQty = (iid, q) => setOrdersMap(m => {
    let cur = [...(m[selId] || [])];
    if (q <= 0) cur = cur.filter(i => i.id !== iid); else cur = cur.map(i => i.id === iid ? { ...i, quantity: q } : i);
    return { ...m, [selId]: cur };
  });
  const sendToKitchen = () => {
    if (!selId || !items.length) return;
    const ticket = {
      id: 'k' + Math.random().toString(16).slice(2, 6).toUpperCase(),
      table_label: selectedTable.label,
      pax: selectedTable.capacity,
      status: 'pending',
      sent_at: new Date().toISOString(),
      offset: 0,
      items: items.map(i => ({ id: 'ki' + Math.random().toString(36).slice(2, 7), quantity: i.quantity, name: i.name, status: 'pending' })),
    };
    setKitchen(ts => [...ts, ticket]);
    toast('Comanda enviada a ' + selectedTable.label);
  };
  const charge = () => {
    if (!selId) return;
    setOrdersMap(m => { const c = { ...m }; delete c[selId]; return c; });
    setTables(ts => ts.map(t => t.id === selId ? { ...t, status: 'free' } : t));
    setSelId(null); toast('Cobro completado');
  };
  const openAddTable = () => {
    const nums = tables.filter(t => t.section === 'sala').map(t => parseInt(t.label.replace(/\D/g, '')) || 0);
    const n = (nums.length ? Math.max(...nums) : 0) + 1;
    setEditingTable({ id: null, label: 'Mesa ' + n, capacity: 4 });
  };
  const saveTableEdit = ({ label, capacity }) => {
    if (editingTable && editingTable.id) {
      setTables(ts => ts.map(t => t.id === editingTable.id ? { ...t, label, capacity } : t));
      toast('Mesa actualizada');
    } else {
      setTables(ts => [...ts, { id: 't' + Date.now(), label, capacity, section: 'sala', status: 'free' }]);
      toast(label + ' añadida');
    }
    setEditingTable(null);
  };
  const uploadFloor = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const url = ev.target.result; setFloorPlan(url); try { localStorage.setItem('unamesa.floorplan', url); } catch(x) {} toast('Plano cargado'); };
    reader.readAsDataURL(file); e.target.value = '';
  };
  const removeTable = (id) => {
    setTables(ts => ts.filter(t => t.id !== id));
    setOrdersMap(m => { const c = { ...m }; delete c[id]; return c; });
    if (selId === id) setSelId(null);
    toast('Mesa eliminada');
  };

  const BSUBS = [
    { key: 'agua',       label: 'Agua y Zumos',  icon: 'ti-droplet' },
    { key: 'refrescos',  label: 'Refrescos',      icon: 'ti-cup' },
    { key: 'cervezas',   label: 'Cervezas',       icon: 'ti-beer' },
    { key: 'vinos',      label: 'Vinos y Cavas',  icon: 'ti-bottle' },
    { key: 'cocteleria', label: 'Coctelería',     icon: 'ti-glass-full' },
    { key: 'calientes',  label: 'Calientes',      icon: 'ti-coffee' },
  ];
  const isBebidas = activeCat === 'c4';
  const filteredItems = menu.filter(i =>
    i.category_id === activeCat && i.available &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase())) &&
    (!isBebidas || !activeSub || (i.subcategory || 'otros') === activeSub) &&
    (excludeAllergens.size === 0 || !(i.allergens || []).some(a => excludeAllergens.has(a)))
  );
  const bebSubsPresent = isBebidas ? BSUBS.filter(s => menu.some(i => i.category_id === 'c4' && i.available && i.subcategory === s.key)) : [];

  return (
    <div className="flex h-screen overflow-hidden">
      {editingTable && <TableEditModal table={editingTable} onSave={saveTableEdit} onClose={() => setEditingTable(null)} />}
      {showFloor && floorPlan && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setShowFloor(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img src={floorPlan} alt="Plano del local" className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-2xl" />
            <button onClick={() => setShowFloor(false)} className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-gray-800 hover:bg-gray-100 flex items-center justify-center shadow-lg text-lg font-bold"><i className="ti ti-x" /></button>
          </div>
        </div>
      )}
      <div className="w-[420px] flex-shrink-0 bg-gray-50 border-r border-black/7 flex flex-col overflow-hidden">
        <div className="px-4 py-3 bg-white border-b border-black/7 flex items-center justify-between">
          <div>
            <div className="font-['Syne'] text-sm font-black text-gray-900">Plano del local</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{tables.filter(t=>t.status==='occupied').length} ocupadas · {tables.length} mesas</div>
          </div>
          <button onClick={() => setManage(m => !m)} title="Gestionar mesas"
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${manage ? 'bg-brand text-white' : 'text-gray-400 hover:text-brand'}`}>
            <i className="ti ti-pencil text-xs mr-1" />{manage ? 'Listo' : 'Editar'}
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <FloorPlan
            tables={tables}
            ordersMap={ordersMap}
            selId={selId}
            onSelect={(id) => { setSelId(id); setSplitBy(1); }}
            manage={manage}
            onEdit={setEditingTable}
            onRemove={removeTable}
          />
        </div>
        {manage && (
          <div className="px-3 py-2.5 bg-amber-50 border-t border-amber-100 flex flex-col gap-1.5">
            <div className="text-[10px] text-amber-700 text-center font-semibold">Modo edición · toca una mesa para editar · ✕ para eliminar</div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white border-r border-black/7">
        <div className="px-4 py-3 border-b border-black/7">
          <div className="font-['Syne'] text-sm font-black text-gray-900">Carta</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{selectedTable ? `Añadiendo a ${selectedTable.label}` : 'Selecciona una mesa'}</div>
        </div>
        <div className="flex gap-0 border-b border-black/7 overflow-x-auto">
          {D.categories.map(c => (
            <button key={c.id} onClick={() => { setActiveCat(c.id); setActiveSub(null); }}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${activeCat === c.id ? 'text-brand border-brand' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>{c.name}</button>
          ))}
        </div>
        {isBebidas && bebSubsPresent.length > 0 && (
          <div className="flex gap-1 px-3 py-2 border-b border-black/7 overflow-x-auto bg-gray-50">
            <button onClick={() => setActiveSub(null)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${!activeSub ? 'bg-brand text-white' : 'text-gray-500 hover:text-brand hover:bg-brand/10'}`}>
              Todas
            </button>
            {bebSubsPresent.map(s => (
              <button key={s.key} onClick={() => setActiveSub(activeSub === s.key ? null : s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${activeSub === s.key ? 'bg-brand text-white' : 'text-gray-500 hover:text-brand hover:bg-brand/10'}`}>
                <i className={`ti ${s.icon} text-[11px]`} />{s.label}
              </button>
            ))}
          </div>
        )}
        <div className="px-3 py-2 border-b border-black/7">
          <input className="w-full px-3 py-1.5 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand" placeholder="Buscar plato..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="px-3 py-2 border-b border-black/7">
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Filtrar sin alergenos</div>
          <div className="flex flex-wrap gap-1">
            {D.ALLERGENS.map(a => {
              const active = excludeAllergens.has(a.key);
              return (
                <button key={a.key} onClick={() => toggleAllergen(a.key)} title={a.label}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    active ? 'text-white border-transparent shadow-sm' : 'bg-white border-black/10 text-gray-500 hover:border-gray-300'
                  }`}
                  style={active ? { background: a.color, borderColor: a.color } : {}}>
                  {a.icon
                    ? <i className={`ti ${a.icon} text-[10px]`} />
                    : <span className="text-[9px] font-black">{a.code}</span>
                  }
                  <span>{a.label}</span>
                  {active && <i className="ti ti-x text-[9px] opacity-80" />}
                </button>
              );
            })}
            {excludeAllergens.size > 0 && (
              <button onClick={() => setExcludeAllergens(new Set())} className="px-2 py-1 rounded-full text-[10px] font-bold text-gray-400 hover:text-brand transition">Limpiar</button>
            )}
          </div>
          {excludeAllergens.size > 0 && (
            <div className="text-[10px] text-brand font-semibold mt-1.5">
              Mostrando platos sin: {[...excludeAllergens].map(k => D.ALLERGENS.find(a=>a.key===k)?.label).join(', ')}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
          {filteredItems.map(item => (
            <button key={item.id} onClick={() => addItem(item)}
              className="bg-gray-50 rounded-xl p-3 text-left border border-transparent hover:border-brand hover:bg-brand/5 transition-all active:scale-95 flex flex-col gap-1">
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-semibold text-gray-900 leading-snug flex-1">{item.name}</span>
                <span className="font-['Syne'] text-sm font-black text-brand flex-shrink-0">{eur(item.price)}</span>
              </div>
              {item.tag && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${TAG[item.tag] || ''}`}>{item.tag}</span>}
              {item.allergens && item.allergens.length > 0 && <div className="mt-1"><AllergenChips keys={item.allergens} size="xs" max={4} /></div>}
            </button>
          ))}
        </div>
      </div>

      <div className="w-[260px] flex-shrink-0 bg-white flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-black/7">
          <div className="font-['Syne'] text-sm font-black text-gray-900">{selectedTable?.label ?? 'Sin mesa'}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{selectedTable ? (items.length ? 'Pedido activo' : 'Nuevo pedido') : 'Selecciona una mesa'}</div>
        </div>
        {kitchenForTable.length > 0 && (
          <div className="border-b border-black/7 bg-brand/[0.04] px-4 py-3 max-h-56 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <i className="ti ti-chef-hat text-brand text-sm" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Estado en cocina</span>
            </div>
            <div className="flex flex-col gap-2">
              {kitchenForTable.map(t => {
                const KS = { pending: { l: 'Pendiente', c: 'bg-amber-100 text-amber-700', dot: '#B45309' }, cooking: { l: 'En cocina', c: 'bg-brand/10 text-brand', dot: '#D8552E' }, ready: { l: 'Listo', c: 'bg-green-100 text-green-700', dot: '#15803D' } };
                const ks = KS[t.status] || KS.pending;
                return (
                  <div key={t.id} className="bg-white rounded-lg border border-black/7 p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-['Syne'] text-xs font-black text-gray-700">#{t.id.slice(-4).toUpperCase()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 font-medium">{fmtTimer(t.sent_at)}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ks.c}`}>{ks.l}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {t.items.map(it => {
                        const done = it.status === 'ready' || it.status === 'served';
                        return (
                          <div key={it.id} className="flex items-center gap-1.5 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: done ? '#15803D' : ks.dot }} />
                            <span className="font-bold text-gray-400 w-4">{it.quantity}×</span>
                            <span className={`flex-1 ${done ? 'line-through text-gray-300' : 'text-gray-600'}`}>{it.name}</span>
                            {done && <i className="ti ti-check text-green-500 text-[11px]" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300"><i className="ti ti-shopping-cart text-3xl mb-2" /><span className="text-xs">Sin productos</span></div>
          ) : (
            <div className="divide-y divide-black/5">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50">
                  <div className="flex-1"><div className="text-xs font-medium text-gray-900">{item.name}</div></div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setQty(item.id, item.quantity - 1)} className="w-5 h-5 rounded border border-black/10 bg-gray-50 text-xs flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition">−</button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => setQty(item.id, item.quantity + 1)} className="w-5 h-5 rounded border border-black/10 bg-gray-50 text-xs flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition">+</button>
                  </div>
                  <div className="text-xs font-bold text-gray-900 min-w-[40px] text-right">{eur(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-black/7 p-4 flex flex-col gap-3">
          <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>{eur(subtotal)}</span></div>
          <div className="flex justify-between text-xs text-gray-500"><span>IVA (10%)</span><span>{eur(vat)}</span></div>
          <div className="flex justify-between font-['Syne'] text-lg font-black text-gray-900 border-t border-black/7 pt-2"><span>Total</span><span>{eur(total / splitBy)}{splitBy > 1 ? ` ×${splitBy}` : ''}</span></div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setSplitBy(n)} className={`py-1.5 rounded-lg text-xs font-semibold border transition ${splitBy === n ? 'bg-brand text-white border-brand' : 'border-black/10 text-gray-500 hover:border-brand hover:text-brand'}`}>{n === 1 ? '1' : `÷${n}`}</button>
            ))}
          </div>
          <button onClick={sendToKitchen} disabled={!items.length} className="w-full py-2.5 rounded-lg border border-brand/30 bg-brand/5 text-xs font-semibold text-brand hover:bg-brand/10 transition disabled:opacity-40 disabled:border-black/10 disabled:bg-transparent disabled:text-gray-400 flex items-center justify-center gap-2"><i className="ti ti-chef-hat" /> Enviar a cocina</button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={charge} disabled={!items.length} className="py-2.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition disabled:opacity-40 flex items-center justify-center gap-1.5"><i className="ti ti-credit-card" /> Tarjeta</button>
            <button onClick={charge} disabled={!items.length} className="py-2.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition disabled:opacity-40 flex items-center justify-center gap-1.5"><i className="ti ti-coins" /> Efectivo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================= COCINA (light brand theme) ========================= */
function fmtTimer(sentAt) {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(sentAt).getTime()) / 1000));
  return `${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')}`;
}
const KSTYLE = {
  pending: { accent: '#B45309', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', pill: 'bg-amber-100 text-amber-700', label: 'Pendiente' },
  cooking: { accent: '#D8552E', bg: 'bg-brand/5', border: 'border-brand/30', text: 'text-brand', pill: 'bg-brand/10 text-brand', label: 'En cocina' },
  ready: { accent: '#15803D', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', pill: 'bg-green-100 text-green-700', label: 'Listo' },
};
function TicketCard({ ticket, onAdvance, onToggle, onCancel }) {
  const [, force] = useState(0);
  const elapsedSecs = Math.floor((Date.now() - new Date(ticket.sent_at).getTime()) / 1000);
  const isUrgent = elapsedSecs > 900 && ticket.status !== 'ready';
  useEffect(() => { if (ticket.status === 'ready') return; const iv = setInterval(() => force(x => x + 1), 1000); return () => clearInterval(iv); }, [ticket.status]);
  const st = KSTYLE[ticket.status] || KSTYLE.pending;
  const accent = isUrgent ? '#DC2626' : st.accent;
  const btnLabel = { pending: 'Iniciar', cooking: 'Marcar listo', ready: 'Servido' }[ticket.status] || 'Avanzar';
  return (
    <div className={`rounded-2xl border bg-white flex flex-col overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${isUrgent ? 'border-red-300 animate-pulse-border' : 'border-black/8'}`}>
      <div className="h-1.5" style={{ background: accent }} />
      <div className="px-4 py-3 flex items-center justify-between border-b border-black/5 gap-2">
        <div className="font-['Syne'] text-lg font-black flex-shrink-0" style={{ color: accent }}>#{ticket.id.slice(-4).toUpperCase()}</div>
        <div className="text-right min-w-0"><div className="text-sm font-semibold text-gray-800 whitespace-nowrap truncate">{ticket.table_label}</div><div className="text-[10px] text-gray-400 whitespace-nowrap">{ticket.pax} pax</div></div>
      </div>
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div><div className="font-['Syne'] text-2xl font-black tracking-wide" style={{ color: accent }}>{ticket.status === 'ready' ? '✓' : fmtTimer(ticket.sent_at)}</div><div className="text-[9px] uppercase tracking-widest text-gray-400">tiempo</div></div>
        <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${isUrgent ? 'bg-red-100 text-red-600' : st.pill}`}>{isUrgent ? 'Urgente' : st.label}</span>
      </div>
      <div className="px-4 pb-3 flex-1 flex flex-col gap-1.5">
        {ticket.items.map(item => {
          const done = item.status === 'ready' || item.status === 'served';
          return (
            <button key={item.id} onClick={() => onToggle(ticket.id, item.id)} className="flex items-baseline gap-2 text-left group">
              <span className="font-['Syne'] text-sm font-bold text-gray-400 min-w-[18px]">{item.quantity}×</span>
              <span className={`text-xs flex-1 ${done ? 'line-through text-gray-300' : 'text-gray-700 group-hover:text-brand'}`}>{item.name}</span>
              {done && <i className="ti ti-check text-green-500 text-xs" />}
            </button>
          );
        })}
      </div>
      <div className="px-3 pb-3 flex gap-2">
        <button onClick={() => onCancel(ticket.id)} className="flex-1 py-2 rounded-xl text-[11px] font-semibold border border-black/10 bg-white text-gray-500 hover:bg-gray-50 hover:text-red-500 transition">Anular</button>
        <button onClick={() => onAdvance(ticket.id)} className="flex-1 py-2 rounded-xl text-[11px] font-semibold text-white transition hover:opacity-90" style={{ background: accent }}>{btnLabel}</button>
      </div>
    </div>
  );
}
function KitchenHistory({ history, onClose, onClear }) {
  const D = window.DATA;
  const fmtT = (iso) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const fmtD = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
  // group by calendar day
  const groups = {};
  history.forEach(h => { const key = (h.closed_at || h.sent_at || '').slice(0, 10); (groups[key] = groups[key] || []).push(h); });
  const dayKeys = Object.keys(groups).sort().reverse();
  const served = history.filter(h => h.outcome === 'served');
  const revenue = served.reduce((s, h) => s + (h.total || 0), 0);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="w-[480px] max-w-full bg-gray-50 h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 bg-white border-b border-black/7 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><i className="ti ti-history text-lg" /></div>
            <div>
              <div className="font-['Syne'] text-base font-black text-gray-900">Historial de comandas</div>
              <div className="text-[11px] text-gray-400">Registro completo · {history.length} comandas</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center transition"><i className="ti ti-x text-lg" /></button>
        </div>
        <div className="grid grid-cols-3 gap-px bg-black/5 border-b border-black/7 flex-shrink-0">
          {[
            { l: 'Servidas hoy', v: served.length, c: 'text-green-600' },
            { l: 'Anuladas', v: history.filter(h => h.outcome === 'cancelled').length, c: 'text-red-500' },
            { l: 'Facturado', v: eur0(revenue), c: 'text-gray-900' },
          ].map(k => (
            <div key={k.l} className="bg-white px-4 py-3 text-center"><div className={`font-['Syne'] text-xl font-black ${k.c}`}>{k.v}</div><div className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">{k.l}</div></div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {history.length === 0 && <div className="text-center text-gray-300 text-sm mt-16">Aún no hay comandas registradas</div>}
          {dayKeys.map(day => (
            <div key={day}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">{fmtD(day)}</div>
              <div className="flex flex-col gap-2">
                {groups[day].map(h => {
                  const cancelled = h.outcome === 'cancelled';
                  return (
                    <div key={h.id} className={`bg-white rounded-xl border overflow-hidden ${cancelled ? 'border-red-200' : 'border-black/7'}`}>
                      <div className="px-4 py-2.5 flex items-center justify-between border-b border-black/5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-['Syne'] text-sm font-black text-gray-700">#{h.id.slice(-4).toUpperCase()}</span>
                          <span className="text-xs font-semibold text-gray-900">{h.table_label}</span>
                          <span className="text-[10px] text-gray-400">{h.pax} pax</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{fmtT(h.closed_at)}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cancelled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{cancelled ? 'Anulada' : 'Servida'}</span>
                        </div>
                      </div>
                      <div className="px-4 py-2.5 flex flex-col gap-1">
                        {h.items.map(it => (
                          <div key={it.id} className="flex items-center gap-2 text-[11px]">
                            <span className="font-bold text-gray-400 w-5">{it.quantity}×</span>
                            <span className={`flex-1 ${cancelled ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{it.name}</span>
                            <span className="text-gray-400">{eur(D.priceOf(it.name) * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`px-4 py-2 flex items-center justify-between border-t border-black/5 ${cancelled ? 'bg-red-50/40' : 'bg-gray-50'}`}>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Total</span>
                        <span className={`font-['Syne'] text-sm font-black ${cancelled ? 'text-gray-300 line-through' : 'text-gray-900'}`}>{eur(h.total || 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {history.length > 0 && (
          <div className="px-5 py-3 bg-white border-t border-black/7 flex-shrink-0">
            <button onClick={onClear} className="w-full py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1.5"><i className="ti ti-trash" /> Vaciar historial</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Cocina() {
  const [tickets, setTickets] = useStore('kitchen');
  const [history, setHistory] = useStore('kitchenHistory');
  const [filter, setFilter] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const [clock, setClock] = useState('');
  useEffect(() => { const u = () => { const n = new Date(); setClock([n.getHours(), n.getMinutes(), n.getSeconds()].map(x => String(x).padStart(2, '0')).join(':')); }; u(); const iv = setInterval(u, 1000); return () => clearInterval(iv); }, []);

  const archive = (t, outcome) => {
    const rec = { ...t, outcome, closed_at: new Date().toISOString(), total: window.DATA.ticketTotal(t.items), items: t.items.map(i => ({ ...i, status: outcome === 'served' ? 'served' : i.status })) };
    setHistory(h => [rec, ...h]);
  };
  const advance = (id) => {
    const t = tickets.find(x => x.id === id); if (!t) return;
    const next = { pending: 'cooking', cooking: 'ready', ready: 'served' }[t.status];
    if (next === 'served') { archive(t, 'served'); setTickets(ts => ts.filter(x => x.id !== id)); toast('Comanda servida'); return; }
    setTickets(ts => ts.map(x => x.id === id ? { ...x, status: next } : x));
  };
  const cancel = (id) => { const t = tickets.find(x => x.id === id); if (t) archive(t, 'cancelled'); setTickets(ts => ts.filter(x => x.id !== id)); toast('Comanda anulada'); };
  const toggle = (tid, iid) => setTickets(ts => ts.map(t => t.id !== tid ? t : { ...t, items: t.items.map(i => i.id === iid ? { ...i, status: i.status === 'ready' ? 'cooking' : 'ready' } : i) }));

  const filtered = tickets.filter(t => {
    if (filter === 'all') return true;
    const urg = Math.floor((Date.now() - new Date(t.sent_at).getTime()) / 1000) > 900;
    if (filter === 'cooking') return t.status === 'cooking' || urg;
    return t.status === filter;
  });
  const cnt = (s) => tickets.filter(t => t.status === s).length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <div className="px-6 py-3.5 flex items-center justify-between border-b border-black/7 bg-white flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-['Syne'] text-xl font-black text-gray-900">Cocina</div>
          <div className="flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-3 py-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /><span className="text-[10px] font-bold uppercase tracking-wider text-brand">En directo</span></div>
        </div>
        <div className="flex gap-5 items-center">
          {[{ val: cnt('pending'), label: 'Pendientes', color: 'text-amber-600' }, { val: cnt('cooking'), label: 'En cocina', color: 'text-brand' }, { val: cnt('ready'), label: 'Listos', color: 'text-green-600' }].map(s => (
            <div key={s.label} className="text-center"><div className={`font-['Syne'] text-2xl font-black ${s.color}`}>{s.val}</div><div className="text-[9px] uppercase tracking-widest text-gray-400">{s.label}</div></div>
          ))}
          <div className="font-['Syne'] text-lg font-bold text-gray-300 tracking-widest pl-3 border-l border-black/7">{clock}</div>
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-black/10 text-gray-600 hover:border-brand hover:text-brand transition">
            <i className="ti ti-history" /> Historial
            {history.length > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">{history.length}</span>}
          </button>
        </div>
      </div>
      <div className="px-6 py-2.5 flex items-center gap-2 border-b border-black/7 bg-white flex-shrink-0">
        {[{ key: 'all', label: 'Todas' }, { key: 'pending', label: 'Pendientes' }, { key: 'cooking', label: 'En cocina' }, { key: 'ready', label: 'Listos' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${filter === f.key ? 'bg-brand text-white border-brand' : 'text-gray-500 border-black/10 hover:border-brand hover:text-brand'}`}>{f.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? <div className="text-gray-300 text-sm text-center mt-16">Sin comandas activas</div> : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {filtered.map(t => <TicketCard key={t.id} ticket={t} onAdvance={advance} onToggle={toggle} onCancel={cancel} />)}
          </div>
        )}
      </div>
      {showHistory && <KitchenHistory history={history} onClose={() => setShowHistory(false)} onClear={() => { setHistory([]); toast('Historial vaciado'); }} />}
    </div>
  );
}

/* ========================= PERSONAL ========================= */
const SHIFT_STYLE = { morning: 'bg-brand text-white border-brand', afternoon: 'bg-amber-500 text-white border-amber-500', night: 'bg-purple-600 text-white border-purple-600', off: 'bg-gray-400 text-white border-gray-400', leave: 'bg-blue-500 text-white border-blue-500', baja: 'bg-red-500 text-white border-red-500' };
const SHIFT_LABEL = { morning: '09–17h', afternoon: '13–19h', night: '20–02h', off: 'Libre', leave: 'Vacac.', baja: 'Baja' };
const SHIFT_DOT = { morning: 'bg-brand', afternoon: 'bg-amber-400', night: 'bg-purple-400', off: 'bg-gray-300', leave: 'bg-blue-400', baja: 'bg-red-400' };
const PRESET_HOURS = { morning: 8, afternoon: 6, night: 6, off: 0, leave: 0, baja: 0 };
const hoursBetween = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60; // overnight shift
  return Math.round((mins / 60) * 10) / 10;
};
const cellHours = (cell) => (cell && typeof cell === 'object') ? hoursBetween(cell.start, cell.end) : (PRESET_HOURS[cell] ?? 0);
const cellLabel = (cell) => (cell && typeof cell === 'object') ? `${cell.start}–${cell.end}` : (SHIFT_LABEL[cell] || 'Libre');
const cellStyle = (cell) => (cell && typeof cell === 'object') ? 'bg-brand text-white border-brand' : (SHIFT_STYLE[cell] || SHIFT_STYLE.off);

/* Cell editor popover — presets, baja, or a custom time range */
function ShiftPopover({ x, y, current, onPick, onClose }) {
  const [custom, setCustom] = useState(current && typeof current === 'object' ? current : { start: '10:00', end: '18:00' });
  const presets = [
    { v: 'morning', l: 'Mañana · 09–17h' },
    { v: 'afternoon', l: 'Tarde · 13–19h' },
    { v: 'night', l: 'Noche · 20–02h' },
    { v: 'off', l: 'Libre' },
    { v: 'baja', l: 'Baja médica' },
    { v: 'leave', l: 'Vacaciones' },
  ];
  const style = { left: Math.min(x, window.innerWidth - 250), top: Math.min(y, window.innerHeight - 340) };
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 w-[230px] bg-white border border-black/10 rounded-2xl shadow-xl p-2.5" style={style} onClick={e => e.stopPropagation()}>
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1.5 pb-1.5">Asignar turno</div>
        <div className="flex flex-col gap-1">
          {presets.map(p => {
            const active = current === p.v;
            return (
              <button key={p.v} onClick={() => onPick(p.v)} className={`flex items-center gap-2 text-left text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${active ? 'bg-brand/10 border-brand text-brand' : 'border-transparent hover:bg-gray-50 text-gray-600'}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SHIFT_DOT[p.v]}`} />{p.l}
              </button>
            );
          })}
        </div>
        <div className="border-t border-black/7 mt-2 pt-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1.5 pb-1.5">Horario personalizado</div>
          <div className="flex items-center gap-1.5 px-1">
            <input type="time" value={custom.start} onChange={e => setCustom(c => ({ ...c, start: e.target.value }))} className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand" />
            <span className="text-gray-400 text-xs">–</span>
            <input type="time" value={custom.end} onChange={e => setCustom(c => ({ ...c, end: e.target.value }))} className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-black/10 rounded-lg bg-gray-50 outline-none focus:border-brand" />
          </div>
          <button onClick={() => onPick({ start: custom.start, end: custom.end })} className="w-full mt-2 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition">Aplicar horario</button>
        </div>
      </div>
    </>
  );
}

function EmployeeProfile({ member, onSave, onClose }) {
  const [f, setF] = useState({ ...member });
  const [photo, setPhoto] = useState(() => { try { return localStorage.getItem('unamesa.photo.' + member.id) || null; } catch(e) { return null; } });
  const photoRef = useRef(null);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const input = "w-full px-3 py-2.5 text-sm border border-black/10 rounded-xl bg-gray-50 outline-none focus:border-brand focus:bg-white transition";
  const lbl = "text-[11px] font-semibold text-gray-600 mb-1.5 block";
  const uploadPhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const url = ev.target.result; setPhoto(url); try { localStorage.setItem('unamesa.photo.' + member.id, url); } catch(x) {} };
    reader.readAsDataURL(file); e.target.value = '';
  };
  const submit = () => {
    if (!f.name.trim()) { toast('Indica el nombre'); return; }
    if (f.pin && !/^\d{4}$/.test(f.pin)) { toast('El PIN debe tener 4 dígitos'); return; }
    const initials = f.name.trim().split(/\s+/).slice(0,2).map(w=>w[0].toUpperCase()).join('');
    onSave({ ...f, initials });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/7 flex items-center justify-between">
          <div className="font-['Syne'] text-base font-black text-gray-900">Perfil del empleado</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><i className="ti ti-x" /></button>
        </div>
        {/* Photo + name hero */}
        <div className="bg-gray-50 px-5 py-5 flex items-center gap-4 border-b border-black/7">
          <div className="relative flex-shrink-0">
            {photo
              ? <img src={photo} alt={f.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" />
              : <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black border-2 border-white shadow" style={{ background: member.color_bg, color: member.color }}>{member.initials}</div>
            }
            <button onClick={() => photoRef.current && photoRef.current.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow hover:bg-brand/90 transition">
              <i className="ti ti-camera text-[11px]" />
            </button>
            <input ref={photoRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-['Syne'] text-lg font-black text-gray-900 truncate">{f.name}</div>
            <div className="text-xs text-gray-400">{f.role} · {f.access}</div>
          </div>
        </div>
        {/* Form */}
        <div className="p-5 flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Nombre completo</label><input className={input} value={f.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className={lbl}>Puesto</label><input className={input} value={f.role || ''} onChange={e => set('role', e.target.value)} placeholder="Camarera, Cocinero…" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Email</label><input className={input} type="email" value={f.email || ''} onChange={e => set('email', e.target.value)} placeholder="nombre@email.com" /></div>
            <div><label className={lbl}>Teléfono</label><input className={input} type="tel" value={f.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+34 600 000 000" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Nivel de acceso</label><select className={input} value={f.access || ''} onChange={e => set('access', e.target.value)}>{['Administrador','Encargado','Camarero','Cocina'].map(a=><option key={a}>{a}</option>)}</select></div>
            <div><label className={lbl}>PIN (4 dígitos)</label><input className={input} value={f.pin || ''} maxLength={4} inputMode="numeric" onChange={e => set('pin', e.target.value.replace(/\D/g,''))} placeholder="••••" /></div>
          </div>
          <div><label className={lbl}>Notas</label><textarea className={input + ' resize-none'} rows={2} value={f.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Alergias, preferencias, observaciones…" /></div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-black/10 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition">Guardar perfil</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rota Import Modal ─────────────────────────────────────── */
function RotaImportModal({ staff, onImport, onClose }) {
  const fileRef = useRef(null);
  const [step, setStep] = useState(1); // 1=guide, 2=preview
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const DAY_KEYS = ['L','M','X','J','V','S','D'];
  const DAY_ALIASES = {
    lunes:'L', monday:'L', l:'L',
    martes:'M', tuesday:'M', m:'M',
    'mi\u00e9rcoles':'X', miercoles:'X', mie:'X', wednesday:'X', x:'X', mi:'X',
    jueves:'J', thursday:'J', j:'J',
    viernes:'V', friday:'V', v:'V',
    's\u00e1bado':'S', sabado:'S', sab:'S', saturday:'S', s:'S',
    domingo:'D', sunday:'D', d:'D',
  };
  const SHIFT_ALIASES = {
    'ma\u00f1ana':'morning', manana:'morning', morning:'morning',
    tarde:'afternoon', afternoon:'afternoon',
    noche:'night', night:'night',
    libre:'off', free:'off', off:'off', descanso:'off', '-':'off', '':'off', ' ':'off',
    baja:'baja', sick:'baja', enfermo:'baja',
    vacaciones:'leave', vacation:'leave', vac:'leave',
  };
  // Normalize string — remove accents + lower + trim
  const norm = (s) => (s||'').toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const SHIFT_COLOR = { morning:'bg-brand text-white', afternoon:'bg-amber-500 text-white', night:'bg-purple-600 text-white', off:'bg-gray-400 text-white', baja:'bg-red-500 text-white', leave:'bg-blue-500 text-white' };
  const SHIFT_LABEL = { morning:'Mañana', afternoon:'Tarde', night:'Noche', off:'Libre', baja:'Baja', leave:'Vacac.' };

  const downloadTemplate = () => {
    const header = ['Nombre','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'];
    const ex = staff.map(s => [s.name,'manana','tarde','libre','noche','tarde','libre','libre']);
    const rows = [header, ...ex];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'rota.csv'; a.click();
  };

  const parseRows = (sheetData) => {
    if (!sheetData || sheetData.length < 2) return { err: 'El archivo está vacío.' };
    // Skip leading rows until we find one that contains a day column
    let headerIdx = -1;
    for (let i = 0; i < Math.min(5, sheetData.length); i++) {
      const row = sheetData[i].map(c => norm((c||'').toString()));
      if (row.some(h => DAY_ALIASES[h])) { headerIdx = i; break; }
    }
    if (headerIdx < 0) return { err: `No se encontraron columnas de días. Asegúrate de que la plantilla tiene cabeceras: Nombre, Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo.` };
    const header = sheetData[headerIdx].map(c => norm((c||'').toString()));
    const dayCols = {}; header.forEach((h,i) => { const dk = DAY_ALIASES[h]; if (dk) dayCols[dk] = i; });
    const nameCol = header.findIndex(h => ['nombre','name','empleado'].includes(h));
    if (nameCol < 0) return { err: `No se encontró columna "Nombre". Cabeceras detectadas: ${header.filter(Boolean).join(', ')}.` };
    const rows = []; const warnings = [];
    sheetData.slice(headerIdx + 1).forEach((row) => {
      const name = (row[nameCol]||'').toString().trim(); if (!name) return;
      const days = {};
      DAY_KEYS.forEach(dk => { const ci = dayCols[dk]; const raw = norm(ci !== undefined ? row[ci] : ''); days[dk] = SHIFT_ALIASES[raw] || 'off'; });
      const match = staff.find(s => norm(s.name).includes(norm(name).split(' ')[0]) || norm(name).includes(norm(s.name).split(' ')[0]));
      if (!match) warnings.push(`"${name}" no coincide — omitido`);
      rows.push({ name, days, staffId: match ? match.id : null });
    });
    return { rows, warnings };
  };

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setError(null); setPreview(null);
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let sheetData;
        if (ext === 'csv') {
          sheetData = ev.target.result.split(/\r?\n/).filter(l=>l.trim()).map(l=>l.split(/[,;\t]/).map(c=>c.trim().replace(/^"|"$/g,'')));
        } else {
          if (!window.XLSX) { setError('La librería XLSX no está cargada. Prueba a recargar la página.'); return; }
          const wb = window.XLSX.read(ev.target.result, { type:'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          sheetData = window.XLSX.utils.sheet_to_json(ws, { header:1, defval:'' }).filter(r => r.some(c => c !== ''));
        }
        if (!sheetData || sheetData.length === 0) { setError('El archivo parece estar vacío. Asegúrate de guardar con datos.'); return; }
        if (sheetData.length === 1) { setError(`Solo se encontró 1 fila (la cabecera). Añade filas con los empleados debajo.`); return; }
        const result = parseRows(sheetData);
        if (result.err) { setError(result.err); return; }
        if (result.rows.length === 0) { setError('No se encontraron empleados. Comprueba que los nombres coincidan con los del sistema.'); return; }
        setPreview(result); setStep(2);
      } catch(ex) { setError('Error al leer el archivo: ' + ex.message); }
    };
    if (ext === 'csv') reader.readAsText(file); else reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const apply = () => { if (!preview) return; onImport(preview.rows.filter(r=>r.staffId)); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/7 flex items-center justify-between flex-shrink-0">
          <div className="font-['Syne'] text-base font-black text-gray-900">Importar rota</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><i className="ti ti-x" /></button>
        </div>

        {step === 1 && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {/* 3 steps */}
            {[
              { n:1, icon:'ti-download', title:'Descarga la plantilla', desc:'Ya viene con los nombres de tus empleados.', action: (
                <div className="mt-2 flex flex-col gap-2">
                  <button onClick={downloadTemplate} className="flex items-center gap-2 bg-brand text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand/90 transition w-full justify-center"><i className="ti ti-download" /> Descargar plantilla (.csv)</button>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-black/7">
                    <div className="text-[10px] font-bold text-gray-500 mb-1">Empleados en el sistema:</div>
                    <div className="flex flex-wrap gap-1">{staff.map(s=><span key={s.id} className="text-[10px] bg-white border border-black/10 rounded px-1.5 py-0.5 text-gray-700 font-medium">{s.name}</span>)}</div>
                  </div>
                </div>
              ) },
              { n:2, icon:'ti-pencil', title:'Rellena los turnos y guarda como CSV', desc:'Edita los turnos. Importante: guarda el archivo como CSV (no como .numbers o .xlsx).', action:
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[['mañana','Mañana','bg-brand'],['tarde','Tarde','bg-amber-500'],['noche','Noche','bg-purple-600'],['libre','Libre','bg-gray-400'],['baja','Baja médica','bg-red-500'],['vacaciones','Vacaciones','bg-blue-500']].map(([v,l,c])=>(
                    <div key={v} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5 border border-black/7">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c}`}></span>
                      <span className="text-[10px]"><span className="font-bold text-gray-900">{v}</span> <span className="text-gray-400">→ {l}</span></span>
                    </div>
                  ))}
                </div>
              },
              { n:3, icon:'ti-upload', title:'Sube el archivo CSV', desc:'Selecciona el archivo .csv que guardaste.', action:
                <label className="mt-2 flex items-center gap-2 border-2 border-dashed border-brand/40 text-brand text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand/5 transition w-full justify-center cursor-pointer">
                  <i className="ti ti-file-upload" /> Seleccionar archivo (.csv)
                  <input type="file" accept=".csv,.xlsx,.xls,.ods,.tsv" onChange={handleFile} className="hidden" />
                </label>
              },
            ].map(s => (
              <div key={s.n} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5">{s.n}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">{s.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                  {s.action}
                </div>
              </div>
            ))}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.ods" onChange={handleFile} className="hidden" />
            {error && <div className="flex items-start gap-2 bg-red-50 text-red-600 text-xs font-semibold px-3 py-2.5 rounded-xl border border-red-100"><i className="ti ti-alert-triangle mt-0.5 flex-shrink-0" />{error}</div>}
          </div>
        )}

        {step === 2 && preview && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {preview.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                <div className="text-[10px] font-bold text-amber-700">Avisos:</div>
                {preview.warnings.map((w,i)=><div key={i} className="text-[11px] text-amber-600">{w}</div>)}
              </div>
            )}
            <div className="text-xs font-semibold text-gray-700">{preview.rows.filter(r=>r.staffId).length} empleados listos para importar:</div>
            <div className="overflow-x-auto rounded-xl border border-black/7">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">Empleado</th>
                  {DAY_KEYS.map(d=><th key={d} className="px-1.5 py-2 font-semibold text-gray-400 text-center">{d}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-black/5">
                  {preview.rows.map((row,i)=>(
                    <tr key={i} className={!row.staffId ? 'opacity-35' : ''}>
                      <td className="px-3 py-2 font-semibold text-gray-800">{row.name}</td>
                      {DAY_KEYS.map(dk=>(
                        <td key={dk} className="px-1 py-2 text-center">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${SHIFT_COLOR[row.days[dk]]||'bg-gray-200 text-gray-500'}`}>{(SHIFT_LABEL[row.days[dk]]||'?').slice(0,3)}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => { setStep(1); setPreview(null); setError(null); }} className="text-xs text-gray-400 hover:text-brand transition text-center">← Volver y subir otro archivo</button>
          </div>
        )}

        <div className="px-5 py-4 border-t border-black/7 flex gap-2 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-black/10 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancelar</button>
          {step === 2 && <button onClick={apply} disabled={!preview || preview.rows.filter(r=>r.staffId).length===0} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition disabled:opacity-40">Aplicar rota ✓</button>}
        </div>
      </div>
    </div>
  );
}


function StaffModal({ onSave, onClose }) {
  const [f, setF] = useState({ name: '', role: 'Camarera', access: 'Camarero', pin: '' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const input = "w-full px-3 py-2.5 text-sm border border-black/10 rounded-xl bg-gray-50 outline-none focus:border-brand focus:bg-white transition";
  const lbl = "text-[11px] font-semibold text-gray-600 mb-1.5 block";
  const submit = () => {
    if (!f.name.trim()) { toast('Indica el nombre'); return; }
    if (!/^\d{4}$/.test(f.pin)) { toast('El PIN debe tener 4 dígitos'); return; }
    onSave(f);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-black/7 flex items-center justify-between">
          <div className="font-['Syne'] text-base font-black text-gray-900">Nuevo empleado</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><i className="ti ti-x" /></button>
        </div>
        <div className="p-5 flex flex-col gap-3.5">
          <div><label className={lbl}>Nombre completo</label><input className={input} value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Marta López" /></div>
          <div><label className={lbl}>Puesto</label><input className={input} value={f.role} onChange={e => set('role', e.target.value)} placeholder="Camarera, Cocinero…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Acceso</label><select className={input} value={f.access} onChange={e => set('access', e.target.value)}>{['Administrador', 'Encargado', 'Camarero', 'Cocina'].map(a => <option key={a}>{a}</option>)}</select></div>
            <div><label className={lbl}>PIN (4 dígitos)</label><input className={input} value={f.pin} maxLength={4} inputMode="numeric" onChange={e => set('pin', e.target.value.replace(/\D/g, ''))} placeholder="0000" /></div>
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-black/10 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition">Añadir empleado</button>
        </div>
      </div>
    </div>
  );
}

function Personal() {
  const D = window.DATA;
  const [tab, setTab] = useState('turnos');
  const [staff, setStaff] = useStore('staff');
  const [rota, setRota] = useStore('rotaPattern');
  const [leave, setLeave] = useStore('leave');
  const [clockState, setClockState] = useStore('clockState');
  const [showAdd, setShowAdd] = useState(false);
  const [profileMember, setProfileMember] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const applyRotaImport = (rows) => {
    const DAY_ORDER = ['L','M','X','J','V','S','D'];
    const newRota = { ...rota };
    let matched = 0;
    rows.forEach(row => {
      if (!row.staffId) return;
      newRota[row.staffId] = DAY_ORDER.map(dk => row.days[dk] || 'off');
      matched++;
    });
    setRota(newRota);
    toast(matched > 0 ? `Rota importada: ${matched} empleado${matched !== 1 ? 's' : ''} actualizado${matched !== 1 ? 's' : ''}` : 'No se reconoció ningún empleado');
  };
  const [cellEdit, setCellEdit] = useState(null);

  const sel = new Date(D.today); const dow = (sel.getDay() + 6) % 7; const weekStart = new Date(sel); weekStart.setDate(sel.getDate() - dow);
  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });
  const staffById = Object.fromEntries(staff.map(s => [s.id, s]));

  const totalHours = (sid) => (rota[sid] || []).reduce((t, c) => t + cellHours(c), 0);
  const weekTotalHours = staff.reduce((t, s) => t + totalHours(s.id), 0);
  const todayIdx = (D.today.getDay() + 6) % 7;
  const dailyHours = (sid) => cellHours((rota[sid] || [])[todayIdx]);
  const monthDays = new Date(D.today.getFullYear(), D.today.getMonth() + 1, 0).getDate();
  const monthlyHours = (sid) => {
    const pat = rota[sid] || Array(7).fill('off');
    let h = 0;
    for (let day = 1; day <= monthDays; day++) { const wd = (new Date(D.today.getFullYear(), D.today.getMonth(), day).getDay() + 6) % 7; h += cellHours(pat[wd]); }
    return Math.round(h * 10) / 10;
  };
  const fmtH = (n) => (Math.round(n * 10) / 10).toLocaleString('es-ES') + 'h';
  const setCell = (sid, dayIdx, value) => setRota(r => { const pat = [...(r[sid] || Array(7).fill('off'))]; pat[dayIdx] = value; return { ...r, [sid]: pat }; });

  const setClock = (sid, stt) => { setClockState(c => ({ ...c, [sid]: stt })); toast(stt === 'in' ? 'Entrada registrada' : 'Salida registrada'); };
  const updateLeave = (id, status) => { setLeave(arr => arr.map(l => l.id === id ? { ...l, status } : l)); toast(status === 'approved' ? 'Ausencia aprobada' : 'Ausencia rechazada'); };

  const addStaff = (f) => {
    const id = 's' + Date.now();
    const c = STAFF_COLORS[staff.length % STAFF_COLORS.length];
    const initials = f.name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
    setStaff(arr => [...arr, { id, name: f.name.trim(), role: f.role, pin: f.pin, initials, color: c.color, color_bg: c.color_bg, email: '', access: f.access }]);
    setRota(r => ({ ...r, [id]: ['off', 'morning', 'afternoon', 'off', 'morning', 'afternoon', 'night'] }));
    setClockState(cs => ({ ...cs, [id]: 'out' }));
    setShowAdd(false); toast(f.name.split(' ')[0] + ' añadido al equipo');
  };
  const removeStaff = (id) => {
    const name = staffById[id]?.name.split(' ')[0] || '';
    setStaff(arr => arr.filter(s => s.id !== id));
    setRota(r => { const c = { ...r }; delete c[id]; return c; });
    setClockState(cs => { const c = { ...cs }; delete c[id]; return c; });
    setLeave(arr => arr.filter(l => l.staff_id !== id));
    toast(name + ' eliminado');
  };

  const saveProfile = (updated) => {
    setStaff(arr => arr.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    setProfileMember(null);
    toast(updated.name.split(' ')[0] + ' actualizado');
  };

  const autoOrganize = () => {
    const prefByRole = (role) => { const r = (role || '').toLowerCase(); return (r.includes('camar') || r.includes('barman') || r.includes('maître') || r.includes('maitre')) ? ['afternoon', 'night'] : ['morning', 'afternoon']; };
    const next = {};
    staff.forEach((s, idx) => {
      const pref = prefByRole(s.role);
      const off = new Set([idx % 7, (idx + 3) % 7]);
      next[s.id] = weekDates.map((d, day) => {
        const di = D.iso(d);
        const onLeave = leave.some(l => l.status === 'approved' && l.staff_id === s.id && di >= l.start_date && di <= l.end_date);
        if (onLeave) return 'leave';
        if (off.has(day)) return 'off';
        return pref[day % 2];
      });
    });
    setRota(next);
    toast('Rota reorganizada y equilibrada');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {showAdd && <StaffModal onSave={addStaff} onClose={() => setShowAdd(false)} />}
      {profileMember && <EmployeeProfile member={profileMember} onSave={saveProfile} onClose={() => setProfileMember(null)} />}
      {showImport && <RotaImportModal staff={staff} onImport={applyRotaImport} onClose={() => setShowImport(false)} />}

      {cellEdit && <ShiftPopover x={cellEdit.x} y={cellEdit.y} current={(rota[cellEdit.sid] || [])[cellEdit.dayIdx]} onPick={(v) => { setCell(cellEdit.sid, cellEdit.dayIdx, v); setCellEdit(null); }} onClose={() => setCellEdit(null)} />}
      <div className="bg-white border-b border-black/7 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] text-xl font-black text-gray-900">Personal</h1>
          <p className="text-xs text-gray-500 mt-0.5">{staff.length} empleados · {Object.values(clockState).filter(s => s === 'in').length} fichados ahora</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap hover:bg-brand/90 transition"><i className="ti ti-plus" /> Nuevo empleado</button>
      </div>

      <div className="flex bg-white border-b border-black/7 px-6">
        {['turnos', 'horas', 'fichajes', 'vacaciones'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-xs font-semibold border-b-2 transition ${tab === t ? 'text-brand border-brand' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>{t === 'turnos' ? 'Turnos semanales' : t === 'horas' ? 'Cómputo de horas' : t === 'fichajes' ? 'Fichajes de hoy' : 'Vacaciones'}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'turnos' && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'En turno ahora', val: Object.values(clockState).filter(s => s === 'in').length, sub: 'trabajando', color: 'text-brand' },
                { label: 'Horas esta semana', val: weekTotalHours + 'h', sub: 'total equipo', color: 'text-gray-900' },
                { label: 'Coste laboral', val: eur0(weekTotalHours * 14), sub: 'estimado semana', color: 'text-gray-900' },
                { label: 'Bajas activas', val: leave.filter(l => l.status === 'approved').length, sub: 'aprobadas', color: 'text-red-500' },
              ].map(k => (
                <div key={k.label} className="bg-white border border-black/7 rounded-xl p-4"><div className="text-[10px] text-gray-400 font-medium">{k.label}</div><div className={`font-['Syne'] text-2xl font-black mt-1 ${k.color}`}>{k.val}</div><div className="text-[10px] text-gray-400 mt-0.5">{k.sub}</div></div>
              ))}
            </div>
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-black/7 flex items-center justify-between">
                <div>
                  <div className="font-['Syne'] text-sm font-black text-gray-900">Turnos semanales</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Pulsa una celda para editar turno, horario o baja · {weekDates[0].getDate()} {MONTHS[weekDates[0].getMonth()].slice(0, 3)} – {weekDates[6].getDate()} {MONTHS[weekDates[6].getMonth()].slice(0, 3)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={autoOrganize} className="flex items-center gap-1.5 bg-brand/10 text-brand text-xs font-semibold px-3 py-2 rounded-lg hover:bg-brand/20 transition">
                    <i className="ti ti-wand" /> Auto-organizar
                  </button>
                  <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-200 transition">
                    <i className="ti ti-file-upload" /> Importar rota
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-gray-50">
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-left min-w-[170px]">Empleado</th>
                    {weekDates.map(d => <th key={d} className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-2.5 text-center min-w-[74px]">{DCAP[d.getDay()]} {d.getDate()}</th>)}
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-2.5 text-right">Total</th>
                    <th className="w-8"></th>
                  </tr></thead>
                  <tbody>
                    {staff.map(s => (
                      <tr key={s.id} className="border-t border-black/5 hover:bg-gray-50 transition group">
                        <td className="px-5 py-3"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: s.color_bg, color: s.color }}>{s.initials}</div><div className="min-w-0"><div className="text-xs font-semibold text-gray-900 whitespace-nowrap">{s.name}</div><div className="text-[10px] text-gray-400 whitespace-nowrap">{s.role}</div></div></div></td>
                        {(rota[s.id] || Array(7).fill('off')).map((type, i) => (
                          <td key={i} className="py-2 px-1 text-center">
                            <button onClick={(e) => setCellEdit({ sid: s.id, dayIdx: i, x: e.clientX, y: e.clientY })} className={`text-[9px] font-semibold px-2 py-1 rounded-lg border inline-block transition hover:ring-1 hover:ring-brand/40 ${cellStyle(type)}`}>{cellLabel(type)}</button>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">{totalHours(s.id)}h</td>
                        <td className="pr-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => setProfileMember(s)} title="Ver perfil" className="w-6 h-6 rounded-lg text-gray-300 hover:text-brand hover:bg-brand/10 transition flex items-center justify-center"><i className="ti ti-user text-sm" /></button>
                            <button onClick={() => removeStaff(s.id)} title="Eliminar" className="w-6 h-6 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center"><i className="ti ti-trash text-sm" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'horas' && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Horas hoy', val: fmtH(staff.reduce((t, s) => t + dailyHours(s.id), 0)), sub: 'turno de hoy · equipo' },
                { label: 'Horas esta semana', val: fmtH(weekTotalHours), sub: 'plantilla completa' },
                { label: 'Horas este mes', val: fmtH(staff.reduce((t, s) => t + monthlyHours(s.id), 0)), sub: MONTHS[D.today.getMonth()] },
              ].map(k => (
                <div key={k.label} className="bg-white border border-black/7 rounded-xl p-4">
                  <div className="text-[10px] text-gray-400 font-medium">{k.label}</div>
                  <div className="font-['Syne'] text-2xl font-black mt-1 text-gray-900">{k.val}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 capitalize">{k.sub}</div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-black/7">
                <div className="font-['Syne'] text-sm font-black text-gray-900">Horas por empleado</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Cómputo diario, semanal y mensual · coste estimado a 14 €/h</div>
              </div>
              <table className="w-full">
                <thead><tr className="bg-gray-50">
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-left">Empleado</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-2.5 text-center">Hoy</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-2.5 text-center">Semana</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-2.5 text-center">Mes</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-2.5 text-right">Coste mes</th>
                </tr></thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id} className="border-t border-black/5 hover:bg-gray-50 transition">
                      <td className="px-5 py-3"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: s.color_bg, color: s.color }}>{s.initials}</div><div className="min-w-0"><div className="text-xs font-semibold text-gray-900 whitespace-nowrap">{s.name}</div><div className="text-[10px] text-gray-400 whitespace-nowrap">{s.role}</div></div></div></td>
                      <td className="py-3 text-center text-xs font-semibold text-gray-500">{fmtH(dailyHours(s.id))}</td>
                      <td className="py-3 text-center text-xs font-bold text-brand">{fmtH(totalHours(s.id))}</td>
                      <td className="py-3 text-center text-xs font-semibold text-gray-700">{fmtH(monthlyHours(s.id))}</td>
                      <td className="px-5 py-3 text-right text-xs font-semibold text-gray-900">{eur0(monthlyHours(s.id) * 14)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'fichajes' && (
          <div className="grid grid-cols-[1fr_320px] gap-4">
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-black/7"><div className="font-['Syne'] text-sm font-black text-gray-900">Fichajes en tiempo real</div><div className="text-[10px] text-gray-400 mt-0.5 capitalize">{fmtDM(D.today)}</div></div>
              <div className="divide-y divide-black/5">
                {staff.map(s => {
                  const stt = clockState[s.id] || 'out';
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: s.color_bg, color: s.color }}>{s.initials}</div>
                      <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-900 whitespace-nowrap">{s.name}</div><div className="text-[10px] text-gray-400">{s.role} · Entrada: {D.clockIn[s.id] || '—'}</div></div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${stt === 'in' ? 'bg-green-100 text-green-700' : stt === 'break' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{stt === 'in' ? 'Trabajando' : stt === 'break' ? 'Descanso' : 'Sin fichar'}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => setClock(s.id, 'in')} className="text-[10px] px-2.5 py-1 rounded-lg bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition font-semibold">Entrada</button>
                        <button onClick={() => setClock(s.id, 'out')} className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 border border-black/10 hover:bg-gray-100 transition font-semibold">Salida</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white border border-black/7 rounded-xl p-4 h-fit">
              <div className="font-['Syne'] text-sm font-black text-gray-900 mb-3">Resumen</div>
              {[{ label: 'Trabajando', val: Object.values(clockState).filter(s => s === 'in').length, color: 'text-brand' }, { label: 'En descanso', val: Object.values(clockState).filter(s => s === 'break').length, color: 'text-amber-500' }, { label: 'Sin fichar', val: Object.values(clockState).filter(s => s === 'out').length, color: 'text-gray-400' }].map(s => (
                <div key={s.label} className="flex justify-between py-2 border-b border-black/5 last:border-0"><span className="text-xs text-gray-500">{s.label}</span><span className={`text-sm font-bold ${s.color}`}>{s.val}</span></div>
              ))}
            </div>
          </div>
        )}

        {tab === 'vacaciones' && (
          <div className="grid grid-cols-[1fr_320px] gap-4">
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-black/7"><div className="font-['Syne'] text-sm font-black text-gray-900">Solicitudes de ausencia</div><div className="text-[10px] text-gray-400 mt-0.5">{leave.filter(l => l.status === 'pending').length} pendientes de aprobación</div></div>
              <div className="divide-y divide-black/5">
                {leave.map(req => {
                  const s = staffById[req.staff_id]; if (!s) return null;
                  return (
                    <div key={req.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: s.color_bg, color: s.color }}>{s.initials}</div>
                      <div className="flex-1"><div className="text-sm font-medium text-gray-900">{s.name}</div><div className="text-[10px] text-gray-400">{req.start_date} – {req.end_date} · {req.days} días · {req.reason}</div></div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>{req.status === 'approved' ? 'Aprobada' : req.status === 'rejected' ? 'Rechazada' : 'Pendiente'}</span>
                      {req.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button onClick={() => updateLeave(req.id, 'approved')} className="w-7 h-7 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition flex items-center justify-center"><i className="ti ti-check text-sm" /></button>
                          <button onClick={() => updateLeave(req.id, 'rejected')} className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition flex items-center justify-center"><i className="ti ti-x text-sm" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white border border-black/7 rounded-xl overflow-hidden h-fit">
              <div className="px-4 py-3.5 border-b border-black/7"><div className="font-['Syne'] text-sm font-black text-gray-900">Días disponibles 2026</div><div className="text-[10px] text-gray-400">30 días por empleado</div></div>
              <div className="divide-y divide-black/5">
                {staff.map(s => {
                  const used = leave.filter(l => l.staff_id === s.id && l.status === 'approved').reduce((t, l) => t + l.days, 0);
                  const pct = Math.round((used / 30) * 100);
                  return (
                    <div key={s.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: s.color_bg, color: s.color }}>{s.initials}</div><span className="text-xs font-medium text-gray-900">{s.name}</span></div><span className="text-[10px] text-gray-400">{used}/30</span></div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 70 ? '#E85D3A' : pct > 40 ? '#F4A72E' : '#D8552E' }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Reservas, TPV, Cocina, Personal, StaffModal });
