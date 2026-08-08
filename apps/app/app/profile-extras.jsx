/* ════ UNA MESA · Extras del perfil ════
   1) Pasaporte Gastronómico  (cocinas + barrios conquistados)
   2) Tu Paladar IA           (perfil de gusto que aprende, editable)
   3) Mercado de Cucharas      (canjear puntos por recompensas)

   Este archivo estaba completamente en español, sin ningún soporte de
   inglés — por eso #profile se veía en español incluso en el dominio
   .co.uk. Se agrega el mismo patrón bilingüe usado en el resto de la app.
*/

/* ── Market/language: window.UM_LANG is the single source of truth (see data.js) ── */
const PX_LANG = window.UM_LANG;

const PX_T = {
  es: {
    ranks: [
      { name:'Sin estrenar', tag:'Tu primera mesa te espera' },
      { name:'Aprendiz', tag:'Acabas de empezar' },
      { name:'Explorador', tag:'Cogiendo el gusto' },
      { name:'Sibarita', tag:'Paladar curtido' },
      { name:'Maestro Gastronómico', tag:'Lo has probado casi todo' },
    ],
    yourRank: 'Tu rango',
    cuisinesRing: 'cocinas',
    cuisinesConquered: 'Cocinas conquistadas',
    areasExplored: (done, total) => `Barrios explorados · ${done}/${total}`,
    spice: ['Sin picante','Suave','Medio','Picante'],
    allergens: ['Gluten','Lactosa','Frutos secos','Marisco','Huevo','Soja'],
    palateTitle: 'Tu Paladar IA',
    palateSubtitle: 'Esto es lo que la IA ha aprendido de ti. Cuanto más reservas, mejor acierta.',
    cuisinesYouLove: 'Cocinas que amas',
    usualBudget: 'Presupuesto habitual',
    preferredAmbiance: 'Ambiente preferido',
    spiceLevel: 'Nivel de picante',
    allergiesLabel: 'Alergias e intolerancias',
    palateFooter: ' El conserje IA usa tu paladar para afinar cada recomendación. Solo tú lo ves.',
    stillLearning: 'Aún aprendiendo',
    toBeDiscovered: 'Por descubrir',
    rewards: [
      { id:'welcome', cost:50,  name:'Copa de bienvenida', desc:'Un vino o vermut de la casa al llegar', icon:'wine' },
      { id:'dessert', cost:80,  name:'Postre de la casa', desc:'Postre gratis para la mesa', icon:'coffee' },
      { id:'priority',cost:120, name:'Prioridad en lista de espera', desc:'Te colamos cuando todo está lleno', icon:'clock' },
      { id:'view',    cost:150, name:'La mejor mesa', desc:'Mesa con vistas o en zona premium', icon:'star' },
      { id:'wine',    cost:220, name:'Botella de Albariño', desc:'Una botella seleccionada, invita la casa', icon:'wine' },
      { id:'dinner',  cost:300, name:'Cena para dos -25%', desc:'Descuento en tu próxima reserva', icon:'gift' },
    ],
    goldenSpoons: ' Cucharas de Oro',
    spoonSub: 'Gánalas en cada reserva · canjéalas por experiencias',
    onlyAtUnaMesa: 'Solo en Una Mesa',
    redeemRewards: 'Canjea tus recompensas',
    codeLabel: ' Código ',
    redeemBtn: 'Canjear',
    missingSpoons: n => `Te faltan ${n}`,
    bookAgain: 'Reservar otra vez',
    viewRestaurant: 'Ver restaurante',
  },
  en: {
    ranks: [
      { name:'Unopened', tag:'Your first table awaits' },
      { name:'Apprentice', tag:"You've just started" },
      { name:'Explorer', tag:'Getting a taste for it' },
      { name:'Epicure', tag:'A seasoned palate' },
      { name:'Culinary Master', tag:"You've tried almost everything" },
    ],
    yourRank: 'Your rank',
    cuisinesRing: 'cuisines',
    cuisinesConquered: 'Cuisines conquered',
    areasExplored: (done, total) => `Neighbourhoods explored · ${done}/${total}`,
    spice: ['No spice','Mild','Medium','Spicy'],
    allergens: ['Gluten','Dairy','Nuts','Shellfish','Egg','Soy'],
    palateTitle: 'Your AI Palate',
    palateSubtitle: "This is what the AI has learned about you. The more you book, the sharper it gets.",
    cuisinesYouLove: 'Cuisines you love',
    usualBudget: 'Usual budget',
    preferredAmbiance: 'Preferred ambiance',
    spiceLevel: 'Spice level',
    allergiesLabel: 'Allergies & intolerances',
    palateFooter: ' The AI concierge uses your palate to fine-tune every recommendation. Only you can see it.',
    stillLearning: 'Still learning',
    toBeDiscovered: 'To be discovered',
    rewards: [
      { id:'welcome', cost:50,  name:'Welcome drink', desc:'A glass of wine or vermouth on arrival', icon:'wine' },
      { id:'dessert', cost:80,  name:"Chef's dessert", desc:'A free dessert for the table', icon:'coffee' },
      { id:'priority',cost:120, name:'Waitlist priority', desc:"We'll squeeze you in when fully booked", icon:'clock' },
      { id:'view',    cost:150, name:'The best table', desc:'A table with a view or in a premium spot', icon:'star' },
      { id:'wine',    cost:220, name:'Bottle of Albariño', desc:'A selected bottle, on the house', icon:'wine' },
      { id:'dinner',  cost:300, name:'Dinner for two -25%', desc:'Discount on your next booking', icon:'gift' },
    ],
    goldenSpoons: ' Golden Spoons',
    spoonSub: 'Earn them with every booking · redeem for experiences',
    onlyAtUnaMesa: 'Only at Una Mesa',
    redeemRewards: 'Redeem your rewards',
    codeLabel: ' Code ',
    redeemBtn: 'Redeem',
    missingSpoons: n => `${n} more needed`,
    bookAgain: 'Book again',
    viewRestaurant: 'View restaurant',
  },
}[PX_LANG];

