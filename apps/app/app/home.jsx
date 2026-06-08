/* ════ UNA MESA · RestaurantCard + Home screen ════ */

/* shared restaurant card — usado en results, profile, concierge */
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

/* card del bento grid — no se exporta a window, solo usada en HomeScreen */
function BentoCard({ r, big, onOpen }) {
  const bg = 'linear-gradient(150deg,'+r.cz.from+','+r.cz.to+')';
  return React.createElement('div', {
    className: 'stitch-bento-card'+(big?'':' small'),
    onClick: () => onOpen(r.id)
  },
    /* fondo con gradiente + grain + glyph + image-slot */
    React.createElement('div', { className:'stitch-bento-bg', style:{ background:bg } },
      React.createElement('div', { style:{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.10) 1px,transparent 1px)', backgroundSize:'14px 14px' } }),
      React.createElement('div', { style:{ position:'absolute', inset:0, display:'grid', placeItems:'center' } },
        React.createElement(Icon, { name:r.glyph, style:{ width:'30%', height:'30%', color:'rgba(255,255,255,.11)' } })
      ),
      React.createElement('image-slot', { id:'bento-'+r.id, shape:'rect', placeholder:'' })
    ),
    /* overlay gradient de abajo hacia arriba */
    React.createElement('div', { className:'stitch-bento-overlay' }),
    /* info en la parte inferior */
    React.createElement('div', { className:'stitch-bento-info' },
      React.createElement('div', null,
        React.createElement('p', { className:'stitch-bento-sub' }, r.cuisine+' · '+r.area),
        React.createElement('div', { className:'stitch-bento-name', style:{ fontSize:big?'30px':'22px' } }, r.name)
      ),
      React.createElement('div', { className:'stitch-bento-pill' }, r.rating.toFixed(1)+' ★')
    )
  );
}

/* ════ HomeScreen ════ */
function HomeScreen({ go, openRest, search, askConcierge, favs, toggleFav, startBook, geo, setManualLocation }) {
  const [q, setQ] = useState('');
  const [ai, setAi] = useState('');
  const [addr, setAddr] = useState('');
  const data = window.UM_DATA;
  const ref = (geo && geo.ref) || {x:50,y:50};
  const withDist = [...data].map(r=>({ r, d: window.UM_DIST(r.coords, ref) }));

  const byRating = [...data].sort((a,b)=>b.rating-a.rating);
  const byMatch  = [...data].sort((a,b)=>b.match-a.match);
  const aiPicks  = byMatch.slice(0,3);
  const nearby   = [...withDist].sort((a,b)=>a.d-b.d).slice(0,3);

  const heroChips = ['Con terraza','Romántico','Marisco','Grupos','Brunch','Vegetariano'];
  const aiSuggestions = ['Cerca de mí','Mesa para grupos','Con terraza','Sin gluten'];

  const submit     = e => { e.preventDefault(); search(q); };
  const submitAi   = e => { e.preventDefault(); if(ai.trim()) askConcierge(ai); };
  const submitAddr = e => { e.preventDefault(); if(addr.trim()) setManualLocation(addr.trim()); };

  return React.createElement('div', { className:'view' },

    /* ═══════════════════════════════════════
       1. HERO  —  fondo oscuro + Playfair h1 + glass search
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'stitch-hero' },
      /* fondo oscuro con blobs de brillo coral */
      React.createElement('div', { className:'stitch-hero-bg' },
        React.createElement('div', { className:'stitch-hero-blob b1' }),
        React.createElement('div', { className:'stitch-hero-blob b2' }),
        /* grain sutil */
        React.createElement('div', { style:{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize:'18px 18px', zIndex:0 } })
      ),

      React.createElement('div', { className:'stitch-hero-content' },
        /* eyebrow */
        React.createElement('span', { className:'eyebrow', style:{ color:'rgba(255,87,51,.85)', marginBottom:'18px', display:'block' } },
          'Reserva en Vigo'),

        /* headline principal en Playfair Display */
        React.createElement('h1', {
          className:'display',
          style:{ fontSize:'clamp(52px,8vw,88px)', color:'#FAFAFA', marginBottom:'40px', letterSpacing:'-.02em', lineHeight:1.02 }
        },
          'La mesa que ',
          React.createElement('span', { style:{ color:'var(--accent)' } }, 'te espera'),
          '.'),

        /* barra de búsqueda glass */
        React.createElement('form', { className:'stitch-search', onSubmit:submit },
          React.createElement(Icon, { name:'search', style:{ width:20, height:20, color:'rgba(250,250,250,.50)', flexShrink:0 } }),
          React.createElement('input', {
            value:q, onChange:e=>setQ(e.target.value),
            placeholder:'Restaurante, cocina, zona…'
          }),
          React.createElement('button', { type:'submit', className:'stitch-search-btn' }, 'Buscar')
        ),

        /* chips de filtro rápido */
        React.createElement('div', { className:'stitch-chips' },
          heroChips.map((c,i)=>React.createElement('button', {
            key:i, className:'stitch-chip', type:'button', onClick:()=>search(c)
          }, c))
        ),

        /* barra de geolocalización — dark variant */
        (geo && geo.status==='granted')
          ? React.createElement('div', { className:'stitch-loc' },
              React.createElement(Icon,{ name:'pin', style:{ width:15, height:15, color:'var(--accent)', flexShrink:0 } }),
              'Cerca de ', React.createElement('b', null, 'tu ubicación actual'))
          : null,
        (geo && geo.status==='manual')
          ? React.createElement('div', { className:'stitch-loc' },
              React.createElement(Icon,{ name:'pin', style:{ width:15, height:15, color:'var(--accent)', flexShrink:0 } }),
              'Cerca de ', React.createElement('b', null, geo.label),
              React.createElement('button', { className:'stitch-loc-btn', style:{ marginLeft:'auto' }, onClick:()=>setManualLocation('') }, 'cambiar'))
          : null,
        (geo && geo.status==='denied')
          ? React.createElement('form', { className:'stitch-loc', onSubmit:submitAddr },
              React.createElement(Icon,{ name:'pin', style:{ width:15, height:15, color:'var(--accent)', flexShrink:0 } }),
              React.createElement('input', {
                value:addr, onChange:e=>setAddr(e.target.value),
                placeholder:'Escribe tu dirección…'
              }),
              React.createElement('button', { type:'submit', className:'stitch-loc-btn' }, 'Usar'))
          : null
      )
    ),

    /* ═══════════════════════════════════════
       2. SELECCIÓN DE LA SEMANA  —  bento grid 2 + 1
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'stitch-bento-section' },
      React.createElement('div', { className:'wrap' },
        /* cabecera de sección */
        React.createElement('div', { className:'stitch-sec-head' },
          React.createElement('div', null,
            React.createElement('span', { className:'stitch-eyebrow-coral' }, 'Curaduría'),
            React.createElement('h2', { className:'display', style:{ fontSize:'clamp(28px,4vw,42px)' } }, 'Selección de la semana')
          ),
          React.createElement('button', { type:'button', className:'stitch-ver-todos', onClick:()=>go('results') },
            'Ver todos ', React.createElement(Icon,{ name:'arrow', style:{ width:16, height:16 } }))
        ),
        /* bento 2/3 + 1/3 */
        React.createElement('div', { className:'stitch-bento-grid' },
          React.createElement(BentoCard, { r:byRating[0], big:true, onOpen:openRest }),
          React.createElement(BentoCard, { r:byRating[1], big:false, onOpen:openRest })
        )
      )
    ),

    /* ═══════════════════════════════════════
       3. CONSERJE DIGITAL  —  sección fondo oscuro
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'stitch-ai-section' },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'stitch-ai-inner' },

          React.createElement('span', { className:'stitch-ai-eyebrow' }, 'Servicio Personalizado'),

          React.createElement('h2', { className:'display stitch-ai-h2' }, 'Conserje Digital'),

          /* cita del asistente */
          React.createElement('div', { className:'stitch-quote' },
            React.createElement('div', { className:'stitch-quote-ico' },
              React.createElement(Icon, { name:'sparkle', style:{ width:18, height:18, color:'var(--accent)' } })
            ),
            React.createElement('p', { className:'stitch-quote-text' },
              '"¿Buscas algo especial para esta noche? Describe tu antojo, el ambiente o la ocasión y te encuentro la mesa perfecta."')
          ),

          /* textarea con borde inferior + botón enviar */
          React.createElement('form', { className:'stitch-ai-form', onSubmit:submitAi },
            React.createElement('textarea', {
              className:'stitch-ai-textarea',
              value:ai, onChange:e=>setAi(e.target.value), rows:2,
              placeholder:'Me gustaría una cena romántica con terraza, buen vino y marisco fresco…'
            }),
            React.createElement('button', { type:'submit', className:'stitch-ai-send' },
              React.createElement(Icon, { name:'arrow', style:{ width:24, height:24 } })
            )
          ),

          /* chips de sugerencia */
          React.createElement('div', { className:'stitch-ai-chips' },
            aiSuggestions.map((s,i)=>React.createElement('button', {
              key:i, type:'button', className:'stitch-ai-chip', onClick:()=>askConcierge(s)
            }, s))
          )
        )
      )
    ),

    /* ═══════════════════════════════════════
       4. RECOMENDADO PARA TI  —  grid de tarjetas
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'stitch-picks-section' },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'sec-head' },
          React.createElement('h2', { className:'display' }, 'Recomendado para ti'),
          React.createElement('span', { className:'lnk', onClick:()=>go('results') },
            'Ver más ', React.createElement(Icon,{name:'arrow'}))
        ),
        React.createElement('div', { className:'rgrid' },
          aiPicks.map(r=>React.createElement(RestaurantCard, {
            key:r.id, r, fav:favs.includes(r.id), onFav:toggleFav, onOpen:openRest, onBook:startBook, showMatch:true
          }))
        )
      )
    ),

    /* ═══════════════════════════════════════
       5. MÁS CERCA DE TI  —  grid con distancia
    ═══════════════════════════════════════ */
    React.createElement('section', { style:{ background:'var(--bg-2)', padding:'0 0 72px' } },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'sec-head' },
          React.createElement('h2', { className:'display' }, 'Más opciones cerca de ti'),
          React.createElement('span', { className:'lnk', onClick:()=>go('results') },
            'Ver todo ', React.createElement(Icon,{name:'arrow'}))
        ),
        React.createElement('div', { className:'rgrid' },
          nearby.map(({r,d})=>React.createElement(RestaurantCard, {
            key:r.id, r, fav:favs.includes(r.id), onFav:toggleFav, onOpen:openRest, onBook:startBook, dist:d
          }))
        )
      )
    )
  );
}

Object.assign(window, { RestaurantCard, HomeScreen });
