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

Next.js 16 App Router app (TypeScript + React 19) deployed on Vercel. Tracks Steam game spending for a gaming clan, with monthly trophy awards and admin moderation.

**Stack:** Next.js App Router · Supabase (Postgres) · Tailwind CSS 4 · shadcn/ui (new-york style) · Radix UI

### Data Flow

1. `app/page.tsx` renders the ranking dashboard — it calls `use-ranking.ts` (the single state manager for all UI).
2. `hooks/use-ranking.ts` fetches from `/api/data` and coordinates all client-side state: participants, purchases, trophies, admin mode.
3. API routes under `app/api/` handle all server logic:
   - `/api/data` — returns participants with purchases and trophies
   - `/api/auth` — admin password check
   - `/api/steam/sync` — pulls a participant's Steam library and creates pending purchases
   - `/api/steam/search` — queries Steam game catalog
   - `/api/steam/pending` — lists purchases awaiting admin approval
   - `/api/steam/sync-returns` — marks refunded games
   - `/api/cron/sync-steam` — daily cron (08:00 UTC via `vercel.json`)
   - `/api/cron/close-month` — monthly cron (00:00 on 1st) assigns trophies and resets

### Data Model

- **Participant** — user with `name`, `avatar`, `total_spent`, `purchases[]`, `trophies[]`
- **Purchase** — `game_name`, `game_appid`, `price`, approval status
- **PendingPurchase** — same shape, held for admin review
- **Trophy** — `position` (1–3), `month`, `year`, `total_spent`

### Key Directories

- `app/` — Next.js pages and API routes
- `components/ranking/` — UI components (`ParticipantCard`, `AdminPanel`, `PurchaseDialog`, `PendingDialog`, `Header`)
- `hooks/` — `use-ranking.ts` (all client state)
- `lib/` — `currency.ts` (formatting), `discord.ts` (webhook notifications)
- `scripts/` — one-off data migration/admin scripts

### Non-Obvious Behaviors

- **In-memory fallback**: API routes fall back to hardcoded participants and in-memory storage when Supabase env vars are absent (v0 preview mode). Real deploys require `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- **Admin gate**: Destructive actions (add game, approve/reject purchase, close month) require the admin password, checked via `/api/auth`. The password is stored in an env var.
- **Cron security**: Cron routes check a `CRON_SECRET` header set by Vercel to prevent unauthorized triggers.
- **Path alias**: `@/*` maps to the repo root, so `@/lib/currency` resolves to `lib/currency.ts`.
- **TypeScript errors ignored in build**: `next.config.mjs` sets `ignoreBuildErrors: true` — type errors won't block deployment.
- **Image optimization disabled**: `unoptimized: true` in next.config.mjs; Steam avatar URLs are used directly.
