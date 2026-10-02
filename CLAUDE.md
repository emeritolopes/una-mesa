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
| `auto-capture` | Cron every 15 min, service-role bearer token checked in code (not just `verify_jwt`). Captures deposits for `pending` reservations past the grace period (`reservations_due_capture` view) — the automatic no-show capture. Uses `try_lock_deposit_capture` so it can't race `mark-noshow` / `mark-completed` for the same deposit. |
| `mark-noshow` | JSON API behind a single-use `noshow_tokens` link (no login) — same pattern as `respond-reservation`: opening the link only validates, `{ execute: true, outcome }` resolves the reservation as `'completed'` or `'no_show'` (both capture the deposit via the same lock as `auto-capture`; only the label differs). `verify_jwt = false`. |
| `mark-completed` | The restaurant's own authenticated backofhouse action to resolve a reservation as `'completed'` or `'no_show'` — re-checks the caller owns the venue via `restaurant_users`, then captures the deposit with the same lock as `mark-noshow` / `auto-capture`. Replaces an old client-side status update that never touched Stripe and left deposits captured-never. |
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
| `cancel-reservation` / `cancel-reservation-guest` | Diner cancels (account: JWT, owner check; guest: single-use `cancel_tokens` link). Applies the 24 h deposit policy, emails the diner, and — when the diner (not the restaurant) cancels — emails the restaurant an informational "booking cancelled by guest" notice (`send-email` `guest_cancelled: true`, non-blocking). Guest cancel links (`cancel_url`, `/?cancel_token=…&lang=…`) are in deposit-booking emails (`stripe-webhook`) and in instantly-confirmed no-deposit emails (`create-reservation`, token via `generate_cancel_token`, non-blocking); not yet in manual-confirmation (`pending`) bookings once confirmed. The response includes `had_deposit` so the app screen doesn't mention a deposit on a £0 booking. |
| `send-reservation-reminders` | Cron every 30 min (migration `050`, same Vault pattern as `expire-pending-reservations`). Sends the diner ONE reminder email per `'confirmed'` reservation with an email (`send-email` `diner_reminder: true`, with the `cancel_url` guest link): when 24 h or less (and at least 2 h) remain until the slot in the venue's timezone, and the booking was made 6 h or more ago (so it doesn't land right next to the confirmation). Claims the reservation atomically (`reservations.reminder_sent_at is null`) before sending; if the email fails it releases the claim to retry. `{ "dry_run": true }` reports without sending. `verify_jwt = true`. Migration `050` also sets `venues.timezone = 'Europe/London'` for London venues that had it null/Madrid (`generate_cancel_token` and the 24 h cancel window read it). |
| `health-check` | Cron. Checks for stuck deposits (`find_stuck_reservations`) and missed cron runs (`find_cron_issues`), emails an alert if anything's off. `config.toml` sets `verify_jwt = true` — the function's own header comment still claims `false` ("pg_cron can't send a real user Authorization header"); that comment is stale. |
| `onboarding-reminder` | Cron. One-time nudge (never repeats per venue) to venues that started Stripe Connect onboarding 24h+ ago but haven't finished (`stripe_charges_enabled = false`). |
| `monthly-report` | Cron (`call_monthly_report`, migration `042`) or admin-triggered. Emails each venue its previous month's `venue_funnel()` numbers; `venue_monthly_reports` caps it to once per venue per month, and venues with nothing to report (no views, no bookings) are skipped. Accepts `dry_run` and `preview_to` for testing without emailing real restaurants. |
| `upsert-customer` | Create or update a customer profile in the `customers` table; called after every reservation (web + phone) |
| `delete-account` | Diner self-service account deletion. Identity comes only from the caller's own JWT, never a body param (so one user can't delete another's account by email). Anonymizes their reservations instead of deleting them (the restaurant still needs the booking record), deletes their `customers` row, then the Auth user. |
| `vapi-availability` | Vapi tool webhook — checks hardcoded lunch/dinner slots; no DB calls (avoids Vapi's 20s timeout) |
| `vapi-reservation` | Vapi tool webhook — creates reservation, calls `upsert-customer`, optionally sends payment link + email |
| `concierge` | Agentic AI concierge (Anthropic Claude); tools: `check_availability`, `create_reservation`, `start_reservation` |
| `menu-video-upload` | Admin-only. Mints a Cloudflare Stream **direct creator upload** URL (`action: 'create'`) and polls processing status (`action: 'status'`) so the admin browser uploads dish videos straight to Cloudflare — the `CLOUDFLARE_API_TOKEN` never reaches the client. Needs `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` secrets. |
| `create-venue` | Admin-only. Creates a venue row and a 30-day Stripe Connect invite token in one step (same token mechanism as `stripe-connect-onboard`, but doesn't create the Stripe account itself — that happens lazily in `stripe-connect-self-onboard` the first time the venue opens the link); emails the invite link, non-blocking. |
| `update-venue` | Admin-only. Patches an allow-listed set of venue fields (name, address, deposit amount, hours, photos, etc.) — never `stripe_connect_account_id` / `stripe_charges_enabled`, which only the Connect functions may touch. |
| `invite-restaurant` | Admin-only. Creates the restaurant's Supabase Auth user via `inviteUserByEmail` and links it in `restaurant_users`. |
| `stripe-connect-onboard` | Admin-only. Creates the venue's Stripe Express account (country derived from `city`: London→GB, else ES) and returns a hosted onboarding link; issues the same 30-day self-service invite token as `create-venue` if the venue doesn't already have one. |
| `stripe-connect-self-onboard` | Public, no login — the restaurant's own entry point via the invite-token link emailed to them, generating a fresh Stripe onboarding link each time it's opened. Refuses to issue a new link once `stripe_charges_enabled = true`, so an old email link can't be replayed to redirect an already-active venue's payouts to a different bank account. |
| `submit-restaurant-lead` | Public "interested in listing" form on the marketing site. Rate-limited to 3 submissions/hour per IP (anti-bot), stores the lead, emails the admin — doesn't create a venue itself, that's still a manual follow-up. |

Of the 32 edge functions, 26 have an explicit `verify_jwt` entry in `config.toml` (20 `true`, 6 `false`); the rest (`create-reservation`, `send-cancellation-email`, `stripe-payment-link`, `upsert-customer`, `vapi-availability`, `vapi-reservation`) have no entry at all — functionally public, same as the explicit-`false` group, since their real callers (an anonymous diner, Vapi's webhook, or another edge function) can't present a user JWT. Many `verify_jwt = true` functions still do their own admin/owner check against `admins` or `restaurant_users` rather than relying on `verify_jwt` alone (e.g. `create-venue`, `update-venue`, `invite-restaurant`, `stripe-connect-onboard`, `mark-completed`, `delete-account`) — `verify_jwt = true` only proves the caller has *a* valid session, not that they own the resource.

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

**Consumer app** (`apps/app/app/app.jsx`): `route` state object with a `view` string — `'home'`, `'results'`, `'detail'`, `'booking'`, `'concierge'`, `'profile'`. Navigate with `setRoute(...)` helpers (`go`, `openRest`, `search`, etc.). No React Router. Every route change (any setter — `go`, `openRest`, `search`, `startBook`, login…) is mirrored by one `useEffect` in `app.jsx` to the URL hash (`routeToHash`: `#detail/<id>`, `#booking/<id>`, `#results/<q>`, `#concierge/<q>`, `#profile`, `#home`) via `history.pushState`, and to `sessionStorage` `um-route`; browser back/forward and manual hash changes set `replaceUrlRef` so they replace instead of push. On load the hash wins; `sessionStorage` is used when it points at the same place (it keeps booking presets the hash can't carry). Refreshing therefore keeps the user on the same screen. `#profile` waits for the Supabase auth check (`authChecked`) and only falls back to home when there is no session.

**Booking clock:** `compiled/booking.js` reads "now" in the **venue's** timezone each time (`venueClock(r.timezone)`; `mapVenue` in `data.js` exposes `timezone`: London by city like the server, else the row's value, else Madrid) for hiding past slots and the past-time check — never in the browser's or Madrid's.

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
