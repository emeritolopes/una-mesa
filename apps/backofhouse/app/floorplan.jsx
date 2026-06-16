/* ─────────────────────────────────────────────────────────────
   Una Mesa — Interactive Floor Plan SVG
   ───────────────────────────────────────────────────────────── */

const FP = { CR: 5, CGAP: 7 }; /* chair radius, gap from table edge */

/* Status palette */
const FP_C = {
  free:     { fill: '#FFFFFF', stroke: '#D0C8BF', text: '#6E655C', chair: '#D8D2CB' },
  occupied: { fill: '#FEF0EB', stroke: '#D8552E', text: '#D8552E', chair: '#FBCAB7' },
  reserved: { fill: '#FFFBF0', stroke: '#D97706', text: '#92400E', chair: '#FDE68A' },
  cleaning: { fill: '#EFF8FF', stroke: '#3B82F6', text: '#1D4ED8', chair: '#BFDBFE' },
};
const FP_SEL = { fill: '#D8552E', stroke: '#B44A27', text: '#FFFFFF', chair: 'rgba(255,255,255,0.45)' };

/* ── Table definitions ── */
const FLOOR_DEFS = [
  { id:'ft1',  label:'1',  shape:'rect',    cx:58,  cy:70,  tw:58,  th:58,  capacity:2,  section:'sala',    topSeats:1, botSeats:1, lftSeats:0, rgtSeats:0 },
  { id:'ft2',  label:'2',  shape:'rect',    cx:165, cy:66,  tw:74,  th:58,  capacity:2,  section:'sala',    topSeats:1, botSeats:1, lftSeats:0, rgtSeats:0 },
  { id:'ft3',  label:'3',  shape:'rect',    cx:296, cy:98,  tw:72,  th:145, capacity:6,  section:'sala',    topSeats:2, botSeats:2, lftSeats:1, rgtSeats:1 },
  { id:'ft4',  label:'4',  shape:'round',   cx:490, cy:108, r:84,           capacity:10, section:'redonda', roundSeats:10 },
  { id:'ft5',  label:'5',  shape:'diamond', cx:58,  cy:245, s:40,           capacity:4,  section:'sala',    roundSeats:4 },
  { id:'ft6',  label:'6',  shape:'diamond', cx:185, cy:243, s:48,           capacity:4,  section:'sala',    roundSeats:4 },
  { id:'ft7',  label:'7',  shape:'rect',    cx:72,  cy:355, tw:122, th:68,  capacity:6,  section:'sala',    topSeats:2, botSeats:2, lftSeats:1, rgtSeats:1 },
  { id:'ft8',  label:'8',  shape:'rect',    cx:218, cy:355, tw:98,  th:66,  capacity:4,  section:'sala',    topSeats:2, botSeats:2, lftSeats:0, rgtSeats:0 },
  { id:'ft9',  label:'9',  shape:'rect',    cx:338, cy:357, tw:80,  th:62,  capacity:4,  section:'sala',    topSeats:2, botSeats:2, lftSeats:0, rgtSeats:0 },
  { id:'ft10', label:'10', shape:'round',   cx:490, cy:355, r:66,           capacity:8,  section:'redonda', roundSeats:8 },
  { id:'ft11', label:'11', shape:'round',   cx:70,  cy:500, r:58,           capacity:6,  section:'redonda', roundSeats:6 },
  { id:'ft12', label:'12', shape:'round',   cx:210, cy:502, r:50,           capacity:5,  section:'redonda', roundSeats:5 },
  { id:'ft13', label:'13', shape:'round',   cx:332, cy:468, r:30,           capacity:2,  section:'redonda', roundSeats:2 },
  { id:'ft14', label:'14', shape:'round',   cx:345, cy:564, r:38,           capacity:3,  section:'redonda', roundSeats:3 },
  { id:'ft15', label:'15', shape:'round',   cx:478, cy:512, r:46,           capacity:4,  section:'redonda', roundSeats:4 },
];

/* Chair positions — all uniform circles, no rotation */
function fpChairs(def) {
  const { cx, cy, shape } = def;
  const gap = FP.CR + FP.CGAP;
  const res = [];
  if (shape === 'round') {
    const { r, roundSeats: n } = def;
    const d = r + gap;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      res.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d });
    }
  } else if (shape === 'diamond') {
    const d = def.s + gap;
    res.push({ x: cx,   y: cy - d });
    res.push({ x: cx,   y: cy + d });
    res.push({ x: cx-d, y: cy     });
    res.push({ x: cx+d, y: cy     });
  } else {
    const { tw, th, topSeats: top=0, botSeats: bot=0, lftSeats: lft=0, rgtSeats: rgt=0 } = def;
    for (let i=0;i<top;i++){ const t=top>1?(i+1)/(top+1):0.5; res.push({x:cx-tw/2+t*tw, y:cy-th/2-gap}); }
    for (let i=0;i<bot;i++){ const t=bot>1?(i+1)/(bot+1):0.5; res.push({x:cx-tw/2+t*tw, y:cy+th/2+gap}); }
    for (let i=0;i<lft;i++){ const t=lft>1?(i+1)/(lft+1):0.5; res.push({x:cx-tw/2-gap,  y:cy-th/2+t*th}); }
    for (let i=0;i<rgt;i++){ const t=rgt>1?(i+1)/(rgt+1):0.5; res.push({x:cx+tw/2+gap,  y:cy-th/2+t*th}); }
  }
  return res;
}

