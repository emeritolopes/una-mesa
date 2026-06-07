/* ════ UNA MESA · Extras del perfil ════
   1) Pasaporte Gastronómico  (cocinas + barrios conquistados)
   2) Tu Paladar IA           (perfil de gusto que aprende, editable)
   3) Mercado de Cucharas      (canjear puntos por recompensas)
*/

/* nivel del pasaporte según cocinas descubiertas */
function passportRank(n){
  if (n>=8) return { name:'Maestro Gastronómico', tag:'Lo has probado casi todo' };
  if (n>=5) return { name:'Sibarita', tag:'Paladar curtido' };
  if (n>=3) return { name:'Explorador', tag:'Cogiendo el gusto' };
  if (n>=1) return { name:'Aprendiz', tag:'Acabas de empezar' };
  return { name:'Sin estrenar', tag:'Tu primera mesa te espera' };
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
        React.createElement('div',{className:'pp-rank-lbl'},'Tu rango'),
        React.createElement('div',{className:'pp-rank'}, rank.name),
        React.createElement('div',{className:'pp-tag'}, rank.tag)),
      React.createElement('div', { className:'pp-ring', style:{'--pct':pct} },
        React.createElement('div',{className:'pp-ring-in'},
          React.createElement('b',null, doneCuisines.size+'/'+cuisines.length),
          React.createElement('span',null,'cocinas')))
    ),
    React.createElement('div',{className:'pp-sec-h'},'Cocinas conquistadas'),
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
    React.createElement('div',{className:'pp-sec-h'},'Barrios explorados · '+doneAreas.size+'/'+areas.length),
    React.createElement('div',{className:'pp-areas'},
      areas.map(a=>React.createElement('span',{key:a,className:'pp-area'+(doneAreas.has(a)?' on':'')},
        React.createElement(Icon,{name:'pin'}), a)))
  );
}

/* ── 2 · Tu Paladar IA ── */
const SPICE = ['Sin picante','Suave','Medio','Picante'];
const ALLERGENS = ['Gluten','Lactosa','Frutos secos','Marisco','Huevo','Soja'];
function PalateAI({ user, data, bookings, favs }){
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
  const tasteCuisines = topCuisines.length?topCuisines:(prefList.length?prefList:['Aún aprendiendo']);
  const budgetTier = (()=>{ const t=refRests.map(r=>r.price.length); if(!t.length) return '€€'; const avg=Math.round(t.reduce((a,b)=>a+b,0)/t.length); return '€'.repeat(Math.max(1,Math.min(4,avg))); })();
  const ambiance = (()=>{ const tags=[]; refRests.forEach(r=>(r.tags||[]).forEach(t=>tags.push(t))); const top=countBy(tags)[0]; return top?top[0]:'Por descubrir'; })();

  return React.createElement('div', { className:'palate-card' },
    React.createElement('div',{className:'palate-head'},
      React.createElement('span',{className:'palate-ico'}, React.createElement(Icon,{name:'sparkle'})),
      React.createElement('div',null,
        React.createElement('h3',null,'Tu Paladar IA'),
        React.createElement('p',null,'Esto es lo que la IA ha aprendido de ti. Cuanto más reservas, mejor acierta.'))),
    React.createElement('div',{className:'palate-grid'},
      React.createElement('div',{className:'palate-cell'},
        React.createElement('div',{className:'pc-k'},'Cocinas que amas'),
        React.createElement('div',{className:'pc-tags'}, tasteCuisines.map((c,i)=>React.createElement('span',{key:i,className:'pc-tag'},c)))),
      React.createElement('div',{className:'palate-cell'},
        React.createElement('div',{className:'pc-k'},'Presupuesto habitual'),
        React.createElement('div',{className:'pc-v'}, budgetTier)),
      React.createElement('div',{className:'palate-cell'},
        React.createElement('div',{className:'pc-k'},'Ambiente preferido'),
        React.createElement('div',{className:'pc-v'}, ambiance))),
    React.createElement('div',{className:'palate-edit'},
      React.createElement('div',{className:'pc-k'},'Nivel de picante'),
      React.createElement('div',{className:'spice-row'},
        SPICE.map((s,i)=>React.createElement('button',{key:i,className:'spice-b'+(spice===i?' on':''),onClick:()=>setSp(i)},
          React.createElement('span',{className:'spice-flames'}, '🌶'.repeat(i)||'∅'), s)))),
    React.createElement('div',{className:'palate-edit'},
      React.createElement('div',{className:'pc-k'},'Alergias e intolerancias'),
      React.createElement('div',{className:'pc-tags'},
        ALLERGENS.map(a=>React.createElement('button',{key:a,className:'chip'+(allerg.includes(a)?' on':''),onClick:()=>toggleAl(a)},a)))),
    React.createElement('p',{className:'palate-foot'},
      React.createElement(Icon,{name:'shield'}),' El conserje IA usa tu paladar para afinar cada recomendación. Solo tú lo ves.')
  );
}

/* ── 3 · Mercado de Cucharas de Oro ── */
const REWARDS = [
  { id:'welcome', cost:50,  name:'Copa de bienvenida', desc:'Un vino o vermut de la casa al llegar', icon:'wine' },
  { id:'dessert', cost:80,  name:'Postre de la casa', desc:'Postre gratis para la mesa', icon:'coffee' },
  { id:'priority',cost:120, name:'Prioridad en lista de espera', desc:'Te colamos cuando todo está lleno', icon:'clock' },
  { id:'view',    cost:150, name:'La mejor mesa', desc:'Mesa con vistas o en zona premium', icon:'star' },
  { id:'wine',    cost:220, name:'Botella de Albariño', desc:'Una botella seleccionada, invita la casa', icon:'wine' },
  { id:'dinner',  cost:300, name:'Cena para dos -25%', desc:'Descuento en tu próxima reserva', icon:'gift' }
];
function RewardsMarket({ spoons, onRedeem }){
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
        React.createElement('div',{className:'sb-n'}, spoons, React.createElement('span',null,' Cucharas de Oro')),
        React.createElement('div',{className:'sb-sub'},'Gánalas en cada reserva · canjéalas por experiencias')),
      React.createElement('span',{className:'sb-badge'},'Solo en Una Mesa')),
    React.createElement('div',{className:'pp-sec-h'},'Canjea tus recompensas'),
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
            ? React.createElement('div',{className:'rw-code'}, React.createElement(Icon,{name:'check'}),' Código '+owned.code)
            : React.createElement('button',{className:'btn '+(can?'btn-acc':'btn-ghost')+' btn-sm btn-block',disabled:!can,onClick:()=>redeem(rw)},
                can?'Canjear':'Te faltan '+(rw.cost-spoons)));
      }))
  );
}

Object.assign(window, { GastroPassport, PalateAI, RewardsMarket });
