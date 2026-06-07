-- ============================================================
-- UNAMESA — Schema completo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- VENUES (locales)
-- ============================================================
create table venues (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  address     text,
  city        text,
  phone       text,
  email       text,
  vat_number  text,
  plan        text default 'profesional' check (plan in ('esencial','profesional','grupo')),
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLES (mesas)
-- ============================================================
create table tables (
  id         uuid primary key default uuid_generate_v4(),
  venue_id   uuid references venues(id) on delete cascade,
  label      text not null,
  section    text default 'sala' check (section in ('sala','terraza','privado','barra')),
  capacity   int default 4,
  position_x int default 0,
  position_y int default 0,
  status     text default 'free' check (status in ('free','occupied','reserved','cleaning')),
  created_at timestamptz default now()
);

-- ============================================================
-- CUSTOMERS (clientes / CRM)
-- ============================================================
create table customers (
  id           uuid primary key default uuid_generate_v4(),
  venue_id     uuid references venues(id) on delete cascade,
  name         text not null,
  phone        text,
  email        text,
  allergies    text[],
  notes        text,
  visits       int default 0,
  last_visit   date,
  vip          boolean default false,
  created_at   timestamptz default now()
);

-- ============================================================
-- RESERVATIONS (reservas)
-- ============================================================
create table reservations (
  id            uuid primary key default uuid_generate_v4(),
  venue_id      uuid references venues(id) on delete cascade,
  table_id      uuid references tables(id),
  customer_id   uuid references customers(id),
  customer_name text not null,
  customer_phone text,
  pax           int not null default 2,
  date          date not null,
  time          time not null,
  status        text default 'pending' check (status in ('confirmed','pending','unconfirmed','cancelled','completed','no_show')),
  notes         text,
  allergy_alert text,
  created_at    timestamptz default now()
);

create index idx_reservations_date on reservations(date);
create index idx_reservations_venue on reservations(venue_id);

-- ============================================================
-- MENU CATEGORIES + ITEMS
-- ============================================================
create table menu_categories (
  id         uuid primary key default uuid_generate_v4(),
  venue_id   uuid references venues(id) on delete cascade,
  name       text not null,
  sort_order int default 0
);

create table menu_items (
  id           uuid primary key default uuid_generate_v4(),
  venue_id     uuid references venues(id) on delete cascade,
  category_id  uuid references menu_categories(id) on delete set null,
  name         text not null,
  description  text,
  price        numeric(8,2) not null,
  vat_rate     numeric(4,2) default 10.00,
  tag          text check (tag in ('popular','nuevo','vegano','sin_gluten',null)),
  available    boolean default true,
  created_at   timestamptz default now()
);

-- ============================================================
-- ORDERS (comandas / pedidos TPV)
-- ============================================================
create table orders (
  id           uuid primary key default uuid_generate_v4(),
  venue_id     uuid references venues(id) on delete cascade,
  table_id     uuid references tables(id),
  reservation_id uuid references reservations(id),
  status       text default 'open' check (status in ('open','sent_to_kitchen','ready','paid','cancelled')),
  subtotal     numeric(10,2) default 0,
  vat_amount   numeric(10,2) default 0,
  total        numeric(10,2) default 0,
  split_by     int default 1,
  payment_method text check (payment_method in ('card','cash','bizum','split',null)),
  created_at   timestamptz default now(),
  closed_at    timestamptz
);

create table order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name         text not null,
  price        numeric(8,2) not null,
  quantity     int default 1,
  course       text,
  status       text default 'pending' check (status in ('pending','cooking','ready','served')),
  notes        text,
  created_at   timestamptz default now()
);

-- ============================================================
-- KITCHEN TICKETS
-- ============================================================
create table kitchen_tickets (
  id           uuid primary key default uuid_generate_v4(),
  venue_id     uuid references venues(id) on delete cascade,
  order_id     uuid references orders(id) on delete cascade,
  table_label  text not null,
  pax          int default 1,
  status       text default 'pending' check (status in ('pending','cooking','ready','served')),
  sent_at      timestamptz default now(),
  ready_at     timestamptz,
  served_at    timestamptz
);

