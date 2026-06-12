# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Una Mesa is a restaurant reservation platform for Vigo, Spain. The monorepo contains two independent frontend apps and a Supabase backend with Deno edge functions.

- **apps/app/** — Customer-facing booking app (comensal)
- **apps/backofhouse/** — Restaurant management panel
- **apps/web/** — Simple redirect hub (unamesa.co → app.unamesa.co)
- **supabase/functions/** — Deno edge functions (Stripe, email, AI concierge)

## No Build Step

Both frontend apps are zero-build. JSX files are compiled at runtime by Babel Standalone loaded from CDN. There is no `npm install`, no webpack, no tsconfig, no bundler. To develop locally, serve the app directory with any static HTTP server (e.g. `npx serve apps/app`) or open `index.html` directly in a browser.

## Frontend Architecture

Both apps use CDN React 18 + Babel Standalone. The `index.html` in each app sets up React globals and loads all `.jsx` and `.js` modules in order via `<script type="text/babel">` tags. **Script order matters** — components must be declared in `index.html` before the files that reference them.

**React hook globals:**
- `apps/app/`: exposes `window.useState`, `window.useEffect`, `window.useRef` only
- `apps/backofhouse/`: exposes all of the above plus `window.useCallback`, `window.useMemo`
- Never use import statements — all hooks are consumed as bare globals in JSX files

**Supabase client singletons:**
- `window.UMAuth.sb` — in `apps/app/` (initialized in `auth.js`)
- `window.sb` — in `apps/backofhouse/` (initialized in `supabase.js`)

**`window.UMAuth`** (exposed by `apps/app/app/auth.js`):
```js
{ signUp, signIn, signOut, getUser, onAuthStateChange, saveReservation, sb }
```

**Mock data globals:**
- `window.UM_DATA`, `window.UM_GEOCODE`, `window.loadRestaurants` — consumer app (`data.js`)
- `window.DATA` — backofhouse (`data.js`); seeds the Store on first load and after a date change

**Icons:** `apps/backofhouse/` uses Tabler Icons webfont — `<i className="ti ti-*" />`. The consumer app uses `window.Icon` (a custom component in `components.jsx`).

**Themes:** both apps support `'crema'` (light) and `'noche'` (dark), stored in `localStorage` as `'um-theme'` and applied as `data-theme` on `<html>`. Theme changes sync across tabs in real time via the `storage` event.

## Key Data Conventions

- **Dates**: always use `toLocaleDateString('en-CA')` (→ `YYYY-MM-DD` in local timezone). Never use `toISOString().split('T')[0]` — that returns UTC, which shifts the date in Spain (UTC+2).
- **Deposit amounts**: stored in Supabase as **cents** (`deposit_amount` column). Divide by 100 for display. Send cents directly to Stripe edge functions.
- **Reservation status**: raw Supabase statuses are `'confirmed'`, `'pending'`, `'cancelled'`. The consumer app maps these to internal `'up'`/`'past'` for UI rendering — always use `rawStatus` or `r.status` directly for business logic.

## Supabase Edge Functions

Functions live in `supabase/functions/` and run on Deno. Each function is a standalone file at `supabase/functions/<name>/index.ts`.

| Function | Purpose |
|---|---|
| `stripe-payment` | Create Stripe PaymentIntent (manual capture, `capture_method: 'manual'`) |
| `stripe-capture` | Capture a previously created PaymentIntent |
| `stripe-refund` | Cancel (`requires_capture`) or refund (`succeeded`) a PaymentIntent |
| `send-email` | Send reservation confirmation HTML email via Resend |
| `concierge` | AI restaurant assistant powered by Anthropic Claude API |

**Local edge function development:**
```bash
supabase start           # start local Supabase stack
supabase functions serve # serve all functions locally with hot reload
```

**Deploy a single function:**
```bash
supabase functions deploy stripe-refund
```

**Set secrets (env vars for functions):**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

## State Management (backofhouse)

`apps/backofhouse/app/store.js` exposes `window.Store` (plain object) and `window.useStore(key)` (React hook). The store seeds from `window.DATA` on first boot and reseeds automatically when the calendar date changes. State is persisted to localStorage under the versioned key `unamesa.store.v7` — bump the version suffix when the shape of mock data changes to force a client reset.

```js
// Read + subscribe in a component
const [menu, setMenu] = useStore('menu');

// Write from anywhere (no React needed)
Store.set('reservations', updated);
Store.set('orders', prev => [...prev, newOrder]); // updater form
```

When Supabase data arrives, replace the entire key with the fetched list rather than merging it — otherwise stale mock data from the seed persists.

## Supabase Query Patterns

Both apps use async/await with try/catch for all Supabase queries. The `null` vs `[]` sentinel pattern is used to distinguish "not yet loaded" from "loaded but empty":

```js
const [items, setItems] = useState(null); // null = loading, [] = empty, [...] = data
// ...
const display = items !== null ? items : fallbackMockData;
```

Always call `setItems(data || [])` on success — an empty result must update state to `[]`, not leave it as `null`.

## App-Level Routing

**Consumer app** (`apps/app/app/app.jsx`): `route` state object with a `view` string — `'home'`, `'results'`, `'detail'`, `'booking'`, `'concierge'`, `'profile'`. Navigate with `setRoute(...)` helpers (`go`, `openRest`, `search`, etc.). No React Router.

**Backofhouse** (`apps/backofhouse/app/shell.jsx`): `view` string — `'panel'`, `'reservas'`, `'tpv'`, `'cocina'`, `'carta'`, `'stock'`, `'personal'`, `'informes'`, `'ajustes'`. Persisted to `localStorage` as `'unamesa.view'`. Navigate via `go(viewName)`.

## localStorage Key Inventory

| Key | App | Contents |
|---|---|---|
| `um-theme` | both | `'crema'` or `'noche'`; cross-tab synced |
| `um-app-user` | consumer | serialised `{ id, name, email }` |
| `um-app-favs` | consumer | array of restaurant IDs |
| `um-app-bookings` | consumer | array of booking objects |
| `um-spoons` | consumer | integer Cucharas de Oro loyalty points |
| `unamesa.user` | backofhouse | serialised staff user |
| `unamesa.view` | backofhouse | last active view string |
| `unamesa.store.v7` | backofhouse | full Store state snapshot |