/* nivel del pasaporte según cocinas descubiertas */
function passportRank(n){
  const r = PX_T.ranks;
  if (n>=8) return r[4];
  if (n>=5) return r[3];
  if (n>=3) return r[2];
  if (n>=1) return r[1];
  return r[0];
}

/* ── 1 · Pasaporte Gastronómico ── */
function GastroPassport({ data, bookings, openRest, go }){
  // mapa cocina → glyph + restaurantes
  const cuisines = [];
  const seen = {};
  data.forEach(r=>{ if(!seen[r.cuisine]){ seen[r.cuisine]=true; cuisines.push({ name:r.cuisine, glyph:r.glyph, rid:r.id }); } });
  const visitedRids = new Set(bookings.map(b=>b.rid));
  const ridCuisine = {}; data.forEach(r=>ridCuisine[r.id]=r.cuisine);
  const doneCuisines = new Set([...visitedRids].map(rid=>ridCuisine[rid]).filter(Boolean));
  const areas = []; const aseen={};
  data.forEach(r=>{ if(!aseen[r.area]){ aseen[r.area]=true; areas.push(r.area); } });
  const doneAreas = new Set([...visitedRids].map(rid=>(data.find(r=>r.id===rid)||{}).area).filter(Boolean));
  const rank = passportRank(doneCuisines.size);
  const pct = Math.round(doneCuisines.size / cuisines.length * 100);

  return React.createElement('div', null,
    React.createElement('div', { className:'passport-hero' },
      React.createElement('div', { className:'pp-left' },
        React.createElement('div',{className:'pp-rank-lbl'},PX_T.yourRank),
        React.createElement('div',{className:'pp-rank'}, rank.name),
        React.createElement('div',{className:'pp-tag'}, rank.tag)),
      React.createElement('div', { className:'pp-ring', style:{'--pct':pct} },
        React.createElement('div',{className:'pp-ring-in'},
          React.createElement('b',null, doneCuisines.size+'/'+cuisines.length),
          React.createElement('span',null,PX_T.cuisinesRing)))
    ),
    React.createElement('div',{className:'pp-sec-h'},PX_T.cuisinesConquered),
    React.createElement('div', { className:'passport-grid' },
      cuisines.map(c=>{
        const done = doneCuisines.has(c.name);
        return React.createElement('button', { key:c.name, className:'pp-cuisine'+(done?' done':''),
            onClick:()=>done?null:go('results') },
          React.createElement('span',{className:'pp-ci'}, React.createElement(Icon,{name:c.glyph})),
          React.createElement('span',{className:'pp-cn'}, c.name),
          done
            ? React.createElement('span',{className:'pp-badge'}, React.createElement(Icon,{name:'check'}))
            : React.createElement('span',{className:'pp-lock'}, React.createElement(Icon,{name:'lock'})));
      })),
    React.createElement('div',{className:'pp-sec-h'},PX_T.areasExplored(doneAreas.size, areas.length)),
    React.createElement('div',{className:'pp-areas'},
      areas.map(a=>React.createElement('span',{key:a,className:'pp-area'+(doneAreas.has(a)?' on':'')},
        React.createElement(Icon,{name:'pin'}), a)))
  );
}