-- ============================================================
-- STAFF (empleados)
-- ============================================================
create table staff (
  id           uuid primary key default uuid_generate_v4(),
  venue_id     uuid references venues(id) on delete cascade,
  name         text not null,
  role         text not null,
  pin          text,
  phone        text,
  email        text,
  color        text default '#1A6B55',
  color_bg     text default '#E8F5F1',
  initials     text,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- ============================================================
-- SHIFTS (turnos)
-- ============================================================
create table shifts (
  id           uuid primary key default uuid_generate_v4(),
  venue_id     uuid references venues(id) on delete cascade,
  staff_id     uuid references staff(id) on delete cascade,
  date         date not null,
  start_time   time,
  end_time     time,
  shift_type   text check (shift_type in ('morning','afternoon','night','off','leave')),
  hours        numeric(4,1) default 0,
  created_at   timestamptz default now()
);

create index idx_shifts_date on shifts(date);

-- ============================================================
-- CLOCK IN/OUT (fichajes)
-- ============================================================
create table clockings (
  id           uuid primary key default uuid_generate_v4(),
  venue_id     uuid references venues(id) on delete cascade,
  staff_id     uuid references staff(id) on delete cascade,
  type         text check (type in ('in','out','break_start','break_end')),
  clocked_at   timestamptz default now(),
  pin_used     boolean default false
);

-- ============================================================
-- LEAVE REQUESTS (vacaciones)
-- ============================================================
create table leave_requests (
  id           uuid primary key default uuid_generate_v4(),
  venue_id     uuid references venues(id) on delete cascade,
  staff_id     uuid references staff(id) on delete cascade,
  start_date   date not null,
  end_date     date not null,
  days         int,
  reason       text,
  status       text default 'pending' check (status in ('pending','approved','rejected')),
  created_at   timestamptz default now()
);

-- ============================================================
-- INVENTORY (inventario)
-- ============================================================
create table inventory_items (
  id              uuid primary key default uuid_generate_v4(),
  venue_id        uuid references venues(id) on delete cascade,
  name            text not null,
  unit            text default 'kg',
  current_stock   numeric(10,3) default 0,
  par_level       numeric(10,3) default 0,
  cost_per_unit   numeric(8,2) default 0,
  supplier        text,
  last_updated    timestamptz default now()
);

-- ============================================================
-- DAILY SALES SUMMARY (for dashboard)
-- ============================================================
create table daily_sales (
  id           uuid primary key default uuid_generate_v4(),
  venue_id     uuid references venues(id) on delete cascade,
  date         date not null,
  total_revenue numeric(10,2) default 0,
  total_orders  int default 0,
  avg_ticket    numeric(8,2) default 0,
  covers        int default 0,
  table_turns   numeric(4,2) default 0,
  unique constraint (venue_id, date)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table venues           enable row level security;
alter table tables           enable row level security;
alter table customers        enable row level security;
alter table reservations     enable row level security;
alter table menu_categories  enable row level security;
alter table menu_items       enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table kitchen_tickets  enable row level security;
alter table staff            enable row level security;
alter table shifts           enable row level security;
alter table clockings        enable row level security;
alter table leave_requests   enable row level security;
alter table inventory_items  enable row level security;
alter table daily_sales      enable row level security;

-- For development: allow all authenticated users to access all data
-- In production, scope by venue_id linked to auth.uid()
create policy "Allow all for authenticated" on venues           for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on tables           for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on customers        for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on reservations     for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on menu_categories  for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on menu_items       for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on orders           for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on order_items      for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on kitchen_tickets  for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on staff            for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on shifts           for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on clockings        for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on leave_requests   for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on inventory_items  for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on daily_sales      for all using (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA — El Bodegón Central (demo venue)
-- ============================================================

-- Venue
insert into venues (id, name, address, city, phone, email, vat_number, plan)
values ('00000000-0000-0000-0000-000000000001', 'El Bodegón Central', 'Calle Mayor 12', 'Madrid', '+34 91 123 4567', 'hola@bodegoncentral.es', 'B12345678', 'profesional');

-- Tables
insert into tables (venue_id, label, section, capacity, status) values
('00000000-0000-0000-0000-000000000001', 'Mesa 1',    'sala',    4, 'occupied'),
('00000000-0000-0000-0000-000000000001', 'Mesa 2',    'sala',    2, 'occupied'),
('00000000-0000-0000-0000-000000000001', 'Mesa 3',    'sala',    4, 'free'),
('00000000-0000-0000-0000-000000000001', 'Mesa 4',    'sala',    2, 'occupied'),
('00000000-0000-0000-0000-000000000001', 'Mesa 5',    'sala',    4, 'reserved'),
('00000000-0000-0000-0000-000000000001', 'Mesa 6',    'sala',    4, 'free'),
('00000000-0000-0000-0000-000000000001', 'Mesa 7',    'sala',    6, 'occupied'),
('00000000-0000-0000-0000-000000000001', 'Mesa 8',    'sala',    2, 'occupied'),
('00000000-0000-0000-0000-000000000001', 'Mesa 9',    'sala',    4, 'free'),
('00000000-0000-0000-0000-000000000001', 'Mesa 10',   'sala',    4, 'occupied'),
('00000000-0000-0000-0000-000000000001', 'Mesa 11',   'sala',    2, 'free'),
('00000000-0000-0000-0000-000000000001', 'Mesa 12',   'sala',    6, 'occupied'),
('00000000-0000-0000-0000-000000000001', 'Privado A', 'privado', 10,'occupied'),
('00000000-0000-0000-0000-000000000001', 'Privado B', 'privado', 14,'free'),
('00000000-0000-0000-0000-000000000001', 'Terraza 1', 'terraza', 4, 'free');

-- Menu categories
insert into menu_categories (id, venue_id, name, sort_order) values
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Entrantes', 1),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Principales', 2),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Postres', 3),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Bebidas', 4);

-- Menu items
insert into menu_items (venue_id, category_id, name, description, price, tag) values
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Croquetas caseras','Jamón ibérico, bechamel suave',9.50,'popular'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Gambas al ajillo','Con guindilla y pan de hogaza',13.80,'popular'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Ensalada mixta','Tomate, lechuga, aceitunas',7.20,'vegano'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Pimientos de Padrón','Fritos, sal gruesa',8.00,'vegano'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Jamón ibérico D.O.','Corte a cuchillo, 80g',18.50,null),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Patatas bravas','Salsa brava y alioli casero',7.80,'popular'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Cocido madrileño','Garbanzos, morcillo, chorizo',17.50,'popular'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Paella valenciana','Pollo, conejo, judías',16.80,null),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Chuletón de buey','700g, con patatas y pimientos',42.00,'nuevo'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Bacalao al pil-pil','Salsa tradicional vasca',21.50,null),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Pollo asado','Medio pollo, limón, tomillo',14.90,null),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Rabo de toro','Estofado, 8 horas de cocción',19.50,'popular'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','Tarta de queso','Estilo Basque, coulis de fresa',6.50,'popular'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','Crema catalana','Azúcar quemado al momento',5.80,null),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','Torrijas caseras','Con miel y canela',6.00,'nuevo'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','Agua mineral','50cl, con o sin gas',2.20,null),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','Cerveza Mahou','Caña 25cl o botella 33cl',2.50,'popular'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','Vino Rioja Crianza','Copa 15cl, Marqués de Riscal',4.50,'popular'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','Café solo','Granos de tueste natural',1.80,null);

