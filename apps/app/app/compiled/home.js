/* ════ UNA MESA · RestaurantCard + Home screen ════ */

/* ── Market detection: EN gated by ?market=uk or .co.uk hostname. Defaults to ES — Spain production is untouched. ── */
function umMarket() {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'uk' || q === 'en') return 'en';
    if (window.location.hostname.endsWith('.co.uk')) return 'en';
  } catch (_) {}
  return 'es';
}
const UM_LANG = umMarket();
const UM_T = {
  es: {
    save: 'Guardar',
    noSlotsToday: 'Sin horarios hoy',
    noRestaurantsYetTitle: 'Aún no hay restaurantes en tu zona',
    noRestaurantsYetBody: 'Estamos incorporando restaurantes en esta ciudad. Vuelve pronto.',
    heroEyebrowIn: 'Reserva en ',
    heroEyebrowNear: 'Reserva cerca de ti',
    heroA: 'La mesa que ',
    heroB: 'te espera',
    searchPh: 'Restaurante, cocina, zona…',
    search: 'Buscar',
    chips: ['Con terraza', 'Romántico', 'Marisco', 'Grupos', 'Brunch', 'Vegetariano'],
    detectingLoc: 'Detectando ubicación…',
    useMyLoc: 'Usar mi ubicación',
    near: 'Cerca de ',
    update: 'actualizar',
    addrPh: 'Escribe tu dirección…',
    use: 'Usar',
    curation: 'Curaduría',
    weekPick: 'Selección de la semana',
    viewAll: 'Ver todos ',
    featured: 'Destacado',
    availToday: 'Disponible hoy',
    menuHighlights: 'Destacados del Menú',
    bookTable: 'Reserva tu mesa',
    guests: 'Invitados',
    slotsAvail: 'Horarios disponibles',
    depositPre: 'Reserva con depósito reembolsable',
    depositAmountFn: () => '',
    depositPost: ' para garantizar tu mesa.',
    confirmBooking: 'Confirmar Reserva',
    personalService: 'Servicio Personalizado',
    concierge: 'Conserje Digital',
    conciergeQuote: '"¿Buscas algo especial para esta noche? Describe tu antojo, el ambiente o la ocasión y te encuentro la mesa perfecta."',
    conciergePh: 'Me gustaría una cena romántica con terraza, buen vino y marisco fresco…',
    aiSuggestions: ['Cerca de mí', 'Mesa para grupos', 'Con terraza', 'Sin gluten'],
    recommended: 'Recomendado para ti',
    viewMore: 'Ver más ',
    viewAllShort: 'Ver todo ',
    kmAway: d => ' · a ' + d + ' km',
    geoLang: 'es',
    yourArea: 'tu zona',
    yourLocation: 'tu ubicación'
  },
  en: {
    save: 'Save',
    noSlotsToday: 'No slots today',
    noRestaurantsYetTitle: 'No restaurants here yet',
    noRestaurantsYetBody: "We're onboarding restaurants in this city. Check back soon.",
    heroEyebrowIn: 'Book in ',
    heroEyebrowNear: 'Book near you',
    heroA: 'The table that ',
    heroB: 'awaits you',
    searchPh: 'Restaurant, cuisine, area…',
    search: 'Search',
    chips: ['Outdoor seating', 'Romantic', 'Seafood', 'Groups', 'Brunch', 'Vegetarian'],
    detectingLoc: 'Detecting location…',
    useMyLoc: 'Use my location',
    near: 'Near ',
    update: 'update',
    addrPh: 'Type your address…',
    use: 'Use',
    curation: 'Curation',
    weekPick: "This Week's Picks",
    viewAll: 'View all ',
    featured: 'Featured',
    availToday: 'Available today',
    menuHighlights: 'Menu Highlights',
    bookTable: 'Book your table',
    guests: 'Guests',
    slotsAvail: 'Available times',
    depositPre: 'Book with a refundable deposit',
    depositAmountFn: () => '',
    depositPost: ' to secure your table.',
    confirmBooking: 'Confirm Booking',
    personalService: 'Personalised Service',
    concierge: 'Digital Concierge',
    conciergeQuote: '"Looking for something special tonight? Describe the mood, the occasion, or what you\'re craving, and I\'ll find your perfect table."',
    conciergePh: 'I\'d like a romantic dinner with a terrace, good wine and fresh seafood…',
    aiSuggestions: ['Near me', 'Table for a group', 'Outdoor seating', 'Gluten-free'],
    recommended: 'Recommended for you',
    viewMore: 'View more ',
    viewAllShort: 'View all ',
    kmAway: d => ' · ' + d + ' km away',
    geoLang: 'en',
    yourArea: 'your area',
    yourLocation: 'your location'
  }
}[UM_LANG];

