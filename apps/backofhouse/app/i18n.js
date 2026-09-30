/* ─────────────────────────────────────────────────────────────
   Una Mesa — backofhouse i18n (ES → EN)

   The UI is written in Spanish throughout. Rather than rewrite every
   component, this layer translates rendered text in the DOM:
   a MutationObserver watches text nodes and placeholder/title
   attributes and swaps Spanish strings for English via DICT (exact
   match on trimmed text) and PATTERNS (strings with dynamic parts).

   Language is a per-device preference in localStorage 'um-bo-lang'
   ('es' | 'en'). Default: browser language (es/ca → es, else en).

   Adding a string: put the exact Spanish text shown on screen as a key
   in DICT. For strings with numbers/names inside, add to PATTERNS
   using {} for each variable part.
   ───────────────────────────────────────────────────────────── */
(function () {
  const KEY = 'um-bo-lang';

  const DICT = {
    /* ── Shell / navigation ── */
    'Gestión de local': 'Restaurant manager',
    'Restaurante': 'Restaurant',
    'Principal': 'Main',
    'Gestión': 'Management',
    'Panel': 'Dashboard',
    'Reservas': 'Reservations',
    'TPV': 'POS',
    'Cocina': 'Kitchen',
    'Carta': 'Menu',
    'Inventario': 'Inventory',
    'Personal': 'Staff',
    'Informes': 'Reports',
    'Analytics': 'Analytics',
    'Ajustes': 'Settings',
    'Modo claro': 'Light mode',
    'Modo oscuro': 'Dark mode',
    'Usuario': 'User',
    'Cerrar sesión': 'Log out',
    'Idioma': 'Language',

    /* ── Common ── */
    'Cancelar': 'Cancel',
    'Guardar': 'Save',
    'Guardar cambios': 'Save changes',
    'Guardando…': 'Saving…',
    'Descartar': 'Discard',
    'Editar': 'Edit',
    'Eliminar': 'Delete',
    'Sí, eliminar': 'Yes, delete',
    'Confirmar': 'Confirm',
    'Cambiar': 'Change',
    'Actualizar': 'Update',
    'Añadir': 'Add',
    'Listo': 'Done',
    'Limpiar': 'Clear',
    'Todas': 'All',
    'Todo': 'All',
    'Hoy': 'Today',
    'Mañana': 'Morning',
    'Tarde': 'Afternoon',
    'Noche': 'Night',
    'Semana': 'Week',
    'Mes': 'Month',
    'Resumen': 'Summary',
    'Historial': 'History',
    'Nombre': 'Name',
    'Descripción': 'Description',
    'Teléfono': 'Phone',
    'Email': 'Email',
    'Fecha': 'Date',
    'Hora': 'Time',
    'Pax': 'Covers',
    'pax': 'covers',
    'Estado': 'Status',
    'Canal': 'Channel',
    'Cliente': 'Customer',
    'Clientes': 'Customers',
    'Total': 'Total',
    'Subtotal': 'Subtotal',
    'Notas': 'Notes',
    'Alergias': 'Allergies',
    'Mesa': 'Table',
    'Sin mesa': 'No table',
    'días': 'days',
    'Cargando…': 'Loading…',
    'Abrir': 'Open',
    'Ver todas': 'View all',
    'Exportar': 'Export',
    'Avanzar': 'Next',
    'Entendido': 'Got it',
    'Error al guardar:': 'Error saving:',
    'error desconocido': 'unknown error',
    'Cambios guardados': 'Changes saved',
    'No se pudo guardar:': 'Could not save:',
    'sin conexión': 'offline',
    'vs.': 'vs.',
    'mesas': 'tables',
    'reservas': 'reservations',
    'popular': 'popular',
    'vegano': 'vegan',
    'nuevo': 'new',
    'tiempo': 'time',
    'trabajando': 'working',
    'aprobadas': 'approved',
    'cobrado': 'charged',
    'https://turestaurante.com/carta': 'https://yourrestaurant.com/menu',

    /* ── Days / months ── */
    'Lunes': 'Monday', 'Martes': 'Tuesday', 'Miercoles': 'Wednesday', 'Miércoles': 'Wednesday',
    'Jueves': 'Thursday', 'Viernes': 'Friday', 'Sabado': 'Saturday', 'Sábado': 'Saturday', 'Domingo': 'Sunday',
    'Lun': 'Mon', 'Mar': 'Tue', 'Mié': 'Wed', 'Jue': 'Thu', 'Vie': 'Fri', 'Sáb': 'Sat', 'Dom': 'Sun',
    'lun': 'Mon', 'mar': 'Tue', 'mié': 'Wed', 'jue': 'Thu', 'vie': 'Fri', 'sáb': 'Sat', 'dom': 'Sun',
    'miércoles': 'Wednesday', 'sábado': 'Saturday',

    /* ── Login ── */
    'Tu local, bajo control.': 'Your restaurant, under control.',
    'Reservas, TPV, cocina y personal en una sola pantalla. Sin papeles, sin líos, en tiempo real.': 'Reservations, POS, kitchen and staff on one screen. No paper, no hassle, in real time.',
    'Revisa tu correo y contraseña.': 'Check your email and password.',
    'Credenciales incorrectas.': 'Incorrect credentials.',
    'Esta cuenta no tiene un restaurante vinculado. Contacta con soporte.': 'This account is not linked to a restaurant. Please contact support.',
    'Responsable': 'Manager',
    'Error al iniciar sesión.': 'Login error.',
    'Correo electrónico': 'Email',
    'Contraseña': 'Password',
    '¿Olvidaste tu contraseña?': 'Forgot your password?',
    'Recordarme': 'Remember me',
    'Entrando…': 'Signing in…',
    'Entrar': 'Sign in',
    'Selecciona tu perfil': 'Select your profile',
    'PIN demo de': 'Demo PIN for',
    'Bienvenido de nuevo': 'Welcome back',
    'Inicia sesión para gestionar tu local.': 'Sign in to manage your restaurant.',
    'PIN de equipo': 'Team PIN',
    '¿No tienes cuenta?': "Don't have an account?",
    'Solicita una demo': 'Request a demo',
    '© 2026 Una Mesa · Hecho en Madrid': '© 2026 Una Mesa',

    /* ── Dashboard (panel) ── */
    'Abierto': 'Open',
    'Mesas ocupadas': 'Tables occupied',
    'Reservas hoy': 'Reservations today',
    'Ventas hoy': 'Sales today',
    'Rotación mesas': 'Table turnover',
    'Panel de control': 'Dashboard',
    'Sistema: Activo': 'System: Active',
    'comensales esperados': 'guests expected',
    'No-shows este mes': 'No-shows this month',
    'Ocupación ahora': 'Occupancy now',
    'mesas ocupadas': 'tables occupied',
    'Próximas reservas': 'Upcoming reservations',
    'reservas hoy': 'reservations today',
    'Ventas esta semana': 'Sales this week',
    'Cocina ahora': 'Kitchen now',
    'comandas abiertas': 'open orders',

    /* ── Reservations ── */
    'Confirmada': 'Confirmed',
    'Confirmadas': 'Confirmed',
    'Cancelada': 'Cancelled',
    'Pendiente': 'Pending',
    'Sin confirmar': 'Unconfirmed',
    'No show': 'No-show',
    'no show': 'no-show',
    'No-show': 'No-show',
    'Completada': 'Completed',
    'Aviso de disponibilidad': 'Availability notice',
    'La siguiente reserva en': 'The next reservation at',
    'es a las': 'is at',
    'de margen — la mesa se reserva por 2 horas.': 'gap — tables are held for 2 hours.',
    'OK, proceder': 'OK, proceed',
    'Mesa ya reservada': 'Table already booked',
    'Solapamiento de horario': 'Time overlap',
    'ya está ocupada por': 'is already taken by',
    'a las': 'at',
    '. ¿Estás seguro?': '. Are you sure?',
    '¿Estás seguro?': 'Are you sure?',
    'en': 'at',
    'Indica el nombre': 'Enter the name',
    'No puedes reservar en el pasado': "You can't book in the past",
    'Reserva guardada': 'Reservation saved',
    'No se pudo cancelar la reserva': 'Could not cancel the reservation',
    'Reserva cancelada': 'Reservation cancelled',
    'No se pudo actualizar la reserva': 'Could not update the reservation',
    'Marcada como no show — depósito cobrado': 'Marked as no-show — deposit charged',
    'Marcada como completada — depósito cobrado': 'Marked as completed — deposit charged',
    '¿Eliminar reserva?': 'Delete reservation?',
    'Vas a eliminar la reserva de': "You're about to delete the reservation for",
    'Mesa con tiempo limitado': 'Table with limited time',
    '1 hora': '1 hour',
    'OK, reservar': 'OK, book',
    'reservas ·': 'reservations ·',
    'Lista': 'List',
    'Timeline': 'Timeline',
    'Ver mes': 'View month',
    'Sin reservas': 'No reservations',
    'Resumen del día': 'Day summary',
    'Total comensales': 'Total guests',
    'Comensales': 'Guests',
    'comensales': 'guests',
    '👤 Perfil del cliente': '👤 Customer profile',
    '✓ Guardar': '✓ Save',
    'Visitas': 'Visits',
    'Última visita': 'Last visit',
    '⭐ Cliente VIP': '⭐ VIP customer',
    'Alergias (separadas por coma)': 'Allergies (comma separated)',
    'gluten, marisco, frutos secos...': 'gluten, shellfish, nuts...',
    'Notas del restaurante': 'Restaurant notes',
    'Prefiere mesa junto a la ventana...': 'Prefers a window table...',
    '⭐ Marcar como VIP': '⭐ Mark as VIP',
    'Cargando perfil...': 'Loading profile...',
    'Historial de visitas': 'Visit history',
    'Asistió': 'Attended',
    'Sin conf.': 'Unconf.',
    'Mesa asignada': 'Table assigned',
    'Mesa liberada': 'Table released',
    'Sin asignar': 'Unassigned',
    'Hora actualizada': 'Time updated',
    '— pasado': '— past',
    'Reserva confirmada': 'Reservation confirmed',
    'Marcar sin confirmar': 'Mark unconfirmed',
    'Más acciones': 'More actions',
    'Esperan tu respuesta': 'Waiting for your response',
    'Rechazar': 'Decline',
    'Reserva confirmada — avisamos al comensal': 'Reservation confirmed — the guest has been notified',
    'Reserva rechazada — avisamos al comensal': 'Reservation declined — the guest has been notified',
    'Esta reserva ya estaba resuelta (el comensal la canceló o ya respondiste)': 'This reservation was already resolved (the guest cancelled or you already responded)',
    'Marcada sin confirmar': 'Marked unconfirmed',
    'Nueva reserva ·': 'New reservation ·',
    'Nueva reserva': 'New reservation',
    'Nombre del cliente': 'Customer name',
    '+34 6XX XXX XXX': '+44 7XXX XXXXXX',
    'Asignar mesa (opcional)': 'Assign table (optional)',
    '— insuficiente': '— too small',
    'admite máximo': 'seats up to',
    'comensales — elige otra mesa o reduce el grupo': 'guests — choose another table or reduce the party',
    'Notas / alergias': 'Notes / allergies',
    'ya está reservada —': 'is already booked —',
    'Guardar reserva': 'Save reservation',

    /* ── Tables / floor plan ── */
    'Nueva mesa': 'New table',
    'Nombre de la mesa': 'Table name',
    'Ej. Mesa 5': 'e.g. Table 5',
    'Capacidad (personas)': 'Capacity (people)',
    'Añadir mesa': 'Add table',
    'Selecciona una mesa primero': 'Select a table first',
    'Comanda enviada a': 'Order sent to',
    'Cobro completado': 'Payment completed',
    'Mesa actualizada': 'Table updated',
    'añadida': 'added',
    'añadido': 'added',
    'Plano cargado': 'Floor plan loaded',
    'Mesa eliminada': 'Table deleted',
    'Plano del local': 'Floor plan',
    'ocupadas ·': 'occupied ·',
    'Gestionar mesas': 'Manage tables',
    'Modo edición · toca una mesa para editar · ✕ para eliminar': 'Edit mode · tap a table to edit · ✕ to delete',
    'Selecciona una mesa': 'Select a table',
    'Libre': 'Free',

    /* ── POS ── */
    'Buscar plato...': 'Search dish...',
    'Filtrar sin alergenos': 'Filter by allergens',
    'Mostrando platos sin:': 'Showing dishes without:',
    'Pedido activo': 'Active order',
    'Nuevo pedido': 'New order',
    'Estado en cocina': 'Kitchen status',
    'En cocina': 'In kitchen',
    'Sin productos': 'No items',
    'IVA (10%)': 'VAT (10%)',
    'Enviar a cocina': 'Send to kitchen',
    'Tarjeta': 'Card',
    'Efectivo': 'Cash',

    /* ── Kitchen ── */
    'Iniciar': 'Start',
    'Marcar listo': 'Mark ready',
    'Servido': 'Served',
    'Urgente': 'Urgent',
    'Anular': 'Void',
    'Historial de comandas': 'Order history',
    'Registro completo ·': 'Full log ·',
    'Servidas hoy': 'Served today',
    'Anuladas': 'Voided',
    'Facturado': 'Billed',
    'Aún no hay comandas registradas': 'No orders recorded yet',
    'Anulada': 'Voided',
    'Servida': 'Served',
    'Vaciar historial': 'Clear history',
    'Comanda servida': 'Order served',
    'Comanda anulada': 'Order voided',
    'En directo': 'Live',
    'Pendientes': 'Pending',
    'Listos': 'Ready',
    'Sin comandas activas': 'No active orders',
    'Historial vaciado': 'History cleared',

    /* ── Staff ── */
    'Vacac.': 'Hol.',
    'Baja': 'Leave',
    'Mañana · 09–17h': 'Morning · 09–17h',
    'Tarde · 13–19h': 'Afternoon · 13–19h',
    'Noche · 20–02h': 'Night · 20–02h',
    'Baja médica': 'Sick leave',
    'Asignar turno': 'Assign shift',
    'Horario personalizado': 'Custom hours',
    'Aplicar horario': 'Apply hours',
    'El PIN debe tener 4 dígitos': 'PIN must be 4 digits',
    'Perfil del empleado': 'Employee profile',
    'Nombre completo': 'Full name',
    'Puesto': 'Role',
    'Camarera, Cocinero…': 'Waiter, Cook…',
    'nombre@email.com': 'name@email.com',
    'Nivel de acceso': 'Access level',
    'PIN (4 dígitos)': 'PIN (4 digits)',
    'Alergias, preferencias, observaciones…': 'Allergies, preferences, notes…',
    'Guardar perfil': 'Save profile',
    'El archivo está vacío.': 'The file is empty.',
    'La librería XLSX no está cargada. Prueba a recargar la página.': 'The XLSX library is not loaded. Try reloading the page.',
    'El archivo parece estar vacío. Asegúrate de guardar con datos.': 'The file seems empty. Make sure you saved it with data.',
    'Solo se encontró 1 fila (la cabecera). Añade filas con los empleados debajo.': 'Only 1 row found (the header). Add rows with employees below it.',
    'No se encontraron empleados. Comprueba que los nombres coincidan con los del sistema.': 'No employees found. Check that names match those in the system.',
    'Error al leer el archivo:': 'Error reading file:',
    'Importar rota': 'Import rota',
    'Descarga la plantilla': 'Download the template',
    'Ya viene con los nombres de tus empleados.': 'It already includes your employees’ names.',
    'Descargar plantilla (.csv)': 'Download template (.csv)',
    'Empleados en el sistema:': 'Employees in the system:',
    'Rellena los turnos y guarda como CSV': 'Fill in the shifts and save as CSV',
    'Edita los turnos. Importante: guarda el archivo como CSV (no como .numbers o .xlsx).': 'Edit the shifts. Important: save the file as CSV (not .numbers or .xlsx).',
    'mañana': 'morning',
    'Sube el archivo CSV': 'Upload the CSV file',
    'Selecciona el archivo .csv que guardaste.': 'Select the .csv file you saved.',
    'Seleccionar archivo (.csv)': 'Select file (.csv)',
    'Avisos:': 'Warnings:',
    'empleados listos para importar:': 'employees ready to import:',
    'Empleado': 'Employee',
    '← Volver y subir otro archivo': '← Back and upload another file',
    'Aplicar rota ✓': 'Apply rota ✓',
    'Nuevo empleado': 'New employee',
    'Ej. Marta López': 'e.g. Jane Smith',
    'Acceso': 'Access',
    'Añadir empleado': 'Add employee',
    'No se reconoció ningún empleado': 'No employees recognised',
    'Entrada registrada': 'Clock-in recorded',
    'Salida registrada': 'Clock-out recorded',
    'Ausencia aprobada': 'Absence approved',
    'Ausencia rechazada': 'Absence rejected',
    'añadido al equipo': 'added to the team',
    'Rota reorganizada y equilibrada': 'Rota reorganised and balanced',
    'empleados ·': 'employees ·',
    'fichados ahora': 'clocked in now',
    'Turnos semanales': 'Weekly shifts',
    'Cómputo de horas': 'Hours tally',
    'Fichajes de hoy': "Today's clock-ins",
    'En turno ahora': 'On shift now',
    'Horas esta semana': 'Hours this week',
    'total equipo': 'team total',
    'Coste laboral': 'Labour cost',
    'estimado semana': 'estimated this week',
    'Bajas activas': 'Active leave',
    'Pulsa una celda para editar turno, horario o baja ·': 'Tap a cell to edit shift, hours or leave ·',
    'Auto-organizar': 'Auto-arrange',
    'Ver perfil': 'View profile',
    'Horas hoy': 'Hours today',
    'turno de hoy · equipo': "today's shift · team",
    'plantilla completa': 'full team',
    'Horas este mes': 'Hours this month',
    'Horas por empleado': 'Hours per employee',
    'Cómputo diario, semanal y mensual · coste estimado a 14 €/h': 'Daily, weekly and monthly tally · estimated cost at €14/h',
    'Coste mes': 'Monthly cost',
    'Fichajes en tiempo real': 'Live clock-ins',
    '· Entrada:': '· In:',
    'Trabajando': 'Working',
    'Descanso': 'Break',
    'Sin fichar': 'Not clocked in',
    'Entrada': 'Clock in',
    'Salida': 'Clock out',
    'En descanso': 'On break',
    'Solicitudes de ausencia': 'Absence requests',
    'pendientes de aprobación': 'pending approval',
    'días ·': 'days ·',
    'Aprobada': 'Approved',
    'Rechazada': 'Rejected',
    'Días disponibles 2026': 'Days available 2026',
    '30 días por empleado': '30 days per employee',
    'Asuntos propios': 'Personal matters',
    'Vacaciones': 'Holiday',
    'Cita médica': 'Medical appointment',
    'Jefe de cocina': 'Head chef',
    'Camarera': 'Waitress',
    'Cocinero': 'Cook',
    'Ayudante cocina': 'Kitchen assistant',
    'Barman': 'Bartender',
    'Maître': 'Maître d’',

    /* ── Menu (carta) ── */
    'Agua y Zumos': 'Water & Juices',
    'Refrescos': 'Soft drinks',
    'Cervezas': 'Beers',
    'Vinos y Cavas': 'Wines & Cava',
    'Coctelería': 'Cocktails',
    'Calientes': 'Hot drinks',
    'Otros': 'Other',
    'Categoría': 'Category',
    'No se pudo crear la categoría:': 'Could not create category:',
    'Categoría añadida': 'Category added',
    'Completa nombre y precio': 'Enter name and price',
    'No se pudo guardar el plato:': 'Could not save dish:',
    'Plato añadido a la carta': 'Dish added to menu',
    'Plato actualizado': 'Dish updated',
    'No se pudo eliminar:': 'Could not delete:',
    'Plato eliminado': 'Dish deleted',
    'platos ·': 'dishes ·',
    'disponibles ·': 'available ·',
    'categorías': 'categories',
    'Nuevo plato': 'New dish',
    'Categorías': 'Categories',
    'Nueva categoría': 'New category',
    'Agotado': 'Sold out',
    'Sin platos en esta categoría': 'No dishes in this category',
    'Resumen de la carta': 'Menu summary',
    'Platos totales': 'Total dishes',
    'Disponibles': 'Available',
    'Agotados': 'Sold out',
    'Precio medio': 'Average price',
    'Más vendido': 'Best seller',
    'unidades esta semana': 'units this week',
    'Selecciona un plato para editarlo, o cambia su disponibilidad con el interruptor. Los cambios se reflejan al instante en el TPV.': 'Select a dish to edit it, or toggle its availability. Changes show instantly in the POS.',
    'Ninguna': 'None',
    'Popular': 'Popular',
    'Nuevo': 'New',
    'Vegano': 'Vegan',
    'Sin gluten': 'Gluten-free',
    'Editar plato': 'Edit dish',
    'Ej. Croquetas caseras': 'e.g. Homemade croquettes',
    'Ingredientes, ración…': 'Ingredients, portion…',
    'Subcategoría de bebida': 'Drink subcategory',
    'Sin subcategoría': 'No subcategory',
    'Precio (€)': 'Price',
    'IVA': 'VAT',
    '10% · General': '10% · Standard',
    '21% · Bebidas alc.': '21% · Alcoholic drinks',
    '4% · Superreducido': '4% · Super-reduced',
    'Etiqueta': 'Label',
    'Alérgenos': 'Allergens',
    'Disponible': 'Available',
    'Visible en el TPV': 'Visible in POS',
    'Añadir a la carta': 'Add to menu',
    'Eliminar plato': 'Delete dish',
    'Entrantes': 'Starters',
    'Principales': 'Mains',
    'Postres': 'Desserts',
    'Bebidas': 'Drinks',
    /* allergens */
    'Gluten': 'Gluten', 'Crustáceos': 'Crustaceans', 'Huevo': 'Egg', 'Pescado': 'Fish',
    'Cacahuetes': 'Peanuts', 'Soja': 'Soy', 'Lácteos': 'Dairy', 'Frutos de cáscara': 'Tree nuts',
    'Apio': 'Celery', 'Mostaza': 'Mustard', 'Sésamo': 'Sesame', 'Sulfitos': 'Sulphites',
    'Altramuces': 'Lupin', 'Moluscos': 'Molluscs',

    /* ── Inventory ── */
    'Crítico': 'Critical',
    'Bajo': 'Low',
    'OK': 'OK',
    'Editar artículo': 'Edit item',
    'Nuevo artículo': 'New item',
    'Ej. Solomillo de buey': 'e.g. Beef sirloin',
    'Unidad': 'Unit',
    'Existencias': 'In stock',
    'Stock mín.': 'Min. stock',
    'Coste/ud €': 'Cost/unit',
    'Añadir artículo': 'Add item',
    'Artículo eliminado': 'Item deleted',
    'No se pudo añadir:': 'Could not add:',
    '¿Eliminar artículo?': 'Delete item?',
    'Vas a eliminar': "You're about to delete",
    'del inventario. ¿Estás seguro?': 'from inventory. Are you sure?',
    'artículos ·': 'items ·',
    'por reponer': 'to restock',
    'Artículos': 'Items',
    'en inventario': 'in inventory',
    'bajo mínimo': 'below minimum',
    'sin existencias': 'out of stock',
    'Valor de stock': 'Stock value',
    'a precio de coste': 'at cost price',
    'Reposición recomendada': 'Recommended restock',
    'Buscar artículo…': 'Search item…',
    'Artículo': 'Item',
    'Nivel': 'Level',
    'Valor': 'Value',
    'mín.': 'min.',
    '% del mínimo': '% of minimum',
    'Reponer al mínimo': 'Restock to minimum',
    'Sin artículos': 'No items',
    'Carne': 'Meat', 'Verdura': 'Vegetables', 'Despensa': 'Pantry', 'Bodega': 'Cellar',

    /* ── Reports (informes) ── */
    'vs. ayer': 'vs. yesterday',
    'vs. semana anterior': 'vs. last week',
    'vs. mes anterior': 'vs. last month',
    'Sem 1': 'Wk 1', 'Sem 2': 'Wk 2', 'Sem 3': 'Wk 3', 'Sem 4': 'Wk 4',
    'Ingresos': 'Revenue',
    'Ticket medio': 'Average ticket',
    'Análisis de ventas y rendimiento ·': 'Sales and performance analysis ·',
    'Informe exportado (PDF)': 'Report exported (PDF)',
    'esta semana': 'this week',
    'este mes': 'this month',
    'Tasa de no-shows': 'No-show rate',
    'Evolución de ventas': 'Sales trend',
    'Por franja horaria': 'By time slot',
    'Últimas 4 semanas': 'Last 4 weeks',
    'total del periodo': 'period total',
    'Ventas por categoría': 'Sales by category',
    'Métodos de pago': 'Payment methods',
    'Platos más vendidos': 'Best-selling dishes',
    'unidades · ingresos': 'units · revenue',
    'uds.': 'units',
    'Ventas por franja': 'Sales by time slot',
    'Comida (13-16h) · Cena (20-23h)': 'Lunch (13-16h) · Dinner (20-23h)',

    /* ── Analytics ── */
    'Analytics error:': 'Analytics error:',
    '7 días': '7 days', '30 días': '30 days', '90 días': '90 days',
    'Web': 'Web',
    'Agente de voz IA': 'AI voice agent',
    'Chat IA': 'AI chat',
    'Cargando analytics…': 'Loading analytics…',
    'Error cargando datos': 'Error loading data',
    'semana anterior': 'previous week',
    'mes anterior': 'previous month',
    '90 días anteriores': 'previous 90 days',
    'Reservas y clientes · vs': 'Reservations and customers · vs',
    'Reservas totales': 'Total reservations',
    'Tasa no-show': 'No-show rate',
    '% vs': '% vs',
    'Sin datos anteriores': 'No previous data',
    'Reservas confirmadas': 'Confirmed reservations',
    'Últimos 7 días': 'Last 7 days',
    'Canal de reserva': 'Booking channel',
    'Dónde vienen tus clientes': 'Where your customers come from',
    'Horarios más populares': 'Most popular times',
    'Franjas con más demanda': 'Busiest time slots',
    'Sin datos para este periodo': 'No data for this period',
    'Nuevos y recurrentes': 'New and returning',
    'Clientes únicos': 'Unique customers',
    'Recurrentes': 'Returning',
    'No-shows': 'No-shows',
    'Reservas recientes': 'Recent reservations',
    'Últimas': 'Latest',
    'Sin reservas en este periodo': 'No reservations in this period',
    'clientes sin reservar en 30+ días': "customers who haven't booked in 30+ days",
    'Oportunidad de recuperación — contáctalos con una oferta': 'Win-back opportunity — contact them with an offer',
    'Lista exportada': 'List exported',
    'Exportar lista': 'Export list',
    'Ocultar ▲': 'Hide ▲',
    'Ver todos ▼': 'View all ▼',
    'Última reserva': 'Last reservation',
    'Días sin reservar': 'Days since last booking',
    'IA Insights': 'AI Insights',
    'Acciones recomendadas basadas en tus datos': 'Recommended actions based on your data',
    'Agente de voz activo': 'Voice agent active',
    'Retención activa': 'Active retention',
    'Exporta la lista y contáctalos con una oferta. Un cliente recuperado vale más que uno nuevo.': 'Export the list and contact them with an offer. A recovered customer is worth more than a new one.',
    'Todos tus clientes recientes han vuelto. Buen trabajo.': 'All your recent customers have come back. Nice work.',
    'Sin no-shows': 'No no-shows',
    'Considera aumentar el depósito en horarios pico para reducir no-shows.': 'Consider raising the deposit at peak times to reduce no-shows.',
    'El depósito reembolsable está funcionando. Tasa de presentación perfecta.': 'The refundable deposit is working. Perfect show-up rate.',

    /* ── Settings (ajustes) ── */
    'Datos del local': 'Restaurant details',
    'Aparecen en tickets, facturas y reservas': 'Shown on receipts, invoices and reservations',
    'Cambiar logo': 'Change logo',
    'PNG o SVG, máx. 1MB': 'PNG or SVG, max. 1MB',
    'Nombre del local': 'Restaurant name',
    'Dirección': 'Address',
    'Ciudad': 'City',
    'Código postal': 'Postcode',
    'NIF / CIF': 'VAT / Company number',
    'Enlace a la carta': 'Menu link',
    'Regional': 'Regional',
    'Moneda': 'Currency',
    'Euro (€)': 'Euro (€)',
    'Libra (£)': 'Pound (£)',
    'Zona horaria': 'Time zone',
    'Comida y refrescos': 'Food and soft drinks',
    'Bebidas alcohólicas': 'Alcoholic drinks',
    'Vino, cerveza, licores': 'Wine, beer, spirits',
    'Superreducido': 'Super-reduced',
    'Pan, leche, productos básicos': 'Bread, milk, basics',
    'Tipos de IVA': 'VAT rates',
    'Se aplican a los platos según su categoría': 'Applied to dishes by category',
    'Por defecto': 'Default',
    'Añadir tipo de IVA': 'Add VAT rate',
    'Añadir tipo': 'Add rate',
    'Precios y cargos': 'Prices and charges',
    'Precios con IVA incluido': 'Prices include VAT',
    'Mostrar precios finales en carta y TPV': 'Show final prices on menu and POS',
    'Cargo por servicio': 'Service charge',
    'Recargo automático en mesas': 'Automatic charge on tables',
    'Permitir propinas': 'Allow tips',
    'Opción de propina al cobrar': 'Tip option at checkout',
    'Administrador': 'Administrator',
    'Propietario': 'Owner',
    'Usuario eliminado': 'User deleted',
    'Equipo': 'Team',
    'personas con acceso': 'people with access',
    'Añadir usuario': 'Add user',
    'Permiso actualizado': 'Permission updated',
    'Encargado': 'Manager',
    'Camarero': 'Waiter',
    'Permisos por rol': 'Permissions by role',
    'Acceso total, ajustes y facturación': 'Full access, settings and billing',
    'Todo salvo facturación y usuarios': 'Everything except billing and users',
    'Reservas, TPV y mesas': 'Reservations, POS and tables',
    'Solo pantalla de cocina': 'Kitchen screen only',
    '¿Eliminar usuario?': 'Delete user?',
    'Esta acción no se puede deshacer': 'This action cannot be undone',
    'Vas a eliminar a': "You're about to remove",
    '). Perderá el acceso al sistema inmediatamente.': '). They will lose access immediately.',
    'Esencial': 'Essential',
    'Reservas y TPV': 'Reservations and POS',
    '1 punto de venta': '1 point of sale',
    'Soporte por email': 'Email support',
    'Profesional': 'Professional',
    'Todo en Esencial': 'Everything in Essential',
    'Cocina + Personal': 'Kitchen + Staff',
    'Informes avanzados': 'Advanced reports',
    'Soporte prioritario': 'Priority support',
    'Grupo': 'Group',
    'Todo en Profesional': 'Everything in Professional',
    'Multi-local': 'Multi-site',
    'API y exportación': 'API and export',
    'Gestor de cuenta': 'Account manager',
    'Plan actual': 'Current plan',
    'Próxima factura: 1 jul 2026 · €59,00/mes': 'Next invoice: 1 Jul 2026 · €59.00/month',
    'Es tu plan actual': 'Your current plan',
    'Método de pago': 'Payment method',
    'Visa terminada en 4242': 'Visa ending in 4242',
    'Caduca 09/27': 'Expires 09/27',
    'Facturas': 'Invoices',
    'Jun 2026': 'Jun 2026', 'May 2026': 'May 2026', 'Abr 2026': 'Apr 2026', 'Mar 2026': 'Mar 2026',
    'Clave copiada al portapapeles': 'Key copied to clipboard',
    'Clave API regenerada': 'API key regenerated',
    'Integraciones': 'Integrations',
    'Conecta un sistema TPV externo con tu cuenta de Una Mesa': 'Connect an external POS system to your Una Mesa account',
    'TPV de terceros': 'Third-party POS',
    'Conectado': 'Connected',
    'No conectado': 'Not connected',
    'Sincroniza pedidos con tu terminal punto de venta externo': 'Sync orders with your external POS terminal',
    'Última sincronización: hace 2 min': 'Last sync: 2 min ago',
    'Abriendo configuración de TPV': 'Opening POS settings',
    'Gestionar': 'Manage',
    'TPV desconectado': 'POS disconnected',
    'Desconectar': 'Disconnect',
    'TPV conectado': 'POS connected',
    'Conectar': 'Connect',
    'Clave API': 'API key',
    'Usa esta clave para conectar tu TPV externo con Una Mesa': 'Use this key to connect your external POS to Una Mesa',
    'URL base:': 'Base URL:',
    '¿Seguro? Se invalidará la clave actual.': 'Are you sure? The current key will stop working.',
    'Sí, regenerar': 'Yes, regenerate',
    'Regenerar clave': 'Regenerate key',
    'Ver documentación de la API': 'View API documentation',
    'Permisos de sincronización': 'Sync permissions',
    'Elige qué datos puede leer y escribir el TPV conectado': 'Choose what data the connected POS can read and write',
    'Pedidos': 'Orders',
    'Lectura y escritura de comandas y tickets': 'Read and write orders and receipts',
    'Estado de mesas': 'Table status',
    'Leer y actualizar ocupación en tiempo real': 'Read and update occupancy in real time',
    'Sincronizar carta / menú': 'Sync menu',
    'Exportar platos, precios y alergenos': 'Export dishes, prices and allergens',
    'Notificaciones de cocina': 'Kitchen notifications',
    'Recibir eventos de KDS en sistemas externos': 'Receive KDS events in external systems',
    'Notificaciones': 'Notifications',
    'Elige qué avisos quieres recibir': 'Choose which alerts you want to receive',
    'Cuando un cliente reserva online': 'When a customer books online',
    'Cancelaciones': 'Cancellations',
    'Reservas canceladas o no-show': 'Cancelled reservations or no-shows',
    'Comandas en cocina': 'Kitchen orders',
    'Aviso por cada comanda enviada': 'Alert for every order sent',
    'Resumen diario': 'Daily summary',
    'Cierre de caja cada noche por email': 'End-of-day cash-up by email every night',
    'Stock bajo': 'Low stock',
    'Cuando un producto se agota': 'When an item runs out',
    'Fichajes del personal': 'Staff clock-ins',
    'Entradas y salidas del equipo': 'Team clock-ins and clock-outs',
    'Impuestos': 'Taxes',
    'Usuarios y permisos': 'Users and permissions',
    'Facturación': 'Billing',
    'Configuración de': 'Settings for',

    /* ── No-show confirmation screen ── */
    'Este enlace ya se usó. Si fue un error, contacta con Una Mesa.': 'This link has already been used. If this was a mistake, contact Una Mesa.',
    'Este enlace ha expirado.': 'This link has expired.',
    'El depósito de esta reserva ya fue procesado antes.': "This reservation's deposit has already been processed.",
    'Este enlace no es válido.': 'This link is not valid.',
    'No se pudo procesar. Inténtalo de nuevo o contacta con Una Mesa.': 'Could not process. Try again or contact Una Mesa.',
    '¿Qué pasó con esta reserva?': 'What happened with this reservation?',
    'El depósito se cobra en los dos casos — solo cambia cómo queda registrada la reserva.': 'The deposit is charged either way — this only changes how the reservation is recorded.',
    'El cliente asistió': 'The customer attended',
    'El cliente no se presentó': "The customer didn't show up",
    'Reserva completada': 'Reservation completed',
    'No-show registrado': 'No-show recorded',
    'La reserva se marcó como completada y el depósito ha sido cobrado.': 'The reservation was marked as completed and the deposit has been charged.',
    'La reserva se marcó como no-show y el depósito ha sido cobrado.': 'The reservation was marked as no-show and the deposit has been charged.',
    'No se pudo procesar': 'Could not process',
  };

  const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const mEN = (m) => { const i = MONTHS_ES.indexOf(m.toLowerCase()); return i < 0 ? m : MONTHS_EN[i]; };
  const dEN = (d) => { const i = DAYS_ES.indexOf(d.toLowerCase()); return i < 0 ? d : DAYS_EN[i]; };
  const monthRe = MONTHS_ES.join('|');
  const dayRe = DAYS_ES.join('|');

  /* Strings with variable parts. {} = any text; kept in order. */
  const PATTERNS_SRC = [
    ['Cambiado a {}', 'Switched to {}'],
    ['Buscar en {}…', 'Search {}…'],
    ['{} reservas gestionadas automáticamente. Sin agente de voz, esas llamadas se habrían perdido.', '{} reservations handled automatically. Without the voice agent, those calls would have been missed.'],
    ['{} clientes sin volver', "{} customers haven't returned"],
    ['{} admite máximo {} comensales', '{} seats a maximum of {} guests'],
    ['Editar {}', 'Edit {}'],
    ['Añadiendo a {}', 'Adding to {}'],
    ['"{}" no coincide — omitido', '"{}" does not match — skipped'],
    ['No se encontró columna "Nombre". Cabeceras detectadas: {}.', 'No "Nombre" column found. Headers detected: {}.'],
    ['Rota importada: {} empleado{} actualizado{}', 'Rota imported: {} employee(s) updated'],
    ['{#} pendientes', '{} pending'],
    ['{#} en turno', '{} on shift'],
    ['+{#} más', '+{} more'],
    ['{#} reservas', '{} reservations'],
    ['{#} comensales', '{} guests'],
    ['{#} reserva', '{} reservation'],
    ['Esta reserva ya se resolvió como "{}" antes de que usaras este enlace.', 'This reservation was already resolved as "{}" before you used this link.'],
    ['Próxima factura: {}', 'Next invoice: {}'],
  ];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const PATTERNS = PATTERNS_SRC.map(([es, en]) => ({
    re: new RegExp('^' + es.split(/(\{#?\})/).map((part) => part === '{}' ? '(.+?)' : part === '{#}' ? '(\\d+)' : esc(part)).join('') + '$'),
    en,
  }));

  function translate(s) {
    if (Object.prototype.hasOwnProperty.call(DICT, s)) return DICT[s];
    let m;
    // "martes 29 de septiembre [de 2026]" / "29 de septiembre"
    if ((m = s.match(new RegExp(`^(?:(${dayRe}),?\\s+)?(\\d{1,2}) de (${monthRe})(?: de (\\d{4}))?$`, 'i')))) {
      return (m[1] ? dEN(m[1]) + ' ' : '') + m[2] + ' ' + mEN(m[3]) + (m[4] ? ' ' + m[4] : '');
    }
    // "septiembre 2026" / "septiembre de 2026"
    if ((m = s.match(new RegExp(`^(${monthRe})(?: de)? (\\d{4})$`, 'i')))) return mEN(m[1]) + ' ' + m[2];
    if ((m = s.match(new RegExp(`^(${monthRe})$`, 'i')))) return mEN(m[1]);
    if ((m = s.match(new RegExp(`^(${dayRe})$`, 'i')))) return dEN(m[1]);
    for (const p of PATTERNS) {
      const mm = s.match(p.re);
      if (mm) { let i = 1; return p.en.replace(/\{\}/g, () => { const g = mm[i++] ?? ''; return DICT[g] ?? g; }); }
    }
    return null;
  }

  /* ── DOM translation ── */
  const ORIG = new WeakMap();          // text node → original Spanish
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  let lang = 'es';
  let busy = false;

  function doText(node) {
    const v = node.nodeValue;
    if (!v || !/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(v)) return;
    const trimmed = v.trim();
    const out = translate(trimmed);
    if (out == null || out === trimmed) return;
    ORIG.set(node, v);
    node.nodeValue = v.replace(trimmed, out);
  }
  function doAttrs(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a);
      if (!v) continue;
      const out = translate(v.trim());
      if (out == null || out === v) continue;
      el.setAttribute('data-um-orig-' + a, v);
      el.setAttribute(a, out);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.tagName === 'SCRIPT' || root.tagName === 'STYLE' || root.isContentEditable) return;
    doAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) {
        const p = n.parentNode;
        if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE' || p.tagName === 'TEXTAREA')) continue;
        doText(n);
      } else doAttrs(n);
    }
  }
  function restore() {
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) { const o = ORIG.get(n); if (o != null) { n.nodeValue = o; ORIG.delete(n); } }
      else for (const a of ATTRS) {
        const o = n.getAttribute('data-um-orig-' + a);
        if (o != null) { n.setAttribute(a, o); n.removeAttribute('data-um-orig-' + a); }
      }
    }
  }

  const observer = new MutationObserver((muts) => {
    if (lang !== 'en' || busy) return;
    busy = true;
    try {
      for (const m of muts) {
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    } finally { busy = false; }
  });

  function start() {
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (lang === 'en') { busy = true; walk(document.body); busy = false; }
  }

  function detect() {
    try { const s = localStorage.getItem(KEY); if (s === 'es' || s === 'en') return s; } catch (e) {}
    const nav = (navigator.language || 'en').toLowerCase();
    return nav.startsWith('es') || nav.startsWith('ca') ? 'es' : 'en';
  }

  const listeners = new Set();
  function setLang(next) {
    next = next === 'en' ? 'en' : 'es';
    try { localStorage.setItem(KEY, next); } catch (e) {}
    if (next === lang) return;
    lang = next;
    document.documentElement.lang = lang;
    busy = true;
    try { if (lang === 'en') walk(document.body); else restore(); } finally { busy = false; }
    listeners.forEach((fn) => { try { fn(lang); } catch (e) {} });
  }

  lang = detect();
  document.documentElement.lang = lang;
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  // keep tabs in sync
  window.addEventListener('storage', (e) => { if (e.key === KEY && e.newValue) setLang(e.newValue); });

  window.UMI18n = {
    getLang: () => lang,
    setLang,
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    t: (s) => (lang === 'en' ? (translate(s) ?? s) : s),
  };
})();
