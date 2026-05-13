# PRD: Email price-change notifications via Resend

## Context

The backend scaffold (PRD-003) is live: Express + Drizzle + Supabase Auth on Fly.io. The `public.users` table already has a `notification_email_opt_in` boolean column added in PRD-003 as a forward-compat placeholder. No favorites, no scheduler, and no email integration exist yet — all were explicitly out of scope.

The product motivation (from PRD-003) was: **"logged-in users receive notifications when a favorite's price changes significantly."** This PRD closes that loop.

## Problem

Users who care about a specific car have no way to:
1. tell the app which cars they want to watch
2. learn when a watched car's FIPE price changes

Every month FIPE publishes updated reference tables. Without automation, users must manually return to the site and re-run a lookup to notice a change. That friction means they don't come back.

## Goal

Let opted-in users save favorite cars and receive a daily email when any favorite's FIPE price changes relative to the previous known price.

## Solution

### Overview

Five additions on top of the existing backend:

1. **`favorites` table** — `(user_id, fipe_code)` pairs; one row per car a user is watching.
2. **`price_snapshots` table** — last known price per `fipe_code`; updated after every worker run.
3. **`notification_logs` table** — audit + dedup; one row per `(user_id, fipe_code, reference_month)` sent.
4. **Favorites REST routes** — `GET/POST/DELETE /favorites`, all behind `requireAuth`.
5. **Worker endpoint + Resend** — `POST /worker/check-prices` (secret-key protected) fetches current prices, diffs them, and emails affected opted-in users via Resend.

A free cron service (cron-job.org) hits the worker endpoint once daily; the Fly machine wakes, runs the check, goes back to sleep. No persistent worker process — `min_machines_running` stays `0`.

---

### Database

#### `favorites`

`backend/src/db/schema/favorites.ts`

| Column        | Type                        | Notes                                         |
|---------------|-----------------------------|-----------------------------------------------|
| `id`          | `uuid` PK                   | `gen_random_uuid()`.                          |
| `user_id`     | `uuid NOT NULL`             | FK → `public.users.id` ON DELETE CASCADE.     |
| `fipe_code`   | `text NOT NULL`             | Matches `HistoryEntry.fipeCode` on frontend.  |
| `vehicle_label` | `text NOT NULL`           | Human-readable, e.g. `"Honda Civic 2020 1.5"`. Stored once so emails don't need an extra API call. |
| `created_at`  | `timestamptz NOT NULL DEFAULT now()` |                                    |

Unique constraint: `(user_id, fipe_code)`.

#### `price_snapshots`

`backend/src/db/schema/priceSnapshots.ts`

| Column            | Type             | Notes                                                   |
|-------------------|------------------|---------------------------------------------------------|
| `fipe_code`       | `text` PK        | One row per vehicle code.                               |
| `price_brl`       | `integer NOT NULL` | Price in centavos (avoids float precision issues).    |
| `reference_month` | `text NOT NULL`  | FIPE reference string, e.g. `"março de 2025"`.         |
| `checked_at`      | `timestamptz NOT NULL DEFAULT now()` |                                       |

#### `notification_logs`

`backend/src/db/schema/notificationLogs.ts`

| Column            | Type             | Notes                                                   |
|-------------------|------------------|---------------------------------------------------------|
| `id`              | `uuid` PK        | `gen_random_uuid()`.                                    |
| `user_id`         | `uuid NOT NULL`  | FK → `public.users.id` ON DELETE CASCADE.               |
| `fipe_code`       | `text NOT NULL`  |                                                         |
| `reference_month` | `text NOT NULL`  | Dedup key: don't email same user, same car, same month. |
| `old_price_brl`   | `integer NOT NULL` |                                                       |
| `new_price_brl`   | `integer NOT NULL` |                                                       |
| `sent_at`         | `timestamptz NOT NULL DEFAULT now()` |                                       |

Unique constraint: `(user_id, fipe_code, reference_month)`.

Migrations are generated via `drizzle-kit generate` — never hand-edited SQL for schema changes.

---

### Resend integration

#### `src/lib/resend.ts`

```ts
import { Resend } from 'resend'
import { env } from '../env.js'

export const resend = new Resend(env.RESEND_API_KEY)
```

#### Email template — `src/emails/priceAlert.ts`

Plain function that returns `{ subject, html, text }` given:
- `vehicleLabel: string`
- `oldPrice: number` (centavos)
- `newPrice: number` (centavos)
- `referenceMonth: string`

Renders a minimal, readable HTML email and a plain-text fallback. No external template engine — just tagged template literals.

