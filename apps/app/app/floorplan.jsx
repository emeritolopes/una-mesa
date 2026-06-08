/* ─────────────────────────────────────────────────────────────
   Una Mesa — Interactive Floor Plan SVG
   Recreated from uploaded restaurant floor plan photo.
   15 table configurations: squares, rectangles, diamonds, rounds.
   ───────────────────────────────────────────────────────────── */

/* Chair geometry */
const FP = { CW: 13, CH: 9, CGAP: 4 };

/* SVG status palette — mirrors brand colors without Tailwind */
const FP_C = {
  free:     { fill: '#FAFAF6', stroke: '#CCCAC5', text: '#8B8578', chair: '#E0DED8' },
  occupied: { fill: '#FDF1EE', stroke: '#D8552E', text: '#D8552E', chair: '#F5C4B6' },
  reserved: { fill: '#FFFCF0', stroke: '#D97706', text: '#92400E', chair: '#FDE68A' },
  cleaning: { fill: '#EFF8FF', stroke: '#3B82F6', text: '#1D4ED8', chair: '#BFDBFE' },
};
const FP_SEL = { fill: '#D8552E', stroke: '#B44A27', text: '#FFFFFF', chair: '#E88060' };

/* ── Floor plan table definitions — based on uploaded photo ── */
const FLOOR_DEFS = [
  /* Row 1 */
  { id:'ft1',  label:'24"×24"',   shape:'rect',    cx:58,  cy:70,  tw:58,  th:58,  capacity:2,  section:'sala',    topSeats:1, botSeats:1, lftSeats:0, rgtSeats:0 },
  { id:'ft2',  label:'24"×30"',   shape:'rect',    cx:165, cy:66,  tw:74,  th:58,  capacity:2,  section:'sala',    topSeats:1, botSeats:1, lftSeats:0, rgtSeats:0 },
  { id:'ft3',  label:'30"×72"',   shape:'rect',    cx:296, cy:98,  tw:72,  th:145, capacity:6,  section:'sala',    topSeats:2, botSeats:2, lftSeats:1, rgtSeats:1 },
  { id:'ft4',  label:'72" Round', shape:'round',   cx:490, cy:108, r:84,           capacity:10, section:'redonda', roundSeats:10 },
  /* Row 2 — diamonds */
  { id:'ft5',  label:'30"×30"',   shape:'diamond', cx:58,  cy:240, s:40,           capacity:4,  section:'sala',    roundSeats:4 },
  { id:'ft6',  label:'36"×36"',   shape:'diamond', cx:185, cy:238, s:48,           capacity:4,  section:'sala',    roundSeats:4 },
  /* Row 3 — medium rects + round */
  { id:'ft7',  label:'30"×60"',   shape:'rect',    cx:72,  cy:348, tw:122, th:68,  capacity:6,  section:'sala',    topSeats:2, botSeats:2, lftSeats:1, rgtSeats:1 },
  { id:'ft8',  label:'30"×48"',   shape:'rect',    cx:218, cy:348, tw:98,  th:66,  capacity:4,  section:'sala',    topSeats:2, botSeats:2, lftSeats:0, rgtSeats:0 },
  { id:'ft9',  label:'24"×42"',   shape:'rect',    cx:338, cy:350, tw:80,  th:62,  capacity:4,  section:'sala',    topSeats:2, botSeats:2, lftSeats:0, rgtSeats:0 },
  { id:'ft10', label:'60" Round', shape:'round',   cx:490, cy:348, r:66,           capacity:8,  section:'redonda', roundSeats:8 },
  /* Row 4 — round tables */
  { id:'ft11', label:'48" Round', shape:'round',   cx:70,  cy:495, r:58,           capacity:6,  section:'redonda', roundSeats:6 },
  { id:'ft12', label:'42" Round', shape:'round',   cx:210, cy:497, r:50,           capacity:5,  section:'redonda', roundSeats:5 },
  { id:'ft13', label:'24" Round', shape:'round',   cx:332, cy:462, r:30,           capacity:2,  section:'redonda', roundSeats:2 },
  { id:'ft14', label:'30" Round', shape:'round',   cx:345, cy:558, r:38,           capacity:3,  section:'redonda', roundSeats:3 },
  { id:'ft15', label:'36" Round', shape:'round',   cx:478, cy:506, r:46,           capacity:4,  section:'redonda', roundSeats:4 },
];

