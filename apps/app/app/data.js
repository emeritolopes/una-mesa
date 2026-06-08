/* ─────────────────────────────────────────────────────────────
   Una Mesa — mock seed data (mirrors Supabase seed: El Bodegón Central)
   Plain JS global: window.DATA
   ───────────────────────────────────────────────────────────── */
(function () {
  const pad = (n) => String(n).padStart(2, '0');
  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

  const venue = {
    id: 'v1', name: 'El Bodegón Central', address: 'Calle Mayor 12',
    city: 'Madrid', cp: '28013', phone: '+34 91 123 4567',
    email: 'hola@bodegoncentral.es', vat_number: 'B12345678',
    plan: 'profesional', currency: 'EUR', locale: 'es-ES', timezone: 'Europe/Madrid',
  };

  const tables = [
    { id: 'ft1',  label: '24"×24"',   section: 'sala',    capacity: 2,  status: 'free'     },
    { id: 'ft2',  label: '24"×30"',   section: 'sala',    capacity: 2,  status: 'occupied' },
    { id: 'ft3',  label: '30"×72"',   section: 'sala',    capacity: 6,  status: 'occupied' },
    { id: 'ft4',  label: '72" Round', section: 'redonda', capacity: 10, status: 'reserved' },
    { id: 'ft5',  label: '30"×30"',   section: 'sala',    capacity: 4,  status: 'free'     },
    { id: 'ft6',  label: '36"×36"',   section: 'sala',    capacity: 4,  status: 'occupied' },
    { id: 'ft7',  label: '30"×60"',   section: 'sala',    capacity: 6,  status: 'free'     },
    { id: 'ft8',  label: '30"×48"',   section: 'sala',    capacity: 4,  status: 'occupied' },
    { id: 'ft9',  label: '24"×42"',   section: 'sala',    capacity: 4,  status: 'free'     },
    { id: 'ft10', label: '60" Round', section: 'redonda', capacity: 8,  status: 'free'     },
    { id: 'ft11', label: '48" Round', section: 'redonda', capacity: 6,  status: 'free'     },
    { id: 'ft12', label: '42" Round', section: 'redonda', capacity: 5,  status: 'free'     },
    { id: 'ft13', label: '24" Round', section: 'redonda', capacity: 2,  status: 'free'     },
    { id: 'ft14', label: '30" Round', section: 'redonda', capacity: 3,  status: 'free'     },
    { id: 'ft15', label: '36" Round', section: 'redonda', capacity: 4,  status: 'free'     },
  ];

  const categories = [
    { id: 'c1', name: 'Entrantes', sort_order: 1 },
    { id: 'c2', name: 'Principales', sort_order: 2 },
    { id: 'c3', name: 'Postres', sort_order: 3 },
    { id: 'c4', name: 'Bebidas', sort_order: 4 },
  ];

  const menu = [
    { id: 'm1',  category_id: 'c1', name: 'Croquetas caseras',    description: 'Jamón ibérico, bechamel suave',           price: 9.50,  vat_rate: 10, tag: 'popular', available: true,  sold: 41 },
    { id: 'm2',  category_id: 'c1', name: 'Gambas al ajillo',      description: 'Con guindilla y pan de hogaza',             price: 13.80, vat_rate: 10, tag: 'popular', available: true,  sold: 33 },
    { id: 'm3',  category_id: 'c1', name: 'Ensalada mixta',        description: 'Tomate, lechuga, aceitunas',                price: 7.20,  vat_rate: 10, tag: 'vegano',  available: true,  sold: 18 },
    { id: 'm4',  category_id: 'c1', name: 'Pimientos de Padrón',   description: 'Fritos, sal gruesa',                        price: 8.00,  vat_rate: 10, tag: 'vegano',  available: true,  sold: 22 },
    { id: 'm5',  category_id: 'c1', name: 'Jamón ibérico D.O.',    description: 'Corte a cuchillo, 80g',                     price: 18.50, vat_rate: 10, tag: null,      available: true,  sold: 27 },
    { id: 'm6',  category_id: 'c1', name: 'Patatas bravas',        description: 'Salsa brava y alioli casero',               price: 7.80,  vat_rate: 10, tag: 'popular', available: true,  sold: 38 },
    { id: 'm7',  category_id: 'c2', name: 'Cocido madrileño',      description: 'Garbanzos, morcillo, chorizo',              price: 17.50, vat_rate: 10, tag: 'popular', available: true,  sold: 29 },
    { id: 'm8',  category_id: 'c2', name: 'Paella valenciana',     description: 'Pollo, conejo, judías',                     price: 16.80, vat_rate: 10, tag: null,      available: true,  sold: 24 },
    { id: 'm9',  category_id: 'c2', name: 'Chuletón de buey',      description: '700g, con patatas y pimientos',             price: 42.00, vat_rate: 10, tag: 'nuevo',   available: true,  sold: 12 },
    { id: 'm10', category_id: 'c2', name: 'Bacalao al pil-pil',    description: 'Salsa tradicional vasca',                   price: 21.50, vat_rate: 10, tag: null,      available: false, sold: 9  },
    { id: 'm11', category_id: 'c2', name: 'Pollo asado',           description: 'Medio pollo, limón, tomillo',               price: 14.90, vat_rate: 10, tag: null,      available: true,  sold: 21 },
    { id: 'm12', category_id: 'c2', name: 'Rabo de toro',          description: 'Estofado, 8 horas de cocción',              price: 19.50, vat_rate: 10, tag: 'popular', available: true,  sold: 26 },
    { id: 'm13', category_id: 'c3', name: 'Tarta de queso',        description: 'Estilo Basque, coulis de fresa',            price: 6.50,  vat_rate: 10, tag: 'popular', available: true,  sold: 44 },
    { id: 'm14', category_id: 'c3', name: 'Crema catalana',        description: 'Azúcar quemado al momento',                 price: 5.80,  vat_rate: 10, tag: null,      available: true,  sold: 19 },
    { id: 'm15', category_id: 'c3', name: 'Torrijas caseras',      description: 'Con miel y canela',                         price: 6.00,  vat_rate: 10, tag: 'nuevo',   available: true,  sold: 15 },
    // Bebidas — grouped by subcategory
    { id: 'm16', category_id: 'c4', subcategory: 'agua',       name: 'Agua mineral',          description: '50cl, con o sin gas',                 price: 2.20,  vat_rate: 10, tag: null,      available: true,  sold: 62 },
    { id: 'mb1', category_id: 'c4', subcategory: 'agua',       name: 'Zumo de naranja natural', description: 'Exprimido al momento',               price: 3.50,  vat_rate: 10, tag: 'nuevo',   available: true,  sold: 24 },
    { id: 'mb2', category_id: 'c4', subcategory: 'refrescos',  name: 'Coca-Cola',             description: 'Lata 33cl',                           price: 2.80,  vat_rate: 10, tag: null,      available: true,  sold: 41 },
    { id: 'mb3', category_id: 'c4', subcategory: 'refrescos',  name: 'Fanta Naranja',         description: 'Lata 33cl',                           price: 2.80,  vat_rate: 10, tag: null,      available: true,  sold: 19 },
    { id: 'mb4', category_id: 'c4', subcategory: 'refrescos',  name: 'Schweppes Limón',       description: 'Lata 33cl',                           price: 2.80,  vat_rate: 10, tag: null,      available: true,  sold: 14 },
    { id: 'm17', category_id: 'c4', subcategory: 'cervezas',   name: 'Cerveza Mahou',         description: 'Caña 25cl o botella 33cl',            price: 2.50,  vat_rate: 21, tag: 'popular', available: true,  sold: 88 },
    { id: 'mb5', category_id: 'c4', subcategory: 'cervezas',   name: 'Estrella Damm',         description: 'Botella 33cl',                        price: 2.80,  vat_rate: 21, tag: null,      available: true,  sold: 31 },
    { id: 'mb6', category_id: 'c4', subcategory: 'cervezas',   name: 'Cerveza sin alcohol',   description: 'Mahou 0,0 botella 33cl',              price: 2.50,  vat_rate: 10, tag: null,      available: true,  sold: 18 },
    { id: 'm18', category_id: 'c4', subcategory: 'vinos',      name: 'Vino Rioja Crianza',    description: 'Copa 15cl, Marqués de Riscal',        price: 4.50,  vat_rate: 21, tag: 'popular', available: true,  sold: 57 },
    { id: 'mb7', category_id: 'c4', subcategory: 'vinos',      name: 'Albariño Martín Códax', description: 'Copa 15cl, Rías Baixas',              price: 4.80,  vat_rate: 21, tag: null,      available: true,  sold: 29 },
    { id: 'mb8', category_id: 'c4', subcategory: 'vinos',      name: 'Cava Freixenet',        description: 'Copa 12cl, brut nature',              price: 5.00,  vat_rate: 21, tag: 'nuevo',   available: true,  sold: 22 },
    { id: 'mb9', category_id: 'c4', subcategory: 'cocteleria', name: 'Gin-tonic Hendrick\'s', description: 'Con pepino y tónica Fever-Tree',      price: 9.50,  vat_rate: 21, tag: null,      available: true,  sold: 17 },
    { id: 'mba', category_id: 'c4', subcategory: 'cocteleria', name: 'Mojito',                description: 'Ron Havana, menta, lima',             price: 8.50,  vat_rate: 21, tag: 'popular', available: true,  sold: 23 },
    { id: 'mbb', category_id: 'c4', subcategory: 'cocteleria', name: 'Aperol Spritz',         description: 'Aperol, cava, naranja',               price: 8.00,  vat_rate: 21, tag: null,      available: true,  sold: 15 },
    { id: 'm19', category_id: 'c4', subcategory: 'calientes',  name: 'Café solo',             description: 'Granos de tueste natural',            price: 1.80,  vat_rate: 10, tag: null,      available: true,  sold: 73 },
    { id: 'mbc', category_id: 'c4', subcategory: 'calientes',  name: 'Café con leche',        description: 'Leche fresca, espresso doble',        price: 2.20,  vat_rate: 10, tag: null,      available: true,  sold: 48 },
    { id: 'mbd', category_id: 'c4', subcategory: 'calientes',  name: 'Té e infusiones',       description: 'Variedad de tés y tisanas',           price: 2.50,  vat_rate: 10, tag: null,      available: true,  sold: 21 },
  ];

  // EU allergen catalog (icon = Tabler glyph that renders; code = 2-letter fallback chip)
  const ALLERGENS = [
    { key: 'gluten',         label: 'Gluten',            icon: 'ti-bread',       code: 'GL', color: '#C8881F' },
    { key: 'crustaceos',     label: 'Crustáceos',        icon: null,             code: 'CR', color: '#E0613B' },
    { key: 'huevo',          label: 'Huevo',             icon: 'ti-egg',         code: 'HU', color: '#E3A008' },
    { key: 'pescado',        label: 'Pescado',           icon: 'ti-fish',        code: 'PE', color: '#2B7FC4' },
    { key: 'cacahuetes',     label: 'Cacahuetes',        icon: null,             code: 'CA', color: '#B5651D' },
    { key: 'soja',           label: 'Soja',              icon: 'ti-plant-2',     code: 'SO', color: '#4E944F' },
    { key: 'lacteos',        label: 'Lácteos',           icon: 'ti-milk',        code: 'LA', color: '#5B8DD9' },
    { key: 'frutos_cascara', label: 'Frutos de cáscara', icon: 'ti-nut',         code: 'FC', color: '#8B5E34' },
    { key: 'apio',           label: 'Apio',              icon: 'ti-leaf',        code: 'AP', color: '#6FAE4A' },
    { key: 'mostaza',        label: 'Mostaza',           icon: 'ti-droplet',     code: 'MO', color: '#D6A50A' },
    { key: 'sesamo',         label: 'Sésamo',            icon: 'ti-grain',       code: 'SE', color: '#B89150' },
    { key: 'sulfitos',       label: 'Sulfitos',          icon: 'ti-bottle',      code: 'SU', color: '#8156A8' },
    { key: 'altramuces',     label: 'Altramuces',        icon: null,             code: 'AL', color: '#C99A1E' },
    { key: 'moluscos',       label: 'Moluscos',          icon: null,             code: 'ML', color: '#4F8E86' },
  ];

  // seed allergens onto the menu (kept separate so the literals above stay readable)
  const ALLERGEN_SEED = {
    m1: ['gluten', 'lacteos'], m2: ['crustaceos'], m3: [], m4: [], m5: [],
    m6: ['huevo'], m7: ['apio'], m8: [], m9: [], m10: ['pescado'], m11: [],
    m12: ['gluten', 'sulfitos'], m13: ['gluten', 'lacteos', 'huevo'],
    m14: ['lacteos', 'huevo'], m15: ['gluten', 'lacteos', 'huevo'], m16: [],
    m17: ['gluten'], m18: ['sulfitos'], m19: [],
  };
  menu.forEach(it => { it.allergens = ALLERGEN_SEED[it.id] || []; });

  const staff = [
    { id: 's1', name: 'Miguel García', role: 'Jefe de cocina', pin: '1234', initials: 'MG', color: '#D8552E', color_bg: '#F6E3DB', email: 'miguel@bodegoncentral.es', access: 'Administrador' },
    { id: 's2', name: 'Laura Romero', role: 'Camarera', pin: '2345', initials: 'LR', color: '#7C3AED', color_bg: '#EDE9FE', email: 'laura@bodegoncentral.es', access: 'Camarero' },
    { id: 's3', name: 'Diego Blanco', role: 'Cocinero', pin: '3456', initials: 'DB', color: '#0369A1', color_bg: '#DBEAFE', email: 'diego@bodegoncentral.es', access: 'Cocina' },
    { id: 's4', name: 'Sofía Ruiz', role: 'Ayudante cocina', pin: '4567', initials: 'SR', color: '#B45309', color_bg: '#FEF3C7', email: 'sofia@bodegoncentral.es', access: 'Cocina' },
    { id: 's5', name: 'Andrés Pérez', role: 'Barman', pin: '5678', initials: 'AP', color: '#D8552E', color_bg: '#F6E3DB', email: 'andres@bodegoncentral.es', access: 'Camarero' },
    { id: 's6', name: 'José Morales', role: 'Maître', pin: '6789', initials: 'JM', color: '#7C3AED', color_bg: '#EDE9FE', email: 'jose@bodegoncentral.es', access: 'Encargado' },
    { id: 's7', name: 'Paula Navarro', role: 'Camarera', pin: '7890', initials: 'PN', color: '#B45309', color_bg: '#FEF3C7', email: 'paula@bodegoncentral.es', access: 'Camarero' },
    { id: 's8', name: 'Ricardo López', role: 'Cocinero', pin: '8901', initials: 'RL', color: '#0369A1', color_bg: '#DBEAFE', email: 'ricardo@bodegoncentral.es', access: 'Cocina' },
  ];

  const admin = { name: 'Carlos Méndez', role: 'Administrador', initials: 'CM', email: 'carlos@bodegoncentral.es' };

  const dailySales = [
    { date: iso(addDays(-6)), total_revenue: 1820.00, total_orders: 48, avg_ticket: 37.92, covers: 52, table_turns: 1.8 },
    { date: iso(addDays(-5)), total_revenue: 2480.00, total_orders: 64, avg_ticket: 38.75, covers: 68, table_turns: 2.2 },
    { date: iso(addDays(-4)), total_revenue: 1560.00, total_orders: 41, avg_ticket: 38.05, covers: 44, table_turns: 1.5 },
    { date: iso(addDays(-3)), total_revenue: 3100.00, total_orders: 80, avg_ticket: 38.75, covers: 86, table_turns: 2.8 },
    { date: iso(addDays(-2)), total_revenue: 2200.00, total_orders: 57, avg_ticket: 38.60, covers: 61, table_turns: 2.1 },
    { date: iso(addDays(-1)), total_revenue: 3600.00, total_orders: 92, avg_ticket: 39.13, covers: 98, table_turns: 3.2 },
    { date: iso(addDays(0)),  total_revenue: 2840.00, total_orders: 74, avg_ticket: 38.38, covers: 79, table_turns: 2.4 },
  ];

  // reservations — seeded relative to today
  const reservations = [
    { id:'r1',  customer_name:'Familia Serrano',    customer_phone:'+34 612 334 556', pax:6,  time:'13:30:00', status:'confirmed',   table:'30"×72"',   notes:'Sin gluten para niña pequeña', allergy_alert:'Glúten' },
    { id:'r2',  customer_name:'Ana Belén García',   customer_phone:'+34 655 221 003', pax:2,  time:'14:00:00', status:'confirmed',   table:'24"×30"',   notes:'', allergy_alert:'' },
    { id:'r3',  customer_name:'Grupo Iberdrola',    customer_phone:'+34 91 555 0199', pax:10, time:'14:00:00', status:'unconfirmed', table:'72" Round', notes:'Comida de empresa, factura', allergy_alert:'' },
    { id:'r4',  customer_name:'Javier Domínguez',  customer_phone:'+34 600 778 221', pax:4,  time:'14:30:00', status:'confirmed',   table:'36"×36"',   notes:'', allergy_alert:'' },
    { id:'r4b', customer_name:'Carlos Fuentes',     customer_phone:'+34 677 221 004', pax:2,  time:'16:30:00', status:'confirmed',   table:'24"×30"',   notes:'', allergy_alert:'' },
    { id:'r4c', customer_name:'Grupo Repsol',       customer_phone:'+34 91 777 0100', pax:5,  time:'17:00:00', status:'confirmed',   table:'30"×60"',   notes:'Reunión de trabajo', allergy_alert:'' },
    { id:'r5',  customer_name:'Montserrat Boix',    customer_phone:'+34 934 667 001', pax:2,  time:'20:00:00', status:'confirmed',   table:'24"×24"',   notes:'', allergy_alert:'' },
    { id:'r6',  customer_name:'Club Rotario Madrid',customer_phone:'+34 91 442 5500', pax:8,  time:'15:00:00', status:'confirmed',   table:'60" Round', notes:'Reserva anual del club', allergy_alert:'' },
    { id:'r7',  customer_name:'Familia López',      customer_phone:'+34 666 119 221', pax:4,  time:'20:30:00', status:'unconfirmed', table:'30"×48"',   notes:'', allergy_alert:'' },
    { id:'r8',  customer_name:'Pedro Ramírez',      customer_phone:'+34 644 119 003', pax:2,  time:'21:00:00', status:'unconfirmed', table:'24"×42"',   notes:'', allergy_alert:'Celíaco' },
    { id:'r9',  customer_name:'Cumpleaños Miriam',  customer_phone:'+34 611 998 007', pax:5,  time:'21:00:00', status:'confirmed',   table:'48" Round', notes:'Tarta sorpresa', allergy_alert:'' },
    { id:'r10', customer_name:'Reunión Accenture',  customer_phone:'+34 91 882 0041', pax:6,  time:'21:30:00', status:'confirmed',   table:'30"×72"',   notes:'', allergy_alert:'' },
    { id:'r11', customer_name:'Pareja Aniversario', customer_phone:'+34 655 003 771', pax:2,  time:'21:30:00', status:'confirmed',   table:'24"×24"',   notes:'Velas y flores', allergy_alert:'' },
    { id:'r12', customer_name:'Cena Empresa TVC',   customer_phone:'+34 93 555 1100', pax:8,  time:'22:00:00', status:'confirmed',   table:'72" Round', notes:'', allergy_alert:'' },
  ];
  reservations.forEach(r => { r.date = iso(today); });
  const extra = [
    { id:'r13', customer_name:'Nuria Castro',        customer_phone:'+34 655 882 014', pax:2,  time:'21:00:00', status:'unconfirmed', table:'',           notes:'', allergy_alert:'', date:iso(addDays(1)) },
    { id:'r14', customer_name:'Conf. Anual Mapfre',  customer_phone:'+34 91 581 1000', pax:10, time:'14:00:00', status:'confirmed',   table:'72" Round', notes:'Menú cerrado', allergy_alert:'', date:iso(addDays(3)) },
    { id:'r15', customer_name:'Bautizo Martín',      customer_phone:'+34 600 332 109', pax:6,  time:'14:00:00', status:'confirmed',   table:'60" Round', notes:'Menú infantil x2', allergy_alert:'', date:iso(addDays(2)) },
    { id:'r16', customer_name:'Hugo Ferrer',         customer_phone:'+34 633 110 558', pax:3,  time:'21:30:00', status:'unconfirmed', table:'',           notes:'', allergy_alert:'', date:iso(addDays(2)) },
    { id:'r17', customer_name:'Cena antiguos alumnos',customer_phone:'+34 91 200 9911',pax:10, time:'21:00:00', status:'confirmed',   table:'48" Round', notes:'', allergy_alert:'', date:iso(addDays(4)) },
  ];
  reservations.push(...extra);

  // kitchen tickets (active) — minutes ago sent
  const mkTime = (minsAgo) => { const d = new Date(today); d.setMinutes(d.getMinutes() - minsAgo); return d.toISOString(); };
  const kitchen = [
    { id:'k1A2F', table_label:'30"×72"',   pax:6, status:'cooking', sent_at:mkTime(42), offset:42*60, items:[
      { id:'ki001', quantity:2, name:'Croquetas caseras',  status:'ready'   },
      { id:'ki002', quantity:3, name:'Gambas al ajillo',    status:'cooking' },
      { id:'ki003', quantity:1, name:'Patatas bravas',      status:'pending' },
    ]},
    { id:'k2C8A', table_label:'60" Round',  pax:8, status:'ready',   sent_at:mkTime(28), offset:28*60, items:[
      { id:'ki004', quantity:2, name:'Paella valenciana',   status:'ready'   },
      { id:'ki005', quantity:2, name:'Cocido madrileño',    status:'ready'   },
    ]},
    { id:'k3F1D', table_label:'36"×36"',   pax:4, status:'pending', sent_at:mkTime(8),  offset:8*60,  items:[
      { id:'ki006', quantity:1, name:'Chuletón de buey',    status:'pending' },
      { id:'ki007', quantity:1, name:'Rabo de toro',         status:'pending' },
    ]},
    { id:'k4B9C', table_label:'30"×48"',   pax:4, status:'cooking', sent_at:mkTime(15), offset:15*60, items:[
      { id:'ki008', quantity:2, name:'Bacalao al pil-pil',  status:'cooking' },
      { id:'ki009', quantity:2, name:'Ensalada mixta',       status:'ready'   },
    ]},
    { id:'k5D2E', table_label:'24"×42"',   pax:2, status:'pending', sent_at:mkTime(3),  offset:3*60,  items:[
      { id:'ki010', quantity:1, name:'Jamón ibérico D.O.',  status:'pending' },
      { id:'ki011', quantity:2, name:'Pimientos de Padrón', status:'pending' },
    ]},
  ];
  // store seconds-elapsed offset so timers can be re-based on each app boot (stays sensible after reload)
  kitchen.forEach(t => { t.offset = Math.round((today.getTime() - new Date(t.sent_at).getTime()) / 1000); });

  // open orders per occupied table for TPV
  const orders = {
    t1: [ { id: 'oi1', name: 'Croquetas caseras', price: 9.50, quantity: 2 }, { id: 'oi2', name: 'Vino Rioja Crianza', price: 4.50, quantity: 2 }, { id: 'oi3', name: 'Rabo de toro', price: 19.50, quantity: 2 } ],
    t2: [ { id: 'oi4', name: 'Gambas al ajillo', price: 13.80, quantity: 1 }, { id: 'oi5', name: 'Bacalao al pil-pil', price: 21.50, quantity: 1 }, { id: 'oi6', name: 'Agua mineral', price: 2.20, quantity: 2 } ],
    t7: [ { id: 'oi7', name: 'Croquetas caseras', price: 9.50, quantity: 3 }, { id: 'oi8', name: 'Cocido madrileño', price: 17.50, quantity: 2 }, { id: 'oi9', name: 'Paella valenciana', price: 16.80, quantity: 1 }, { id: 'oi10', name: 'Cerveza Mahou', price: 2.50, quantity: 4 } ],
    t13: [ { id: 'oi11', name: 'Chuletón de buey', price: 42.00, quantity: 4 }, { id: 'oi12', name: 'Patatas bravas', price: 7.80, quantity: 6 }, { id: 'oi13', name: 'Vino Rioja Crianza', price: 4.50, quantity: 8 } ],
  };

  // weekly rota
  const shiftTypes = ['morning', 'afternoon', 'night', 'off', 'leave'];
  const rotaPattern = {
    s1: ['morning', 'morning', 'morning', 'off', 'morning', 'morning', 'night'],
    s2: ['afternoon', 'night', 'night', 'afternoon', 'off', 'night', 'night'],
    s3: ['morning', 'morning', 'off', 'morning', 'morning', 'afternoon', 'off'],
    s4: ['afternoon', 'afternoon', 'afternoon', 'leave', 'leave', 'afternoon', 'morning'],
    s5: ['night', 'off', 'night', 'night', 'night', 'night', 'afternoon'],
    s6: ['morning', 'afternoon', 'afternoon', 'afternoon', 'afternoon', 'off', 'morning'],
    s7: ['off', 'afternoon', 'night', 'night', 'afternoon', 'afternoon', 'night'],
    s8: ['morning', 'off', 'morning', 'morning', 'off', 'morning', 'morning'],
  };
  const shiftHours = { morning: 8, afternoon: 6, night: 6, off: 0, leave: 0 };

  // clock-in state today
  const clockState = { s1: 'in', s2: 'in', s3: 'break', s4: 'out', s5: 'in', s6: 'in', s7: 'out', s8: 'in' };
  const clockIn = { s1: '08:45', s2: '12:50', s3: '08:30', s5: '19:40', s6: '09:05', s8: '08:55' };

  const leave = [
    { id: 'l1', staff_id: 's4', start_date: iso(addDays(2)), end_date: iso(addDays(3)), days: 2, reason: 'Asuntos propios', status: 'pending' },
    { id: 'l2', staff_id: 's7', start_date: iso(addDays(10)), end_date: iso(addDays(17)), days: 8, reason: 'Vacaciones', status: 'approved' },
    { id: 'l3', staff_id: 's2', start_date: iso(addDays(-4)), end_date: iso(addDays(-4)), days: 1, reason: 'Cita médica', status: 'approved' },
    { id: 'l4', staff_id: 's5', start_date: iso(addDays(20)), end_date: iso(addDays(27)), days: 8, reason: 'Vacaciones', status: 'pending' },
  ];

  // payment method split (today)
  const payments = [
    { method: 'Tarjeta', value: 1932, pct: 68, icon: 'ti-credit-card' },
    { method: 'Efectivo', value: 596, pct: 21, icon: 'ti-coins' },
    { method: 'Bizum', value: 312, pct: 11, icon: 'ti-device-mobile' },
  ];

  // ── price helper (kitchen history totals) ──────────────────────────
  const priceOf = (name) => { const m = menu.find(x => x.name === name); return m ? m.price : 0; };
  const ticketTotal = (items) => items.reduce((s, i) => s + priceOf(i.name) * i.quantity, 0);

  // ── kitchen history (served / cancelled comandas — the "papelera") ──
  const histItems = (arr) => arr.map((x, i) => ({ id: 'hi' + Math.random().toString(36).slice(2, 7), quantity: x[0], name: x[1], status: 'served' }));
  const kitchenHistory = [
    { id: 'h1', table_label: '36"×36"', pax: 4, outcome: 'served', sent_at: mkTime(142), closed_at: mkTime(118), items: histItems([[1, 'Paella valenciana'], [2, 'Croquetas caseras'], [4, 'Cerveza Mahou']]) },
    { id: 'h2', table_label: '60" Round', pax: 3, outcome: 'served', sent_at: mkTime(128), closed_at: mkTime(100), items: histItems([[3, 'Cocido madrileño'], [1, 'Tarta de queso'], [3, 'Vino Rioja Crianza']]) },
    { id: 'h3', table_label: '24"×24"', pax: 2, outcome: 'served', sent_at: mkTime(96), closed_at: mkTime(74), items: histItems([[2, 'Rabo de toro'], [2, 'Croquetas caseras'], [2, 'Agua mineral']]) },
    { id: 'h4', table_label: '30"×48"', pax: 4, outcome: 'cancelled', sent_at: mkTime(88), closed_at: mkTime(82), items: histItems([[1, 'Chuletón de buey'], [2, 'Patatas bravas']]) },
    { id: 'h5', table_label: '30"×60"', pax: 2, outcome: 'served', sent_at: mkTime(64), closed_at: mkTime(41), items: histItems([[2, 'Bacalao al pil-pil'], [1, 'Crema catalana'], [2, 'Café solo']]) },
    { id: 'h6', table_label: '42" Round', pax: 6, outcome: 'served', sent_at: mkTime(40), closed_at: mkTime(18), items: histItems([[3, 'Pollo asado'], [2, 'Ensalada mixta'], [6, 'Cerveza Mahou'], [3, 'Torrijas caseras']]) },
  ];
  kitchenHistory.forEach(t => { t.total = ticketTotal(t.items); t.sent_offset = Math.round((today.getTime() - new Date(t.sent_at).getTime()) / 1000); t.closed_offset = Math.round((today.getTime() - new Date(t.closed_at).getTime()) / 1000); });

  // ── stock / inventory (Stocktake tab) ──────────────────────────────
  const stock = [
    { id: 'sk1',  name: 'Solomillo de buey',    category: 'Carne',    unit: 'kg',  qty: 14.5, par: 18, cost: 23.50 },
    { id: 'sk2',  name: 'Pollo de corral',      category: 'Carne',    unit: 'ud',  qty: 22,   par: 20, cost: 5.80 },
    { id: 'sk3',  name: 'Morcillo de ternera',  category: 'Carne',    unit: 'kg',  qty: 6.2,  par: 12, cost: 11.40 },
    { id: 'sk4',  name: 'Gambas frescas',       category: 'Pescado',  unit: 'kg',  qty: 3.1,  par: 8,  cost: 18.90 },
    { id: 'sk5',  name: 'Bacalao desalado',     category: 'Pescado',  unit: 'kg',  qty: 9.0,  par: 10, cost: 16.20 },
    { id: 'sk6',  name: 'Mejillones',           category: 'Pescado',  unit: 'kg',  qty: 11.5, par: 10, cost: 4.30 },
    { id: 'sk7',  name: 'Patata',               category: 'Verdura',  unit: 'kg',  qty: 38,   par: 30, cost: 0.95 },
    { id: 'sk8',  name: 'Tomate maduro',        category: 'Verdura',  unit: 'kg',  qty: 7.4,  par: 15, cost: 1.80 },
    { id: 'sk9',  name: 'Pimiento de Padrón',   category: 'Verdura',  unit: 'kg',  qty: 4.8,  par: 6,  cost: 6.50 },
    { id: 'sk10', name: 'Garbanzo cocido',      category: 'Despensa', unit: 'kg',  qty: 19,   par: 15, cost: 2.10 },
    { id: 'sk11', name: 'Arroz bomba',          category: 'Despensa', unit: 'kg',  qty: 24,   par: 20, cost: 3.40 },
    { id: 'sk12', name: 'Aceite de oliva V.E.', category: 'Despensa', unit: 'L',   qty: 16,   par: 25, cost: 8.90 },
    { id: 'sk13', name: 'Harina de trigo',      category: 'Despensa', unit: 'kg',  qty: 12,   par: 10, cost: 0.85 },
    { id: 'sk14', name: 'Queso curado',         category: 'Lácteos',  unit: 'kg',  qty: 5.5,  par: 6,  cost: 12.60 },
    { id: 'sk15', name: 'Leche entera',         category: 'Lácteos',  unit: 'L',   qty: 28,   par: 24, cost: 0.92 },
    { id: 'sk16', name: 'Vino Rioja Crianza',   category: 'Bodega',   unit: 'bot', qty: 42,   par: 36, cost: 6.20 },
    { id: 'sk17', name: 'Cerveza Mahou',        category: 'Bodega',   unit: 'bot', qty: 9,    par: 48, cost: 0.75 },
    { id: 'sk18', name: 'Agua mineral 50cl',    category: 'Bodega',   unit: 'bot', qty: 64,   par: 60, cost: 0.35 },
  ];

  // hourly sales (today) — comida & cena services
  const hourly = [
    { hour: '13h', value: 380 }, { hour: '14h', value: 720 }, { hour: '15h', value: 540 },
    { hour: '16h', value: 120 }, { hour: '17h', value: 60 }, { hour: '18h', value: 40 },
    { hour: '19h', value: 90 }, { hour: '20h', value: 310 }, { hour: '21h', value: 480 },
    { hour: '22h', value: 100 },
  ];

  window.DATA = {
    venue, tables, categories, menu, staff, admin, dailySales, reservations, ALLERGENS,
    kitchen, kitchenHistory, stock, orders, rotaPattern, shiftHours, clockState, clockIn, leave,
    payments, hourly, priceOf, ticketTotal,
    today, iso, addDays, pad,
    TIMES: (() => { const out = []; for (let h = 13; h <= 23; h++) { out.push(pad(h) + ':00'); out.push(pad(h) + ':30'); } return out; })(),
  };
})();
