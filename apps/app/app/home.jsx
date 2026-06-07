/* ════ UNA MESA · RestaurantCard + Home screen ════ */

/* shared restaurant card */
function RestaurantCard({ r, fav, onFav, onOpen, onBook, showMatch, dist }) {
  const firstTimes = [...(r.times.lunch||[]), ...(r.times.dinner||[])].slice(0,3);
  return React.createElement('div', { className:'rcard', onClick:()=>onOpen(r.id) },
    React.createElement('div', { className:'rc-photo' },
      React.createElement(Photo, { cz:r.cz, glyph:r.glyph, slotId:'rphoto-'+r.id }),
      showMatch ? React.createElement('span', { className:'rc-match' },
        React.createElement(Icon,{name:'sparkle',fill:'currentColor'}), r.match+'%') : null,
      React.createElement('button', { className:'rc-fav'+(fav?' on':''), title:'Guardar',
        onClick:e=>{ e.stopPropagation(); onFav(r.id); } },
        React.createElement(Icon,{name:'heart', fill: fav?'currentColor':'none'}))
    ),
    React.createElement('div', { className:'rc-body' },
      React.createElement('div', { className:'rc-top' },
        React.createElement('div', { className:'rc-name' }, r.name),
        React.createElement('div', { className:'rc-rating' },
          React.createElement(Icon,{name:'star',fill:'currentColor'}),
          r.rating.toFixed(1), React.createElement('span',{className:'cnt'},'('+r.reviews+')'))
      ),
      React.createElement('div', { className:'rc-meta' }, r.cuisine+' · '+r.price+' · '+r.area + (dist!=null ? ' · a '+dist+' km' : '')),
      React.createElement('div', { className:'rc-tags' },
        r.tags.slice(0,2).map((t,i)=>React.createElement('span',{key:i,className:'tagpill'},t))),
      React.createElement('div', { className:'rc-foot' },
        React.createElement('div', { className:'rc-times' },
          firstTimes.length
            ? firstTimes.map(([t,st],i)=>React.createElement('span', {
                key:i, className:'tslot'+(st==='few'?' few':st==='full'?' full':''),
                onClick:e=>{ e.stopPropagation(); if(st!=='full') onBook(r.id,t); }
              }, t))
            : React.createElement('span',{className:'rc-meta'},'Sin horarios hoy')
        )
      )
    )
  );
}

