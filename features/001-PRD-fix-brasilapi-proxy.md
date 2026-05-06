# PRD: Fix BrasilAPI integration for price history charts

## Context

The `easy-fipe` project uses two APIs:

1. **Parallelum FIPE API** (`fipe.parallelum.com.br/api/v2`) — proxied via `/api/v2` configured in `vite.config.ts`. Works only in dev. Used for brands, models, years, and current price.
2. **BrasilAPI** (`brasilapi.com.br/api/fipe`) — called **directly from the browser** in `src/api/brasilapi.ts`. Used for price history in `usePriceHistory.ts` (charts).

## Problem

The price history charts do not load in production (fipefacil.com).

Root cause verified via `curl` directly against the endpoints:

- `GET https://brasilapi.com.br/api/fipe/marcas/v1/carros` → **403 Forbidden**
- `GET https://brasilapi.com.br/api/fipe/tabelas/v1` → **403 Forbidden**

BrasilAPI is blocking browser-originated requests (likely CORS, User-Agent, or rate limit per origin). Requests must originate from a server, not from the client.

Additional issues:

- The Vite `/api/v2` proxy only works in **dev mode** — in production (S3 + CloudFront) there is no proxy, so `src/api/fipe.ts` also breaks when fetching `/api/v2/...` (it falls through to S3 and returns 404/index.html).
- `src/api/brasilapi.ts` does not go through a proxy even in dev — it uses an absolute URL `https://brasilapi.com.br/...`.

## Goal

Make **all** API calls work in both dev and production, without exposing the browser directly to the upstream APIs.

## Solution

Route all calls through relative paths (`/api/v2/...` and `/api/brasilapi/...`) and configure proxies in two places:

1. **Dev** → Vite proxy (`vite.config.ts`)
2. **Prod** → CloudFront Function + additional origins on CloudFront pointing to the upstream APIs

---

## Code changes

### 1. `vite.config.ts` — add BrasilAPI proxy

Add a `/api/brasilapi` entry to the `server.proxy` object, with path rewrite:

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

### 2. `src/api/brasilapi.ts` — use a relative path

Change `BASE_URL` to `/api/brasilapi/fipe` (no domain):

```ts
import type { BrasilApiPrice, BrasilApiReference } from '@/types/fipe'
import { track } from '@/lib/analytics'

const BASE_URL = '/api/brasilapi/fipe'

export async function fetchReferenceTables(): Promise<BrasilApiReference[]> {
  const res = await fetch(`${BASE_URL}/tabelas/v1`)
  if (!res.ok) {
    track('api_error', { path: '/tabelas/v1', status: String(res.status), status_text: res.statusText })
    throw new Error(`BrasilAPI error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<BrasilApiReference[]>
}

