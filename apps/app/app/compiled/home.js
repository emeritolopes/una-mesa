/* ════ UNA MESA · RestaurantCard + Home screen ════ */

/* ── Market/language: window.UM_LANG is the single source of truth (see data.js) ── */
const UM_LANG = window.UM_LANG;
const UM_T = {
  es: {
    save: 'Guardar',
    noSlotsToday: 'Sin horarios hoy',
    noRestaurantsYetTitle: 'Aún no hay restaurantes en tu zona',
    noRestaurantsYetBody: 'Estamos incorporando restaurantes en esta ciudad. Vuelve pronto.',
    heroEyebrowIn: 'Reserva en ',
    heroEyebrowNear: 'Reserva cerca de ti',
    heroA: 'Descubre. Elige. ',
    heroB: 'Reserva',
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
    heroA: 'Discover. Choose. ',
    heroB: 'Reserve',
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
function RestaurantCard({ r, fav, onFav, onOpen, onBook, showMatch, dist, img }) {
  /* Same card as the unamesa.co.uk landing: 4:3 photo with cuisine badge + heart,
     name, area, rating · price, quick time slots, full-width "Reserve" button. */
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const firstTimes = [...(r.times.lunch || []), ...(r.times.dinner || [])]
    .filter(([time]) => { const [h, m] = time.split(':').map(Number); return h * 60 + m > currentMinutes + 30; })
    .slice(0, 3);
  const resolvedImg = r.photo_url || (r.photo_urls && r.photo_urls[0]) || img;
  const isAbsoluteImg = resolvedImg && /^https?:\/\//.test(resolvedImg);
  const cuisine = String(r.cuisine || '').split(',')[0].trim();
  return React.createElement('div', { className: 'rcard', onClick: () => onOpen(r.id) },
    React.createElement('div', { className: 'rc-photo' },
      resolvedImg
        ? React.createElement('div', { className: 'rc-img', style: { backgroundImage: "url('" + (isAbsoluteImg ? resolvedImg : './' + resolvedImg) + "')" } })
        : React.createElement(Photo, { cz: r.cz, glyph: r.glyph, slotId: 'rphoto-' + r.id }),
      showMatch ? React.createElement('span', { className: 'rc-match' },
        React.createElement(Icon, { name: 'sparkle', fill: 'currentColor' }), r.match + '%') : null,
      cuisine ? React.createElement('span', { className: 'rc-cuisine' }, cuisine) : null,
      React.createElement('button', { className: 'rc-fav' + (fav ? ' on' : ''), title: UM_T.save,
        onClick: e => { e.stopPropagation(); onFav(r.id); } },
        React.createElement(Icon, { name: 'heart', fill: fav ? 'currentColor' : 'none' }))
    ),
    React.createElement('div', { className: 'rc-body' },
      React.createElement('div', { className: 'rc-name' }, r.name),
      React.createElement('div', { className: 'rc-loc' },
        React.createElement(Icon, { name: 'pin' }),
        (r.area || r.city || '') + (dist != null ? UM_T.kmAway(dist) : '')),
      React.createElement('div', { className: 'rc-rating' },
        React.createElement(Icon, { name: 'star', fill: 'currentColor' }),
        r.rating.toFixed(1),
        React.createElement('span', { className: 'cnt' }, '(' + r.reviews + ')'),
        React.createElement('span', { className: 'dot' }, '•'),
        React.createElement('span', { className: 'price' }, r.price)),
      React.createElement('div', { className: 'rc-times' },
        firstTimes.length
          ? firstTimes.map(([t, st], i) => React.createElement('span', {
              key: i, className: 'tslot' + (st === 'few' ? ' few' : st === 'full' ? ' full' : ''),
              onClick: e => { e.stopPropagation(); if (st !== 'full') onBook(r.id, t); }
            }, t))
          : React.createElement('span', { className: 'rc-meta' }, UM_T.noSlotsToday)),
      React.createElement('button', { type: 'button', className: 'rc-reserve',
        onClick: e => { e.stopPropagation(); onOpen(r.id); } },
        UM_LANG === 'en' ? 'Reserve a table' : 'Reservar mesa')
    )
  );
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
/* Home ("Discover") — mirrors the unamesa.co.uk landing page section by section,
   wired to the app's own functions (search → results, concierge, open/book). */
const HX = {
  es: {
    city: 'Madrid', eyebrow: 'Plataforma Gastronómica Exclusiva · Madrid',
    title: 'Descubre. Elige. Reserva.',
    sub: 'Restaurantes reales, historias auténticas y reservas directas. Vive la gastronomía de una forma diferente.',
    where: '¿Dónde quieres comer?', wherePh: 'Zona, cocina o restaurante', date: 'Fecha', guests: 'Comensales',
    guest: n => n + (n === 1 ? ' persona' : ' personas'), cuisine: 'Cocina', all: 'Todas', explore: 'Explorar restaurantes',
    nearMe: 'Ver restaurantes cerca de mí',
    pills: [['Romántico', 'romántico'], ['Terraza exterior', 'terraza'], ['Barra de autor', 'menú degustación'], ['Sunday Brunch', 'brunch']],
    gridEyebrow: 'Restaurantes en Madrid', gridTitle: 'Descubre dónde comer ',
    tod: ['esta mañana', 'esta tarde', 'esta noche'], seeAll: 'Ver todos los restaurantes',
    vidEyebrow: 'Vídeos, menús y experiencias', vidTitle: 'Vívelo antes de reservar', vidMore: 'Explora más vídeos',
    reels: ['Auténtica pizza napolitana', 'Cócteles de autor en el corazón de Malasaña', 'Una experiencia gastronómica única', 'Cenas con las mejores vistas de la ciudad', 'El arte del sushi en cada detalle', 'Así se crea nuestro menú'],
    reelQ: ['pizza', 'cócteles', 'carne', 'vistas', 'sushi', ''],
    aiEyebrow: 'Asistente Gastronómico Inteligente', aiTitle: '¿Buscas algo especial para esta noche?',
    aiSub: 'Describe el ambiente, la ocasión o lo que se te antoja, y nuestro AI Concierge encontrará tu mesa perfecta al instante.',
    aiPh: "Ej: 'Cena íntima y romántica con vinos naturales cerca de La Latina…'", tryWith: 'Prueba con:',
    aiChips: [['Joya escondida', 'Una joya escondida'], ['Cena con clientes', 'Cena de negocios con clientes'], ['Celebración en grupo', 'Celebración en grupo'], ['Copas nocturnas', 'Copas nocturnas']],
    frEyebrow: 'Para restaurantes', frTitle: 'Llena tus mesas, no solo tu calendario',
    frSub: 'Te ayudamos a atraer más comensales con contenido visual, reservas directas y una presencia online que realmente funciona.',
    feats: [['calendar_today', 'Reservas directas', 'Sin comisiones abusivas ni ataduras.'], ['smart_display', 'Menú de vídeo', 'Contenido audiovisual que enamora al instante.'], ['camera_enhance', 'Contenido profesional', 'Producción de alta calidad para redes sociales.'], ['query_stats', 'Analítica real', 'Resultados tangibles y métricas claras de clientes.']],
    frCta: 'Quiero mi restaurante en Una Mesa', frHow: 'Ver cómo funciona',
    metrics: ['Reservas este mes', 'Reservas directas', 'Comensales', 'Visualizaciones'],
    ribbon: [['calendar_month', 'Reserva directa', 'Sin comisiones abusivas'], ['groups_2', 'Menos dependencia', 'De marketplaces impersonales'], ['bar_chart_4_bars', 'Contenido que genera', 'Demanda real y sostenible']]
  },
  en: {
    city: 'London', eyebrow: 'Exclusive Gastronomic Platform · London',
    title: 'Discover. Choose. Reserve.',
    sub: "Real restaurants, authentic stories and direct reservations. Experience London's gastronomy differently.",
    where: 'Where do you want to eat?', wherePh: 'Area, cuisine or restaurant', date: 'Date', guests: 'Guests',
    guest: n => n + (n === 1 ? ' guest' : ' guests'), cuisine: 'Cuisine', all: 'All', explore: 'Explore restaurants',
    nearMe: 'See restaurants near me',
    pills: [['Romantic', 'romantic'], ['Outdoor terrace', 'terrace'], ["Chef's counter", 'tasting menu'], ['Sunday Brunch', 'brunch']],
    gridEyebrow: 'Restaurants in London', gridTitle: 'Discover where you want to eat ',
    tod: ['this morning', 'this afternoon', 'tonight'], seeAll: 'See all restaurants',
    vidEyebrow: 'Videos, menus & experiences', vidTitle: 'Experience it before you book', vidMore: 'Explore more videos',
    reels: ['Authentic Neapolitan pizza in London', 'Signature cocktails in the heart of Soho', 'A unique gastronomic experience', 'Dinners with the best views of the city', 'The art of sushi in every detail', 'This is how our menu is made'],
    reelQ: ['pizza', 'cocktails', 'steak', 'views', 'sushi', ''],
    aiEyebrow: 'Intelligent Gastronomic Assistant', aiTitle: 'Looking for something special tonight?',
    aiSub: 'Describe the vibe, the occasion or whatever you fancy, and our AI Concierge will find your perfect table instantly.',
    aiPh: "E.g. 'An intimate, romantic dinner with natural wines near Covent Garden…'", tryWith: 'Try:',
    aiChips: [['Hidden gem', 'A hidden gem'], ['Dinner with clients', 'Business dinner with clients'], ['Group celebration', 'Group celebration'], ['Late-night drinks', 'Late-night drinks']],
    frEyebrow: 'For restaurants', frTitle: 'Fill your tables, not just your calendar',
    frSub: 'We help independent London restaurants attract more diners with video content, direct bookings and an online presence that actually works.',
    feats: [['calendar_today', 'Direct bookings', 'No hefty commissions, no lock-ins.'], ['smart_display', 'Video menu', 'Short clips of every dish that win diners over.'], ['camera_enhance', 'Professional content', 'High-quality production for social media.'], ['query_stats', 'Real analytics', 'Clear results and guest metrics.']],
    frCta: 'List my restaurant on Una Mesa', frHow: 'See how it works',
    metrics: ['Bookings this month', 'Direct bookings', 'Covers', 'Menu video views'],
    ribbon: [['calendar_month', 'Direct reservations', 'No hefty commissions'], ['groups_2', 'Less dependency', 'On impersonal marketplaces'], ['bar_chart_4_bars', 'Content that converts', 'Real, sustainable demand']]
  }
};
const HX_IMG = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EEAzwZUvO4SvnS8Notm2hD9DNK/';
const HX_HERO = HX_IMG + 'hf_20260926_110543_2a51e290-0934-4a45-a5f2-7916884c9998.png';
const HX_CHEF = HX_IMG + 'hf_20260926_110554_1c68743e-2029-40a7-81cb-30a9527070cb.png';
const HX_REELS = [
  ['hf_20260926_110631_b909a1a4-0bda-44ef-be23-3f5a45edbd12.png', '12.4K'],
  ['hf_20260926_110651_38d56b61-aa87-4f01-85d2-52a0a4067efb.png', '8.7K'],
  ['hf_20260926_110631_1a165c04-8165-4da6-8b61-35493b2d9ea1.png', '15.2K'],
  ['hf_20260926_110631_ecf3c52d-ff6d-4a1b-b7d9-c0406ea61688.png', '11.1K'],
  ['hf_20260926_110631_ea54d46c-53a0-4cd5-96d9-9e8bffe257ed.png', '9.3K'],
  ['hf_20260926_110651_c0d360d0-1846-4e83-a8aa-9fbf56b8581f.png', '9.3K']
];
const MS = (name, extra) => React.createElement('span', { className: 'msym' + (extra ? ' ' + extra : '') }, name);

function HomeScreen({ go, openRest, search, askConcierge, favs, toggleFav, startBook, geo, setManualLocation, noRealRestaurants }) {
  const T = HX[UM_LANG] || HX.en;
  const [q, setQ] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [party, setParty] = useState(2);
  const [cuisine, setCuisine] = useState('');
  const [ai, setAi] = useState('');
  const data = window.UM_DATA || [];
  const top = [...data].sort((a, b) => b.rating - a.rating).slice(0, 8);
  const cuisines = [...new Set(data.map(r => String(r.cuisine || '').split(',')[0].trim()).filter(Boolean))].sort();
  const h = new Date().getHours();
  const tod = h >= 5 && h < 12 ? T.tod[0] : h >= 12 && h < 17 ? T.tod[1] : T.tod[2];
  const today = new Date().toLocaleDateString('en-CA');
  const doSearch = text => search([text, cuisine].filter(Boolean).join(' ').trim());
  const onSubmit = e => { e.preventDefault(); doSearch(q.trim()); };
  const onAi = e => { e.preventDefault(); askConcierge(ai.trim()); };
  const bookFrom = (rid, t) => startBook(rid, t, party, date);
  const sec = (eyebrow, title, linkLabel, onLink) => React.createElement('div', { className: 'lx-sechead' },
    React.createElement('div', null,
      React.createElement('span', { className: 'lx-eyebrow' }, eyebrow),
      React.createElement('h2', { className: 'lx-h2' }, title)),
    linkLabel ? React.createElement('button', { type: 'button', className: 'lx-more', onClick: onLink }, React.createElement('span', null, linkLabel), MS('arrow_forward')) : null);

  return React.createElement('div', { className: 'view lx' },
    /* 1. HERO */
    React.createElement('section', { className: 'lx-hero' },
      React.createElement('div', { className: 'lx-hero-bg', style: { backgroundImage: "url('" + HX_HERO + "')" } }),
      React.createElement('div', { className: 'lx-hero-in' },
        React.createElement('span', { className: 'lx-pill' }, MS('restaurant_menu', 'fill lx-gold'), T.eyebrow),
        React.createElement('h1', { className: 'lx-h1' }, T.title),
        React.createElement('p', { className: 'lx-sub' }, T.sub),
        React.createElement('form', { className: 'lx-bar', onSubmit },
          React.createElement('label', { className: 'lx-seg grow' }, MS('search'),
            React.createElement('span', { className: 'lx-segtxt' },
              React.createElement('span', { className: 'lx-seglbl' }, T.where),
              React.createElement('input', { value: q, onChange: e => setQ(e.target.value), placeholder: T.wherePh, autoComplete: 'off' }))),
          React.createElement('label', { className: 'lx-seg' }, MS('calendar_today'),
            React.createElement('span', { className: 'lx-segtxt' },
              React.createElement('span', { className: 'lx-seglbl' }, T.date),
              React.createElement('input', { type: 'date', value: date, min: today, onChange: e => setDate(e.target.value || today) }))),
          React.createElement('label', { className: 'lx-seg' }, MS('person'),
            React.createElement('span', { className: 'lx-segtxt' },
              React.createElement('span', { className: 'lx-seglbl' }, T.guests),
              React.createElement('select', { value: party, onChange: e => setParty(parseInt(e.target.value, 10)) },
                [1, 2, 3, 4, 5, 6, 7, 8].map(n => React.createElement('option', { key: n, value: n }, T.guest(n)))))),
          React.createElement('label', { className: 'lx-seg' }, MS('restaurant'),
            React.createElement('span', { className: 'lx-segtxt' },
              React.createElement('span', { className: 'lx-seglbl' }, T.cuisine),
              React.createElement('select', { value: cuisine, onChange: e => setCuisine(e.target.value) },
                React.createElement('option', { value: '' }, T.all),
                cuisines.map(c => React.createElement('option', { key: c, value: c }, c))))),
          React.createElement('button', { type: 'submit', className: 'lx-go' }, React.createElement('span', null, T.explore), MS('arrow_forward'))),
        React.createElement('div', { className: 'lx-pills' },
          React.createElement('button', { type: 'button', className: 'lx-near', onClick: () => go('results') }, MS('near_me'), T.nearMe),
          React.createElement('span', { className: 'lx-dot' }, '•'),
          T.pills.map(([label, term]) => React.createElement('button', { key: term, type: 'button', className: 'lx-chip', onClick: () => search(term) }, label))))),

    /* 2. RESTAURANTS */
    React.createElement('section', { className: 'lx-sec' },
      React.createElement('div', { className: 'lx-wrap' },
        sec(T.gridEyebrow, T.gridTitle + tod, T.seeAll, () => go('results')),
        noRealRestaurants || !top.length
          ? React.createElement('div', { className: 'lx-empty' },
              React.createElement('h3', null, UM_T.noRestaurantsYetTitle),
              React.createElement('p', null, UM_T.noRestaurantsYetBody))
          : React.createElement('div', { className: 'lx-grid' },
              top.map(r => React.createElement(RestaurantCard, { key: r.id, r, fav: favs.includes(r.id), onFav: toggleFav, onOpen: openRest, onBook: bookFrom }))))),

    /* 3. VIDEOS */
    React.createElement('section', { className: 'lx-sec alt' },
      React.createElement('div', { className: 'lx-wrap' },
        sec(T.vidEyebrow, T.vidTitle, T.vidMore, () => go('results')),
        React.createElement('div', { className: 'lx-reels' },
          HX_REELS.map(([img, views], i) => React.createElement('button', { key: i, type: 'button', className: 'lx-reel', onClick: () => T.reelQ[i] ? search(T.reelQ[i]) : go('results') },
            React.createElement('img', { src: HX_IMG + img, alt: '', loading: 'lazy' }),
            React.createElement('span', { className: 'lx-reel-shade' }),
            React.createElement('span', { className: 'lx-play' }, MS('play_arrow', 'fill')),
            React.createElement('span', { className: 'lx-reel-cap' },
              React.createElement('span', { className: 'lx-reel-t' }, T.reels[i]),
              React.createElement('span', { className: 'lx-reel-v' }, MS('visibility'), views))))))),

    /* 4. AI CONCIERGE */
    React.createElement('section', { className: 'lx-sec' },
      React.createElement('div', { className: 'lx-wrap narrow' },
        React.createElement('div', { className: 'lx-ai' },
          React.createElement('div', { className: 'lx-ai-glow' }),
          React.createElement('div', { className: 'lx-ai-in' },
            React.createElement('div', { className: 'lx-ai-ico' }, MS('auto_awesome')),
            React.createElement('span', { className: 'lx-eyebrow acc' }, T.aiEyebrow),
            React.createElement('h2', { className: 'lx-h2' }, T.aiTitle),
            React.createElement('p', { className: 'lx-ai-sub' }, T.aiSub),
            React.createElement('form', { className: 'lx-ai-form', onSubmit: onAi },
              MS('chat_bubble_outline', 'lx-ai-chat'),
              React.createElement('input', { value: ai, onChange: e => setAi(e.target.value), placeholder: T.aiPh }),
              React.createElement('button', { type: 'submit', 'aria-label': T.aiTitle }, MS('arrow_upward'))),
            React.createElement('div', { className: 'lx-ai-chips' },
              React.createElement('span', null, T.tryWith),
              T.aiChips.map(([label, prompt]) => React.createElement('button', { key: label, type: 'button', onClick: () => askConcierge(prompt) }, label))))))),

    /* 5. FOR RESTAURANTS */
    React.createElement('section', { className: 'lx-sec lowest' },
      React.createElement('div', { className: 'lx-wrap lx-fr' },
        React.createElement('div', { className: 'lx-fr-vis' },
          React.createElement('img', { src: HX_CHEF, alt: '' }),
          React.createElement('div', { className: 'lx-metrics' },
            React.createElement('div', { className: 'lx-m-head' }, React.createElement('span', null, T.metrics[0]), React.createElement('b', null, '+68%')),
            React.createElement('div', { className: 'lx-spark' }, [40, 55, 35, 70, 60, 85, 100].map((v, i) => React.createElement('i', { key: i, style: { height: v + '%' } }))),
            [['event_seat', T.metrics[1], '124'], ['group', T.metrics[2], '342'], ['visibility', T.metrics[3], '28.4K']].map(([ic, k, v]) =>
              React.createElement('div', { key: k, className: 'lx-m-row' }, React.createElement('span', null, MS(ic), k), React.createElement('b', null, v))))),
        React.createElement('div', null,
          React.createElement('span', { className: 'lx-eyebrow' }, T.frEyebrow),
          React.createElement('h2', { className: 'lx-h2' }, T.frTitle),
          React.createElement('p', { className: 'lx-fr-sub' }, T.frSub),
          React.createElement('div', { className: 'lx-feats' },
            T.feats.map(([ic, t, d]) => React.createElement('div', { key: t, className: 'lx-feat' },
              React.createElement('div', { className: 'lx-feat-ico' }, MS(ic)),
              React.createElement('div', null, React.createElement('h3', null, t), React.createElement('p', null, d))))),
          React.createElement('div', { className: 'lx-fr-ctas' },
            React.createElement('a', { className: 'lx-cta', href: '/restaurants/' }, React.createElement('span', null, T.frCta), MS('arrow_forward')),
            React.createElement('a', { className: 'lx-more', href: '/restaurants/' }, React.createElement('span', null, T.frHow), MS('arrow_forward')))))),

    /* 6. VALUE RIBBON */
    React.createElement('section', { className: 'lx-ribbon' },
      React.createElement('div', { className: 'lx-wrap lx-rib' },
        T.ribbon.map(([ic, t, s]) => React.createElement('div', { key: t, className: 'lx-rib-item' },
          MS(ic, 'lx-rib-ico'),
          React.createElement('div', null, React.createElement('b', null, t), React.createElement('span', null, s))))))
  );
}

Object.assign(window, {
  RestaurantCard,
  HomeScreen
});