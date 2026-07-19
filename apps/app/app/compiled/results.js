/* ════ UNA MESA · Results screen · Stitch design system ════ */

function ResultsScreen({
  query,
  openRest,
  favs,
  toggleFav,
  startBook,
  geoLabel,
  geo
}) {
  const data = window.UM_DATA;
  const [q, setQ] = useState(query || '');
  const [cuisines, setCuisines] = useState([]);
  const [prices, setPrices] = useState([]);
  const [tags, setTags] = useState([]);
  const [sort, setSort] = useState('match');
  const [hoverId, setHoverId] = useState(null);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const [coords, setCoords] = useState(geo?.lat ? {
    lat: geo.lat,
    lng: geo.lng
  } : null);
  useEffect(() => {
    if (coords) return;
    let alive = true;
    if (!('geolocation' in navigator)) {
      setCoords({
        lat: 40.4168,
        lng: -3.7038
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
      if (alive) setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    }, () => {
      if (alive) setCoords({
        lat: 40.4168,
        lng: -3.7038
      });
    }, {
      timeout: 5000,
      maximumAge: 300000
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    setQ(query || '');
  }, [query]);

  /* Map — init cuando coords están disponibles */
  React.useEffect(() => {
    if (!coords || !mapContainerRef.current || !window.L) return;
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
    delete mapContainerRef.current._leaflet_id;
    const map = window.L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 14);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);
    leafletMapRef.current = map;
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [coords]);
  const allCuisines = [...new Set(data.map(r => r.cuisine))];
  const allTags = [...new Set(data.flatMap(r => r.tags))];
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  let list = data.filter(r => {
    const text = (q || '').toLowerCase().trim();
    const matchText = !text || [r.name, r.cuisine, r.area, ...r.tags, ...(r.kw || [])].join(' ').toLowerCase().includes(text);
    const matchCui = !cuisines.length || cuisines.includes(r.cuisine);
    const matchPrice = !prices.length || prices.includes(r.price);
    const matchTag = !tags.length || tags.some(t => r.tags.includes(t));
    return matchText && matchCui && matchPrice && matchTag;
  });
  list = [...list].sort((a, b) => {
    if (sort === 'match') return b.match - a.match;
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'price-lo') return a.price.length - b.price.length;
    if (sort === 'price-hi') return b.price.length - a.price.length;
    return 0;
  });
  useEffect(() => {
    if (!leafletMapRef.current || !coords) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    list.forEach(r => {
      if (!r.lat || !r.lng) return;
      const m = window.L.marker([r.lat, r.lng]).addTo(leafletMapRef.current).bindPopup('<b>' + r.name + '</b><br>' + r.rating.toFixed(1) + '★ · ' + r.price + '<br><small>' + r.area + '</small>');
      m.on('click', () => openRest(r.id));
      markersRef.current.push(m);
    });
  }, [list, coords]);
  React.useEffect(() => {
    if (!q || q.length < 3) return;
    const timer = setTimeout(() => {
      if (!leafletMapRef.current) return;
      const words = q.trim().split(' ').filter(w => w.length > 2);
      const cityQuery = words[words.length - 1] || q;
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=1&countrycodes=es`).then(r => r.json()).then(data => {
        if (data[0] && leafletMapRef.current) {
          leafletMapRef.current.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 13);
        }
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [q]);
  const clearAll = () => {
    setCuisines([]);
    setPrices([]);
    setTags([]);
    setQ('');
  };

  /* pill filter button — replaces checkbox style */
  const FPill = (label, arr, set) => React.createElement('button', {
    type: 'button',
    className: 'res-fpill' + (arr.includes(label) ? ' on' : ''),
    onClick: () => toggle(arr, set, label)
  }, label);

  /* sort pill button — replaces <select> */
  const SortPill = (val, label) => React.createElement('button', {
    type: 'button',
    className: 'res-sort-pill' + (sort === val ? ' on' : ''),
    onClick: () => setSort(val)
  }, label);
  return React.createElement('div', {
    className: 'view'
  }, /* ════ Hero header ════ */
  React.createElement('div', {
    className: 'res-hero'
  }, React.createElement('div', {
    className: 'wrap'
  }, React.createElement('div', {
    className: 'res-hero-inner'
  }, React.createElement('span', {
    className: 'res-eyebrow'
  }, 'Explorar'), React.createElement('div', {
    className: 'res-hero-row'
  }, React.createElement('h1', {
    className: 'res-h1 display'
  }, q ? '”' + q + '”' : 'Restaurantes en ' + (geoLabel || 'tu zona')), React.createElement('span', {
    className: 'res-count-pill'
  }, list.length + ' sitios')), /* AI panel */
  React.createElement('div', {
    className: 'res-ai-panel'
  }, React.createElement('div', {
    className: 'res-ai-left'
  }, React.createElement('div', {
    className: 'res-ai-ico'
  }, React.createElement(Icon, {
    name: 'sparkle',
    fill: 'currentColor'
  })), React.createElement('div', {
    className: 'res-ai-body'
  }, React.createElement('p', {
    className: 'res-ai-label'
  }, 'Conserje IA'), React.createElement('p', {
    className: 'res-ai-sub'
  }, q ? 'Coincidencias para “' + q + '” — ordenadas por afinidad.' : 'Resultados ordenados por afinidad con tu gusto, presupuesto y franja habitual.'))), React.createElement('button', {
    type: 'button',
    className: 'res-clear-btn',
    onClick: clearAll
  }, 'Limpiar filtros'))))), /* ════ Main layout ════ */
  React.createElement('div', {
    className: 'wrap',
    style: {
      paddingTop: '32px',
      paddingBottom: '72px'
    }
  }, React.createElement('div', {
    className: 'results-layout'
  }, /* ── Filters sidebar ── */
  React.createElement('aside', {
    className: 'filters'
  }, React.createElement('div', {
    className: 'res-fgroup'
  }, React.createElement('p', {
    className: 'res-flabel'
  }, 'Cocina'), React.createElement('div', {
    className: 'res-fpills'
  }, allCuisines.map(c => React.createElement(React.Fragment, {
    key: c
  }, FPill(c, cuisines, setCuisines))))), React.createElement('div', {
    className: 'res-fgroup'
  }, React.createElement('p', {
    className: 'res-flabel'
  }, 'Precio'), React.createElement('div', {
    className: 'res-fpills'
  }, ['€€', '€€€'].map(p => React.createElement(React.Fragment, {
    key: p
  }, FPill(p, prices, setPrices))))), React.createElement('div', {
    className: 'res-fgroup'
  }, React.createElement('p', {
    className: 'res-flabel'
  }, 'Ambiente'), React.createElement('div', {
    className: 'res-fpills res-fpills-wrap'
  }, allTags.map(t => React.createElement(React.Fragment, {
    key: t
  }, FPill(t, tags, setTags)))))), /* ── Sort + grid ── */
  React.createElement('div', null, React.createElement('div', {
    className: 'res-sort-wrap'
  }, SortPill('match', 'Afinidad IA'), SortPill('rating', 'Mejor valorados'), SortPill('price-lo', 'Precio: bajo'), SortPill('price-hi', 'Precio: alto')), list.length ? React.createElement('div', {
    className: 'results-grid'
  }, list.map(r => React.createElement('div', {
    key: r.id,
    onMouseEnter: () => setHoverId(r.id),
    onMouseLeave: () => setHoverId(null)
  }, React.createElement(RestaurantCard, {
    r,
    fav: favs.includes(r.id),
    onFav: toggleFav,
    onOpen: openRest,
    onBook: startBook,
    showMatch: sort === 'match'
  })))) : React.createElement('div', {
    className: 'res-empty'
  }, React.createElement('div', {
    className: 'res-empty-ico'
  }, React.createElement(Icon, {
    name: 'search'
  })), React.createElement('p', {
    className: 'res-empty-msg'
  }, 'No encontramos sitios con esos filtros.'), React.createElement('button', {
    type: 'button',
    className: 'btn btn-acc',
    style: {
      marginTop: '20px'
    },
    onClick: clearAll
  }, 'Quitar filtros'))), /* ── Map panel (Leaflet) ── */
  React.createElement('aside', {
    className: 'mappanel'
  }, React.createElement('div', {
    id: 'uma-map',
    ref: mapContainerRef,
    style: {
      height: '100%',
      width: '100%',
      borderRadius: '12px',
      overflow: 'hidden'
    }
  })))));
}
Object.assign(window, {
  ResultsScreen
});