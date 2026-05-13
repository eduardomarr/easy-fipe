# easy-fipe backend

Express + Drizzle + PostgreSQL backend for the easy-fipe app.

## Local dev

```bash
docker compose up -d postgres        # local Postgres on :54322
cp .env.example .env                  # fill in Supabase keys
yarn install
yarn db:migrate                       # apply drizzle/* migrations
yarn dev                              # http://localhost:8080/health
```

## Scripts

| Script              | Purpose                                                  |
|---------------------|----------------------------------------------------------|
| `yarn dev`          | tsx watch dev server                                     |
| `yarn build`        | `tsc -p tsconfig.json` to `dist/`                        |
| `yarn start`        | Run the compiled app                                     |
| `yarn test`         | Vitest (requires local Postgres running)                 |
| `yarn typecheck`    | `tsc --noEmit`                                           |
| `yarn db:generate`  | drizzle-kit generate (diffs `src/db/schema.ts` → SQL)    |
| `yarn db:migrate`   | Apply migrations against `DATABASE_URL`                  |
| `yarn db:studio`    | drizzle-kit studio UI                                    |

## Migrations against Supabase

The trigger migration (`drizzle/0001_handle_new_user.sql`) needs DDL privileges
on the `auth` schema, which Supabase's pgbouncer pooler does not allow. Set
`MIGRATIONS_DATABASE_URL` to the **direct** connection
(`db.<ref>.supabase.co:5432`) when migrating Supabase. Runtime app traffic uses
the **pooled** URL (`*.pooler.supabase.com:6543`) in `DATABASE_URL`.

## Deploy (Fly.io)

```bash
flyctl launch --no-deploy             # one-time
flyctl secrets set \
  DATABASE_URL='postgres://postgres.<ref>:<pwd>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' \
  SUPABASE_URL='https://<ref>.supabase.co' \
  SUPABASE_ANON_KEY='...' \
  SUPABASE_SERVICE_ROLE_KEY='...' \
  SUPABASE_JWT_SECRET='...'
flyctl deploy
```
