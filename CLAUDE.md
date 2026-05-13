# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev        # start dev server (Vite HMR)
yarn build      # tsc -b && vite build  (type-check + bundle)
yarn lint       # eslint
yarn preview    # preview production build locally
```

There are no tests. `yarn build` is the validation step — it must pass cleanly before finishing any task.

## TypeScript Constraints

The tsconfig enforces two non-standard rules that affect how code is written:

- **`verbatimModuleSyntax: true`** — type-only imports must use `import type`, e.g. `import type { Foo } from './foo'`
- **`erasableSyntaxOnly: true`** — no `const enum`, no TypeScript-specific decorators. Use string unions instead of enums.

## Architecture

The app is a FIPE vehicle price lookup tool. It has no backend — all data comes from the [Parallelum FIPE API](https://fipe.parallelum.com.br/api/v2) (free tier, 500 req/day unauthenticated).

### Data flow

1. User selects vehicle type → brand → model → year (cascading selects, each dependent on prior)
2. `FipeLookup.tsx` orchestrates: calls four hooks in sequence (`useBrands` → `useModels` → `useYears` → `useFipePrice`), each enabled only when upstream selections are set
3. On a successful price fetch, the result is stored in Zustand history (persisted to `localStorage` via `fipe-storage` key)
4. `PriceHistoryChart` reads that accumulated history and filters by `fipeCode` to show price evolution over time

### State

Zustand store (`src/store/fipeStore.ts`):
- `selection` — current brand/model/year codes and names; **ephemeral** (not persisted)
- `history: HistoryEntry[]` — accumulated past results; **persisted** to localStorage

### API layer

The app uses **two** upstream APIs, both proxied to avoid CORS and direct-browser 403s:
- `/api/v2/*` → `fipe.parallelum.com.br/api/v2/*` (brands, models, years, current price)
- `/api/brasilapi/*` → `brasilapi.com.br/api/*` (reference tables + historical prices used by `PriceHistoryChart`)

In dev, proxying is handled by Vite (`vite.config.ts`). In production, it's handled by CloudFront (two additional origins + a behavior per path pattern). Never call these upstream hosts directly from the browser — they return 403 when the request comes from a non-allowlisted origin.

Key limitation: Parallelum's `?reference=CODE` for historical prices is a **paid feature**. The free tier only returns the current month. BrasilAPI supports `?tabela_referencia=CODE` for full history — that is what `usePriceHistory.ts` uses via `src/api/brasilapi.ts`.

### Styling

Tailwind v4 via `@tailwindcss/vite` plugin — **no `tailwind.config.js`**. All theme tokens are CSS custom properties in `src/index.css` using `oklch()` color space. The design uses a red primary color (`oklch(0.52 0.22 27)`). Shadcn components are New York style, neutral base.

Shadcn UI primitives are based on **Base UI** (`@base-ui/react`), not Radix — the import path is `@base-ui/react/select`, `@base-ui/react/tabs`, etc.

### React Query caching

All queries use `staleTime: 24h` set globally on the `QueryClient` in `App.tsx` (`ONE_DAY` constant). FIPE data updates once a month, so 24 hours is a safe cache window. **Do not add per-query `staleTime` overrides** — they inherit from the default.

### Path alias

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

### Building Components
Never create a component longer than 180 lines. If it exceeds this, split it into smaller components automatically. Always separate UI from logic.

### UI Primitives
Always use shadcn UI components (`src/components/ui/`) for all interactive elements. Never use raw HTML `<input>`, `<select>`, or `<button>` — use the corresponding shadcn component. Shadcn components use `@base-ui/react` (base-nova style), not Radix.

### Analytics
PostHog (product analytics) and Google Analytics (GA4) are both initialized as side-effect imports in `main.tsx`. PostHog config is in `src/lib/posthog.ts`, GA config is in `src/lib/ga.ts`.

### Event Handlers
Never call multiple functions inline in a JSX event handler (e.g. `onClick={() => { track(...); onClear() }}`). Instead, wrap them in a single named handler function. For `track()` calls specifically, include them inside the callback that owns the action — not alongside it in the JSX.

### Database Migrations
Always create migrations using `drizzle-kit generate` or `drizzle-kit generate --custom`. Never write migration `.sql` files by hand.