export async function fetchHistoricalPrice(
  fipeCode: string,
  referenceCode: number,
): Promise<BrasilApiPrice[]> {
  const path = `/preco/v1/${fipeCode}?tabela_referencia=${referenceCode}`
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    track('api_error', { path, status: String(res.status), status_text: res.statusText })
    throw new Error(`BrasilAPI error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<BrasilApiPrice[]>
}
```

### 3. `src/api/fipe.ts` — no code change, just validate

`BASE_URL = '/api/v2'` is already correct for dev. The required change is in the production infra (see CloudFront section below). Confirm the file still reads:

```ts
const BASE_URL = '/api/v2'
```

### 4. `CLAUDE.md` — update note about BrasilAPI

Replace this note:

> Note: BrasilAPI (`brasilapi.com.br/api/fipe`) is a free alternative with no documented rate limits that supports `?tabela_referencia=CODE` for historical lookups (not yet integrated).

With:

> The app uses **two** upstream APIs, both proxied to avoid CORS and direct-browser 403s:
> - `/api/v2/*` → `fipe.parallelum.com.br/api/v2/*` (brands, models, years, current price)
> - `/api/brasilapi/*` → `brasilapi.com.br/api/*` (reference tables + historical prices used by `PriceHistoryChart`)
>
> In dev, proxying is handled by Vite (`vite.config.ts`). In production, it's handled by CloudFront (two additional origins + a behavior per path pattern). Never call these upstream hosts directly from the browser — they return 403 when the request comes from a non-allowlisted origin.

---

## Infra changes (CloudFront)

CloudFront needs to forward `/api/v2/*` and `/api/brasilapi/*` to the upstream APIs instead of trying to serve from S3.

### Step 1 — Create two new **Origins** in CloudFront

**Origin 1: Parallelum FIPE**
- Origin domain: `fipe.parallelum.com.br`
- Protocol: HTTPS only
- Origin path: *(empty)*
- Name: `parallelum-fipe`

**Origin 2: BrasilAPI**
- Origin domain: `brasilapi.com.br`
- Protocol: HTTPS only
- Origin path: *(empty)*
- Name: `brasilapi`

### Step 2 — Create two new **Behaviors** (before the default, order matters)

**Behavior 1: `/api/v2/*`**
- Path pattern: `/api/v2/*`
- Origin: `parallelum-fipe`
- Viewer protocol policy: Redirect HTTP to HTTPS
- Allowed HTTP methods: GET, HEAD, OPTIONS
- Cache policy: `CachingOptimized` (or a custom one with 24h TTL, aligned with React Query's `staleTime`)
- Origin request policy: `AllViewerExceptHostHeader` (so the host header doesn't break SSL at the origin)

**Behavior 2: `/api/brasilapi/*`**
- Path pattern: `/api/brasilapi/*`
- Origin: `brasilapi`
- Viewer protocol policy: Redirect HTTP to HTTPS
- Allowed HTTP methods: GET, HEAD, OPTIONS
- Cache policy: `CachingOptimized` (24h)
- Origin request policy: `AllViewerExceptHostHeader`
- **Requires path rewrite**: the app calls `/api/brasilapi/fipe/tabelas/v1`, but BrasilAPI expects `/api/fipe/tabelas/v1`. Solution below.

### Step 3 — CloudFront Function for BrasilAPI path rewrite

Create a CloudFront Function (type **viewer-request**) associated with the `/api/brasilapi/*` behavior:

```js
function handler(event) {
  var request = event.request
  // Remove the /api/brasilapi prefix, leaving /api/...
  if (request.uri.indexOf('/api/brasilapi') === 0) {
    request.uri = '/api' + request.uri.substring('/api/brasilapi'.length)
  }
  return request
}
```

Final request flow in production:
- Browser: `GET https://fipefacil.com/api/brasilapi/fipe/tabelas/v1`
- CloudFront Function rewrites URI: `/api/fipe/tabelas/v1`
- Behavior forwards to origin `brasilapi.com.br`
- Result: `https://brasilapi.com.br/api/fipe/tabelas/v1` → 200

### Step 4 — Invalidate CloudFront cache after deploy

The `deploy:cdn` script already handles this. No change needed.

---

## Validation

### Dev

1. `npm run dev`
2. Open the app, complete a full lookup (brand → model → year → price)
3. DevTools → Network, filter by `/api/`:
   - Requests to `/api/v2/cars/brands` → **200**
   - Requests to `/api/brasilapi/fipe/tabelas/v1` → **200**
   - Requests to `/api/brasilapi/fipe/preco/v1/...` → **200**
4. `PriceHistoryChart` should render with multiple data points
5. No CORS errors in the console

### Prod

1. `npm run deploy:prod`
2. Wait for CloudFront invalidation (~1–3 min)
3. Visit `https://www.fipefacil.com`, repeat the test above
4. In Network, all calls should go to `https://www.fipefacil.com/api/...` and return 200
5. Confirm the chart loads in production

---

## Rollout

- [ ] Apply code changes (items 1–4 above) on a branch
- [ ] Run `npm run build` locally to confirm it compiles
- [ ] Open PR, merge
- [ ] Apply CloudFront changes (two origins, two behaviors, one function)
- [ ] Deploy to production
- [ ] Validate in prod

## Risks and mitigations

- **BrasilAPI might block CloudFront too** due to volume. Mitigation: CloudFront caching (24h TTL) drastically reduces the number of requests hitting the origin. If it still gets blocked, alternatives are switching to fipe.online (offers historical CSV) or using Parallelum with a paid token (includes 1 year of history).
- **`AllViewerExceptHostHeader` origin request policy** is essential — without it, CloudFront forwards `Host: fipefacil.com` to BrasilAPI and breaks SNI/SSL.
- **Path rewrite via CloudFront Function** has a 10KB code size limit and 1ms execution budget. The script above is well below both limits.