/* shared restaurant card — usado en results, profile, concierge */
function RestaurantCard({
  r,
  fav,
  onFav,
  onOpen,
  onBook,
  showMatch,
  dist,
  img
}) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const firstTimes = [...(r.times.lunch || []), ...(r.times.dinner || [])].filter(([time]) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m > currentMinutes + 30;
  }).slice(0, 3);
  const resolvedImg = r.photo_url || img;
  const isAbsoluteImg = resolvedImg && /^https?:\/\//.test(resolvedImg);
  return React.createElement('div', {
    className: 'rcard',
    onClick: () => onOpen(r.id)
  }, React.createElement('div', {
    className: 'rc-photo'
  }, resolvedImg ? React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: "url('" + (isAbsoluteImg ? resolvedImg : './' + resolvedImg) + "')",
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }) : React.createElement(Photo, {
    cz: r.cz,
    glyph: r.glyph,
    slotId: 'rphoto-' + r.id
  }), showMatch ? React.createElement('span', {
    className: 'rc-match'
  }, React.createElement(Icon, {
    name: 'sparkle',
    fill: 'currentColor'
  }), r.match + '%') : null, React.createElement('button', {
    className: 'rc-fav' + (fav ? ' on' : ''),
    title: UM_T.save,
    onClick: e => {
      e.stopPropagation();
      onFav(r.id);
    }
  }, React.createElement(Icon, {
    name: 'heart',
    fill: fav ? 'currentColor' : 'none'
  }))), React.createElement('div', {
    className: 'rc-body'
  }, React.createElement('div', {
    className: 'rc-top'
  }, React.createElement('div', {
    className: 'rc-name'
  }, r.name), React.createElement('div', {
    className: 'rc-rating'
  }, React.createElement(Icon, {
    name: 'star',
    fill: 'currentColor'
  }), r.rating.toFixed(1), React.createElement('span', {
    className: 'cnt'
  }, '(' + r.reviews + ')'))), React.createElement('div', {
    className: 'rc-meta'
  }, r.cuisine + ' · ' + r.price + ' · ' + r.area + (dist != null ? UM_T.kmAway(dist) : '')), React.createElement('div', {
    className: 'rc-tags'
  }, r.tags.slice(0, 2).map((t, i) => React.createElement('span', {
    key: i,
    className: 'tagpill'
  }, t))), React.createElement('div', {
    className: 'rc-foot'
  }, React.createElement('div', {
    className: 'rc-times'
  }, firstTimes.length ? firstTimes.map(([t, st], i) => React.createElement('span', {
    key: i,
    className: 'tslot' + (st === 'few' ? ' few' : st === 'full' ? ' full' : ''),
    onClick: e => {
      e.stopPropagation();
      if (st !== 'full') onBook(r.id, t);
    }
  }, t)) : React.createElement('span', {
    className: 'rc-meta'
  }, UM_T.noSlotsToday)))));
}