/* ── 2 · Tu Paladar IA ── */
function PalateAI({ user, data, bookings, favs }){
  const SPICE = PX_T.spice;
  const ALLERGENS = PX_T.allergens;
  const load = ()=>{ try{ return JSON.parse(localStorage.getItem('um-palate')||'{}'); }catch(e){ return {}; } };
  const saved = load();
  const [spice, setSpice] = useState(typeof saved.spice==='number'?saved.spice:1);
  const [allerg, setAllerg] = useState(saved.allerg||[]);
  const persist = (sp, al)=>{ try{ localStorage.setItem('um-palate', JSON.stringify({ spice:sp, allerg:al })); }catch(e){} };
  const toggleAl = a => setAllerg(s=>{ const n=s.includes(a)?s.filter(x=>x!==a):[...s,a]; persist(spice,n); return n; });
  const setSp = v => { setSpice(v); persist(v, allerg); };

  // señales aprendidas
  const refRids = [...new Set([...bookings.map(b=>b.rid), ...favs])];
  const refRests = refRids.map(id=>data.find(r=>r.id===id)).filter(Boolean);
  const countBy = (arr)=>{ const m={}; arr.forEach(k=>m[k]=(m[k]||0)+1); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
  const topCuisines = countBy(refRests.map(r=>r.cuisine)).slice(0,3).map(x=>x[0]);
  const prefList = (user&&user.prefs&&user.prefs.length)?user.prefs.slice(0,4):[];
  const tasteCuisines = topCuisines.length?topCuisines:(prefList.length?prefList:[PX_T.stillLearning]);
  const budgetTier = (()=>{ const t=refRests.map(r=>r.price.length); if(!t.length) return '€€'; const avg=Math.round(t.reduce((a,b)=>a+b,0)/t.length); return '€'.repeat(Math.max(1,Math.min(4,avg))); })();
  const ambiance = (()=>{ const tags=[]; refRests.forEach(r=>(r.tags||[]).forEach(t=>tags.push(t))); const top=countBy(tags)[0]; return top?top[0]:PX_T.toBeDiscovered; })();

  return React.createElement('div', { className:'palate-card' },
    React.createElement('div',{className:'palate-head'},
      React.createElement('span',{className:'palate-ico'}, React.createElement(Icon,{name:'sparkle'})),
      React.createElement('div',null,
        React.createElement('h3',null,PX_T.palateTitle),
        React.createElement('p',null,PX_T.palateSubtitle))),
    React.createElement('div',{className:'palate-grid'},
      React.createElement('div',{className:'palate-cell'},
        React.createElement('div',{className:'pc-k'},PX_T.cuisinesYouLove),
        React.createElement('div',{className:'pc-tags'}, tasteCuisines.map((c,i)=>React.createElement('span',{key:i,className:'pc-tag'},c)))),
      React.createElement('div',{className:'palate-cell'},
        React.createElement('div',{className:'pc-k'},PX_T.usualBudget),
        React.createElement('div',{className:'pc-v'}, budgetTier)),
      React.createElement('div',{className:'palate-cell'},
        React.createElement('div',{className:'pc-k'},PX_T.preferredAmbiance),
        React.createElement('div',{className:'pc-v'}, ambiance))),
    React.createElement('div',{className:'palate-edit'},
      React.createElement('div',{className:'pc-k'},PX_T.spiceLevel),
      React.createElement('div',{className:'spice-row'},
        SPICE.map((s,i)=>React.createElement('button',{key:i,className:'spice-b'+(spice===i?' on':''),onClick:()=>setSp(i)},
          React.createElement('span',{className:'spice-flames'}, '🌶'.repeat(i)||'∅'), s)))),
    React.createElement('div',{className:'palate-edit'},
      React.createElement('div',{className:'pc-k'},PX_T.allergiesLabel),
      React.createElement('div',{className:'pc-tags'},
        ALLERGENS.map(a=>React.createElement('button',{key:a,className:'chip'+(allerg.includes(a)?' on':''),onClick:()=>toggleAl(a)},a)))),
    React.createElement('p',{className:'palate-foot'},
      React.createElement(Icon,{name:'shield'}),PX_T.palateFooter)
  );
}

/* ── 3 · Mercado de Cucharas de Oro ── */
function RewardsMarket({ spoons, onRedeem }){
  const REWARDS = PX_T.rewards;
  const load = ()=>{ try{ return JSON.parse(localStorage.getItem('um-rewards')||'[]'); }catch(e){ return []; } };
  const [claimed, setClaimed] = useState(load());
  const redeem = (rw)=>{
    if (spoons < rw.cost) return;
    const ok = onRedeem(rw.cost);
    if (ok===false) return;
    const code = rw.id.toUpperCase().slice(0,3)+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
    const next = [{ id:rw.id, name:rw.name, code, ts:Date.now() }, ...claimed];
    setClaimed(next); try{ localStorage.setItem('um-rewards', JSON.stringify(next)); }catch(e){}
  };
  return React.createElement('div', null,
    React.createElement('div',{className:'spoon-balance'},
      React.createElement('span',{className:'sb-ico'}, React.createElement(Icon,{name:'spoon'})),
      React.createElement('div',null,
        React.createElement('div',{className:'sb-n'}, spoons, React.createElement('span',null,PX_T.goldenSpoons)),
        React.createElement('div',{className:'sb-sub'},PX_T.spoonSub)),
      React.createElement('span',{className:'sb-badge'},PX_T.onlyAtUnaMesa)),
    React.createElement('div',{className:'pp-sec-h'},PX_T.redeemRewards),
    React.createElement('div',{className:'rewards-grid'},
      REWARDS.map(rw=>{
        const owned = claimed.find(c=>c.id===rw.id);
        const can = spoons>=rw.cost;
        return React.createElement('div',{key:rw.id,className:'reward-card'+(owned?' owned':'')+(!can&&!owned?' locked':'')},
          React.createElement('div',{className:'rw-top'},
            React.createElement('span',{className:'rw-ico'}, React.createElement(Icon,{name:rw.icon})),
            React.createElement('span',{className:'rw-cost'}, React.createElement(Icon,{name:'spoon'}), rw.cost)),
          React.createElement('div',{className:'rw-name'}, rw.name),
          React.createElement('div',{className:'rw-desc'}, rw.desc),
          owned
            ? React.createElement('div',{className:'rw-code'}, React.createElement(Icon,{name:'check'}),PX_T.codeLabel+owned.code)
            : React.createElement('button',{className:'btn '+(can?'btn-acc':'btn-ghost')+' btn-sm btn-block',disabled:!can,onClick:()=>redeem(rw)},
                can?PX_T.redeemBtn:PX_T.missingSpoons(rw.cost-spoons)));
      }))
  );
}

Object.assign(window, { GastroPassport, PalateAI, RewardsMarket });
