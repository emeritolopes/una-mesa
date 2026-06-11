# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project Overview

Una Mesa is a restaurant reservation platform for Vigo, Spain. The monorepo contains two independent frontend apps and a Supabase backend with Deno edge functions.

- **apps/app/** — Customer-facing booking app (comensal)
- **apps/backofhouse/** — Restaurant management panel
- **apps/web/** — Simple redirect hub (unamesa.co → app.unamesa.co)
- **supabase/functions/** — Deno edge functions (Stripe, email, AI concierge)

## No Build Step

Both frontend apps are zero-build. JSX files are compiled at runtime by Babel Standalone loaded from CDN. There is no `npm install`, no webpack, no tsconfig, no bundler. To develop locally, serve the app directory with any static HTTP server (e.g. `npx serve apps/app`) or open `index.html` directly in a browser.

## Frontend Architecture

Both apps use CDN React 18 + Babel Standalone. The `index.html` in each app sets up React globals and loads all `.jsx` and `.js` modules in order via `<script type="text/babel">` tags.

**Critical globals set by `index.html`:**
- `window.useState`, `window.useEffect`, `window.useRef`, `window.useCallback` — used directly in all components (no import statements)
- `window.React` — available globally; JSX compiles against it

**Supabase client singletons:**
- `window.UMAuth.sb` — in `apps/app/` (initialized in `auth.js`)
- `window.sb` — in `apps/backofhouse/` (initialized in `supabase.js`)

**`window.UMAuth`** (exposed by `apps/app/app/auth.js`):
```js
{ signUp, signIn, signOut, getUser, onAuthStateChange, saveReservation, sb }
```

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

`apps/backofhouse/app/store.js` provides a `useStore(key)` hook backed by localStorage. The store initializes from localStorage on first load — when Supabase data arrives, **replace the list entirely** (e.g. `setList(mapped)`) rather than merging, or stale mock/localStorage data will persist.

## Supabase Query Patterns

Both apps use async/await with try/catch for all Supabase queries. The `null` vs `[]` sentinel pattern is used to distinguish "not yet loaded" from "loaded but empty":

```js
const [items, setItems] = useState(null); // null = loading, [] = empty, [...] = data
// ...
const display = items !== null ? items : fallbackMockData;
```

Always call `setItems(data || [])` on success — an empty result must update state to `[]`, not leave it as `null`.

## App-Level Routing

`apps/app/app/app.jsx` manages all routing via a `view` state string (`'home'`, `'results'`, `'detail'`, `'booking'`, `'profile'`). There is no React Router — view transitions are done by setting state and rendering the matching component.