/* bento card — sección Selección de la semana */
function BentoCard({
  r,
  big,
  onOpen,
  img
}) {
  const resolvedImg = r.photo_url || img;
  const isAbsoluteImg = resolvedImg && /^https?:\/\//.test(resolvedImg);
  const bgStyle = resolvedImg ? {
    backgroundImage: "url('" + (isAbsoluteImg ? resolvedImg : './' + resolvedImg) + "')",
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {
    background: 'linear-gradient(150deg,' + r.cz.from + ',' + r.cz.to + ')'
  };
  return React.createElement('div', {
    className: 'stitch-bento-card' + (big ? '' : ' small'),
    onClick: () => onOpen(r.id)
  }, React.createElement('div', {
    className: 'stitch-bento-bg',
    style: bgStyle
  }), React.createElement('div', {
    className: 'stitch-bento-overlay'
  }), React.createElement('div', {
    className: 'stitch-bento-info'
  }, React.createElement('div', null, React.createElement('p', {
    className: 'stitch-bento-sub'
  }, r.cuisine + ' · ' + r.area), React.createElement('div', {
    className: 'stitch-bento-name',
    style: {
      fontSize: big ? '30px' : '22px'
    }
  }, r.name)), React.createElement('div', {
    className: 'stitch-bento-pill'
  }, r.rating.toFixed(1) + ' ★')));
}

/* nearby card — sección Disponible hoy (bento pequeño con título visible) */
function NearbyCard({
  r,
  dist,
  onOpen,
  img
}) {
  const resolvedImg = r.photo_url || img;
  const isAbsolute = resolvedImg && /^https?:\/\//.test(resolvedImg);
  const bgStyle = resolvedImg ? {
    backgroundImage: "url('" + (isAbsolute ? resolvedImg : './' + resolvedImg) + "')",
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {
    background: 'linear-gradient(150deg,' + r.cz.from + ',' + r.cz.to + ')'
  };
  return React.createElement('div', {
    className: 'nearby-card',
    onClick: () => onOpen(r.id)
  }, React.createElement('div', {
    className: 'nb-bg',
    style: bgStyle
  }), React.createElement('div', {
    className: 'nb-overlay'
  }), React.createElement('div', {
    className: 'nb-info'
  }, React.createElement('div', {
    className: 'nb-name'
  }, r.name), React.createElement('div', {
    className: 'nb-meta'
  }, r.cuisine + (dist != null ? UM_T.kmAway(dist) : ' · ' + r.area))), React.createElement('div', {
    className: 'nb-pill'
  }, r.rating.toFixed(1) + ' ★'));
}

/* ════ HomeScreen ════ */
function HomeScreen({
  go,
  openRest,
  search,
  askConcierge,
  favs,
  toggleFav,
  startBook,
  geo,
  setManualLocation,
  noRealRestaurants
}) {
  const [q, setQ] = useState('');
  const [ai, setAi] = useState('');
  const [addr, setAddr] = useState('');
  const [selParty, setSelParty] = useState(2);
  const [selTime, setSelTime] = useState('');
  const data = window.UM_DATA;
  const ref = geo && geo.ref || {
    x: 50,
    y: 50
  };
  const withDist = [...data].map(r => ({
    r,
    d: window.UM_DIST(r.coords, ref)
  }));
  const byRating = [...data].sort((a, b) => b.rating - a.rating);
  const byMatch = [...data].sort((a, b) => b.match - a.match);
  const aiPicks = byMatch.slice(0, 3);
  const nearby = [...withDist].sort((a, b) => a.d - b.d).slice(0, 4);

  /* restaurante destacado (top rated) */
  const dest = byRating[0] || null;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const destTimes = dest ? [...(dest.times.dinner || []), ...(dest.times.lunch || [])].filter(([time]) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m > currentMinutes + 30;
  }).sort(([a], [b]) => {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  }).slice(0, 6) : [];
  const destMenu = dest && dest.menu && dest.menu[0] ? dest.menu[0].items.slice(0, 3) : [];
  const heroChips = UM_T.chips;
  const aiSuggestions = UM_T.aiSuggestions;

  /* fotos reales por sección (posición fija) */
  const PICKS_IMGS = ['chris-liverani-oCsaxvGCehM-unsplash.jpg', 'clem-onojeghuo-zlABb6Gke24-unsplash.jpg', 'igor-rand-wfM1Fi-kMaY-unsplash.jpg'];
  const NEARBY_IMGS = ['k8-sWEpcc0Rm0U-unsplash.jpg', 'nick-karvounis-Ciqxn7FE4vE-unsplash.jpg', 'pablo-merchan-montes-Orz90t6o0e4-unsplash.jpg', 'simon-karemann-p85-MG66GRY-unsplash.jpg'];
  const submit = e => {
    e.preventDefault();
    search(q);
  };
  const submitAi = e => {
    e.preventDefault();
    if (ai.trim()) askConcierge(ai);
  };
  const submitAddr = e => {
    e.preventDefault();
    if (addr.trim()) setManualLocation(addr.trim());
  };
  const confirmBook = () => {
    if (!dest) return;
    const t = selTime || destTimes[0] && destTimes[0][0];
    if (t) startBook(dest.id, t, selParty);else openRest(dest.id);
  };

  /* ── Geolocalización + reverse geocoding (Nominatim OSM) ── */
  const [geoLoading, setGeoLoading] = useState(false);
  const requestGeo = () => {
    if (!('geolocation' in navigator)) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const {
          latitude,
          longitude
        } = pos.coords;
        const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + latitude + '&lon=' + longitude + '&addressdetails=1&accept-language=' + UM_T.geoLang, {
          headers: {
            'User-Agent': 'una-mesa-app/1.0'
          }
        });
        const json = await res.json();
        const a = json.address || {};
        const label = a.neighbourhood || a.suburb || a.city_district || a.city || a.town || a.village || a.county || UM_T.yourArea;
        setManualLocation(label);
      } catch (_) {
        setManualLocation(UM_T.yourLocation);
      }
      setGeoLoading(false);
    }, () => setGeoLoading(false), {
      timeout: 10000,
      maximumAge: 300000
    });
  };

  /* cuando app.jsx ya ha obtenido permiso en el background, reverse-geocodifica */
  useEffect(() => {
    if (geo.status === 'granted') requestGeo();
  }, [geo.status]);
  const geoCity = !geoLoading && geo && geo.status !== 'idle' && geo.label && geo.label !== UM_T.yourLocation && geo.label !== 'tu ubicación actual' && geo.label !== 'your current location' ? geo.label : null;
  const heroEyebrow = geoCity ? UM_T.heroEyebrowIn + geoCity : UM_T.heroEyebrowNear;
  return React.createElement('div', {
    className: 'view'
  },
  /* ═══════════════════════════════════════
     1. HERO  —  fondo oscuro + Playfair h1 + glass search
  ═══════════════════════════════════════ */
  React.createElement('section', {
    className: 'stitch-hero'
  }, React.createElement('div', {
    className: 'stitch-hero-bg'
  }, React.createElement('div', {
    className: 'stitch-hero-blob b1'
  }), React.createElement('div', {
    className: 'stitch-hero-blob b2'
  }), React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'radial-gradient(rgba(255,255,255,.025) 1px,transparent 1px)',
      backgroundSize: '18px 18px',
      zIndex: 0
    }
  })), React.createElement('div', {
    className: 'stitch-hero-content'
  }, React.createElement('span', {
    className: 'eyebrow',
    style: {
      color: 'rgba(255,87,51,.85)',
      marginBottom: '18px',
      display: 'block'
    }
  }, heroEyebrow), React.createElement('h1', {
    className: 'display',
    style: {
      fontSize: 'clamp(52px,8vw,88px)',
      color: '#FAFAFA',
      marginBottom: '40px',
      letterSpacing: '-.02em',
      lineHeight: 1.02
    }
  }, UM_T.heroA, React.createElement('span', {
    style: {
      color: 'var(--accent)',
      fontWeight: 900
    }
  }, UM_T.heroB), '.'), React.createElement('form', {
    className: 'stitch-search',
    onSubmit: submit
  }, React.createElement(Icon, {
    name: 'search',
    style: {
      width: 20,
      height: 20,
      color: 'rgba(250,250,250,.50)',
      flexShrink: 0
    }
  }), React.createElement('input', {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: UM_T.searchPh
  }), React.createElement('button', {
    type: 'submit',
    className: 'stitch-search-btn'
  }, UM_T.search)), React.createElement('div', {
    className: 'stitch-chips'
  }, heroChips.map((c, i) => React.createElement('button', {
    key: i,
    className: 'stitch-chip',
    type: 'button',
    onClick: () => search(c)
  }, c))), /* ── barra de ubicación: idle → botón GPS | loading → spinner | manual → ciudad | denied → texto ── */
  geoLoading ? React.createElement('div', {
    className: 'stitch-loc'
  }, React.createElement(Icon, {
    name: 'pin',
    style: {
      width: 15,
      height: 15,
      color: 'var(--accent)',
      flexShrink: 0,
      opacity: .55
    }
  }), React.createElement('span', {
    style: {
      opacity: .65
    }
  }, UM_T.detectingLoc)) : !geo || geo.status === 'idle' ? React.createElement('button', {
    type: 'button',
    className: 'stitch-loc',
    onClick: requestGeo,
    style: {
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      fontFamily: 'inherit'
    }
  }, React.createElement(Icon, {
    name: 'pin',
    style: {
      width: 15,
      height: 15,
      color: 'var(--accent)',
      flexShrink: 0
    }
  }), UM_T.useMyLoc) : geo.status === 'granted' ? React.createElement('div', {
    className: 'stitch-loc'
  }, React.createElement(Icon, {
    name: 'pin',
    style: {
      width: 15,
      height: 15,
      color: 'var(--accent)',
      flexShrink: 0,
      opacity: .55
    }
  }), React.createElement('span', {
    style: {
      opacity: .65
    }
  }, UM_T.detectingLoc)) : geo.status === 'manual' ? React.createElement('div', {
    className: 'stitch-loc'
  }, React.createElement(Icon, {
    name: 'pin',
    style: {
      width: 15,
      height: 15,
      color: 'var(--accent)',
      flexShrink: 0
    }
  }), UM_T.near, React.createElement('b', null, geo.label), React.createElement('button', {
    type: 'button',
    className: 'stitch-loc-btn',
    style: {
      marginLeft: 'auto'
    },
    onClick: requestGeo
  }, UM_T.update)) : geo.status === 'denied' ? React.createElement('form', {
    className: 'stitch-loc',
    onSubmit: submitAddr
  }, React.createElement(Icon, {
    name: 'pin',
    style: {
      width: 15,
      height: 15,
      color: 'var(--accent)',
      flexShrink: 0
    }
  }), React.createElement('input', {
    value: addr,
    onChange: e => setAddr(e.target.value),
    placeholder: UM_T.addrPh
  }), React.createElement('button', {
    type: 'button',
    className: 'stitch-loc-btn',
    onClick: requestGeo,
    style: {
      marginRight: '4px'
    }
  }, '⊕'), React.createElement('button', {
    type: 'submit',
    className: 'stitch-loc-btn'
  }, UM_T.use)) : null)), noRealRestaurants ? React.createElement('section', {
    style: {
      padding: '60px 24px',
      textAlign: 'center'
    }
  }, React.createElement('h2', {
    style: {
      fontFamily: 'Playfair Display',
      fontSize: 24,
      marginBottom: 8
    }
  }, UM_T.noRestaurantsYetTitle), React.createElement('p', {
    style: {
      color: 'var(--muted)',
      fontSize: 15
    }
  }, UM_T.noRestaurantsYetBody)) : null,
  /* ═══════════════════════════════════════
     2. SELECCIÓN DE LA SEMANA  —  bento grid 2 + 1
  ═══════════════════════════════════════ */
  byRating.length > 0 ? React.createElement('section', {
    className: 'stitch-bento-section'
  }, React.createElement('div', {
    className: 'wrap'
  }, React.createElement('div', {
    className: 'stitch-sec-head'
  }, React.createElement('div', null, React.createElement('span', {
    className: 'stitch-eyebrow-coral'
  }, UM_T.curation), React.createElement('h2', {
    className: 'display',
    style: {
      fontSize: 'clamp(28px,4vw,42px)'
    }
  }, UM_T.weekPick)), React.createElement('button', {
    type: 'button',
    className: 'stitch-ver-todos',
    onClick: () => go('results')
  }, UM_T.viewAll, React.createElement(Icon, {
    name: 'arrow',
    style: {
      width: 16,
      height: 16
    }
  }))), React.createElement('div', {
    className: 'stitch-bento-grid'
  }, React.createElement(BentoCard, {
    r: byRating[0],
    big: true,
    onOpen: openRest,
    img: 'dish.jpg'
  }), byRating[1] ? React.createElement(BentoCard, {
    r: byRating[1],
    big: false,
    onOpen: openRest,
    img: 'albert-YYZU0Lo1uXE-unsplash.jpg'
  }) : null))) : null,
  /* ═══════════════════════════════════════
     3. DESTACADO  —  info restaurante + foto plato + widget reserva
     Stitch: bg-desert-sand/30, grid 2/3 + 1/3
  ═══════════════════════════════════════ */
  dest ? React.createElement('section', {
    className: 'detail-section'
  }, React.createElement('div', {
    className: 'wrap'
  }, React.createElement('div', {
    className: 'detail-grid'
  }, /* ── columna izquierda: info + menú + foto ── */
  React.createElement('div', null, /* eyebrow tags */
  React.createElement('div', {
    className: 'detail-tags'
  }, React.createElement('span', {
    className: 'detail-tag-pill'
  }, UM_T.featured), React.createElement('span', {
    className: 'detail-tag-avail'
  }, UM_T.availToday)), /* nombre del restaurante */
  React.createElement('h2', {
    className: 'display detail-h2',
    onClick: () => openRest(dest.id),
    style: {
      cursor: 'pointer'
    }
  }, dest.name), /* descripción */
  React.createElement('p', {
    className: 'detail-about'
  }, dest.about), /* grid menú + foto */
  React.createElement('div', {
    className: 'detail-inner-grid'
  }, /* destacados del menú */
  React.createElement('div', null, React.createElement('h4', {
    className: 'detail-menu-title'
  }, UM_T.menuHighlights), destMenu.map(([name,, price], i) => React.createElement('div', {
    key: i,
    className: 'detail-menu-item'
  }, React.createElement('span', {
    className: 'detail-menu-name'
  }, name), React.createElement('span', {
    className: 'detail-menu-price'
  }, price)))), /* foto del plato */
  React.createElement('div', {
    className: 'detail-food-ph'
  }, React.createElement('img', {
    src: './dish.jpg',
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '12px'
    }
  })))), /* ── columna derecha: glass booking card ── */
  React.createElement('div', {
    className: 'booking-glass'
  }, React.createElement('h3', {
    className: 'display'
  }, UM_T.bookTable), /* invitados */
  React.createElement('span', {
    className: 'bk-gl-label'
  }, UM_T.guests), React.createElement('div', {
    className: 'party-row'
  }, [1, 2, 3, 4, '5+'].map((n, i) => React.createElement('button', {
    key: i,
    type: 'button',
    className: 'party-btn' + (selParty === i + 1 ? ' on' : ''),
    onClick: () => setSelParty(i + 1)
  }, n))), /* horarios */
  React.createElement('span', {
    className: 'bk-gl-label'
  }, UM_T.slotsAvail), React.createElement('div', {
    className: 'ts-grid'
  }, destTimes.map(([t, st], i) => React.createElement('button', {
    key: i,
    type: 'button',
    className: 'ts-btn' + (selTime === t ? ' on' : '') + (st === 'full' ? ' full' : ''),
    onClick: () => {
      if (st !== 'full') setSelTime(t);
    }
  }, t))), /* nota depósito */
  React.createElement('div', {
    className: 'deposit-note'
  }, React.createElement(Icon, {
    name: 'info',
    style: {
      width: 16,
      height: 16,
      color: 'var(--accent)'
    }
  }), React.createElement('span', null, UM_T.depositPre, React.createElement('b', null, UM_T.depositAmountFn(dest)), UM_T.depositPost)), /* confirmar */
  React.createElement('button', {
    className: 'book-cta',
    onClick: confirmBook
  }, UM_T.confirmBooking))))) : null,
  /* ═══════════════════════════════════════
     4. CONSERJE DIGITAL  —  sección fondo oscuro
  ═══════════════════════════════════════ */
  React.createElement('section', {
    className: 'stitch-ai-section'
  }, React.createElement('div', {
    className: 'wrap'
  }, React.createElement('div', {
    className: 'stitch-ai-inner'
  }, React.createElement('span', {
    className: 'stitch-ai-eyebrow'
  }, UM_T.personalService), React.createElement('h2', {
    className: 'display stitch-ai-h2'
  }, UM_T.concierge), React.createElement('div', {
    className: 'stitch-quote'
  }, React.createElement('div', {
    className: 'stitch-quote-ico'
  }, React.createElement(Icon, {
    name: 'sparkle',
    style: {
      width: 18,
      height: 18,
      color: 'var(--accent)'
    }
  })), React.createElement('p', {
    className: 'stitch-quote-text'
  }, UM_T.conciergeQuote)), React.createElement('form', {
    className: 'stitch-ai-form',
    onSubmit: submitAi
  }, React.createElement('textarea', {
    className: 'stitch-ai-textarea',
    value: ai,
    onChange: e => setAi(e.target.value),
    rows: 2,
    placeholder: UM_T.conciergePh
  }), React.createElement('button', {
    type: 'submit',
    className: 'stitch-ai-send'
  }, React.createElement(Icon, {
    name: 'arrow',
    style: {
      width: 24,
      height: 24
    }
  }))), React.createElement('div', {
    className: 'stitch-ai-chips'
  }, aiSuggestions.map((s, i) => React.createElement('button', {
    key: i,
    type: 'button',
    className: 'stitch-ai-chip',
    onClick: () => askConcierge(s)
  }, s)))))),
  /* ═══════════════════════════════════════
     5. RECOMENDADO PARA TI  —  grid de tarjetas
  ═══════════════════════════════════════ */
  React.createElement('section', {
    className: 'stitch-picks-section'
  }, React.createElement('div', {
    className: 'wrap'
  }, React.createElement('div', {
    className: 'sec-head'
  }, React.createElement('h2', {
    className: 'display'
  }, UM_T.recommended), React.createElement('span', {
    className: 'lnk',
    onClick: () => go('results')
  }, UM_T.viewMore, React.createElement(Icon, {
    name: 'arrow'
  }))), React.createElement('div', {
    className: 'rgrid'
  }, aiPicks.map((r, i) => React.createElement(RestaurantCard, {
    key: r.id,
    r,
    fav: favs.includes(r.id),
    onFav: toggleFav,
    onOpen: openRest,
    onBook: startBook,
    showMatch: true,
    img: PICKS_IMGS[i]
  }))))),
  /* ═══════════════════════════════════════
     6. DISPONIBLE HOY  —  bento pequeño con título visible
  ═══════════════════════════════════════ */
  React.createElement('section', {
    className: 'dispo-section'
  }, React.createElement('div', {
    className: 'wrap'
  }, React.createElement('div', {
    className: 'sec-head'
  }, React.createElement('h2', {
    className: 'display'
  }, UM_T.availToday), React.createElement('span', {
    className: 'lnk',
    onClick: () => go('results')
  }, UM_T.viewAllShort, React.createElement(Icon, {
    name: 'arrow'
  }))), React.createElement('div', {
    className: 'nearby-grid'
  }, nearby.map(({
    r,
    d
  }, i) => React.createElement(NearbyCard, {
    key: r.id,
    r,
    dist: d,
    onOpen: openRest,
    img: NEARBY_IMGS[i]
  }))))));
}
Object.assign(window, {
  RestaurantCard,
  HomeScreen
});