/* Home */
function HomeScreen({ go, openRest, search, askConcierge, favs, toggleFav, startBook, geo, setManualLocation }) {
  const [q, setQ] = useState('');
  const [ai, setAi] = useState('');
  const [addr, setAddr] = useState('');
  const data = window.UM_DATA;
  const cats = window.UM_CATEGORIES;
  const ref = (geo && geo.ref) || {x:50,y:50};
  const withDist = [...data].map(r=>({ r, d: window.UM_DIST(r.coords, ref) }));
  const top = [...data].sort((a,b)=>b.match-a.match);
  const aiPicks = top.slice(0,3);
  const featured = [...data].sort((a,b)=>b.rating-a.rating).slice(0,6);
  const nearby = [...withDist].sort((a,b)=>a.d-b.d).slice(0,8);
  const chips = ['Con terraza','Romántico','Marisco','Grupos','Brunch','Vegetariano'];

  const submit = e => { e.preventDefault(); search(q); };
  const submitAi = e => { e.preventDefault(); askConcierge(ai); };
  const submitAddr = e => { e.preventDefault(); if(addr.trim()) setManualLocation(addr.trim()); };

  return React.createElement('div', { className:'view' },
    /* hero */
    React.createElement('section', { className:'home-hero' },
      React.createElement('div',{className:'blob b1'}), React.createElement('div',{className:'blob b2'}),
      React.createElement('div', { className:'hero-art', 'aria-hidden':'true', dangerouslySetInnerHTML:{ __html:
        '<svg viewBox="0 0 520 420" fill="none" xmlns="http://www.w3.org/2000/svg">'+
        // steam wisps
        '<path class="ha-steam" d="M236 96c-14-16 14-30 0-48" /><path class="ha-steam" d="M260 90c-16-18 16-32 0-52" /><path class="ha-steam" d="M284 96c-14-16 14-30 0-48" />'+
        // dinner plate (outer + inner rings)
        '<ellipse cx="260" cy="248" rx="150" ry="86" class="ha-stroke"/>'+
        '<ellipse cx="260" cy="248" rx="108" ry="60" class="ha-stroke"/>'+
        '<ellipse cx="260" cy="248" rx="60" ry="32" class="ha-fill"/>'+
        // fork (left)
        '<path class="ha-stroke" d="M70 168v150M58 168v40c0 10 24 10 24 0v-40M64 208v40"/>'+
        // knife (right)
        '<path class="ha-stroke" d="M452 168c-20 6-26 60-12 86 6 10 12 8 12-2zM452 254v64"/>'+
        // wine glass (top right)
        '<path class="ha-stroke" d="M398 70h54c0 30-12 46-27 46s-27-16-27-46zM425 116v40M409 158h32"/>'+
        // wine glass (top left)
        '<path class="ha-stroke" d="M70 70h54c0 30-12 46-27 46S70 100 70 70zM97 116v40M81 158h32"/>'+
        '</svg>' } }),
      React.createElement('div', { className:'wrap home-hero-in' },
        React.createElement('span',{className:'eyebrow'},'Reserva en Vigo'),
        React.createElement('h1', { className:'display' }, 'La mesa que ', React.createElement('span',{className:'hl'},'te espera'), '.'),
        React.createElement('p', { className:'lede' }, 'Busca entre los mejores restaurantes, compara y reserva en segundos. Dejas un pequeño depósito reembolsable y lo recuperas íntegro al llegar.'),
        React.createElement('form', { className:'bigsearch', onSubmit:submit },
          React.createElement(Icon,{name:'search',className:'lupa'}),
          React.createElement('input', { value:q, onChange:e=>setQ(e.target.value), placeholder:'Restaurante, cocina o zona…' }),
          React.createElement('button', { className:'btn btn-acc', type:'submit' }, 'Buscar')
        ),
        React.createElement('div', { className:'home-chips' },
          chips.map((c,i)=>React.createElement('span',{key:i,className:'chip',onClick:()=>search(c)},c))),
        /* location bar (geolocation + manual fallback) */
        (geo && geo.status==='granted') ? React.createElement('div',{className:'loc-bar ok'},
          React.createElement(Icon,{name:'pin'}),
          React.createElement('span',null,'Mostrando restaurantes cerca de ', React.createElement('b',null,'tu ubicación actual'))) : null,
        (geo && geo.status==='manual') ? React.createElement('div',{className:'loc-bar ok'},
          React.createElement(Icon,{name:'pin'}),
          React.createElement('span',null,'Cerca de ', React.createElement('b',null, geo.label)),
          React.createElement('button',{className:'loc-change',onClick:()=>setManualLocation('')},'cambiar')) : null,
        (geo && geo.status==='denied') ? React.createElement('form',{className:'loc-bar ask',onSubmit:submitAddr},
          React.createElement(Icon,{name:'pin'}),
          React.createElement('input',{value:addr,onChange:e=>setAddr(e.target.value),placeholder:'Activa la ubicación o escribe tu dirección…'}),
          React.createElement('button',{className:'btn btn-soft btn-sm',type:'submit'},'Usar')) : null,
        React.createElement('div', { className:'home-meta' },
          React.createElement('div',{className:'m'},React.createElement('span',{className:'d'}),'Disponibilidad en tiempo real'),
          React.createElement('div',{className:'m'},'Confirmación al instante'),
          React.createElement('div',{className:'m'},'Depósito 100% reembolsable')
        )
      )
    ),
    React.createElement('div', { className:'wrap' },
      /* categories */
      React.createElement('section', { className:'section' },
        React.createElement('div', { className:'sec-head' },
          React.createElement('h2', { className:'display' }, 'Explora por antojo'),
          React.createElement('span', { className:'lnk', onClick:()=>go('results') }, 'Ver todo', React.createElement(Icon,{name:'arrow'}))
        ),
        React.createElement('div', { className:'cats' },
          cats.map(c=>React.createElement('div', { key:c.key, className:'cat-wrap', onClick:()=>search(c.name) },
            React.createElement('div', { className:'cat' },
              React.createElement('image-slot',{ id:'cat-'+c.key, shape:'rect', placeholder:'' }),
              React.createElement('div',{className:'cat-body'},
                React.createElement('div',{className:'ci'},React.createElement(Icon,{name:c.glyph})))),
            React.createElement('div',{className:'cn'}, c.name))))
      ),
      /* AI banner — interactive concierge field */
      React.createElement('section', { className:'section', style:{paddingTop:0} },
        React.createElement('div', { className:'aibanner' },
          React.createElement('div',{className:'ai-ico'},React.createElement(Icon,{name:'sparkle',fill:'currentColor'})),
          React.createElement('div', { className:'ai-tx' },
            React.createElement('h3', null, '¿No sabes dónde? Pregúntale al conserje IA'),
            React.createElement('p', null, 'Describe la ocasión, las personas, la dieta o el presupuesto — y te traigo la mesa perfecta.')),
          React.createElement('form', { className:'ai-form', onSubmit:submitAi },
            React.createElement(Icon,{name:'sparkle'}),
            React.createElement('input', { value:ai, onChange:e=>setAi(e.target.value),
              placeholder:'Quiero una mesa para 5, algo vegano…' }),
            React.createElement('button', { className:'btn btn-acc', type:'submit' }, 'Preguntar'))
        )
      ),
      /* AI picks */
      React.createElement('section', { className:'section', style:{paddingTop:0} },
        React.createElement('div', { className:'sec-head' },
          React.createElement('h2', { className:'display' }, 'Recomendado para ti'),
          React.createElement('span', { className:'lnk', onClick:()=>go('results') }, 'Ver más', React.createElement(Icon,{name:'arrow'}))
        ),
        React.createElement('div', { className:'rgrid' },
          aiPicks.map(r=>React.createElement(RestaurantCard, {
            key:r.id, r, fav:favs.includes(r.id), onFav:toggleFav, onOpen:openRest, onBook:startBook, showMatch:true })))
      ),
      /* featured */
      React.createElement('section', { className:'section', style:{paddingTop:0} },
        React.createElement('div', { className:'sec-head' },
          React.createElement('h2', { className:'display' }, 'Mejor valorados en Vigo'),
          React.createElement('span', { className:'lnk', onClick:()=>go('results') }, 'Ver todo', React.createElement(Icon,{name:'arrow'}))
        ),
        React.createElement('div', { className:'rgrid' },
          featured.map(r=>React.createElement(RestaurantCard, {
            key:r.id, r, fav:favs.includes(r.id), onFav:toggleFav, onOpen:openRest, onBook:startBook })))
      ),
      /* más opciones cerca de ti */
      React.createElement('section', { className:'section', style:{paddingTop:0} },
        React.createElement('div', { className:'sec-head' },
          React.createElement('h2', { className:'display' }, 'Más opciones cerca de ti'),
          React.createElement('span', { className:'lnk', onClick:()=>go('results') }, 'Ver todo', React.createElement(Icon,{name:'arrow'}))
        ),
        React.createElement('div', { className:'rgrid g4' },
          nearby.map(({r,d})=>React.createElement(RestaurantCard, {
            key:r.id, r, fav:favs.includes(r.id), onFav:toggleFav, onOpen:openRest, onBook:startBook, dist:d })))
      )
    )
  );
}

Object.assign(window, { RestaurantCard, HomeScreen });