/* Compute chair positions for any table definition */
function fpChairs(def) {
  const { cx, cy, shape } = def;
  const res = [];
  if (shape === 'round') {
    const { r, roundSeats: n } = def;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      const d = r + FP.CGAP + FP.CH / 2;
      res.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, rot: a * 180 / Math.PI + 90 });
    }
  } else if (shape === 'diamond') {
    const d = def.s + FP.CGAP + FP.CH / 2;
    res.push({ x: cx,   y: cy - d, rot: 0  }); // top
    res.push({ x: cx,   y: cy + d, rot: 0  }); // bottom
    res.push({ x: cx-d, y: cy,     rot: 90 }); // left
    res.push({ x: cx+d, y: cy,     rot: 90 }); // right
  } else {
    const { tw, th, topSeats: top = 0, botSeats: bot = 0, lftSeats: lft = 0, rgtSeats: rgt = 0 } = def;
    for (let i = 0; i < top; i++) { const t = top > 1 ? (i+1)/(top+1) : 0.5; res.push({ x: cx-tw/2+t*tw, y: cy-th/2-FP.CGAP-FP.CH/2, rot: 0  }); }
    for (let i = 0; i < bot; i++) { const t = bot > 1 ? (i+1)/(bot+1) : 0.5; res.push({ x: cx-tw/2+t*tw, y: cy+th/2+FP.CGAP+FP.CH/2, rot: 0  }); }
    for (let i = 0; i < lft; i++) { const t = lft > 1 ? (i+1)/(lft+1) : 0.5; res.push({ x: cx-tw/2-FP.CGAP-FP.CH/2, y: cy-th/2+t*th,  rot: 90 }); }
    for (let i = 0; i < rgt; i++) { const t = rgt > 1 ? (i+1)/(rgt+1) : 0.5; res.push({ x: cx+tw/2+FP.CGAP+FP.CH/2, y: cy-th/2+t*th,  rot: 90 }); }
  }
  return res;
}

/* Top-right corner of table's bounding box — for manage badges */
function fpBadge(def) {
  if (def.shape === 'rect')    return { bx: def.cx + def.tw / 2 - 4, by: def.cy - def.th / 2 + 4 };
  if (def.shape === 'round')   return { bx: def.cx + def.r * 0.66,   by: def.cy - def.r * 0.66   };
  return { bx: def.cx + def.s * 0.66, by: def.cy - def.s * 0.66 };
}

