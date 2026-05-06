# PRD: Automate CloudFront proxy infra setup via aws CLI

## Context

PRD-001 (`001-PRD-fix-brasilapi-proxy.md`) shipped the **code** changes for proxying BrasilAPI through `/api/brasilapi/*`, but the **production CloudFront infra** was specified as manual console clicks. As a result the changes were never applied — `https://www.fipefacil.com/api/brasilapi/fipe/tabelas/v1` returns **404** in production (the request falls through to the SPA's S3 origin), so the price history chart still doesn't load.

## Problem

Manual CloudFront console steps are:

- error-prone (easy to misconfigure cache policies, origin protocols, function associations)
- not version-controlled (no diff history, no audit trail)
- not repeatable (a fresh distribution would need to be re-clicked from scratch)
- forgotten (the PRD-001 rollout checklist for the infra steps was never ticked, which is why the chart is still broken in prod)

## Goal

Apply the CloudFront proxy infra in **one command** (`yarn infra:cloudfront:apply`) using the `aws` CLI, so the production proxy is set up identically to the PRD-001 spec — repeatably, idempotently, and trackably.

## Solution

Add a Node.js setup script (no new npm deps — it shells out to the `aws` CLI via `node:child_process`) and commit the CloudFront Function source to the repo. Re-running the script is a no-op once everything is in place.

---

## Code changes

### 1. `infra/cloudfront/brasilapi-rewrite.js` (new)

CloudFront Function source — viewer-request handler that strips `/api/brasilapi` before forwarding to the BrasilAPI origin. Same code as PRD-001 step 3, just committed to the repo so it's diff-able:

```js
function handler(event) {
  var request = event.request
  if (request.uri.indexOf('/api/brasilapi') === 0) {
    request.uri = '/api' + request.uri.substring('/api/brasilapi'.length)
  }
  return request
}
```

### 2. `scripts/setup-cloudfront-proxy.mjs` (new)

Node.js script that orchestrates the setup. Required env vars (already present in `.env.example` and GitHub secrets):

- `CLOUDFRONT_DISTRIBUTION_ID`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (or a configured profile)
- `AWS_DEFAULT_REGION` (project default: `sa-east-1`)

**Steps the script performs (each idempotent):**

1. **Function** — `aws cloudfront describe-function --name brasilapi-rewrite`. If 404, `create-function`; else `update-function` (with `--if-match`). Then `publish-function`. Capture the function ARN.
   - Function code is read from `infra/cloudfront/brasilapi-rewrite.js`.
   - Runtime: `cloudfront-js-2.0`.

2. **Distribution config fetch** — `aws cloudfront get-distribution-config --id $CLOUDFRONT_DISTRIBUTION_ID`, save `{ DistributionConfig, ETag }`.

3. **Backup** — write current config to `infra/cloudfront/.last-config-backup.json` (gitignored) before any mutation, so rollback is one command.

4. **Mutate config in memory** (each mutation skipped if already present):
   - **Origins** — append to `Origins.Items` if `Id` is missing:
     - `{ Id: "parallelum-fipe", DomainName: "fipe.parallelum.com.br", CustomOriginConfig: { OriginProtocolPolicy: "https-only", HTTPSPort: 443, HTTPPort: 80, OriginSslProtocols: { Items: ["TLSv1.2"], Quantity: 1 }, OriginReadTimeout: 30, OriginKeepaliveTimeout: 5 }, CustomHeaders: { Quantity: 0 }, OriginPath: "", OriginShield: { Enabled: false } }`
     - `{ Id: "brasilapi", DomainName: "brasilapi.com.br", CustomOriginConfig: { …same shape… } }`
     - Bump `Origins.Quantity`.
   - **Cache behaviors** — append to `CacheBehaviors.Items` if `PathPattern` is missing:
     - `/api/v2/*` → `TargetOriginId: "parallelum-fipe"`, allowed methods `GET,HEAD,OPTIONS` (cached), `CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6` (managed `CachingOptimized`), `OriginRequestPolicyId: b689b0a8-53d0-40ab-baf2-68738e2966ac` (managed `AllViewerExceptHostHeader`), `ViewerProtocolPolicy: redirect-to-https`. No function associations.
     - `/api/brasilapi/*` → `TargetOriginId: "brasilapi"`, same cache/origin-request policies, **plus** `FunctionAssociations: { Quantity: 1, Items: [{ EventType: "viewer-request", FunctionARN: <ARN from step 1> }] }`.
     - Bump `CacheBehaviors.Quantity`.
   - Order between the two API behaviors doesn't matter — their path patterns don't overlap. The `DefaultCacheBehavior` (SPA fallback) is a separate field, so insertion order vs. default is also a non-issue.

5. **Push** — if any mutations happened, write the new config to a temp file (the CLI requires `file://` for nested JSON) and run:
   ```bash
   aws cloudfront update-distribution \
     --id $CLOUDFRONT_DISTRIBUTION_ID \
     --distribution-config file://<tmp> \
     --if-match <ETag>
   ```
   On a clean idempotent run (everything already in place), the script logs `no changes` and skips this step.

6. **Invalidate** — `aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/api/*"` to flush the bad cached 404s. Cheaper than `/*`.

**Output:** the script logs each mutation (or skip), prints the function ARN, and exits 0 on success.

### 3. `package.json` — add one script

```json
"infra:cloudfront:apply": "dotenv -- node scripts/setup-cloudfront-proxy.mjs"
```

(Mirrors the `dotenv -- ` prefix used in `deploy:sync` and `deploy:cdn` so it picks up `.env`.)

### 4. `.gitignore` — ignore the backup file

```
infra/cloudfront/.last-config-backup.json
```

### 5. `CLAUDE.md` — short deployment note

Add a one-liner under the API layer section:

> Production proxy infra is configured via `yarn infra:cloudfront:apply` (one-time per CloudFront distribution; idempotent on re-run). The CloudFront Function source lives at `infra/cloudfront/brasilapi-rewrite.js`.

---

## Why managed AWS policy IDs (not custom)

Using AWS-managed `CachingOptimized` (`658327ea-f89d-4fab-a63d-7e88639e58f6`) and `AllViewerExceptHostHeader` (`b689b0a8-53d0-40ab-baf2-68738e2966ac`) avoids creating new custom policies (which would also need management), and these IDs are stable AWS globals. PRD-001 already specifies these exact policies.

---

## Critical existing files (read-only references)

- `package.json:11-13` — `deploy:sync` / `deploy:cdn` scripts. Mirror the `dotenv -- sh -c 'aws …'` pattern.
- `.github/workflows/deploy.yml` — confirms the env var names (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CLOUDFRONT_DISTRIBUTION_ID`, `AWS_DEFAULT_REGION=sa-east-1`).
- `features/001-PRD-fix-brasilapi-proxy.md` — source of truth for origin/behavior fields and the function code.
- `vite.config.ts` — already has the matching dev-mode proxy and rewrite, no changes needed.
- `src/api/brasilapi.ts` — already uses relative path `/api/brasilapi/fipe`, no changes needed.

**Note:** `infra:cloudfront:apply` should **not** be added to `.github/workflows/deploy.yml` — it's a one-time setup, not part of every push.

---

## Validation

### Local

1. `yarn infra:cloudfront:apply` — should log: created/updated function, added origins, added behaviors, pushed update, created invalidation. Exit 0.
2. Wait 5–15 min for CloudFront propagation.
3. `curl -i https://www.fipefacil.com/api/brasilapi/fipe/tabelas/v1` → **200**, JSON array of reference tables.
4. `curl -i https://www.fipefacil.com/api/v2/cars/brands` → **200**, JSON array of brands.

### Browser

1. Visit `https://www.fipefacil.com`, run a full lookup (brand → model → year)
2. Network tab: `/api/brasilapi/fipe/tabelas/v1` and `/api/brasilapi/fipe/preco/v1/...` → 200
3. `PriceHistoryChart` renders with multiple data points
4. No CORS errors in console

### Idempotency

- Re-run `yarn infra:cloudfront:apply` — should log `no changes — origins, behaviors, and function already configured` and exit 0 without touching the distribution.

### Dev unchanged

- `yarn dev` → lookup → chart loads (Vite proxy in `vite.config.ts` is unchanged).

---

## Rollout

- [ ] Add `infra/cloudfront/brasilapi-rewrite.js`
- [ ] Add `scripts/setup-cloudfront-proxy.mjs`
- [ ] Update `package.json` with `infra:cloudfront:apply` script
- [ ] Update `.gitignore` to ignore the backup file
- [ ] Update `CLAUDE.md` with the deployment note
- [ ] Run `yarn build` locally to confirm nothing broke
- [ ] Open PR, merge to main
- [ ] Run `yarn infra:cloudfront:apply` locally with prod env vars (or a one-off CI job)
- [ ] Validate in production (curl + browser)

---

## Risks and mitigations

- **Distribution updates propagate 5–15 min asynchronously.** The script returns as soon as the update is accepted; CloudFront finishes async. Script stdout documents this.
- **Malformed config breaks the distribution.** Mitigation: the script writes `.last-config-backup.json` before pushing, so rollback is:
  ```bash
  aws cloudfront update-distribution \
    --id $CLOUDFRONT_DISTRIBUTION_ID \
    --distribution-config file://infra/cloudfront/.last-config-backup.json \
    --if-match <current ETag>
  ```
- **BrasilAPI may rate-limit CloudFront's egress IP** (same risk PRD-001 calls out). Mitigation: the 24h `CachingOptimized` policy drastically reduces request volume. Fallbacks (fipe.online, paid Parallelum) are documented in PRD-001.
- **Managed policy IDs change.** Extremely unlikely (AWS treats these as GA-stable globals), but if it happens the script will fail loudly when CloudFront rejects the unknown ID — easy to update the constant.
