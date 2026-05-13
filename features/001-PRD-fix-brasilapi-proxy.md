# PRD: Fix BrasilAPI integration for price history charts

## Context

The `easy-fipe` project uses two APIs:

1. **Parallelum FIPE API** (`fipe.parallelum.com.br/api/v2`) — proxied via `/api/v2` configured in `vite.config.ts`. Works only in dev. Used for brands, models, years, and current price.
2. **BrasilAPI** (`brasilapi.com.br/api/fipe`) — called **directly from the browser** in `src/api/brasilapi.ts`. Used for price history in `usePriceHistory.ts` (charts).

The project now has a backend: an Express server on Fly.io (`easy-fipe-backend.fly.dev`), deployed per `features/003-PRD-backend-scaffold.md`.

## Problem

The price history charts do not load in production (fipefacil.com).

Root cause verified via `curl` directly against the endpoints:

- `GET https://brasilapi.com.br/api/fipe/marcas/v1/carros` → **403 Forbidden**
- `GET https://brasilapi.com.br/api/fipe/tabelas/v1` → **403 Forbidden**

BrasilAPI blocks browser-originated requests (CORS / User-Agent / origin rate limit). Requests must come from a server.

Additional issue: the Vite `/api/v2` proxy only works in dev. In production (S3 + CloudFront) there is no proxy, so `/api/v2/...` calls fall through to S3 and return 404/index.html.

## Goal

Make **all** API calls work in both dev and production, without exposing the browser directly to the upstream APIs.

## Solution

**Dev** — keep the existing Vite proxy as-is. No changes needed for local development.

**Production** — route `/api/*` through the Fly.io Express backend instead of directly to the upstream APIs or via a CloudFront Function. The backend adds two proxy routes that forward requests server-side:

- `GET /api/v2/*` → forwards to `https://fipe.parallelum.com.br/api/v2/*`
- `GET /api/brasilapi/*` → forwards to `https://brasilapi.com.br/api/*` (strips the `/brasilapi` segment)

A single new CloudFront behavior routes `/api/*` from `fipefacil.com` to the Fly.io origin. No CloudFront Function, no upstream origins in CloudFront.

---

## Code changes

### 1. `backend/src/routes/fipe.ts` — new proxy router

```ts
import { Router } from 'express'
import type { Request, Response } from 'express'

export const fipeRouter = Router()

fipeRouter.get('/v2/*', async (req: Request, res: Response) => {
  const qs = new URLSearchParams(req.query as Record<string, string>).toString()
  const upstream = `https://fipe.parallelum.com.br/api/v2${req.path}${qs ? `?${qs}` : ''}`
  const response = await fetch(upstream)
  if (!response.ok) {
    res.status(response.status).json({ error: 'upstream_error', status: response.status })
    return
  }
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.json(await response.json())
})

fipeRouter.get('/brasilapi/*', async (req: Request, res: Response) => {
  // Strip /brasilapi prefix: /brasilapi/fipe/tabelas/v1 → /fipe/tabelas/v1
  const upstreamPath = req.path.replace(/^\/brasilapi/, '')
  const qs = new URLSearchParams(req.query as Record<string, string>).toString()
  const upstream = `https://brasilapi.com.br/api${upstreamPath}${qs ? `?${qs}` : ''}`
  const response = await fetch(upstream)
  if (!response.ok) {
    res.status(response.status).json({ error: 'upstream_error', status: response.status })
    return
  }
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.json(await response.json())
})
```

> **Note on path:** this router is mounted at `/api` in `routes/index.ts`, so inside the router `req.path` is already stripped of the `/api` prefix. A request to `/api/v2/cars/brands` arrives here as `/v2/cars/brands`.

### 2. `backend/src/routes/index.ts` — mount the fipe router

```ts
import { Router } from 'express'
import { healthRouter } from './health.js'
import { meRouter } from './me.js'
import { fipeRouter } from './fipe.js'