function fpBadge(def) {
  if (def.shape === 'rect')  return { bx: def.cx + def.tw/2 - 4, by: def.cy - def.th/2 + 4 };
  if (def.shape === 'round') return { bx: def.cx + def.r*0.66,   by: def.cy - def.r*0.66   };
  return { bx: def.cx + def.s*0.66, by: def.cy - def.s*0.66 };
}

function FPTable({ def, storeT, sel, order, onSel, manage, onEdit, onDel }) {
  const status = storeT ? storeT.status : 'free';
  const c = sel ? FP_SEL : (FP_C[status] || FP_C.free);
  const chairs = fpChairs(def);
  const tot = order ? order.reduce((s,i) => s + i.price * i.quantity, 0) : 0;
  const { cx, cy, shape } = def;
  const sw = sel ? 2.5 : 1.5;

  const minD = shape==='round' ? def.r*2 : shape==='diamond' ? def.s*1.4 : Math.min(def.tw, def.th);
  const fs = minD < 40 ? 13 : minD < 70 ? 17 : 21;
  const hasTotal = tot > 0 && minD >= 40;

  let body;
  if (shape === 'round') {
    body = <circle cx={cx} cy={cy} r={def.r} fill={c.fill} stroke={c.stroke} strokeWidth={sw} />;
  } else if (shape === 'diamond') {
    const { s } = def;
    body = <polygon points={`${cx},${cy-s} ${cx+s},${cy} ${cx},${cy+s} ${cx-s},${cy}`} fill={c.fill} stroke={c.stroke} strokeWidth={sw} />;
  } else {
    body = <rect x={cx-def.tw/2} y={cy-def.th/2} width={def.tw} height={def.th} rx={6} fill={c.fill} stroke={c.stroke} strokeWidth={sw} />;
  }

  const { bx, by } = fpBadge(def);
  const txtStyle = { fontWeight:700, fontFamily:'Manrope,sans-serif', fill:c.text, pointerEvents:'none', userSelect:'none' };

  return (
    <g style={{ cursor:'pointer' }} onClick={() => manage ? onEdit(storeT || def) : onSel(def.id)}>
      {/* Chairs — uniform circles */}
      {chairs.map((ch, i) => (
        <circle key={i} cx={ch.x} cy={ch.y} r={FP.CR} fill={c.chair} />
      ))}
      {/* Table surface */}
      {body}
      {/* Number */}
      <text x={cx} y={cy - (hasTotal ? fs*0.9 : fs*0.6)} textAnchor="middle" dominantBaseline="middle"
        style={{ ...txtStyle, fontSize:fs, fontWeight:800 }}>
        {def.label}
      </text>
      {/* Capacity */}
      <text x={cx} y={cy + (hasTotal ? fs*0.1 : fs*0.6)} textAnchor="middle" dominantBaseline="middle"
        style={{ ...txtStyle, fontSize:Math.max(7,fs*0.58), fontWeight:600, opacity: sel ? 0.8 : 0.5 }}>
        {(storeT ? storeT.capacity : def.capacity)}p
      </text>
      {/* Order total */}
      {hasTotal && (
        <text x={cx} y={cy + fs*1.1} textAnchor="middle" dominantBaseline="middle"
          style={{ ...txtStyle, fontSize:Math.max(7,fs-3), fill: sel ? 'rgba(255,255,255,0.9)' : '#D8552E' }}>
          {eur0(tot)}
        </text>
      )}
      {/* Manage badges */}
      {manage && (
        <>
          <circle cx={bx} cy={by} r={8} fill="#D8552E" opacity={0.92} />
          <text x={bx} y={by+0.5} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize:8, fill:'#fff', pointerEvents:'none', userSelect:'none' }}>✎</text>
          <g onClick={e=>{ e.stopPropagation(); onDel(def.id); }} style={{ cursor:'pointer' }}>
            <circle cx={bx+18} cy={by} r={7} fill="#DC2626" opacity={0.92} />
            <text x={bx+18} y={by+0.5} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize:9, fontWeight:700, fill:'#fff', pointerEvents:'none', userSelect:'none' }}>✕</text>
          </g>
        </>
      )}
    </g>
  );
}

function FloorPlan({ tables, ordersMap, selId, onSelect, manage, onEdit, onRemove }) {
  return (
    <div className="w-full h-full overflow-hidden" style={{ background:'#FAFAF7' }}>
      <svg viewBox="0 0 600 640" style={{ width:'100%', height:'100%', display:'block' }}
        preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        {/* Clean open floor — no bounding box */}
        <rect width={600} height={640} fill="#FAFAF7" />
        {/* Tables */}
        {FLOOR_DEFS.map(def => {
          const storeT = tables.find(t => t.id === def.id);
          if (!storeT) return null;
          return (
            <FPTable key={def.id} def={def} storeT={storeT} sel={selId===def.id}
              order={ordersMap && ordersMap[def.id]} onSel={onSelect}
              manage={manage} onEdit={onEdit} onDel={onRemove} />
          );
        })}
      </svg>
    </div>
  );
}

Object.assign(window, { FloorPlan, FLOOR_DEFS });
