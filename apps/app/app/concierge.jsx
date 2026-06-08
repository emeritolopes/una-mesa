/* ════ UNA MESA · Conserje IA (interactive chat) ════ */

/* ── intent parser (local, always works) ── */
function parseIntent(text){
  const t = ' ' + text.toLowerCase()
    .normalize('NFD').replace(/[̀-̃̈]/g,'') + ' '; // strip accents (keep ñ)
  let party = null;
  const numWords = { un:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9, diez:10 };
  // "pareja" always means 2 — check first so it wins over "una"
  if (/\bpareja\b/.test(t)) party = 2;
  let m = t.match(/\b(?:para|somos|mesa para|grupo de|reserva para)\s+(\d{1,2})\b/) || t.match(/\b(\d{1,2})\s*(?:personas|comensales|pax|gente)\b/);
  if (!party && m) party = parseInt(m[1],10);
  // spelled-out number right after a reservation preposition (e.g. "para dos", "somos cuatro")
  if (!party){
    const mw = t.match(/\b(?:para|somos|mesa para|reserva para|grupo de)\s+(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/);
    if (mw) party = numWords[mw[1]];
  }
  // spelled-out number anywhere, when a person/table keyword is present.
  // "un/una" only counts with a person-noun (avoid "una mesa" = a table → 1).
  if (!party) for (const w in numWords){
    if (t.includes(' '+w+' ')){
      const strong = /person|comensal|pax/.test(t);
      const weak = /mesa|somos|grupo/.test(t);
      if (strong || ((w!=='un' && w!=='una') && weak)) { party = numWords[w]; break; }
    }
  }

  const dietary = [];
  if (/vegan/.test(t)) dietary.push('vegano');
  if (/vegetarian/.test(t)) dietary.push('vegetariano');
  if (/sin gluten|celiac|celiac/.test(t)) dietary.push('sin gluten');

  const CUES = {
    'Marisco': /marisco|mariscada|pescado|ostra|almeja|gamba|percebe/,
    'Japonés': /japon|sushi|nigiri|ramen|sashimi/,
    'Arroces': /arroz|paella/,
    'Asador': /asador|carne|chuleton|chuletón|brasa|parrilla|costilla/,
    'Italiano': /italian|pizza|pasta|trattoria/,
    'Brunch': /brunch|desayun|tortita/,
    'Gallego': /gallego|galician|pulpo|lacon|empanada/,
    'Fusión': /fusion|fusión|asiatic|asiátic|nikkei/,
    'Tapas': /tapas|pincho|picoteo/
  };
  const cuisines = [];
  for (const c in CUES) if (CUES[c].test(t)) cuisines.push(c);

  const vibes = [];
  if (/romantic|romántic|aniversario|cita|pareja/.test(t)) vibes.push('Romántico');
  if (/terraza|fuera|exterior|al aire/.test(t)) vibes.push('Con terraza');
  if (/vista|mirador|ria|ría|mar/.test(t)) vibes.push('Vistas');
  if (/tranquil|silencio|relajad/.test(t)) vibes.push('Tranquilo');
  if (/negocio|trabajo|empresa|cliente/.test(t)) vibes.push('Grupos');
  if (/saludable|sano|healthy|ligero/.test(t)) vibes.push('Saludable');

  let price = null;
  if (/barat|economic|económic|asequible|sin gastar/.test(t)) price = '€';
  if (/car[oa]\b|premium|lujo|alta cocina|fine dining|especial/.test(t)) price = '€€€';

  let city = null;
  const cities = ['vigo','madrid','barcelona','sevilla','valencia','bilbao','santiago','coruña','coruna','pontevedra','ourense','lugo','oporto','porto'];
  for (const c of cities){ if (t.includes(c)) { city = c; break; } }

  let time = null;
  const tm = t.match(/\b(\d{1,2})[:h\.](\d{2})?\b/);
  if (tm && parseInt(tm[1],10) <= 23) time = tm[1].padStart(2,'0') + ':' + (tm[2] || '00');
  if (!time && /esta noche|cena|cenar|noche/.test(t)) time = 'noche';
  if (!time && /comer|comida|mediodia|mediodía|almuerzo|almorzar/.test(t)) time = 'comida';

  return { party, dietary, cuisines, vibes, price, city, time, raw: text };
}

/* ── match against the real Vigo dataset ── */
function matchRestaurants(intent){
  const data = window.UM_DATA;
  const scored = data.map(r=>{
    const hay = [r.cuisine, r.area, ...(r.tags||[]), ...(r.kw||[])].join(' ').toLowerCase();
    const isVeg = /vegetarian|vegano|verde|saludable|mercado/.test(hay) || (r.kw||[]).some(k=>/veget|vegan/i.test(k));
    let score = (r.match||80)/100;
    let dietOk = true;
    if (intent.dietary.length){
      if (isVeg) score += 0.7; else { dietOk = false; }
    }
    intent.cuisines.forEach(c=>{ if (hay.includes(c.toLowerCase())) score += 0.45; });
    intent.vibes.forEach(v=>{ if (hay.includes(v.toLowerCase())) score += 0.3; });
    if (intent.price && r.price === intent.price) score += 0.25;
    if (intent.party && intent.party >= 6 && /grupo/.test(hay)) score += 0.35;
    return { r, score, dietOk };
  });
  const ok = scored.filter(x=>x.dietOk).sort((a,b)=>b.score-a.score);
  return (ok.length ? ok : scored.sort((a,b)=>b.score-a.score)).map(x=>x.r);
}

/* ── friendly reply (Claude if available, templated fallback) ── */
function templatedReply(intent, picks){
  const bits = [];
  if (intent.party) bits.push('mesa para ' + intent.party);
  if (intent.dietary.length) bits.push('opciones ' + intent.dietary.join(' y '));
  if (intent.cuisines.length) bits.push(intent.cuisines.join(' / ').toLowerCase());
  if (intent.vibes.length) bits.push(intent.vibes.join(', ').toLowerCase());
  if (intent.time && intent.time!=='noche' && intent.time!=='comida') bits.push('a las ' + intent.time);
  else if (intent.time) bits.push('para ' + intent.time==='noche'?'cenar':'comer');
  const otherCity = intent.city && intent.city !== 'vigo';
  let head;
  if (otherCity) head = 'De momento operamos en Vigo, así que te muestro lo mejor de aquí que encaja con lo que buscas';
  else head = bits.length ? ('Perfecto — busco ' + bits.join(', ')) : 'He buscado entre los mejores de Vigo';
  const names = picks.slice(0,3).map(r=>r.name).join(', ');
  return head + '. Estas son mis recomendaciones: ' + names + '.';
}

async function getReply(intent, picks){
  const local = templatedReply(intent, picks);
  if (!(window.claude && typeof window.claude.complete === 'function')) return local;
  const list = picks.slice(0,3).map(r=>`${r.name} (${r.cuisine}, ${r.area}, ${r.price})`).join('; ');
  const prompt = `Eres el conserje de Una Mesa, una app de reservas de restaurantes en VIGO (Galicia).
El usuario pidió: "${intent.raw}".
Restaurantes que he seleccionado para él (usa SOLO estos, no inventes otros): ${list}.
Responde en español, cálido y muy breve (máximo 2 frases). Resume qué has entendido (nº de personas, dieta, zona u ocasión si los mencionó) y presenta las opciones por su nombre. Si pidió una ciudad distinta de Vigo, acláralo con amabilidad (solo operamos en Vigo). No uses listas ni markdown, solo texto.`;
  try {
    const r = await Promise.race([
      window.claude.complete({ messages:[{ role:'user', content: prompt }] }),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')), 9000))
    ]);
    const txt = (typeof r === 'string' ? r : (r && r.content) || '').trim()
      .replace(/\*\*(.+?)\*\*/g,'$1').replace(/[*_`#]/g,'').replace(/\s+/g,' ').trim();
    return txt && txt.length > 8 ? txt : local;
  } catch(e){ return local; }
}

/* ════ Conserje screen · Stitch dark redesign ════ */
function ConciergeScreen({ initialQuery, openRest, favs, toggleFav, startBook, go }){
  const [msgs, setMsgs] = useState([
    { who:'ai', text:'¡Hola! Soy tu conserje de Una Mesa. Dime qué te apetece — por ejemplo, "una mesa para 5 personas, algo vegano y con terraza" — y te busco la mesa perfecta en Vigo.' }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const seeded = useRef(false);

  const examples = [
    'Quiero una mesa para 5 en Madrid para veganos',
    'Cena romántica con terraza para dos',
    'Algo de marisco para 6, sin gastar mucho',
    'El mejor sitio de arroces para comer hoy'
  ];

  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, busy]);

  async function ask(text){
    const q = (text || '').trim();
    if (!q || busy) return;
    setInput('');
    setMsgs(m => [...m, { who:'me', text:q }]);
    setBusy(true);
    const intent = parseIntent(q);
    const picks = matchRestaurants(intent).slice(0,4);
    await new Promise(r=>setTimeout(r, 700));
    const reply = await getReply(intent, picks);
    setMsgs(m => [...m, { who:'ai', text: reply, picks, intent }]);
    setBusy(false);
  }

  useEffect(()=>{
    if (!seeded.current && initialQuery && initialQuery.trim()){
      seeded.current = true;
      ask(initialQuery);
    }
  }, []);

  const submit = e => { e.preventDefault(); ask(input); };

  return React.createElement('div', { className:'view cc-view' },
    React.createElement('div', { className:'wrap cc-wrap' },

      /* ── Header ── */
      React.createElement('div', { className:'cc-head' },
        React.createElement('span', { className:'eyebrow' }, 'Conserje IA'),
        React.createElement('h1', { className:'display' },
          'Dime qué te apetece y ',
          React.createElement('span',{className:'hl'},'yo reservo'),
          '.'
        ),
        React.createElement('p', null,
          'Pregunta con tus palabras — ocasión, personas, dieta, zona o presupuesto. El conserje entiende y te trae la mesa.'
        )
      ),

      /* ── Chat panel ── */
      React.createElement('div', { className:'cc-panel' },

        /* Scroll area */
        React.createElement('div', { className:'cc-scroll', ref:scrollRef },
          msgs.map((mm,i) => React.createElement(ConciergeMsg, {
            key:i, m:mm, openRest, favs, toggleFav, startBook
          })),
          busy ? React.createElement('div',{className:'cc-msg ai'},
            React.createElement('div',{className:'cc-ava'},
              React.createElement(Icon,{name:'sparkle',fill:'currentColor'})),
            React.createElement('div',{className:'cc-bub thinking'},
              React.createElement('span',{className:'tdot'}),
              React.createElement('span',{className:'tdot'}),
              React.createElement('span',{className:'tdot'}))
          ) : null
        ),

        /* Suggestion chips */
        React.createElement('div', { className:'cc-examples' },
          examples.map((ex,i) => React.createElement('button',{
            key:i, className:'chip', onClick:()=>ask(ex), disabled:busy
          }, ex))
        ),

        /* Input form — editorial border-bottom, icon send button */
        React.createElement('form', { className:'cc-input', onSubmit:submit },
          React.createElement(Icon,{ name:'sparkle' }),
          React.createElement('input', {
            value:input, onChange:e=>setInput(e.target.value),
            placeholder:'Escribe lo que te apetece…', disabled:busy, autoFocus:true
          }),
          React.createElement('button', {
            type:'submit',
            className:'cc-send-btn',
            disabled: busy || !input.trim(),
            title: busy ? 'Buscando…' : 'Enviar'
          },
            React.createElement(Icon,{name:'arrow',style:{width:22,height:22}})
          )
        )
      )
    )
  );
}

/* ── A single chat row: bubble + optional result cards ── */
function ConciergeMsg({ m, openRest, favs, toggleFav, startBook }){
  if (m.who === 'me')
    return React.createElement('div', { className:'cc-msg me' },
      React.createElement('div', { className:'cc-bub' }, m.text));

  const intent = m.intent || {};
  const presetParty = intent.party || null;
  const slotFor = r => {
    const wantLunch = intent.time === 'comida';
    const pool = wantLunch ? (r.times.lunch||[]) : (r.times.dinner||r.times.lunch||[]);
    const free = pool.find(t=>Array.isArray(t)? t[1]!=='full' : true);
    return Array.isArray(free) ? free[0] : (free || null);
  };

  return React.createElement('div', { className:'cc-msg ai' },
    React.createElement('div', { className:'cc-ava' },
      React.createElement(Icon,{name:'sparkle',fill:'currentColor'})),
    React.createElement('div', { className:'cc-ai-col' },
      React.createElement('div', { className:'cc-bub' }, m.text),
      (m.picks && m.picks.length) ? React.createElement('div', { className:'cc-results' },
        m.picks.map((r,i) => React.createElement('div', {
          key:r.id, className:'cc-card-wrap', style:{ animationDelay:(i*90)+'ms' }
        },
          React.createElement(window.RestaurantCard, {
            r, fav:favs.includes(r.id), onFav:toggleFav,
            onOpen:openRest, onBook:startBook, showMatch:true
          }),
          React.createElement('button', {
            className:'cc-book btn btn-acc',
            onClick:()=>startBook(r.id, slotFor(r), presetParty)
          },
            React.createElement(Icon,{name:'cal'}),
            presetParty ? ('Reservar para '+presetParty) : 'Reservar ahora'
          )
        ))
      ) : null
    )
  );
}

Object.assign(window, { ConciergeScreen, parseIntent, matchRestaurants });
