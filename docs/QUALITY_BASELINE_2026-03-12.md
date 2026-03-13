# Quality Baseline — 2026-03-12

Anchor intent: this is the known-good quality floor to build forward from.

## Baseline anchor
- Branch: `preview/release-candidate-20260308-215810`
- Commit: `d24ffd3`

## Validation suite status (local)
All checks below passed in this baseline run:

- `npm run smoke:local`
- `npm run check:runtime-health`
- `npm run check:critical-paths` (35/35)
- `npm run check:p2-regression` (26/26)
- `npm run check:buy-flows`
- `npm run check:critical-indexes`
- `npm run check:db-docs`

## Quality notes
- Homepage runtime healthy, no Resume/Continue chip regression.
- Marketplace buy-flow checks stable (href-first locator fallback in harness).
- Password reset request routes return safe generic success and token-write path is validated.
- Sponsor mapping lane has remaining asset-content gaps tracked in:
  - `docs/SPONSOR_ASSET_GAPS_2026-03-12.md`

## Known local caveat (non-code)
- Dev server can occasionally enter stale `.next` 500 state; safe recovery is documented in:
  - `docs/RECURRING_FAILURE_PATTERNS.md`

## Build-forward rule
Before any new merge-worthy change:
1. keep scope bounded
2. rerun at minimum: `smoke:local` + `check:runtime-health` + target-lane check
3. if touching auth/marketplace routes, rerun full baseline suite above
