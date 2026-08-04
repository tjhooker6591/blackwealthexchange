## CURRENT SESSION HANDOFF

- timestamp: 2026-08-04 22:05 PDT
- canonical repository: `/Users/blackforge/workspace/bwe/repos/repo_clean`
- branch: `friday-release-candidate`
- HEAD: `c626bcfe1737620d864d2b0a9b85bf028293f195`
- current active task: `CQ-2 Auth/session parity proof continuation`
- last completed task: `Admin business approvals pagination/count repair + focused admin proof pass`
- last commit SHA: `c626bcfe1737620d864d2b0a9b85bf028293f195`
- tests last run: focused admin proof pass on Tuesday, August 4, 2026 for `/admin/dashboard`, `/admin/command-center`, `/admin/financial-review`, `/admin/revenue`, `/admin/directory-approvals`, `/admin/business-approvals`; `npm run typecheck` pass; `node scripts/runtime-check.mjs` pass; localhost `3000` returned HTTP `200`
- known blockers:
  - `repo_clean` still has a large pre-existing dirty working tree and is not clean
  - normal `git commit` hooks trigger repo-wide `eslint src/ --fix` plus `prettier --write .`, which creates broad churn and must be handled carefully
  - `src/lib/adminFinanceSummary.ts` has a post-finance-commit indentation-only working-tree delta that must be preserved/classified, not discarded
- current dirty-tree count: `456` file-level git status entries (`git status --porcelain=v1 -uall`)
- exact next action: run the CQ-2 continuation proofs already present in the working tree (`scripts/runtime-proof-business-parity.mjs`, `scripts/runtime-proof-directory-ownership.mjs`, `scripts/runtime-repro-org-verify.mjs`) without disturbing the preserved unrelated dirty tree; the admin queue-count mismatch was closed as a pagination/visibility defect, not a remaining normalization defect
- production/deployment status: no deploy this session; no production Mongo writes; no Stripe production mutations
- dirty-tree preservation snapshot: `/Users/blackforge/workspace/bwe/snapshots/repo_clean-2026-08-03T04-31-39-146Z`

# BWE Master Task List

Legend: `complete` | `in-progress` | `incomplete` | `verify-next`
Owner default: `BlackForge`

Revenue-first governing directive override is in force: `docs/BWE_12_MONTH_REVENUE_FIRST_GOVERNING_DIRECTIVE_2026-06-28.md`

Before any item remains active, it must pass the Revenue Gate and be classed as one of:

- Revenue Critical
- Trust or Payment Critical
- Customer Fulfillment
- Maintenance
- Deferred
- Retired

Historical items below must be reclassified before further implementation.

## P0

1. Full reset lifecycle proof + hardening

- status: complete
- owner/agent: BlackForge
- proof required: e2e reset lifecycle, reuse fail, expiry fail, TTL, no raw token
- dependencies: env + Mongo access
- last updated commit: c259c67

2. Env centralization on critical auth/data routes

- status: complete
- owner/agent: BlackForge
- proof required: lint/build + route/API checks
- dependencies: env.ts helpers
- last updated commit: f5a8f5f

3. DB documentation/process system

- status: complete
- owner/agent: BlackForge
- proof required: check:db-docs output
- dependencies: docs + checker script
- last updated commit: c8bac4e

## P1

4. Built-runtime stabilization standard

- status: complete
- owner/agent: BlackForge
- proof required: build + smoke
- dependencies: startable runtime
- last updated commit: 9f8e5a1

5. Security headers + CSP

- status: complete
- owner/agent: BlackForge
- proof required: curl header proof
- dependencies: next.config headers
- last updated commit: 9f8e5a1

6. Critical DB index verification

- status: complete
- owner/agent: BlackForge
- proof required: check:critical-indexes output
- dependencies: Mongo access
- last updated commit: 9f8e5a1

## P2

7. Role-by-role regression verification

- status: complete
- owner/agent: BlackForge
- proof required: check:p2-regression pass
- dependencies: seeded role accounts in harness
- last updated commit: 7dddecf

8. Vertical regressions (marketplace/ads/jobs/admin)

- status: complete (route/regression baseline)
- owner/agent: BlackForge
- proof required: scenario matrix + screenshots/logs
- dependencies: stable runtime + seeded data
- last updated commit: 7dddecf

## P2.5

9. Referral engine v1 foundation

- status: complete
- owner/agent: BlackForge
- proof required: auth code endpoint + track endpoint + DB docs backfill
- dependencies: auth session + Mongo
- last updated commit: 3a2e174

## P2.6

11. Runtime/link integrity gates

- status: complete
- owner/agent: BlackForge
- proof required: `check:runtime-health` + `check:internal-links` pass
- dependencies: running app instance
- last updated commit: e6d3505

## P2.7

12. Canonical route typo cleanup (`inclusive-job-descriptions`)

- status: complete
- owner/agent: BlackForge
- proof required: critical-path pass + typo redirect verification
- dependencies: next.config redirect + canonical page path
- last updated commit: 23f9a48

## P2.8

13. Marketplace buy-button completion matrix + fixes

- status: complete
- owner/agent: BlackForge
- proof required: full buy-button matrix, failing paths, runtime/env correction, checkout-session recovery, rerun GO
- dependencies: runtime pinned to recovered app URL + Atlas Mongo + STRIPE_SECRET_KEY present
- notes: local validation ran in live Stripe mode; inventory-policy follow-up remains because `stock=0` products still create checkout sessions
- last updated commit: c797e3a

