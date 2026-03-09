# Release Candidate Status

Last updated commit: c797e3a

## Candidate branch (push tomorrow)

- `preview/release-candidate-20260308-215810`

## Local built-runtime readiness

- Status: **GO (local runtime + marketplace buy-flow matrix accepted in current cycle)**
- Marketplace products visible again on recovered runtime.
- Checkout session route recovered after runtime env correction (`STRIPE_SECRET_KEY` missing in process env was the blocker).
- Marketplace Buy Now matrix: **GO**.
- Note: local validation is currently running in **live Stripe mode**.
- Follow-up: products with `stock=0` still create checkout sessions (inventory-policy decision pending).

## Canonical route decision

- Canonical: `/resources/inclusive-job-descriptions`
- Backward compatibility: `/resources/inclusive-job-desriptions` redirects to canonical route.

## Checks executed

- `npm run lint`
- `npm run build`
- `npm run check:runtime-health`
- `npm run check:internal-links`
- `npm run check:critical-paths`
- `npm run check:vertical-regression`
- `npm run check:critical-indexes`

## Latest accepted commits (most recent first)

- `c797e3a` marketplace buy-flow audit matrix script (accepted purchase-flow completion cycle)
- `23f9a48` canonical route typo cleanup (canonical path + redirect)
- `4f38e6c` critical-path verifier reliability fix
- `e6d3505` referral/docs/link/runtime-health finalization
- `7dddecf` SSR role-guard enforcement + P2 pass
- `c8bac4e` DB change-control docs + db-docs checker

## Remaining known issues

- Preview deployment not yet executed (blocked until branch push/auth from this environment).
- Runtime can drift into mismatched process/env state if old repo process owns target port.
- Inventory policy gap: `stock=0` products currently still generate checkout sessions.

## Rollback target

- `23f9a48` (or previous stable `e9f0ea4` depending scope of rollback)

## Preview validation checklist for tomorrow

1. Confirm Preview URL and exact commit SHA
2. Verify env parity:
   - `APP_URL`, `NEXTAUTH_URL`
   - `MONGODB_URI`, `MONGODB_DB`
   - `JWT_SECRET`, `NEXTAUTH_SECRET`, `RESET_TOKEN_SECRET`
   - Stripe/webhook/email vars if enabled
3. Run route/API checks on Preview:
   - `/`, `/business-directory`, business detail, `/recruiting-consulting`
   - `/api/auth/session`, `/api/auth/request-reset`, search APIs
   - marketplace + advertising routes
4. Run protected-role checks
5. Validate index readiness in target env
6. Produce GO/NO-GO promotion card with rollback SHA
