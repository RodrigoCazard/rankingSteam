# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Architecture

Next.js App Router app (TypeScript + React 19) deployed on Vercel. Tracks Steam game spending for a gaming clan, with monthly trophy awards and admin moderation.

**Stack:** Next.js App Router · Supabase (Postgres, accessed via raw REST fetch — no Supabase SDK) · Tailwind CSS 4 · shadcn/ui (new-york style) · Radix UI

### Required Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `STEAM_API_KEY` | Steam Web API key (for sync) |
| `DISCORD_WEBHOOK_URL` | Discord webhook (optional, for notifications) |
| `ADMIN_PASSWORD` | Admin password checked by `/api/auth` |
| `CRON_SECRET` | Header secret Vercel sends on cron invocations |

### Data Flow

1. `app/page.tsx` renders the ranking dashboard — purely a layout component that consumes `useRanking()`.
2. `components/ranking/use-ranking.ts` is the single state manager for all UI: participants, pending purchases, search, admin mode, and all async actions.
3. API routes under `app/api/` handle all server logic:
   - `/api/data` — multi-method CRUD: GET (ranking), POST (add purchase), DELETE (remove), PATCH (update price), PUT (close month/trophies)
   - `/api/auth` — POST: validates admin password
   - `/api/steam/sync` — POST: pulls each participant's Steam library, inserts new games to `pending_purchases`
   - `/api/steam/search` — GET: queries Steam store catalog with country-specific pricing
   - `/api/steam/pending` — GET/POST/PUT/DELETE: list, approve, add, and reject pending purchases
   - `/api/steam/sync-returns` — POST: removes purchases/pendings whose appid disappeared from the Steam library (refunds)
   - `/api/cron/sync-steam` — daily cron at 08:00 UTC (calls `syncSteamLibraries()` from the sync route)
   - `/api/cron/close-month` — monthly cron on the 1st at 00:00 UTC: inserts trophies for top 3 and shame (position 5) for last place

### Data Model

- **Participant** — `name`, `avatar_url`, `country_code`, `steam_id`, `known_appids` (int array used to detect new/returned games)
- **Purchase** — `game_name`, `game_appid`, `game_image`, `price` (always stored in USD)
- **PendingPurchase** — same shape as Purchase plus `currency` and `detected_at`; held for admin approval
- **Trophy** — `position` (1=gold, 2=silver, 3=bronze, 5=shame 🪳), `month`, `year`, `total_spent`

### Key Directories

- `app/` — Next.js pages and API routes
- `components/ranking/` — all ranking UI: `ParticipantCard`, `AdminPanel`, `PurchaseDialog`, `PendingDialog`, `Header`, `use-ranking.ts`, `types.ts`, `constants.tsx`
- `lib/currency.ts` — `convertToUSD()` with 1-hour cached exchange rates from open.er-api.com
- `lib/discord.ts` — `sendPurchaseNotification()` fires-and-forgets to Discord on purchase approval
- `scripts/` — one-off data migration/admin scripts

### Non-Obvious Behaviors

- **In-memory fallback**: API routes in `/api/data` fall back to hardcoded participants and in-memory arrays when `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent. Other routes (steam, pending) return early with errors/empty data without Supabase.
- **Supabase via raw fetch**: There is no Supabase JS client. All DB access uses direct REST calls with `apikey`/`Authorization: Bearer` headers against `${SUPABASE_URL}/rest/v1/...`.
- **Steam sync — first-sync baseline**: On a participant's first sync (`known_appids` is empty), all current games are recorded as baseline without creating pending purchases. Only subsequent syncs detect new games.
- **Steam sync — known_appids**: When a purchase is manually added via POST `/api/data`, the game's appid is appended to `participant.known_appids` so that the next sync doesn't treat it as new.
- **Returns detection**: `sync-returns` runs in the background after sync; it compares `purchases` and `pending_purchases` against `known_appids` and deletes any whose appid is no longer in the library. If removals are found, the UI refreshes both lists.
- **Trophy position 5 = shame**: Close-month always awards position 5 (🪳) to the last-place participant in addition to positions 1–3.
- **Admin gate**: Destructive actions require `isAdmin` state in the hook, which is set after a successful POST to `/api/auth`. Admin state is client-only (no session/cookie).
- **Cron security**: Cron routes check a `CRON_SECRET` header set by Vercel.
- **Path alias**: `@/*` maps to the repo root (`@/lib/currency` → `lib/currency.ts`).
- **TypeScript errors ignored in build**: `next.config.mjs` sets `ignoreBuildErrors: true`.
- **Image optimization disabled**: `unoptimized: true`; Steam CDN URLs are used directly.
- **`maxDuration = 300`**: Set on the steam sync route to handle large libraries within Vercel's function timeout.
