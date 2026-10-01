# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Una Mesa is a restaurant reservation platform. London, UK is the current primary market (`app.unamesa.co.uk`); Madrid, Spain (`app.unamesa.co`) is the next market being onboarded. The monorepo contains two independent frontend apps and a Supabase backend with Deno edge functions.

- **apps/app/** — Customer-facing booking app (comensal)
- **apps/backofhouse/** — Restaurant management panel
- **apps/web/** — Simple redirect hub (unamesa.co → app.unamesa.co)
- **supabase/functions/** — Deno edge functions (Stripe, email, AI concierge)

## No Build Step

Both frontend apps are zero-build in principle — no `npm install`, no webpack, no tsconfig, no bundler. To develop locally, serve the app directory with any static HTTP server (e.g. `npx serve apps/app`) or open `index.html` directly in a browser.

**Exception — `apps/app/` does NOT compile JSX at runtime**, despite the rest of this doc describing that model. `apps/app/index.html` loads no Babel Standalone script at all; instead it loads pre-compiled plain-JS files from `apps/app/app/compiled/*.js` (one per `.jsx` source: `components`, `home`, `results`, `detail`, `booking`, `concierge`, `reserve-auth`, `profile-extras`, `profile`, `app`). **There is no build script in this repo that regenerates `compiled/*.js` from the matching `.jsx`.** If you edit a `.jsx` file under `apps/app/app/`, you must manually re-apply the same change to its `compiled/*.js` counterpart, or the edit has zero effect in the browser — found while investigating a change to `detail.jsx` that turned out to need the same edit in `compiled/detail.js` to actually ship. `apps/backofhouse/` is unaffected — it genuinely loads Babel Standalone from CDN and compiles `.jsx` at runtime, exactly as described below.

## Frontend Architecture

Both apps use CDN React 18. `apps/backofhouse/` uses Babel Standalone: `index.html` sets up React globals and loads all `.jsx`/`.js` modules in order via `<script type="text/babel">` tags. `apps/app/` loads its React-component modules as plain `<script src="app/compiled/*.js">` (see the "No Build Step" exception above) — only `data.js`/`auth.js` are loaded as-is (they're already plain JS, not JSX). **Script order matters in both apps** — components must be declared in `index.html` before the files that reference them.

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
- `window.UM_DATA`, `window.UM_GEOCODE`, `window.loadRestaurants` — consumer app (`data.js`). See comment on `mapVenue()` (`data.js`) about new `venues` columns not reaching `UM_DATA` automatically.
- `window.DATA` — backofhouse (`data.js`); seeds the Store on first load and after a date change

**Styling:** `apps/backofhouse/` uses Tailwind CSS CDN (`https://cdn.tailwindcss.com`) with a custom config — brand color `#D8552E`, warm gray scale, and `Manrope` as `font-sans`. Dark mode overrides are applied via `[data-theme="noche"]` attribute selectors in `index.html` (not Tailwind's `dark:` variant). The consumer app uses a hand-written CSS file (`app/app.css`) with CSS variables.

**Icons:** `apps/backofhouse/` uses Tabler Icons webfont — `<i className="ti ti-*" />`. The consumer app uses `window.Icon` (a custom component in `components.jsx`).

**Themes:** both apps support `'crema'` (light) and `'noche'` (dark), stored in `localStorage` as `'um-theme'` and applied as `data-theme` on `<html>`. Theme changes sync across tabs in real time via the `storage` event.

## Key Data Conventions

- **Dates**: always use `toLocaleDateString('en-CA')` (→ `YYYY-MM-DD` in local timezone). Never use `toISOString().split('T')[0]` — that returns UTC, which shifts the date in Spain (UTC+2).
- **Deposit amounts**: stored in Supabase as **cents** (`deposit_amount` column). Divide by 100 for display. Send cents directly to Stripe edge functions.
- **Reservation status**: raw Supabase statuses are `'confirmed'`, `'pending'`, `'cancelled'`. The consumer app maps these to internal `'up'`/`'past'` for UI rendering — always use `rawStatus` or `r.status` directly for business logic.
- **Customer profiles**: the `customers` table (`id`, `venue_id`, `name`, `email`, `phone`, `allergies[]`, `notes`, `visits`, `last_visit`, `vip`) is linked to `reservations` via `customer_id` FK. The `upsert-customer` function maintains this on every reservation creation. In backofhouse `modules.jsx`, the customer profile loads when a reservation with a non-null `customer_id` is selected.

## Supabase Edge Functions

Functions live in `supabase/functions/` and run on Deno. Each function is a standalone file at `supabase/functions/<name>/index.ts`.

| Function | Purpose |
|---|---|
| `stripe-payment` | Create Stripe PaymentIntent (manual capture, `capture_method: 'manual'`) |
| `stripe-capture` | Capture a previously created PaymentIntent |
| `stripe-refund` | Cancel (`requires_capture`) or refund (`succeeded`) a PaymentIntent |
| `stripe-payment-link` | Create a Stripe Payment Link for a reservation (used by `vapi-reservation`) |
| `stripe-webhook` | Handle Stripe webhook events (payment captured/refunded → update reservation status) |
| `send-email` | Send reservation confirmation HTML email via Resend |
| `send-cancellation-email` | Send cancellation HTML email via Resend |
| `update-reservation` | Patch reservation status in DB (only `'cancelled'` is allowed) |
| `create-reservation` | Creates a reservation WITHOUT deposit (party below `venues.deposit_min_party_size`). Per-venue opt-ins (migration `044`, off by default): `manual_confirmation` → reservation is `'pending'` and the restaurant gets an email with Confirm / Decline buttons (rolls back + errors if that email can't be sent); `max_covers_per_service` → cap per day and service (lunch < 17:00, dinner ≥ 17:00), counting Una Mesa bookings only, not atomic. Rejects `party` > 100. Falls back to the old columns if migration `044` isn't applied yet. When the booking is confirmed instantly (manual confirmation off) and the venue has an email, it also sends the restaurant an informational "New booking" email (`send-email` `new_booking: true`, no buttons, non-blocking) — otherwise a no-deposit booking would be visible only in the backofhouse panel. |
| `create-manual-reservation` | Reservation created by the restaurant itself from backofhouse "Nueva reserva" (phone / walk-in). `verify_jwt = true` and re-checks the caller in `restaurant_users` — the venue comes from the session, never the body. No deposit, no emails, `source = 'backofhouse'` (excluded from `venue_funnel`, migration `048`). Covers cap (`max_covers_per_service`) is a warning (`over_capacity`), not a block. Calls `upsert-customer` (profile only created when a phone is given). |
| `respond-reservation` | Restaurant confirms/declines a `'pending'` reservation via single-use token (`reservation_response_tokens`). Two entry points: (A) the email link (token); (B) the backofhouse "Esperan tu respuesta" inbox in `Reservas` sends `{ reservation_id, action, execute: true }` with the user's JWT, and the function re-checks against `restaurant_users` that the reservation belongs to the caller's venue. JSON API like `mark-noshow`: the screen lives in backofhouse (`?respond_token=…&action=confirm\|decline`, `RespondReservationScreen` in `shell.jsx`); opening the link only validates, a real click executes. Atomic PATCH only while still `pending`; emails the diner (`send-email` modes `response_status`, `pending_notice`, `respond_*_url`). `verify_jwt = false`. |
| `expire-pending-reservations` | Cron every 15 min (migration `046`, same Vault pattern as `auto-capture`). For `'pending'` reservations with an unused response token (manual-confirmation venues): halfway through the window it re-sends the Confirm/Decline email to the restaurant (`send-email` `reminder: true`, `reservation_response_tokens.reminder_sent_at`); at the deadline it cancels the reservation (atomic PATCH only while still `pending`) and emails the diner (`response_status: 'expired'`). Window = `max(created+1h, min(created+12h, slot−1h))`; slot time uses Europe/London for London venues, Europe/Madrid otherwise. `{ "dry_run": true }` reports without changing anything. `verify_jwt = true`. |
| `cancel-reservation` / `cancel-reservation-guest` | Diner cancels (account: JWT, owner check; guest: single-use `cancel_tokens` link). Applies the 24 h deposit policy, emails the diner, and — when the diner (not the restaurant) cancels — emails the restaurant an informational "booking cancelled by guest" notice (`send-email` `guest_cancelled: true`, non-blocking). Guest cancel links only exist in deposit-booking emails today. |
| `upsert-customer` | Create or update a customer profile in the `customers` table; called after every reservation (web + phone) |
| `vapi-availability` | Vapi tool webhook — checks hardcoded lunch/dinner slots; no DB calls (avoids Vapi's 20s timeout) |
| `vapi-reservation` | Vapi tool webhook — creates reservation, calls `upsert-customer`, optionally sends payment link + email |
| `concierge` | Agentic AI concierge (Anthropic Claude); tools: `check_availability`, `create_reservation`, `start_reservation` |
| `menu-video-upload` | Admin-only. Mints a Cloudflare Stream **direct creator upload** URL (`action: 'create'`) and polls processing status (`action: 'status'`) so the admin browser uploads dish videos straight to Cloudflare — the `CLOUDFLARE_API_TOKEN` never reaches the client. Needs `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` secrets. |

Most edge functions run with `verify_jwt = false` and rely on input validation; a few (`upload-venue-photo`, `menu-video-upload`, the Stripe/venue admin functions) set `verify_jwt = true` in `config.toml` **and** re-check the caller against the `admins` table.

**Dish videos — Cloudflare Stream:** `menu_videos.video_url` holds a Cloudflare **HLS** URL (`.m3u8`) and `menu_videos.stream_uid` the Stream UID (migration `040`; `legacy_storage_url` keeps the pre-migration Supabase Storage URL). One-off backfill: `scripts/migrate-videos-to-stream.mjs` (gitignored, reads `.env.local`). Playback in `apps/app/menu-video/index.html` and the `apps/admin/` previews uses `hls.js` (CDN) with a shared `umLoadVideo()` helper — Safari plays HLS natively. The `menu-videos` Supabase Storage bucket still exists but new uploads no longer go there.

**Restaurant funnel (migration `041`):** restaurant-page visits go to `venue_page_views`; the two in-between steps go to `venue_events` (`event` = `'video_view'` from `apps/app/menu-video/` after 2 s of playback, `'booking_start'` when `BookingScreen` mounts, via `window.umTrack()` in `data.js`; anonymous, with a per-tab `sessionStorage` id `um-sid`). `venue_funnel(venue_id, from, to)` (security definer, admin or that venue's `restaurant_users` only) returns views → video views → booking starts → bookings → covers → attended covers → no-shows, counting only non-`phone_agent` reservations by reservation date.

**Vapi webhook security:** `vapi-availability` and `vapi-reservation` verify an `x-vapi-secret` header against the `VAPI_WEBHOOK_SECRET` env var. The guard is `if (expectedSecret && secret !== expectedSecret)` — a no-op until the secret is set, so it's safe to deploy before configuring Vapi.

```bash
supabase secrets set VAPI_WEBHOOK_SECRET=<hex-secret>
# Also add x-vapi-secret header in Vapi dashboard → Assistants → Tools → Server Headers
```

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

**Screen-to-file mapping:** `panel.jsx`, `carta.jsx`, `informes.jsx`, `ajustes.jsx`, `stock.jsx`, `floorplan.jsx` are each standalone files. `modules.jsx` contains four screens in a single file: `Reservas`, `TPV`, `Cocina`, and `Personal`.

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

**Consumer app** (`apps/app/app/app.jsx`): `route` state object with a `view` string — `'home'`, `'results'`, `'detail'`, `'booking'`, `'concierge'`, `'profile'`. Navigate with `setRoute(...)` helpers (`go`, `openRest`, `search`, etc.). No React Router. Route state is persisted to `sessionStorage` (not localStorage) so it survives same-tab refreshes but resets on new tabs; `'profile'` view is intentionally reset to `'home'` on reload.

**Consumer app script load order** (`apps/app/index.html`): `data.js` → `auth.js` → `components` → `home` → `results` → `detail` → `booking` → `concierge` → `reserve-auth` → `profile-extras` → `profile` → `app`. Named here by their `.jsx` source for readability, but per the "No Build Step" exception above, the file actually loaded for each is `apps/app/app/compiled/<name>.js` — edit the `.jsx`, then manually mirror the change into `compiled/<name>.js` too.

- `reserve-auth.jsx` — pre-booking auth gate (sign up / guest / sign in flow + `ClaimSpoonsModal`)
- `profile-extras.jsx` — Pasaporte Gastronómico, Paladar IA, and Mercado de Cucharas tabs inside the profile view

**Unloaded files in consumer app:** `apps/app/app/` contains several files that are **not** referenced in `apps/app/index.html` — they are not active in the consumer app: `ajustes.jsx`, `carta.jsx`, `floorplan.jsx`, `informes.jsx`, `login.jsx`, `modules.jsx`, `panel.jsx`, `shell.jsx`, `stock.jsx`, `store.js`, `ui.jsx`.

**Video menu** (`apps/app/menu-video/index.html`): a standalone page, outside the `route`/`view` state above — not one of the SPA views, its own static HTML file linked from the `'detail'` view (`/menu-video/?venue=<slug>`, looked up against `venues.slug`) and served directly by Vercel, not through `app.jsx`'s routing. Two responsive variants of the same page, split at a 900px breakpoint: a horizontal scroll-snap carousel on desktop, and an Instagram-Reels-style full-screen vertical category feed on mobile — both driven by the same fetched data, no separate mobile fetch.

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