/* Single interactive table */
function FPTable({ def, storeT, sel, order, onSel, manage, onEdit, onDel }) {
  const status = storeT ? storeT.status : 'free';
  const c = sel ? FP_SEL : (FP_C[status] || FP_C.free);
  const chairs = fpChairs(def);
  const tot = order ? order.reduce((s, i) => s + i.price * i.quantity, 0) : 0;
  const { cx, cy, shape } = def;
  const sw = sel ? 2.5 : 1.5;

  /* Minimum dimension drives font size */
  const minD = shape === 'round' ? def.r * 2 : shape === 'diamond' ? def.s * 1.4 : Math.min(def.tw, def.th);
  const fs = minD < 50 ? 7 : minD < 80 ? 8.5 : 10;
  const hasTotal = tot > 0 && minD >= 40;

  /* Table body */
  let body;
  if (shape === 'round') {
    body = <circle cx={cx} cy={cy} r={def.r} fill={c.fill} stroke={c.stroke} strokeWidth={sw} />;
  } else if (shape === 'diamond') {
    const { s } = def;
    body = <polygon points={`${cx},${cy-s} ${cx+s},${cy} ${cx},${cy+s} ${cx-s},${cy}`} fill={c.fill} stroke={c.stroke} strokeWidth={sw} />;
  } else {
    body = <rect x={cx-def.tw/2} y={cy-def.th/2} width={def.tw} height={def.th} rx={3} fill={c.fill} stroke={c.stroke} strokeWidth={sw} />;
  }

  const { bx, by } = fpBadge(def);
  const txtStyle = { fontWeight: 700, fontFamily: 'Manrope,sans-serif', fill: c.text, pointerEvents: 'none', userSelect: 'none' };

  return (
    <g style={{ cursor: 'pointer' }} onClick={() => manage ? onEdit(storeT || def) : onSel(def.id)}>
      {/* Chairs */}
      {chairs.map((ch, i) => (
        <rect key={i} x={ch.x - FP.CW/2} y={ch.y - FP.CH/2} width={FP.CW} height={FP.CH} rx={2}
          fill={c.chair} transform={`rotate(${ch.rot},${ch.x},${ch.y})`} />
      ))}
      {/* Table surface */}
      {body}
      {/* Label */}
      <text x={cx} y={cy - (hasTotal ? fs * 0.65 : 0)} textAnchor="middle" dominantBaseline="middle"
        style={{ ...txtStyle, fontSize: fs }}>
        {def.label}
      </text>
      {/* Order total */}
      {hasTotal && (
        <text x={cx} y={cy + fs * 0.8} textAnchor="middle" dominantBaseline="middle"
          style={{ ...txtStyle, fontSize: Math.max(7, fs - 1.5), fill: sel ? 'rgba(255,255,255,0.9)' : '#D8552E' }}>
          {eur0(tot)}
        </text>
      )}
      {/* Manage mode — edit pencil + remove × */}
      {manage && (
        <>
          <circle cx={bx} cy={by} r={8} fill="#D8552E" opacity={0.92} />
          <text x={bx} y={by + 0.5} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 8, fill: '#fff', pointerEvents: 'none', userSelect: 'none' }}>✎</text>
          <g onClick={e => { e.stopPropagation(); onDel(def.id); }} style={{ cursor: 'pointer' }}>
            <circle cx={bx + 18} cy={by} r={7} fill="#DC2626" opacity={0.92} />
            <text x={bx + 18} y={by + 0.5} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 9, fontWeight: 700, fill: '#fff', pointerEvents: 'none', userSelect: 'none' }}>✕</text>
          </g>
        </>
      )}
    </g>
  );
}

/* Full floor plan SVG */
function FloorPlan({ tables, ordersMap, selId, onSelect, manage, onEdit, onRemove }) {
  return (
    <div className="w-full h-full overflow-hidden" style={{ background: '#F8F5F0' }}>
      <svg viewBox="0 0 600 640" style={{ width: '100%', height: '100%', display: 'block' }}
        preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        {/* Floor */}
        <rect width={600} height={640} fill="#F8F5F0" />
        {/* Subtle grid lines */}
        {Array.from({ length: 21 }).map((_, i) => (
          <line key={'h' + i} x1={0} y1={i * 32} x2={600} y2={i * 32} stroke="#EAE5DC" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={'v' + i} x1={i * 32} y1={0} x2={i * 32} y2={640} stroke="#EAE5DC" strokeWidth={0.5} />
        ))}
        {/* Tables */}
        {FLOOR_DEFS.map(def => {
          const storeT = tables.find(t => t.id === def.id);
          if (!storeT) return null;
          return (
            <FPTable key={def.id} def={def} storeT={storeT} sel={selId === def.id}
              order={ordersMap && ordersMap[def.id]} onSel={onSelect}
              manage={manage} onEdit={onEdit} onDel={onRemove} />
          );
        })}
      </svg>
    </div>
  );
}

Object.assign(window, { FloorPlan, FLOOR_DEFS });
