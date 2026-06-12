/* ════ UNA MESA · RestaurantCard + Home screen ════ */

/* shared restaurant card — usado en results, profile, concierge */
function RestaurantCard({ r, fav, onFav, onOpen, onBook, showMatch, dist, img }) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const firstTimes = [...(r.times.lunch||[]), ...(r.times.dinner||[])]
    .filter(([time]) => { const [h,m] = time.split(':').map(Number); return (h*60+m) > currentMinutes+30; })
    .slice(0,3);
  return React.createElement('div', { className:'rcard', onClick:()=>onOpen(r.id) },
    React.createElement('div', { className:'rc-photo' },
      img
        ? React.createElement('div', { style:{ position:'absolute', inset:0, backgroundImage:"url('./"+img+"')", backgroundSize:'cover', backgroundPosition:'center' } })
        : React.createElement(Photo, { cz:r.cz, glyph:r.glyph, slotId:'rphoto-'+r.id }),
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

/* bento card — sección Selección de la semana */
function BentoCard({ r, big, onOpen, img }) {
  const bgStyle = img
    ? { backgroundImage:"url('./"+img+"')", backgroundSize:'cover', backgroundPosition:'center' }
    : { background:'linear-gradient(150deg,'+r.cz.from+','+r.cz.to+')' };
  return React.createElement('div', {
    className: 'stitch-bento-card'+(big?'':' small'),
    onClick: () => onOpen(r.id)
  },
    React.createElement('div', { className:'stitch-bento-bg', style:bgStyle }),
    React.createElement('div', { className:'stitch-bento-overlay' }),
    React.createElement('div', { className:'stitch-bento-info' },
      React.createElement('div', null,
        React.createElement('p', { className:'stitch-bento-sub' }, r.cuisine+' · '+r.area),
        React.createElement('div', { className:'stitch-bento-name', style:{ fontSize:big?'30px':'22px' } }, r.name)
      ),
      React.createElement('div', { className:'stitch-bento-pill' }, r.rating.toFixed(1)+' ★')
    )
  );
}

/* nearby card — sección Disponible hoy (bento pequeño con título visible) */
function NearbyCard({ r, dist, onOpen, img }) {
  const bgStyle = img
    ? { backgroundImage:"url('./"+img+"')", backgroundSize:'cover', backgroundPosition:'center' }
    : { background:'linear-gradient(150deg,'+r.cz.from+','+r.cz.to+')' };
  return React.createElement('div', { className:'nearby-card', onClick:()=>onOpen(r.id) },
    React.createElement('div', { className:'nb-bg', style:bgStyle }),
    React.createElement('div', { className:'nb-overlay' }),
    React.createElement('div', { className:'nb-info' },
      React.createElement('div', { className:'nb-name' }, r.name),
      React.createElement('div', { className:'nb-meta' }, r.cuisine+(dist!=null?' · a '+dist+' km':' · '+r.area))
    ),
    React.createElement('div', { className:'nb-pill' }, r.rating.toFixed(1)+' ★')
  );
}

/* ════ HomeScreen ════ */
function HomeScreen({ go, openRest, search, askConcierge, favs, toggleFav, startBook, geo, setManualLocation }) {
  const [q, setQ] = useState('');
  const [ai, setAi] = useState('');
  const [addr, setAddr] = useState('');
  const [selParty, setSelParty] = useState(2);
  const [selTime, setSelTime] = useState('');

  const data = window.UM_DATA;
  const ref = (geo && geo.ref) || {x:50,y:50};
  const withDist = [...data].map(r=>({ r, d: window.UM_DIST(r.coords, ref) }));

  const byRating = [...data].sort((a,b)=>b.rating-a.rating);
  const byMatch  = [...data].sort((a,b)=>b.match-a.match);
  const aiPicks  = byMatch.slice(0,3);
  const nearby   = [...withDist].sort((a,b)=>a.d-b.d).slice(0,4);

  /* restaurante destacado (top rated) */
  const dest       = byRating[0];
  const destTimes  = [...(dest.times.dinner||[]), ...(dest.times.lunch||[])].slice(0,6);
  const destMenu   = dest.menu && dest.menu[0] ? dest.menu[0].items.slice(0,3) : [];

  const heroChips    = ['Con terraza','Romántico','Marisco','Grupos','Brunch','Vegetariano'];
  const aiSuggestions = ['Cerca de mí','Mesa para grupos','Con terraza','Sin gluten'];

  /* fotos reales por sección (posición fija) */
  const PICKS_IMGS  = ['chris-liverani-oCsaxvGCehM-unsplash.jpg','clem-onojeghuo-zlABb6Gke24-unsplash.jpg','igor-rand-wfM1Fi-kMaY-unsplash.jpg'];
  const NEARBY_IMGS = ['k8-sWEpcc0Rm0U-unsplash.jpg','nick-karvounis-Ciqxn7FE4vE-unsplash.jpg','pablo-merchan-montes-Orz90t6o0e4-unsplash.jpg','simon-karemann-p85-MG66GRY-unsplash.jpg'];

  const submit     = e => { e.preventDefault(); search(q); };
  const submitAi   = e => { e.preventDefault(); if(ai.trim()) askConcierge(ai); };
  const submitAddr = e => { e.preventDefault(); if(addr.trim()) setManualLocation(addr.trim()); };
  const confirmBook = () => {
    const t = selTime || (destTimes[0] && destTimes[0][0]);
    if(t) startBook(dest.id, t, selParty);
    else openRest(dest.id);
  };

  /* ── Geolocalización + reverse geocoding (Nominatim OSM) ── */
  const [geoLoading, setGeoLoading] = useState(false);

  const requestGeo = () => {
    if (!('geolocation' in navigator)) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + latitude +
            '&lon=' + longitude + '&addressdetails=1&accept-language=es',
            { headers: { 'User-Agent': 'una-mesa-app/1.0' } }
          );
          const json = await res.json();
          const a = json.address || {};
          const label = a.neighbourhood || a.suburb || a.city_district ||
                        a.city || a.town || a.village || a.county || 'tu zona';
          setManualLocation(label);
        } catch (_) {
          setManualLocation('tu ubicación');
        }
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  /* cuando app.jsx ya ha obtenido permiso en el background, reverse-geocodifica */
  useEffect(() => {
    if (geo.status === 'granted') requestGeo();
  }, [geo.status]);

  const geoCity = (!geoLoading && geo && geo.status !== 'idle' && geo.label &&
                   geo.label !== 'tu ubicación' && geo.label !== 'tu ubicación actual')
    ? geo.label : null;
  const heroEyebrow = geoCity ? 'Reserva en ' + geoCity : 'Reserva cerca de ti';

  return React.createElement('div', { className:'view' },

    /* ═══════════════════════════════════════
       1. HERO  —  fondo oscuro + Playfair h1 + glass search
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'stitch-hero' },
      React.createElement('div', { className:'stitch-hero-bg' },
        React.createElement('div', { className:'stitch-hero-blob b1' }),
        React.createElement('div', { className:'stitch-hero-blob b2' }),
        React.createElement('div', { style:{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize:'18px 18px', zIndex:0 } })
      ),
      React.createElement('div', { className:'stitch-hero-content' },
        React.createElement('span', { className:'eyebrow', style:{ color:'rgba(255,87,51,.85)', marginBottom:'18px', display:'block' } }, heroEyebrow),
        React.createElement('h1', {
          className:'display',
          style:{ fontSize:'clamp(52px,8vw,88px)', color:'#FAFAFA', marginBottom:'40px', letterSpacing:'-.02em', lineHeight:1.02 }
        },
          'La mesa que ',
          React.createElement('span', { style:{ color:'var(--accent)', fontWeight:900 } }, 'te espera'),
          '.'),
        React.createElement('form', { className:'stitch-search', onSubmit:submit },
          React.createElement(Icon, { name:'search', style:{ width:20, height:20, color:'rgba(250,250,250,.50)', flexShrink:0 } }),
          React.createElement('input', { value:q, onChange:e=>setQ(e.target.value), placeholder:'Restaurante, cocina, zona…' }),
          React.createElement('button', { type:'submit', className:'stitch-search-btn' }, 'Buscar')
        ),
        React.createElement('div', { className:'stitch-chips' },
          heroChips.map((c,i)=>React.createElement('button', { key:i, className:'stitch-chip', type:'button', onClick:()=>search(c) }, c))
        ),
        /* ── barra de ubicación: idle → botón GPS | loading → spinner | manual → ciudad | denied → texto ── */
        geoLoading
          ? React.createElement('div', { className:'stitch-loc' },
              React.createElement(Icon,{ name:'pin', style:{ width:15, height:15, color:'var(--accent)', flexShrink:0, opacity:.55 } }),
              React.createElement('span', { style:{ opacity:.65 } }, 'Detectando ubicación…'))
          : (!geo || geo.status==='idle')
            ? React.createElement('button', {
                type:'button', className:'stitch-loc', onClick:requestGeo,
                style:{ cursor:'pointer', background:'none', border:'none', fontFamily:'inherit' }
              },
                React.createElement(Icon,{ name:'pin', style:{ width:15, height:15, color:'var(--accent)', flexShrink:0 } }),
                'Usar mi ubicación')
          : (geo.status==='granted')
            ? React.createElement('div', { className:'stitch-loc' },
                React.createElement(Icon,{ name:'pin', style:{ width:15, height:15, color:'var(--accent)', flexShrink:0, opacity:.55 } }),
                React.createElement('span', { style:{ opacity:.65 } }, 'Detectando ubicación…'))
          : (geo.status==='manual')
            ? React.createElement('div', { className:'stitch-loc' },
                React.createElement(Icon,{ name:'pin', style:{ width:15, height:15, color:'var(--accent)', flexShrink:0 } }),
                'Cerca de ', React.createElement('b', null, geo.label),
                React.createElement('button', {
                  type:'button', className:'stitch-loc-btn', style:{ marginLeft:'auto' }, onClick:requestGeo
                }, 'actualizar'))
          : (geo.status==='denied')
            ? React.createElement('form', { className:'stitch-loc', onSubmit:submitAddr },
                React.createElement(Icon,{ name:'pin', style:{ width:15, height:15, color:'var(--accent)', flexShrink:0 } }),
                React.createElement('input', { value:addr, onChange:e=>setAddr(e.target.value), placeholder:'Escribe tu dirección…' }),
                React.createElement('button', { type:'button', className:'stitch-loc-btn', onClick:requestGeo, style:{ marginRight:'4px' } }, '⊕'),
                React.createElement('button', { type:'submit', className:'stitch-loc-btn' }, 'Usar'))
          : null
      )
    ),

    /* ═══════════════════════════════════════
       2. SELECCIÓN DE LA SEMANA  —  bento grid 2 + 1
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'stitch-bento-section' },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'stitch-sec-head' },
          React.createElement('div', null,
            React.createElement('span', { className:'stitch-eyebrow-coral' }, 'Curaduría'),
            React.createElement('h2', { className:'display', style:{ fontSize:'clamp(28px,4vw,42px)' } }, 'Selección de la semana')
          ),
          React.createElement('button', { type:'button', className:'stitch-ver-todos', onClick:()=>go('results') },
            'Ver todos ', React.createElement(Icon,{ name:'arrow', style:{ width:16, height:16 } }))
        ),
        React.createElement('div', { className:'stitch-bento-grid' },
          React.createElement(BentoCard, { r:byRating[0], big:true,  onOpen:openRest, img:'dish.jpg' }),
          React.createElement(BentoCard, { r:byRating[1], big:false, onOpen:openRest, img:'albert-YYZU0Lo1uXE-unsplash.jpg' })
        )
      )
    ),

    /* ═══════════════════════════════════════
       3. DESTACADO  —  info restaurante + foto plato + widget reserva
       Stitch: bg-desert-sand/30, grid 2/3 + 1/3
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'detail-section' },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'detail-grid' },

          /* ── columna izquierda: info + menú + foto ── */
          React.createElement('div', null,
            /* eyebrow tags */
            React.createElement('div', { className:'detail-tags' },
              React.createElement('span', { className:'detail-tag-pill' }, 'Destacado'),
              React.createElement('span', { className:'detail-tag-avail' }, 'Disponible hoy')
            ),
            /* nombre del restaurante */
            React.createElement('h2', { className:'display detail-h2', onClick:()=>openRest(dest.id), style:{ cursor:'pointer' } }, dest.name),
            /* descripción */
            React.createElement('p', { className:'detail-about' }, dest.about),
            /* grid menú + foto */
            React.createElement('div', { className:'detail-inner-grid' },
              /* destacados del menú */
              React.createElement('div', null,
                React.createElement('h4', { className:'detail-menu-title' }, 'Destacados del Menú'),
                destMenu.map(([name,,price],i)=>
                  React.createElement('div', { key:i, className:'detail-menu-item' },
                    React.createElement('span', { className:'detail-menu-name' }, name),
                    React.createElement('span', { className:'detail-menu-price' }, price)
                  )
                )
              ),
              /* foto del plato */
              React.createElement('div', { className:'detail-food-ph' },
                React.createElement('img', { src:'./dish.jpg', style:{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'12px' } })
              )
            )
          ),

          /* ── columna derecha: glass booking card ── */
          React.createElement('div', { className:'booking-glass' },
            React.createElement('h3', { className:'display' }, 'Reserva tu mesa'),
            /* invitados */
            React.createElement('span', { className:'bk-gl-label' }, 'Invitados'),
            React.createElement('div', { className:'party-row' },
              [1,2,3,4,'5+'].map((n,i)=>
                React.createElement('button', {
                  key:i, type:'button',
                  className: 'party-btn'+(selParty===(i+1)?' on':''),
                  onClick: ()=>setSelParty(i+1)
                }, n)
              )
            ),
            /* horarios */
            React.createElement('span', { className:'bk-gl-label' }, 'Horarios disponibles'),
            React.createElement('div', { className:'ts-grid' },
              destTimes.map(([t,st],i)=>
                React.createElement('button', {
                  key:i, type:'button',
                  className: 'ts-btn'+(selTime===t?' on':'')+(st==='full'?' full':''),
                  onClick: ()=>{ if(st!=='full') setSelTime(t); }
                }, t)
              )
            ),
            /* nota depósito */
            React.createElement('div', { className:'deposit-note' },
              React.createElement(Icon,{ name:'info', style:{ width:16, height:16, color:'var(--accent)' } }),
              React.createElement('span', null, 'Reserva con depósito reembolsable de ', React.createElement('b', null, '10 €'), ' para garantizar tu mesa.')
            ),
            /* confirmar */
            React.createElement('button', { className:'book-cta', onClick:confirmBook }, 'Confirmar Reserva')
          )
        )
      )
    ),

    /* ═══════════════════════════════════════
       4. CONSERJE DIGITAL  —  sección fondo oscuro
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'stitch-ai-section' },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'stitch-ai-inner' },
          React.createElement('span', { className:'stitch-ai-eyebrow' }, 'Servicio Personalizado'),
          React.createElement('h2', { className:'display stitch-ai-h2' }, 'Conserje Digital'),
          React.createElement('div', { className:'stitch-quote' },
            React.createElement('div', { className:'stitch-quote-ico' },
              React.createElement(Icon, { name:'sparkle', style:{ width:18, height:18, color:'var(--accent)' } })
            ),
            React.createElement('p', { className:'stitch-quote-text' },
              '"¿Buscas algo especial para esta noche? Describe tu antojo, el ambiente o la ocasión y te encuentro la mesa perfecta."')
          ),
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
          React.createElement('div', { className:'stitch-ai-chips' },
            aiSuggestions.map((s,i)=>React.createElement('button', {
              key:i, type:'button', className:'stitch-ai-chip', onClick:()=>askConcierge(s)
            }, s))
          )
        )
      )
    ),

    /* ═══════════════════════════════════════
       5. RECOMENDADO PARA TI  —  grid de tarjetas
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'stitch-picks-section' },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'sec-head' },
          React.createElement('h2', { className:'display' }, 'Recomendado para ti'),
          React.createElement('span', { className:'lnk', onClick:()=>go('results') }, 'Ver más ', React.createElement(Icon,{name:'arrow'}))
        ),
        React.createElement('div', { className:'rgrid' },
          aiPicks.map((r,i)=>React.createElement(RestaurantCard, {
            key:r.id, r, fav:favs.includes(r.id), onFav:toggleFav, onOpen:openRest, onBook:startBook, showMatch:true, img:PICKS_IMGS[i]
          }))
        )
      )
    ),

    /* ═══════════════════════════════════════
       6. DISPONIBLE HOY  —  bento pequeño con título visible
    ═══════════════════════════════════════ */
    React.createElement('section', { className:'dispo-section' },
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'sec-head' },
          React.createElement('h2', { className:'display' }, 'Disponible hoy'),
          React.createElement('span', { className:'lnk', onClick:()=>go('results') }, 'Ver todo ', React.createElement(Icon,{name:'arrow'}))
        ),
        React.createElement('div', { className:'nearby-grid' },
          nearby.map(({r,d},i)=>React.createElement(NearbyCard, {
            key:r.id, r, dist:d, onOpen:openRest, img:NEARBY_IMGS[i]
          }))
        )
      )
    )
  );
}

Object.assign(window, { RestaurantCard, HomeScreen });