-- Staff
insert into staff (venue_id, name, role, pin, initials, color, color_bg) values
('00000000-0000-0000-0000-000000000001','Miguel García','Jefe de cocina','1234','MG','#1A6B55','#E8F5F1'),
('00000000-0000-0000-0000-000000000001','Laura Romero','Camarera','2345','LR','#7C3AED','#EDE9FE'),
('00000000-0000-0000-0000-000000000001','Diego Blanco','Cocinero','3456','DB','#0369A1','#DBEAFE'),
('00000000-0000-0000-0000-000000000001','Sofía Ruiz','Ayudante cocina','4567','SR','#B45309','#FEF3C7'),
('00000000-0000-0000-0000-000000000001','Andrés Pérez','Barman','5678','AP','#1A6B55','#E8F5F1'),
('00000000-0000-0000-0000-000000000001','José Morales','Maître','6789','JM','#7C3AED','#EDE9FE'),
('00000000-0000-0000-0000-000000000001','Paula Navarro','Camarera','7890','PN','#B45309','#FEF3C7'),
('00000000-0000-0000-0000-000000000001','Ricardo López','Cocinero','8901','RL','#0369A1','#DBEAFE');

-- Daily sales (last 7 days)
insert into daily_sales (venue_id, date, total_revenue, total_orders, avg_ticket, covers, table_turns) values
('00000000-0000-0000-0000-000000000001', current_date - 6, 1820.00, 48, 37.92, 52, 1.8),
('00000000-0000-0000-0000-000000000001', current_date - 5, 2480.00, 64, 38.75, 68, 2.2),
('00000000-0000-0000-0000-000000000001', current_date - 4, 1560.00, 41, 38.05, 44, 1.5),
('00000000-0000-0000-0000-000000000001', current_date - 3, 3100.00, 80, 38.75, 86, 2.8),
('00000000-0000-0000-0000-000000000001', current_date - 2, 2200.00, 57, 38.60, 61, 2.1),
('00000000-0000-0000-0000-000000000001', current_date - 1, 3600.00, 92, 39.13, 98, 3.2),
('00000000-0000-0000-0000-000000000001', current_date,     2840.00, 74, 38.38, 79, 2.4);
