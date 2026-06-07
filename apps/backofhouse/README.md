# Unamesa — Backend Setup

## Paso 1 — Supabase: Crear la base de datos

1. Ve a **supabase.com** → tu proyecto → **SQL Editor**
2. Abre el archivo `supabase/migrations/001_unamesa_schema.sql`
3. Copia todo el contenido y pégalo en el SQL Editor
4. Haz clic en **Run** — esto crea todas las tablas y el seed data

## Paso 2 — Obtener tus claves de Supabase

1. En tu proyecto Supabase ve a **Settings → API**
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## Paso 3 — Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y pega tus claves:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Paso 4 — Instalar dependencias y arrancar

```bash
npm install
npm run dev
```

Abre **http://localhost:5173** — deberías ver el dashboard con los datos del seed.

## Paso 5 — Deploy en Vercel

1. Crea una cuenta en **vercel.com**
2. Conecta tu repositorio de GitHub
3. En **Settings → Environment Variables** añade las dos variables del `.env`
4. Vercel detecta Vite automáticamente y despliega en segundos
5. Tu URL será algo como `unamesa-xxxx.vercel.app`

## Estructura del proyecto

```
unamesa/
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Cliente Supabase + tipos TypeScript
│   ├── hooks/
│   │   └── useUnamesa.ts        # Todos los hooks de datos (CRUD real)
│   ├── components/
│   │   ├── dashboard/Dashboard.tsx
│   │   ├── reservas/Reservas.tsx
│   │   ├── tpv/TPV.tsx
│   │   ├── cocina/Cocina.tsx    # Realtime via Supabase channels
│   │   └── personal/Personal.tsx
│   ├── App.tsx                  # Router + Sidebar
│   └── main.tsx
├── supabase/
│   └── migrations/
│       └── 001_unamesa_schema.sql  # Schema completo + seed data
├── .env.example
└── README.md
```

## Módulos y tablas

| Módulo     | Tablas Supabase                                  |
|------------|--------------------------------------------------|
| Dashboard  | `daily_sales`, `tables`, `clockings`, `kitchen_tickets` |
| Reservas   | `reservations`, `tables`, `customers`            |
| TPV        | `orders`, `order_items`, `tables`, `menu_items`, `menu_categories` |
| Cocina     | `kitchen_tickets`, `orders`, `order_items` (realtime) |
| Personal   | `staff`, `shifts`, `clockings`, `leave_requests` |

## Realtime

La pantalla de Cocina se actualiza automáticamente vía **Supabase Realtime**.
Cuando el TPV envía una comanda a cocina, aparece en tiempo real sin recargar.

Para activar Realtime en Supabase:
1. Ve a **Database → Replication**
2. Activa la tabla `kitchen_tickets` en el canal `0`