Sender address: `alertas@fipefacil.com` (or the Resend-verified domain). Subject: `"Atualização de preço: {vehicleLabel}"`.

---

### Favorites routes

`src/routes/favorites.ts` — mounted at `/favorites`, all behind `requireAuth`.

| Method   | Path            | Behavior                                                                 |
|----------|-----------------|--------------------------------------------------------------------------|
| `GET`    | `/favorites`    | Returns all favorites for `req.user.id`, ordered by `created_at DESC`.  |
| `POST`   | `/favorites`    | Body: `{ fipeCode, vehicleLabel }`. Inserts; ignores if already exists. Returns the row. |
| `DELETE` | `/favorites/:fipeCode` | Deletes the row for `(req.user.id, fipeCode)`. 204 on success, 404 if not found. |

Validation via Zod in `src/schemas/favorites.ts`.

---

### Worker endpoint

`POST /worker/check-prices`

Protected by `WORKER_SECRET` — request must include `Authorization: Bearer <WORKER_SECRET>`. No Supabase JWT involved; this is a separate static secret used only by the cron caller.

**Worker logic (sequential, not parallel — free-tier rate-limit friendly):**

1. Fetch all distinct `fipe_code` values across the `favorites` table.
2. For each code:
   a. Call the FIPE API (`/api/v2/…/price?reference=…` or the BrasilAPI endpoint) to get the current price and reference month.
   b. Compare against the existing row in `price_snapshots`.
   c. If the `reference_month` changed (i.e., FIPE published a new table):
      - Find all users who favorited this code **and** have `notification_email_opt_in = true`.
      - For each such user, check `notification_logs` for a row with `(user_id, fipe_code, reference_month)` — skip if found (dedup).
      - Send the Resend email.
      - Insert a row into `notification_logs`.
   d. Upsert `price_snapshots` with the new price and reference month.
3. Return `{ checked: N, notified: M }` JSON.

The worker never sends more than one email per user per car per FIPE reference month, regardless of how many times the endpoint is called.

**FIPE API call:** Uses the same `/api/v2` path already proxied by CloudFront. In the backend process, calls are made directly to `fipe.parallelum.com.br` (no CORS restriction server-side) — not through the CloudFront proxy. Uses `fetch` (Node 18+).

---

### Opt-in / opt-out

`notification_email_opt_in` already exists on `users`. Two new routes on `src/routes/me.ts`:

| Method  | Path                      | Behavior                                                    |
|---------|---------------------------|-------------------------------------------------------------|
| `PATCH` | `/me/notifications/opt-in` | Sets `notification_email_opt_in = true`. Returns the updated user row. |
| `PATCH` | `/me/notifications/opt-out` | Sets `notification_email_opt_in = false`. Returns the updated user row. |

Both behind `requireAuth`.

---

### Cron trigger — cron-job.org

