/* ════ UNA MESA · Conserje IA (interactive chat) ════ */

/* ── Market detection (self-contained copy — see home.jsx for canonical version) ── */
function ccMarket() {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'uk' || q === 'en') return 'en';
    if (window.location.hostname.endsWith('.co.uk')) return 'en';
  } catch (_) {}
  return 'es';
}
const CC_LANG = ccMarket();
const CC_T = {
  es: {
    greeting: '¡Hola! Soy tu conserje de Una Mesa. Dime qué te apetece — por ejemplo, "una mesa para 5 personas, algo vegano y con terraza" — y te busco la mesa perfecta.',
    examples: [
      'Quiero una mesa para 5 en Madrid para veganos',
      'Cena romántica con terraza para dos',
      'Algo de marisco para 6, sin gastar mucho',
      'El mejor sitio de arroces para comer hoy'
    ],
    eyebrow: 'Conserje IA',
    headingA: 'Dime qué te apetece y ', headingHl: 'yo reservo', headingB: '.',
    sub: 'Pregunta con tus palabras — ocasión, personas, dieta, zona o presupuesto. El conserje entiende y te trae la mesa.',
    inputPh: 'Escribe lo que te apetece…',
    searching: 'Buscando…', send: 'Enviar',
    bookFor: n => 'Reservar para '+n, bookNow: 'Reservar ahora',
    /* templatedReply (fallback local si falla la IA remota) */
    tableFor: n => 'mesa para '+n,
    dietOptions: arr => 'opciones '+arr.join(' y '),
    atTime: t => 'a las '+t,
    forDinner: 'para cenar', forLunch: 'para comer',
    otherCityHead: 'De momento no operamos en esa ciudad, así que te muestro lo mejor de aquí que encaja con lo que buscas',
    matchHead: bits => 'Perfecto — busco ' + bits,
    genericHead: 'He buscado entre los mejores restaurantes',
    theseAreMyRecs: names => '. Estas son mis recomendaciones: ' + names + '.',
  },
  en: {
    greeting: 'Hi! I\'m your Una Mesa concierge. Tell me what you fancy — for example, "a table for 5, something vegan with outdoor seating" — and I\'ll find you the perfect table.',
    examples: [
      'I want a table for 5 in London, vegan-friendly',
      'Romantic dinner with a terrace for two',
      'Something seafood-y for 6, without breaking the bank',
      'The best rice place for lunch today'
    ],
    eyebrow: 'AI Concierge',
    headingA: 'Tell me what you fancy and ', headingHl: 'I\'ll book it', headingB: '.',
    sub: 'Ask in your own words — occasion, people, diet, area or budget. The concierge understands and brings you the table.',
    inputPh: 'Type what you fancy…',
    searching: 'Searching…', send: 'Send',
    bookFor: n => 'Book for '+n, bookNow: 'Book now',
    tableFor: n => 'a table for '+n,
    dietOptions: arr => arr.join(' and ')+' options',
    atTime: t => 'at '+t,
    forDinner: 'for dinner', forLunch: 'for lunch',
    otherCityHead: "We don't currently operate in that city, so here's the best of what we have that matches what you're after",
    matchHead: bits => 'Perfect — looking for ' + bits,
    genericHead: "I've searched among the best restaurants",
    theseAreMyRecs: names => '. Here are my recommendations: ' + names + '.',
  }
}[CC_LANG];

const CONCIERGE_URL = 'https://rkaytcmyaaighozxatod.supabase.co/functions/v1/concierge';
const CONCIERGE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYXl0Y215YWFpZ2hvenhhdG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDU2NDIsImV4cCI6MjA5NjQyMTY0Mn0.8zgAxW2q6JU_PySTQHBfBUHpxlDnz9UVLr6jm981x3s';

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

