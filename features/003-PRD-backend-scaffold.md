# PRD: Backend scaffold (Express + Drizzle + Supabase Auth + Fly.io)

## Context

The app today is a pure SPA: every vehicle lookup hits FIPE/BrasilAPI through the CloudFront proxy and lands in `localStorage` via Zustand (`src/store/fipeStore.ts`). There is no server, no user identity, no persistence beyond the browser.

The product is moving toward two new capabilities that require server state:

1. **Logged-in users save favorite cars** and **receive notifications when a favorite's price changes significantly.**
2. **Anonymous users keep working as today** — FIPE lookup and the local price-history chart must remain available without an account.

This PRD covers only the foundation: a backend project, a database, an auth-aware Express server, and a `users` table. Favorites, notifications, and frontend integration are deliberately deferred.

## Problem

No backend exists. There is no place to:

- store per-user state (favorites)
- run scheduled jobs (price-change polling)
- verify a user identity server-side

Adding all three at once would balloon scope. We need a minimal, working backend first so subsequent PRDs (favorites, notifications, frontend auth) have something to attach to.

## Goal

Stand up `backend/` with a working Express + Drizzle + PostgreSQL + Vitest + Docker scaffold, deployable to Fly.io, with a single `users` table and a `requireAuth` middleware that verifies Supabase Auth JWTs.

## Solution

A standalone `backend/` yarn project at the repo root (not a workspaces conversion). Stack: Node 20 + Express + TypeScript + Drizzle + PostgreSQL + Zod + Vitest + Docker. Auth uses Supabase Auth (HS256 JWTs verified via `jose` against `SUPABASE_JWT_SECRET`).

### Hosting choice — Supabase + Fly.io

Chosen over Amazon Lightsail purely on the "cheaper / free tier" criterion. Supabase Postgres + Auth is free forever (auto-pauses after 7 idle days, one click to resume); Fly.io's `shared-cpu-1x` machines stay in the free allowance with `min_machines_running = 0`. Lightsail's $3.50/mo instance is only free for 90 days. Both stacks port: Drizzle schema and Express code are hosting-agnostic; only the auth layer would change if migrating.

### Database — `public.users` mirror of `auth.users`

Standard Supabase pattern: canonical identity lives in Supabase's managed `auth.users`; we mirror it into `public.users` so app queries don't cross-schema.

`backend/src/db/schema/users.ts` columns:

| Column                       | Type           | Notes                                                              |
|------------------------------|----------------|--------------------------------------------------------------------|
| `id`                         | `uuid` PK      | Mirrors `auth.users.id`; FK added in `0001` guarded on `auth` schema. |
| `email`                      | `text NOT NULL UNIQUE` | Mirrored from `auth.users.email`.                          |
| `full_name`                  | `text`         | Populated from `auth.users.raw_user_meta_data->>'full_name'`.      |
| `notification_email_opt_in`  | `boolean NOT NULL DEFAULT false` | Forward-compat for notifications; explicit opt-in. |
| `created_at` / `updated_at`  | `timestamptz NOT NULL DEFAULT now()` | Audit.                                       |

Migration `drizzle/0001_handle_new_user.sql` is a hand-written raw SQL file that adds the FK to `auth.users` and a `SECURITY DEFINER` trigger on `AFTER INSERT ON auth.users` to mirror new rows into `public.users`. Both statements are guarded by `IF EXISTS (… schema_name = 'auth')`, so a local Postgres (no Supabase) applies the migration cleanly with those statements as no-ops.

### Auth — `jose` JWT verification, per-route

Supabase issues HS256 JWTs signed with `SUPABASE_JWT_SECRET`. `jose` verifies them locally — no HTTP roundtrip to Supabase per request. `jsonwebtoken` and the Supabase admin client are both rejected: the first for ESM/security reasons, the second for unnecessary latency.

`requireAuth` is **never global**. It applies per-route, so `GET /health` and any future anonymous FIPE-proxy endpoints work without a token. `src/types/express.d.ts` augments `Express.Request` with `user?: { id, email?, role? }`.

### Initial endpoints

| Method | Path     | Auth | Behavior |
|--------|----------|------|----------|
| GET    | `/health`| no   | `{ status: "ok" }`. Fly health check. |
| GET    | `/me`    | yes  | Returns the row from `public.users` matching `req.user.id`. 404 on race window before the trigger fires. |

### Tooling

- **Local dev**: `backend/docker-compose.yml` runs `postgres:16-alpine` on host port `54322` (mirrors Supabase CLI, avoids host clashes).
- **Vitest**: `pool: 'forks'` + `singleFork: true` to serialize DB tests; `beforeAll` runs migrations, `beforeEach` truncates. The auth-required test (`me.test.ts`) is parked as a placeholder until a `jose`-based token-mock helper exists.
- **Drizzle config**: schema discovered via glob `./src/db/schema/*.ts` (single-file barrels don't load under drizzle-kit's CJS resolver when paired with NodeNext `.js` imports — the glob sidesteps it). The barrel `src/db/schema.ts` remains for the runtime app's `import * as schema from './schema.js'`.
- **Migrations**: `yarn db:migrate` reads `MIGRATIONS_DATABASE_URL ?? DATABASE_URL`. Against Supabase, set `MIGRATIONS_DATABASE_URL` to the **direct** connection (`db.<ref>.supabase.co:5432`) — pgbouncer (port 6543) can't run DDL or touch the `auth` schema.

### Environment variables

Validated by `src/env.ts` (zod):