A free account on [cron-job.org](https://cron-job.org) schedules a daily HTTP POST to `https://easy-fipe-backend.fly.dev/worker/check-prices` with the `Authorization: Bearer <WORKER_SECRET>` header. Runs at 08:00 UTC (after FIPE typically publishes monthly tables). No additional infrastructure; the Fly machine wakes on the HTTP request.

---

### Environment variables

Additions to `src/env.ts` and `backend/.env.example`:

| Var               | Notes                                                                    |
|-------------------|--------------------------------------------------------------------------|
| `RESEND_API_KEY`  | From the Resend dashboard. Free tier: 3 000 emails/month, 100/day.      |
| `WORKER_SECRET`   | Random string (≥32 chars). Set in `cron-job.org` and `flyctl secrets set`. |
| `FIPE_API_BASE`   | `https://fipe.parallelum.com.br/api/v2` — direct, no proxy, server-side only. |

`MIGRATIONS_DATABASE_URL` is unchanged from PRD-003.

---

### Free-tier constraints

- **Resend free tier**: 3 000 emails/month, 100/day. At early stage (tens of users, a few favorites each), well within limits. The dedup logic (`notification_logs`) prevents re-sends if the cron fires more than once.
- **Fly.io**: `min_machines_running = 0` preserved. The worker endpoint wakes the machine; the machine idles and stops after the response. No always-on cost.
- **FIPE API**: Parallelum free tier is 500 req/day. Worker calls once per distinct fipe_code. If the user base grows past ~400 distinct watched codes, migrate the price fetch to BrasilAPI (already used by `usePriceHistory`).

---

## Out of scope

- Frontend changes — opt-in toggle, favorites UI, notification history. Deferred to a frontend PRD.
- Push / SMS / browser notifications — email only.
- Per-user notification frequency settings (daily digest vs. immediate) — always daily for now.
- Unsubscribe link inside the email — users opt out via the app settings. Add only when a frontend exists.
- Email delivery status tracking (webhooks from Resend) — not needed at this scale.
- Rate limiting / CORS / pino — deferred from PRD-003, still deferred.

---

## Validation

From `backend/`:

```bash
docker compose up -d postgres
yarn db:generate       # generates migration for favorites, price_snapshots, notification_logs
yarn db:migrate        # applies

# favorites CRUD (needs a valid JWT)
TOKEN=$(...)           # mint via supabase.auth.signInWithPassword in a script
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/favorites
# → 200 []

curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fipeCode":"001004-9","vehicleLabel":"Honda Civic 2020 1.5 Turbo"}' \
  http://localhost:8080/favorites
# → 201 { id, fipe_code, vehicle_label, created_at }

curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/favorites/001004-9
# → 204

# opt-in
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/me/notifications/opt-in
# → 200 { ...user, notification_email_opt_in: true }

# worker (no JWT — uses WORKER_SECRET)
curl -X POST -H "Authorization: Bearer supersecret" \
  http://localhost:8080/worker/check-prices
# → 200 { checked: 1, notified: 1 }   (if a favorite exists and price differs)

# wrong secret
curl -X POST -H "Authorization: Bearer wrong" \
  http://localhost:8080/worker/check-prices
# → 401

yarn test              # existing health test still green; add favorites.test.ts and worker.test.ts
yarn build             # dist/index.js produced cleanly
```

### Resend smoke test

Set `RESEND_API_KEY` to a Resend test key. The Resend test mode logs the email but does not deliver — check the Resend dashboard logs to confirm subject, recipient, and body render correctly.

---

## Rollout

- [ ] Install `resend` in `backend/`
- [ ] Add `RESEND_API_KEY` and `WORKER_SECRET` to `src/env.ts` and `.env.example`
- [ ] Add `FIPE_API_BASE` env var and a thin `src/lib/fipeClient.ts` (direct fetch, no proxy)
- [ ] Add Drizzle schema files: `favorites.ts`, `priceSnapshots.ts`, `notificationLogs.ts`; re-export from `src/db/schema.ts`
- [ ] Run `yarn db:generate`; review generated SQL; run `yarn db:migrate` locally
- [ ] Add `src/lib/resend.ts` and `src/emails/priceAlert.ts`
- [ ] Add `src/schemas/favorites.ts`
- [ ] Add `src/routes/favorites.ts` and mount in `src/routes/index.ts`
- [ ] Add opt-in/opt-out PATCH routes to `src/routes/me.ts`
- [ ] Add `src/routes/worker.ts` with the check-prices logic; mount in `src/routes/index.ts`
- [ ] Add `favorites.test.ts` and `worker.test.ts`
- [ ] `yarn build` passes; `yarn test` green
- [ ] Open PR, merge to main
- [ ] `flyctl secrets set RESEND_API_KEY=… WORKER_SECRET=…`
- [ ] `flyctl deploy`
- [ ] Run `yarn db:migrate` against Supabase direct URL
- [ ] Smoke `/worker/check-prices` against `https://easy-fipe-backend.fly.dev`
- [ ] Create cron-job.org job: daily 08:00 UTC, POST, `Authorization: Bearer <WORKER_SECRET>`
- [ ] Verify email delivered to a test account with a real `RESEND_API_KEY`

---

## Risks and mitigations

- **Resend daily limit (100/day free tier)** — with dedup and monthly FIPE cadence, the daily cap is only hit if 100+ unique user-vehicle pairs change price in the same day (impossible in practice; FIPE updates monthly). If the product scales, upgrade Resend tier before the limit matters.
- **FIPE API rate limit (500 req/day)** — worker calls once per distinct fipe_code. Acceptable until ~400 distinct watched vehicles. Mitigation: cache snapshots aggressively; if needed, migrate price fetch to BrasilAPI which has no stated rate limit.
- **Fly cold start delays** — cron-job.org has a 30 s timeout by default; Fly cold start is ~1–2 s. Not a risk at current load.
- **WORKER_SECRET leaking** — it's only stored in `flyctl secrets` and `cron-job.org`. Rotation requires updating both and redeploying. Document in `backend/README.md`.
- **Resend domain verification** — `fipefacil.com` DNS must have the Resend DKIM/SPF records for emails to avoid spam folders. Required before go-live; can be set up independently of the code changes.