/* ── friendly reply (Claude if available, templated fallback) ──
   NOTA: parseIntent() detecta señales (número de personas, cocina, vibe...)
   con patrones afinados solo para español. Para consultas en inglés, casi
   siempre no va a extraer nada — este fallback entonces cae al mensaje
   genérico (CC_T.genericHead), no al personalizado. Es una limitación
   aceptada, no un bug oculto: la ruta principal (IA remota) ya entiende
   inglés de verdad; esto solo afecta al fallback cuando esa llamada falla. */
function templatedReply(intent, picks){
  const bits = [];
  if (intent.party) bits.push(CC_T.tableFor(intent.party));
  if (intent.dietary.length) bits.push(CC_T.dietOptions(intent.dietary));
  if (intent.cuisines.length) bits.push(intent.cuisines.join(' / ').toLowerCase());
  if (intent.vibes.length) bits.push(intent.vibes.join(', ').toLowerCase());
  if (intent.time && intent.time!=='noche' && intent.time!=='comida') bits.push(CC_T.atTime(intent.time));
  else if (intent.time) bits.push(intent.time==='noche'?CC_T.forDinner:CC_T.forLunch);
  const otherCity = intent.city && intent.city !== 'vigo';
  let head;
  if (otherCity) head = CC_T.otherCityHead;
  else head = bits.length ? CC_T.matchHead(bits.join(', ')) : CC_T.genericHead;
  const names = picks.slice(0,3).map(r=>r.name).join(', ');
  return head + CC_T.theseAreMyRecs(names);
}

/* ════ Conserje screen · Stitch dark redesign ════ */
function ConciergeScreen({ initialQuery, openRest, favs, toggleFav, startBook, go, user }){
  const [msgs, setMsgs] = useState([
    { who:'ai', text:CC_T.greeting }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const seeded = useRef(false);

  const examples = CC_T.examples;

  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, busy]);

  async function ask(text) {
    const q = (text || '').trim();
    if (!q || busy) return;
    setInput('');
    const intent  = parseIntent(q);
    const picks   = matchRestaurants(intent).slice(0, 4);
    const history = msgs; // capture before state update — this is the API history
    setMsgs(m => [...m, { who:'me', text:q }]);
    setBusy(true);

    const restaurants = (window.UM_DATA || []).map(r => ({
      id: r.id, name: r.name, cuisine: r.cuisine, area: r.area, price: r.price,
    }));

    try {
      const res = await fetch(CONCIERGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONCIERGE_KEY },
        body: JSON.stringify({
          message: q,
          history,
          restaurants,
          user: user || null,
          lang: CC_LANG,
        }),
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const json = await res.json();
      setMsgs(m => [...m, { who:'ai', text: json.text }]);
      setBusy(false);

      if (json.action) {
        const rest = (window.UM_DATA || []).find(r =>
          r.name.toLowerCase().includes(json.action.restaurant_name.toLowerCase())
        );
        if (rest) {
          setTimeout(() => startBook(rest.id, json.action.time, json.action.party_size, json.action.date), 500);
        }
      }
    } catch (e) {
      console.warn('[UNA MESA] concierge:', e.message);
      setBusy(false);
      setMsgs(m => [...m, { who:'ai', text: templatedReply(intent, picks), picks, intent }]);
    }
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
        React.createElement('span', { className:'eyebrow' }, CC_T.eyebrow),
        React.createElement('h1', { className:'display' },
          CC_T.headingA,
          React.createElement('span',{className:'hl'},CC_T.headingHl),
          CC_T.headingB
        ),
        React.createElement('p', null,
          CC_T.sub
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
            placeholder:CC_T.inputPh, disabled:busy, autoFocus:true
          }),
          React.createElement('button', {
            type:'submit',
            className:'cc-send-btn',
            disabled: busy || !input.trim(),
            title: busy ? CC_T.searching : CC_T.send
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
            presetParty ? CC_T.bookFor(presetParty) : CC_T.bookNow
          )
        ))
      ) : null
    )
  );
}

Object.assign(window, { ConciergeScreen, parseIntent, matchRestaurants });