export function buildRouter(): Router {
  const router = Router()
  router.use('/health', healthRouter)
  router.use('/me', meRouter)
  router.use('/api', fipeRouter)
  return router
}
```

### 3. `src/api/brasilapi.ts` — use relative path (if not already)

`BASE_URL` must be `/api/brasilapi/fipe` (no domain). In dev, Vite proxies it; in prod, CloudFront routes it to the backend.

```ts
const BASE_URL = '/api/brasilapi/fipe'
```

### 4. `src/api/fipe.ts` — validate, no change

`BASE_URL = '/api/v2'` is already correct for dev. No code change needed. The required change is that production now routes this to the backend (see Infra section).

### 5. `vite.config.ts` — add BrasilAPI dev proxy (dev only, no production effect)

```ts
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    proxy: {
      '/api/v2': {
        target: 'https://fipe.parallelum.com.br',
        changeOrigin: true,
      },
      '/api/brasilapi': {
        target: 'https://brasilapi.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/brasilapi/, '/api'),
      },
    },
  },
})
```

### 6. `CLAUDE.md` — update API layer note

Replace the current note with:

> The app uses **two** upstream APIs, both proxied to avoid CORS and direct-browser 403s:
> - `/api/v2/*` → `fipe.parallelum.com.br/api/v2/*` (brands, models, years, current price)
> - `/api/brasilapi/*` → `brasilapi.com.br/api/*` (reference tables + historical prices used by `PriceHistoryChart`)
>
> In dev, proxying is handled by Vite (`vite.config.ts`). In production, CloudFront routes `/api/*` to the Fly.io Express backend (`easy-fipe-backend.fly.dev`), which forwards the requests server-side. Never call these upstream hosts directly from the browser — they return 403 when the request comes from a non-allowlisted origin.

---

## Infra changes (CloudFront)

This approach is simpler than the original design: **one** new origin (the Fly.io backend) and **one** new behavior. No CloudFront Functions, no upstream API origins.

### Step 1 — Create one new Origin in CloudFront

- **Origin domain:** `easy-fipe-backend.fly.dev`
- **Protocol:** HTTPS only
- **Origin path:** *(empty)*
- **Name:** `fly-backend`

### Step 2 — Create one new Behavior (before the default)

**Behavior: `/api/*`**
- Path pattern: `/api/*`
- Origin: `fly-backend`
- Viewer protocol policy: Redirect HTTP to HTTPS
- Allowed HTTP methods: GET, HEAD, OPTIONS
- Cache policy: `CachingOptimized` (24h TTL — backend sets `Cache-Control: public, max-age=86400`)
- Origin request policy: `AllViewerExceptHostHeader` (prevents CloudFront from forwarding `Host: fipefacil.com` to Fly.io)

Request flow in production:
```
Browser → GET https://fipefacil.com/api/brasilapi/fipe/tabelas/v1
  → CloudFront behavior /api/* → easy-fipe-backend.fly.dev
  → Express /api/brasilapi/* handler
  → fetch https://brasilapi.com.br/api/fipe/tabelas/v1
  → 200 JSON
```

### Step 3 — Invalidate CloudFront cache after deploy

The `deploy:cdn` script already handles this. No change needed.

---

## Validation

### Dev

1. `npm run dev`
2. Complete a full lookup (brand → model → year → price)
3. DevTools → Network, filter by `/api/`:
   - `/api/v2/cars/brands` → **200** (proxied by Vite to Parallelum)
   - `/api/brasilapi/fipe/tabelas/v1` → **200** (proxied by Vite to BrasilAPI)
   - `/api/brasilapi/fipe/preco/v1/...` → **200**
4. `PriceHistoryChart` renders with multiple data points
5. No CORS errors in the console

### Backend unit test

1. `cd backend && docker compose up -d postgres && yarn dev`
2. `curl http://localhost:8080/api/v2/cars/brands` → 200 JSON array
3. `curl http://localhost:8080/api/brasilapi/fipe/tabelas/v1` → 200 JSON array

### Prod

1. `npm run deploy:prod` (frontend) + `flyctl deploy` (backend)
2. Wait for CloudFront invalidation (~1–3 min)
3. Visit `https://www.fipefacil.com`, repeat the lookup
4. Network: all calls go to `https://www.fipefacil.com/api/...` → 200
5. Chart loads

---

## Rollout

- [ ] Add `backend/src/routes/fipe.ts`
- [ ] Update `backend/src/routes/index.ts` to mount fipe router at `/api`
- [ ] Update `src/api/brasilapi.ts` to use relative `BASE_URL` (if not already)
- [ ] Update `vite.config.ts` to add `/api/brasilapi` proxy entry
- [ ] Update `CLAUDE.md` API layer note
- [ ] Run `yarn build` (frontend) and `yarn build` (backend) — both must pass
- [ ] Open PR, merge
- [ ] `flyctl deploy` — backend live with new proxy routes
- [ ] Create CloudFront origin `fly-backend` + behavior `/api/*`
- [ ] `npm run deploy:prod` — frontend deploy + CloudFront invalidation
- [ ] Validate in prod

---

## Risks and mitigations

- **BrasilAPI might block Fly.io IPs** — less likely than blocking browsers, but possible if volume grows. Mitigation: CloudFront caches responses for 24h (backend sets `Cache-Control: public, max-age=86400`), so the backend only hits upstream once per unique request per day. If blocked, fallback is to use fipe.online historical CSV or Parallelum with a paid token.
- **`AllViewerExceptHostHeader` is required** — without it, CloudFront forwards `Host: fipefacil.com` to Fly.io, which won't match any Fly app. The backend would return 404.
- **Fly.io cold starts** — `min_machines_running = 0` means the first request after idle pays ~1s startup. The CloudFront cache absorbs most traffic; cold starts only affect the first uncached request after a quiet period.
- **No new dependencies** — the proxy uses Node 20's native `fetch`. No `http-proxy-middleware` or `node-fetch` needed.
- **CORS** — the browser only ever talks to `fipefacil.com` (CloudFront). The backend-to-upstream hop is server-to-server. No CORS headers needed on the Express routes.
