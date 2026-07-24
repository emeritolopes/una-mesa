/* ════ UNA MESA · mock data (Vigo / Galicia) ════ */
(function(){
  // gradient palettes for photo placeholders [from,to]
  const G = {
    marisco:['#2E6E8E','#143B4F'], asador:['#8E4A2E','#4F2414'], gallego:['#3E7A52','#1F3D29'],
    arroz:['#C8810E','#7A4E08'], tapas:['#B0492E','#5E2418'], fusion:['#6E4A8E','#36234F'],
    bistro:['#A35C3A','#5E3320'], pulpo:['#9E3A4E','#52202A'], cafe:['#7A5E3A','#3D2E1F'],
    vegetal:['#5E8E3A','#2F4F1D'], japones:['#3A5E8E','#1D2F4F'], dulce:['#B06A8E','#5E3349']
  };
  const cz = (k)=>({key:k, from:G[k][0], to:G[k][1]});

  const R = (o)=>o;
  const data = [
    R({ id:'casa-lua', name:'Casa Lúa', cuisine:'Mediterráneo', cz:cz('marisco'), price:'€€€', area:'Casco Vello', city:'Vigo',
      rating:4.8, reviews:284, match:98, coords:{x:30,y:42}, lat:42.2373, lng:-8.7241, glyph:'fish',
      tags:['Romántico','Con terraza','Pescado del día'],
      about:'Cocina mediterránea de producto en pleno Casco Vello. Pescado de la lonja de Vigo, brasa de encina y una bodega corta pero bien elegida. Sala íntima con velas y una terraza interior sobre piedra centenaria.',
      address:'Rúa Real 12, Casco Vello', hours:'13:00–16:00 · 20:30–23:30', phone:'+34 986 22 14 08',
      times:{ lunch:[['13:30','few'],['14:00','free'],['14:30','free'],['15:00','free']],
              dinner:[['20:30','free'],['21:00','few'],['21:30','free'],['22:00','full']] },
      menu:[
        {s:'Para empezar', items:[['Ostras de Arcade','media docena, al natural','18€'],['Zamburiñas a la brasa','con manteiga de algas','16€'],['Croquetas de centollo','crujientes, cremosas','12€']]},
        {s:'Principales', items:[['Rodaballo a la brasa','de la lonja, verduras de temporada','28€'],['Arroz meloso de bogavante','para dos','46€'],['Solomillo de vaca rubia gallega','grelos y patata confitada','26€']]},
        {s:'Postres', items:[['Filloas rellenas','crema de castaña','7€'],['Tarta de queso de O Cebreiro','—','7€']]}
      ],
      revs:[['Sara M.',5,'Hace 2 días','Reservé por la app en un minuto y la mesa estaba lista al llegar. El rodaballo, espectacular. Volveremos.'],
            ['Rafa S.',5,'Hace 1 semana','Ambiente íntimo perfecto para una cena especial. El depósito se devolvió al sentarnos, sin líos.'],
            ['Elena V.',4,'Hace 2 semanas','Muy buena experiencia. El arroz de bogavante para dos da de sobra. Algo de ruido cuando se llena.']] }),

    R({ id:'el-mirador', name:'El Mirador', cuisine:'Contemporáneo', cz:cz('fusion'), price:'€€€', area:'A Guía', city:'Vigo',
      rating:4.7, reviews:196, match:95, coords:{x:72,y:24}, lat:42.2449, lng:-8.7289, glyph:'sparkle',
      tags:['Vistas','Con terraza','Maridaje'],
      about:'Cocina contemporánea gallega con las mejores vistas a la ría desde el monte de A Guía. Menú degustación opcional con maridaje, terraza acristalada y puestas de sol que justifican la subida.',
      address:'Estrada da Guía 88, A Guía', hours:'13:30–16:00 · 20:00–23:00', phone:'+34 986 37 55 21',
      times:{ lunch:[['14:00','free'],['14:30','free'],['15:00','few']],
              dinner:[['20:00','free'],['20:30','free'],['21:00','few'],['21:30','free']] },
      menu:[
        {s:'Entrantes', items:[['Steak tartar de vaca madurada','yema curada, pan de cristal','19€'],['Vieira asada','coliflor y avellana','17€']]},
        {s:'Principales', items:[['Merluza de pincho','pil-pil de algas','27€'],['Pichón de Bresse','remolacha y cereza','32€']]},
        {s:'Menú degustación', items:[['7 pases','con la cocina de temporada','68€'],['Maridaje de vinos','5 copas','34€']]}
      ],
      revs:[['Marcos P.',5,'Hace 4 días','Las vistas al atardecer son una pasada y la cocina está a la altura. Maridaje muy bien pensado.'],
            ['Lucía F.',5,'Hace 10 días','De lo mejor de Vigo para celebrar algo. Reserva fácil y mesa junto al ventanal como pedí en las notas.']] }),

    R({ id:'verde', name:'Verde', cuisine:'De mercado', cz:cz('vegetal'), price:'€€', area:'Areal', city:'Vigo',
      rating:4.6, reviews:152, match:92, coords:{x:48,y:58}, lat:42.2324, lng:-8.7168, glyph:'leaf',
      tags:['Vegetariano','Tranquilo','Saludable'],
      about:'Cocina de mercado con mucha verdura de temporada y opciones vegetarianas y veganas reales, no de relleno. Local luminoso y tranquilo en el Areal, ideal para comidas de diario sin renunciar a comer bien.',
      address:'Rúa do Areal 44', hours:'13:00–16:30 · 20:30–23:00', phone:'+34 986 11 90 33',
      times:{ lunch:[['13:00','free'],['13:30','free'],['14:00','few'],['14:30','free']],
              dinner:[['20:30','free'],['21:00','free'],['21:30','few']] },
      menu:[
        {s:'Del huerto', items:[['Ensalada de tomate de temporada','burrata y albahaca','13€'],['Coliflor asada entera','tahini y granada','12€']]},
        {s:'Platos', items:[['Risotto de setas','parmesano curado','16€'],['Curry verde de garbanzos','arroz basmati','14€'],['Lubina al vapor','verduras salteadas','21€']]},
        {s:'Dulce', items:[['Tarta de zanahoria','—','6€'],['Helado artesano','de temporada','5€']]}
      ],
      revs:[['Nuria A.',5,'Hace 3 días','Por fin un sitio con opciones veganas que están realmente buenas. Tranquilo para comer y trabajar.'],
            ['Pablo R.',4,'Hace 1 semana','Comida fresca y de calidad. Relación calidad-precio muy buena para el menú de mediodía.']] }),

    R({ id:'o-pulpeiro', name:'O Pulpeiro', cuisine:'Gallego', cz:cz('pulpo'), price:'€€', area:'Berbés', city:'Vigo',
      rating:4.7, reviews:331, match:90, coords:{x:24,y:66}, lat:42.2360, lng:-8.7258, glyph:'pot',
      tags:['Clásico','Grupos','Pulpo á feira'],
      about:'Una pulpería de toda la vida en el Berbés, junto al puerto. Pulpo á feira cocido en cobre, raxo, zorza y vinos del Ribeiro en cunca. Mesas corridas, bullicio y raciones generosas para compartir.',
      address:'Rúa do Berbés 7', hours:'12:30–16:30 · 20:00–23:30', phone:'+34 986 43 21 76',
      times:{ lunch:[['13:00','few'],['13:30','full'],['14:00','few'],['14:30','free']],
              dinner:[['20:30','free'],['21:00','free'],['21:30','few'],['22:00','free']] },
      menu:[
        {s:'Para compartir', items:[['Pulpo á feira','ración','16€'],['Raxo con cachelos','—','11€'],['Zorza','—','9€'],['Pimientos de Padrón','—','7€']]},
        {s:'Cazuelas', items:[['Caldeirada de raya','—','15€'],['Almejas a la marinera','—','18€']]},
        {s:'Postre', items:[['Tarta de Santiago','—','5€'],['Queixo con membrillo','—','6€']]}
      ],
      revs:[['Antón G.',5,'Hace 5 días','El pulpo está en su punto siempre. Fuimos 8 y reservar mesa grande fue facilísimo por la app.'],
            ['Carmen L.',5,'Hace 2 semanas','Sabor de siempre, raciones enormes. El Ribeiro en cunca no falla.'],
            ['Dani T.',4,'Hace 3 semanas','Muy auténtico y animado. Si vas en finde, reserva sí o sí porque se llena.']] }),

    R({ id:'brasa-norte', name:'Brasa Norte', cuisine:'Asador', cz:cz('asador'), price:'€€€', area:'Travesía de Vigo', city:'Vigo',
      rating:4.8, reviews:218, match:88, coords:{x:60,y:48}, lat:42.2291, lng:-8.7154, glyph:'flame',
      tags:['Carne madurada','Grupos','Brasa'],
      about:'Asador de brasa de carbón de encina especializado en chuletón de vaca rubia gallega madurada. Cortes a la vista, guarniciones de huerta y una carta de tintos para acompañar. Mesas amplias para grupos.',
      address:'Travesía de Vigo 102', hours:'13:30–16:00 · 20:30–00:00', phone:'+34 986 27 64 19',
      times:{ lunch:[['14:00','free'],['14:30','few'],['15:00','free']],
              dinner:[['20:30','free'],['21:00','few'],['21:30','few'],['22:00','free']] },
      menu:[
        {s:'Entrantes', items:[['Cecina de vaca','con aceite de oliva','14€'],['Provolone a la brasa','orégano y tomate','10€']]},
        {s:'A la brasa', items:[['Chuletón de vaca rubia (1kg)','maduración 45 días','56€'],['Entrecot','guarnición','24€'],['Secreto ibérico','pimientos asados','19€']]},
        {s:'Postres', items:[['Torrija caramelizada','helado de vainilla','7€']]}
      ],
      revs:[['Iván M.',5,'Hace 1 día','El chuletón madurado es brutal. Punto de brasa perfecto. Ideal para ir en grupo.'],
            ['Rosa B.',5,'Hace 6 días','Carne de primera y servicio atento. Reservamos para 10 sin problema.']] }),

    R({ id:'sakura', name:'Sakura', cuisine:'Japonés', cz:cz('japones'), price:'€€€', area:'Plaza de Compostela', city:'Vigo',
      rating:4.6, reviews:174, match:86, coords:{x:42,y:38}, lat:42.2382, lng:-8.7208, glyph:'fish',
      tags:['Sushi','Barra','Omakase'],
      about:'Cocina japonesa con producto gallego: nigiri de pescado de la ría, omakase en barra y robata. Espacio minimalista de madera clara junto a la Plaza de Compostela. Barra para ver al itamae trabajar.',
      address:'Rúa de Reconquista 5', hours:'13:30–16:00 · 20:30–23:30', phone:'+34 986 90 12 47',
      times:{ lunch:[['14:00','few'],['14:30','free'],['15:00','free']],
              dinner:[['20:30','free'],['21:00','full'],['21:30','few'],['22:00','free']] },
      menu:[
        {s:'Entrantes', items:[['Edamame con sal de algas','—','5€'],['Gyozas de cerdo','—','9€'],['Tartar de atún','aguacate y soja','15€']]},
        {s:'Sushi', items:[['Nigiri selección (8 pz)','del día','24€'],['Uramaki Sakura','langostino y mango','14€']]},
        {s:'Omakase', items:[['Menú del itamae','12 pases en barra','62€']]}
      ],
      revs:[['Tomás V.',5,'Hace 4 días','El omakase en barra es una experiencia. Pescado fresquísimo de la ría. Reserva la barra con tiempo.'],
            ['Ana D.',4,'Hace 2 semanas','Muy buen sushi y ambiente cuidado. Un pelín caro pero merece la pena.']] }),

    R({ id:'a-taberna', name:'A Taberna do Bo', cuisine:'Tapas', cz:cz('tapas'), price:'€€', area:'Casco Vello', city:'Vigo',
      rating:4.5, reviews:267, match:84, coords:{x:34,y:50}, lat:42.2368, lng:-8.7235, glyph:'wine',
      tags:['Tapas','Animado','Vinos'],
      about:'Tapas gallegas con un punto moderno y una carta de vinos naturales en constante rotación. Barra de pinchos, mesas altas y mucho ambiente las tardes de finde en el corazón del Casco Vello.',
      address:'Rúa Cesteiros 3, Casco Vello', hours:'12:00–16:00 · 19:30–00:00', phone:'+34 986 55 38 90',
      times:{ lunch:[['13:00','free'],['13:30','few'],['14:00','free']],
              dinner:[['20:00','free'],['20:30','free'],['21:00','few'],['21:30','full']] },
      menu:[
        {s:'Pinchos', items:[['Tortilla de Betanzos','poco hecha','3€'],['Pincho de bonito','con pimiento','3,5€'],['Croqueta del día','—','2€']]},
        {s:'Tapas', items:[['Pulpo en tempura','alioli de pimentón','12€'],['Croquetas de jamón','6 uds','8€'],['Mejillones tigre','—','9€']]},
        {s:'Dulce', items:[['Mousse de chocolate','—','5€']]}
      ],
      revs:[['Berta C.',5,'Hace 2 días','Para ir de vinos y tapas es perfecto. La tortilla de Betanzos, de las mejores que he probado.'],
            ['Hugo N.',4,'Hace 9 días','Muy animado y buen rollo. Los vinos naturales que recomiendan, un acierto.']] }),

    R({ id:'arrozal', name:'Arrozal', cuisine:'Arroces', cz:cz('arroz'), price:'€€€', area:'Bouzas', city:'Vigo',
      rating:4.7, reviews:143, match:82, coords:{x:16,y:52}, lat:42.2273, lng:-8.7439, glyph:'pot',
      tags:['Arroces','Con terraza','Frente al mar'],
      about:'Arrocería frente al puerto de Bouzas con arroces de leña y producto de la ría. Terraza con vistas a los barcos y arroces para dos y cuatro que hay que pedir al reservar. Especialidad en arroz con bogavante.',
      address:'Rúa Eduardo Cabello 30, Bouzas', hours:'13:00–16:30', phone:'+34 986 24 71 55',
      times:{ lunch:[['13:30','free'],['14:00','few'],['14:30','free'],['15:00','free']],
              dinner:[['20:30','free'],['21:00','free']] },
      menu:[
        {s:'Para abrir boca', items:[['Navajas a la plancha','—','14€'],['Ensaladilla de la casa','con ventresca','9€']]},
        {s:'Arroces (mín. 2)', items:[['Arroz con bogavante','por persona','24€'],['Arroz de marisco','por persona','21€'],['Arroz negro con chipirones','por persona','19€']]},
        {s:'Postre', items:[['Leche frita','—','6€']]}
      ],
      revs:[['Sonia R.',5,'Hace 1 semana','El arroz de bogavante espectacular y con vistas al mar. Avisar al reservar que tarda 40 min, merece la espera.'],
            ['Luis A.',4,'Hace 3 semanas','Muy buen producto. La terraza es una gozada en días de sol.']] }),

    R({ id:'panadeira', name:'A Panadeira', cuisine:'Brunch & Café', cz:cz('cafe'), price:'€€', area:'Areal', city:'Vigo',
      rating:4.6, reviews:209, match:80, coords:{x:52,y:44}, lat:42.2329, lng:-8.7172, glyph:'coffee',
      tags:['Brunch','Café de especialidad','Desayunos'],
      about:'Café de especialidad y brunch todo el día en un antiguo obrador. Bollería propia, tostas de masa madre, huevos benedictinos y matcha. Mesas junto al ventanal y wifi para quedarse.',
      address:'Rúa Luís Taboada 18', hours:'09:00–14:00 · brunch finde 09:00–16:00', phone:'+34 986 33 87 02',
      times:{ lunch:[['10:00','free'],['10:30','few'],['11:00','free'],['11:30','few'],['12:00','free']],
              dinner:[] },
      menu:[
        {s:'Brunch', items:[['Huevos benedictinos','con salmón','12€'],['Tosta de aguacate','huevo poché','10€'],['Pancakes','frutos rojos y sirope','9€']]},
        {s:'Café', items:[['Flat white','—','2,8€'],['Matcha latte','—','3,5€'],['Filtrado V60','origen del mes','3€']]},
        {s:'Dulce', items:[['Croissant de almendra','—','3€'],['Roll de canela','—','3,5€']]}
      ],
      revs:[['Marta L.',5,'Hace 3 días','El mejor brunch de Vigo. El finde se llena, así que reservar por la app es un salvavidas.'],
            ['Jorge P.',4,'Hace 1 semana','Café de especialidad de verdad y bollería buenísima. Sitio acogedor.']] }),

    R({ id:'fumeiro', name:'Fumeiro Moderno', cuisine:'Fusión', cz:cz('bistro'), price:'€€€', area:'Centro', city:'Vigo',
      rating:4.5, reviews:118, match:78, coords:{x:46,y:30}, lat:42.2351, lng:-8.7198, glyph:'sparkle',
      tags:['Fusión','Cócteles','Cena tardía'],
      about:'Bistró de fusión gallego-asiática con coctelería de autor. Platos para compartir que cruzan la brasa gallega con el wok, y una barra de cócteles que aguanta hasta tarde. Luz tenue y música a buen volumen.',
      address:'Rúa do Príncipe 41, Centro', hours:'20:00–01:00', phone:'+34 986 19 55 60',
      times:{ lunch:[],
              dinner:[['20:00','free'],['20:30','few'],['21:00','free'],['21:30','few'],['22:00','free'],['22:30','free']] },
      menu:[
        {s:'Para compartir', items:[['Bao de panceta a la brasa','hoisin gallego','7€'],['Tartar de vieira','leche de tigre','15€'],['Gyoza de raxo','—','10€']]},
        {s:'Platos', items:[['Pulpo al wok','pak choi','18€'],['Costilla glaseada','48h a baja temperatura','19€']]},
        {s:'Cócteles', items:[['Albariño spritz','—','9€'],['Negroni de loureiro','—','10€']]}
      ],
      revs:[['Elsa M.',5,'Hace 6 días','Conceptazo. Los baos a la brasa y los cócteles, top. Para cenar tarde es ideal.'],
            ['Nico R.',4,'Hace 2 semanas','Original y rico. Algo alto de precio pero la experiencia lo vale.']] })
  ];

  const CATEGORIES = [
    {key:'marisco', name:'Marisco', glyph:'fish'},
    {key:'asador', name:'Asador', glyph:'flame'},
    {key:'arroz', name:'Arroces', glyph:'pot'},
    {key:'japones', name:'Japonés', glyph:'fish'},
    {key:'vegetal', name:'Saludable', glyph:'leaf'},
    {key:'cafe', name:'Brunch', glyph:'coffee'}
  ];

  const KW = {
    'casa-lua':['Marisco','Mariscada','Pescado','Mediterráneo','Romántico'],
    'el-mirador':['Marisco','Pescado','Vistas','Contemporáneo','Romántico'],
    'verde':['Vegetariano','Vegano','Saludable','Mercado','Ensaladas'],
    'o-pulpeiro':['Marisco','Pulpo','Gallego','Grupos','Ribeiro'],
    'brasa-norte':['Carne','Asador','Brasa','Chuletón','Grupos'],
    'sakura':['Japonés','Sushi','Marisco','Pescado','Nigiri'],
    'a-taberna':['Tapas','Vinos','Marisco','Pinchos','Animado'],
    'arrozal':['Arroces','Marisco','Paella','Bogavante','Vistas'],
    'panadeira':['Brunch','Café','Desayuno','Saludable','Dulce'],
    'fumeiro':['Fusión','Cócteles','Asiático','Brasa','Cena tardía']
  };
  data.forEach(r=>{ r.kw = KW[r.id] || []; });

  // area centroids (for manual-address fallback) + distance helper
  const AREAS = {};
  data.forEach(r=>{ if(!AREAS[r.area]) AREAS[r.area]=r.coords; });
  function distKm(coords, ref){
    const dx=coords.x-ref.x, dy=coords.y-ref.y;
    return Math.round(Math.sqrt(dx*dx+dy*dy)*0.09*10)/10; // ~0–6 km
  }
  // resolve a typed address to a reference point (matches a known área, else Vigo centre)
  function geocode(text){
    if(!text) return {x:50,y:50};
    const t=text.toLowerCase();
    for(const a in AREAS){ if(t.includes(a.toLowerCase())) return AREAS[a]; }
    return {x:50,y:50};
  }

  window.UM_DATA = data;
  window.UM_CATEGORIES = CATEGORIES;
  window.UM_AREAS = AREAS;
  window.UM_DIST = distKm;
  window.UM_GEOCODE = geocode;
  window.UM_CURRENCY_SYMBOL = function(code){
    const symbols = { eur:'€', gbp:'£', usd:'$' };
    return symbols[(code||'eur').toLowerCase()] || '€';
  };

  /* ══════════════════════════════════════════════
     Supabase loader — maps venues rows → SPA shape
     Falls back to mock data if fetch fails
  ══════════════════════════════════════════════ */
  const SUPA_URL = 'https://rkaytcmyaaighozxatod.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYXl0Y215YWFpZ2hvenhhdG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDU2NDIsImV4cCI6MjA5NjQyMTY0Mn0.8zgAxW2q6JU_PySTQHBfBUHpxlDnz9UVLr6jm981x3s';

  function glyphFromCuisine(c) {
    c = (c||'').toLowerCase();
    if (/marisco|pescado|sushi|jap/.test(c)) return 'fish';
    if (/carne|asador|brasa|grill/.test(c))  return 'flame';
    if (/vegetar|vegano|mercado/.test(c))     return 'leaf';
    if (/caf|brunch|coffee/.test(c))          return 'coffee';
    if (/vino|tapas|pincho/.test(c))          return 'wine';
    if (/arroz|paella/.test(c))               return 'pot';
    return 'sparkle';
  }

  function czFromCuisine(c) {
    c = (c||'').toLowerCase();
    if (/marisco|mediterr|pescado/.test(c)) return cz('marisco');
    if (/asador|carne/.test(c))             return cz('asador');
    if (/gallego|pulpo/.test(c))            return cz('pulpo');
    if (/arroz|paella/.test(c))             return cz('arroz');
    if (/tapas|bar|pincho/.test(c))         return cz('tapas');
    if (/fusion|asian|contemp/.test(c))     return cz('fusion');
    if (/vegetar|vegano|mercado/.test(c))   return cz('vegetal');
    if (/japon|sushi/.test(c))              return cz('japones');
    if (/caf|brunch|coffee/.test(c))        return cz('cafe');
    return cz('bistro');
  }

  /* Build [[time, status], ...] slots every 30 min between from and to ('HH:MM') */
  function generateSlots(from, to) {
    const slots = [];
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    let h = fh, m = fm;
    while (h * 60 + m < th * 60 + tm) {
      slots.push([String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0'), '']);
      m += 30;
      if (m >= 60) { h++; m -= 60; }
    }
    return slots;
  }

  /* Parse opening_hours string like "13:00-16:00, 20:00-23:00" → { lunch, dinner } */
  function parseOpeningHours(str) {
    if (!str || typeof str !== 'string') return null;
    const re = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;
    const lunch = [], dinner = [];
    let m;
    while ((m = re.exec(str)) !== null) {
      const fromHour = parseInt(m[1], 10);
      const slots = generateSlots(m[1], m[2]);
      (fromHour < 17 ? lunch : dinner).push(...slots);
    }
    return (lunch.length || dinner.length) ? { lunch, dinner } : null;
  }

  function defaultTimes() {
    return {
      lunch:  generateSlots('13:00', '16:00'),
      dinner: generateSlots('20:00', '23:00'),
    };
  }

  function mapVenue(v) {
    const cuisine = v.cuisine || v.cuisine_type || '';
    return {
      id:      String(v.id || v.slug || Math.random().toString(36).slice(2)),
      name:    v.name || 'Restaurante',
      cuisine,
      price:   v.price || v.price_range || '€€',
      area:    v.neighborhood || v.area || v.district || '',
      city:    v.city || '',
      rating:  parseFloat(v.rating || v.avg_rating || 4.0),
      reviews: parseInt(v.review_count || v.reviews || 0, 10),
      match:   parseInt(v.match || v.match_score || 80, 10),
      coords:  v.coords || { x: 50, y: 50 },
      glyph:   v.glyph || v.icon || glyphFromCuisine(cuisine),
      cz:      v.cz || (v.color_key ? cz(v.color_key) : czFromCuisine(cuisine)),
      tags:    v.tags || [],
      about:   v.about || v.description || '',
      address: v.address || '',
      hours:   v.hours || v.opening_hours || '',
      phone:   v.phone || '',
      times:   v.times || parseOpeningHours(v.opening_hours || v.hours) || defaultTimes(),
      menu:    v.menu || [],
      revs:    v.revs || v.reviews_list || [],
      kw:      v.kw || v.keywords || [],
      deposit_amount: parseInt(v.deposit_amount, 10) || 1000,           // céntimos, tal cual Supabase (1000 = 10€)
      deposit:        (parseInt(v.deposit_amount, 10) || 1000) / 100,   // euros, solo para mostrar
      currency:       (v.currency || 'eur').toLowerCase(),              // moneda real del restaurante, no del mercado del comensal
      stripeConnectAccountId: v.stripe_connect_account_id || null,      // necesario para inicializar Stripe.js con la cuenta correcta (direct charge)
      stripeChargesEnabled:   !!v.stripe_charges_enabled,
      menuVideoAccess:        !!v.menu_video_access,
      stripeMode: v.stripe_mode || 'live',
      photo_url: v.photo_url || v.image_url || v.photo || null,
      photo_urls: Array.isArray(v.photo_urls) ? v.photo_urls : [],
    };
  }

  async function loadRestaurants() {
    if (!window.supabase) return null;
    try {
      /* Ciudad objetivo según mercado — 'Madrid' es donde están los restaurantes reales
         actuales; cuando se onboarde el primer restaurante de Londres, debe llevar
         city='London' en `venues` para que esta consulta lo encuentre. */
      let targetCity = 'Madrid';
      try {
        const q = new URLSearchParams(window.location.search).get('market');
        if (q === 'uk' || q === 'en' || window.location.hostname.endsWith('.co.uk')) targetCity = 'London';
      } catch (_) {}

      // Reutiliza el cliente único de auth.js (window.UMAuth.sb) en vez de crear uno nuevo —
      // dos instancias de GoTrueClient en la misma pestaña compiten por la misma sesión
      // y pueden dejarla en un estado inconsistente (Supabase lo advierte explícitamente
      // como "undefined behavior"). Fallback a un cliente nuevo solo si por algún motivo
      // auth.js no llegó a inicializarse todavía.
      const sb = (window.UMAuth && window.UMAuth.sb) || window.supabase.createClient(SUPA_URL, SUPA_KEY);
      // Ya no filtramos por stripe_charges_enabled aquí — se decidió mostrar
      // todos los restaurantes, incluso sin Stripe completado, para que
      // sirvan como muestra a restaurantes potenciales ("mira, aparecerías
      // aquí"). La reserva en sí se bloquea aparte (ver stripeChargesEnabled
      // en detail.jsx/booking.jsx), no el listado.
      const { data: rows, error } = await sb.from('venues').select('*').eq('city', targetCity).eq('archived', false);
      if (error) throw error;
      // Antes, "sin filas" y "la consulta falló" devolvían lo mismo (null),
      // y el llamador no podía distinguir un fallo técnico real de que
      // simplemente no hay restaurantes todavía en esta ciudad — mostraba
      // el catálogo ficticio en los dos casos por igual, sin ningún aviso.
      // Ahora: sin filas mapea a un array vacío de verdad (nunca null),
      // para que el llamador sepa que la consulta SÍ funcionó y muestre un
      // estado honesto de "aún no hay restaurantes aquí", no datos falsos.
      return (rows || []).map(mapVenue);
    } catch (e) {
      console.warn('[UNA MESA] loadRestaurants:', e.message || e);
      return null;
    }
  }

  window.loadRestaurants = loadRestaurants;
})();