| Var                          | Notes                                                      |
|------------------------------|------------------------------------------------------------|
| `NODE_ENV`                   | `development` / `test` / `production`.                     |
| `PORT`                       | Default `8080`.                                            |
| `DATABASE_URL`               | Local Postgres or Supabase **pooled** URL in prod.         |
| `MIGRATIONS_DATABASE_URL`    | Optional. Supabase **direct** URL when migrating prod.     |
| `SUPABASE_URL`               | `https://<ref>.supabase.co`.                               |
| `SUPABASE_ANON_KEY`          | Public anon key.                                           |
| `SUPABASE_SERVICE_ROLE_KEY`  | Server only; future admin scripts.                         |
| `SUPABASE_JWT_SECRET`        | Sole input to `requireAuth`.                               |

`backend/.env.example` holds placeholders. `backend/.env` is covered by the root `.gitignore`.

### Fly.io

`backend/fly.toml`: app `easy-fipe-backend`, region `gru` (matches Supabase sa-east-1), `internal_port = 8080`, `auto_stop_machines = true`, `min_machines_running = 0`, `shared-cpu-1x` / `256mb`. Secrets set via `flyctl secrets set` for the five Supabase vars + `DATABASE_URL` (pooled). No `release_command` yet — migrations run manually from a workstation against the direct URL this iteration.

## Out of scope

- `favorites` table and routes — next PRD. Will key on `fipe_code` (matches `HistoryEntry.fipeCode` on the frontend) with `(user_id, fipe_code)` unique.
- Notification worker — no scheduler, no email integration, no audit table.
- Frontend changes — no `@supabase/supabase-js` install, no sign-in UI, no auth context.
- OAuth providers — email/password only when the frontend wires up.
- Supabase Edge Functions — we use Express on Fly.
- Row Level Security — unnecessary while all DB access flows through Express. Becomes a concern only if the frontend ever talks to Supabase directly.
- `release_command` for migrations, rate limiting, CORS, pino/Sentry/OTEL — basic console logging only.

## Validation

From `backend/`:

```bash
docker compose up -d postgres
yarn install
yarn typecheck                                    # passes
yarn db:generate                                  # no schema changes -> no new file
yarn db:migrate                                   # "migrations applied"
docker exec -it easy-fipe-postgres psql -U postgres -d easy_fipe -c '\d users'
# expect: 6 columns, users_email_unique constraint

yarn dev &                                        # http://localhost:8080
curl -sf http://localhost:8080/health             # {"status":"ok"}
curl -i  http://localhost:8080/me                 # 401 missing_bearer_token

yarn test                                         # health.test.ts green
yarn build                                        # dist/index.js produced
NODE_ENV=production node dist/index.js &
curl -sf http://localhost:8080/health             # still {"status":"ok"}

docker build -t easy-fipe-backend .               # image builds cleanly
```

### Supabase-side validation (deferred, runs at deploy time)

1. Create a Supabase project (region `sa-east-1`).
2. Set `MIGRATIONS_DATABASE_URL` to the direct URL; run `yarn db:migrate` from a workstation.
3. Sign up a test user via the Supabase dashboard.
4. Confirm a row appears in `public.users` via the SQL editor.
5. Mint a token (dashboard or `supabase.auth.signInWithPassword` from a script), `curl -H 'Authorization: Bearer <token>' https://easy-fipe-backend.fly.dev/me` → 200 with the user row.

## Rollout

- [ ] Create `backend/` skeleton (`package.json`, `tsconfig.json`, `.env.example`, `.dockerignore`)
- [ ] Add source files (`src/env.ts`, `src/app.ts`, `src/index.ts`, `src/db/*`, `src/middleware/*`, `src/routes/*`, `src/schemas/*`, `src/types/express.d.ts`)
- [ ] Add `docker-compose.yml`, `Dockerfile`, `vitest.config.ts`, `drizzle.config.ts`, `fly.toml`
- [ ] Generate `drizzle/0000_*.sql` from schema; hand-write `drizzle/0001_handle_new_user.sql`
- [ ] Add `src/__tests__/setup.ts` and `health.test.ts`
- [ ] Run validation checklist locally
- [ ] Open PR, merge to main
- [ ] Create Supabase project, run migrations against direct URL
- [ ] `flyctl launch --no-deploy`, `flyctl secrets set …`, `flyctl deploy`
- [ ] Smoke `/health` against `https://easy-fipe-backend.fly.dev`

## Risks and mitigations

- **`SUPABASE_JWT_SECRET` rotation** — rotating it in the Supabase dashboard invalidates all existing tokens. Mitigation: document that rotations require a coordinated client logout; tie rotation to deliberate security events, not routine ops.
- **Pooled vs direct connection footgun** — the pooled URL (port 6543) cannot run DDL or touch the `auth` schema, so a careless `yarn db:migrate` against `DATABASE_URL` (the pooled URL) on Fly will fail the trigger migration. Mitigation: `MIGRATIONS_DATABASE_URL` is a separate, opt-in var; `db:migrate` prefers it. The pattern is documented in `backend/README.md`.
- **Fly cold starts on the free tier** — `min_machines_running = 0` means the first request after idle pays ~1s startup. Acceptable for this iteration; revisit when traffic exists.
- **No RLS** — the Supabase Postgres has no Row Level Security policies. Acceptable while access is server-side only through Express (the connection authenticates as `postgres`). Becomes load-bearing if the frontend ever calls Supabase directly; called out as future work.
- **Race between Supabase signup and `public.users` mirror** — `GET /me` immediately after signup may 404 if the trigger hasn't fired. Mitigation: the route returns a specific `user_not_found` error so the frontend can retry; the trigger fires synchronously in the same transaction as the auth insert, so the window is microseconds and only an issue if a token is used before its own commit settles.
- **Drizzle migrations don't run on deploy** — `release_command` is intentionally omitted. Migrations must be run manually. Documented in `backend/README.md`; revisit once schema iteration slows.