## P2.9

14. Critical-path harness reliability fix

- status: complete
- owner/agent: BlackForge
- proof required: `check:critical-paths` pass including authenticated role checks
- dependencies: login endpoint + cookie capture
- last updated commit: 14e83a9

## P3

9. Cross-site design consistency pass

- status: incomplete
- owner/agent: BlackForge
- proof required: before/after visual set
- dependencies: design freeze for launch scope
- last updated commit: pending

10. Recruiting v1.1 admin workflow

- status: verify-next
- owner/agent: BlackForge
- proof required: intake->pipeline->status transitions
- dependencies: admin UI/API extension
- last updated commit: pending

11. Lane 3 backlog: business detail image trust improvement

- status: incomplete
- owner/agent: BlackForge
- proof required: business image precedence + category fallback matrix + persistence proof + trust QA screenshots
- dependencies: Lane 3 search quality/trust window (do not execute during Lane 2)
- requirements:
  - use business-provided image/logo first
  - if missing, use category-specific fallback imagery
  - do not use one generic fallback across all businesses
  - do not hotlink random web images
  - use licensed/public/approved sources only
  - store selected fallback image/source metadata for consistency per listing
  - unknown categories use premium BWE-branded fallback
- last updated commit: pending

## Lane Issue Log and Closure Verification (mandatory)

### P0 stable baseline issue log (2026-04-30)

- Issue name: Login session persistence failure (kicked back to login)
- Description: User could login but session did not persist and returned to login.
- When/where: P0 stability sweep during Lane 2 closure attempts.
- Root cause: auth role/collection drift + cookie scope mismatch for localhost/proto handling.
- Files involved: `src/pages/api/auth/login.ts`, `src/pages/api/auth/me.ts`, `src/pages/api/auth/logout.ts`, `src/pages/api/auth/signup.ts`, `src/middleware.ts`
- Fix applied: cross-collection role fallback in login/me; localhost-safe cookie domain/secure handling.
- Date/time resolved: 2026-04-30 PDT

- Issue name: Cookie/session handling issue
- Description: session cookie/accountType cookie not consistently reused across follow-up auth checks.
- When/where: auth validation during P0.
- Root cause: cookie attribute mismatch for local host/protocol and role lookup assumptions.
- Files involved: `src/pages/api/auth/login.ts`, `src/pages/api/auth/me.ts`, `src/pages/api/auth/logout.ts`, `src/pages/api/auth/signup.ts`
- Fix applied: host-aware cookie policy in auth routes and resilient identity resolution.
- Date/time resolved: 2026-04-30 PDT

- Issue name: One-click/navigation delay (5-6s)
- Description: delayed click response/navigation reported by user.
- When/where: homepage/core navigation P0 report.
- Root cause: request-path overhead in search endpoint (`count`/prep path) and auth-path overhead investigations.
- Files involved: `src/pages/api/search/businesses.ts`, `src/middleware.ts`
- Fix applied: remove request-path count logic; reduce prep overhead; middleware localhost redirect guard.
- Date/time resolved: 2026-04-30 PDT (user-validated P0 closure)

- Issue name: Search count/data-trust issue (incorrect inventory numbers)
- Description: homepage displayed low page-limited totals instead of true inventory counts.
- When/where: homepage hero stat cards.
- Root cause: homepage consumed search pagination `total` after search count-path optimization.
- Files involved: `src/pages/index.tsx`, `src/pages/api/search/businesses.ts`, `src/pages/api/stats/inventory.ts`
- Fix applied: separated global inventory stats to dedicated endpoint.
- Date/time resolved: 2026-04-30 PDT

- Issue name: Middleware/redirect behavior issue
- Description: local runtime API calls redirected unexpectedly under production mode behavior.
- When/where: middleware HTTPS enforcement and protected-route redirects.
- Root cause: HTTPS redirect enforced without localhost exemption.
- Files involved: `src/middleware.ts`
- Fix applied: localhost bypass for HTTPS redirect enforcement.
- Date/time resolved: 2026-04-30 PDT

### Issue Verification Block (required)

- Issue: Login session persistence failure
  - Original behavior: Login then bounce to login window.
  - Root cause: role collection drift + cookie scope mismatch.
  - Fix: auth fallback + host-aware cookie settings.
  - Re-test result: PASS

- Issue: Cookie/session handling issue
  - Original behavior: session cookie not reliably honored.
  - Root cause: domain/secure mismatch in local host contexts.
  - Fix: localhost cookie overrides in login/signup/logout.
  - Re-test result: PASS

- Issue: One-click/navigation delay
  - Original behavior: 5-6 second click delay.
  - Root cause: heavy search cold prep/count path and redirect overhead.
  - Fix: removed count path from search request and tightened prep path.
  - Re-test result: PASS

- Issue: Search count/data-trust issue
  - Original behavior: homepage counts showed page-limited values.
  - Root cause: search totals reused for global stats.
  - Fix: dedicated `/api/stats/inventory` endpoint and homepage wiring.
  - Re-test result: PASS

- Issue: Middleware/redirect behavior issue
  - Original behavior: unintended local redirects.
  - Root cause: strict production HTTPS redirect without localhost carve-out.
  - Fix: localhost bypass in middleware.
  - Re-test result: PASS
