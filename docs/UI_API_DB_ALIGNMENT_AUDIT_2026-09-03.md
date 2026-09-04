# Platform-Wide UI ↔ API ↔ DB Alignment Audit — 2026-09-03

Owner-ordered systematic audit. Executed in bounded batches per
`docs/BWE_POST_BASELINE_CHANGE_LEDGER_2026-08-27_FORWARD.md` entry 16
(permanent UI ↔ API ↔ DB sync rule). Repository:
`/Users/blackforge/workspace/bwe/repos/repo_clean`. Database: `bwes-cluster`
(production). No unreleased UI is deployed by this audit.

Classification values used below: `READY`, `MISSING FIELD`,
`MISSING RELATIONSHIP`, `MISSING INDEX`, `MISSING DATA`,
`LEGACY / FRAGMENTED`, `API ↔ DB CONTRACT MISMATCH`, `UNRESOLVED`.

---

## BATCH 1 — AUTH/USERS, GENERAL MEMBER, BUSINESS OWNER, DIRECTORY, CLAIM/OWNERSHIP VERIFICATION

### AUTH / USERS

- UI/ROUTE: `/login`, `/signup`, `/reset-password`
- API: `src/pages/api/auth/{login,signup,logout,me,forgot-password,request-reset,reset-password,verify}.ts`
- COLLECTION: `users`, `password_resets`, `password_reset_rate_limits`
- REQUIRED FIELDS: `email` (unique), `accountType`, `currentPlan`, `premiumStatus`, `isAdmin`
- INDEXES: `users.email_1` (unique) present. `password_resets.expiresAt_1`, `password_resets.tokenHash_1` (unique) present. `password_reset_rate_limits.expiresAt_1` present. Confirmed via `node scripts/check-critical-indexes.mjs` — all `OK`.
- CLASSIFICATION: `READY` for signup/login/reset field contract (verified `signup.ts` writes `currentPlan: "free"`, `premiumStatus: "inactive"` matching `person360.ts` `normalizeMembershipState`).
- KNOWN OPEN ITEM (not touched this pass): production auth/session logout-correctness + timeout-enforcement audit lane remains `PARTIAL` per `docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md` §17 — an April 2026 audit found plausible root causes but no fresh reproduction has been run. This requires owner-approved narrow production fix scope, not a bulk DB alignment change. `CLASSIFICATION: UNRESOLVED (owner-gated, pre-existing)`.

### GENERAL MEMBER

- UI/ROUTE: `/profile`, `/pricing`, `/founding-membership`
- API: `src/pages/api/auth/me.ts`, membership read paths inside `person360.ts`
- COLLECTION: `users` (`currentPlan`, `premiumStatus`, `subscriptionStatus`, `membershipPlanStatus`, `membershipPlanExpiresAt`)
- REQUIRED IDS/RELATIONSHIPS: `users._id` is the sole membership anchor; no separate membership collection required for general (non-founding) membership.
- CLASSIFICATION: `READY` — `Person360Membership` lane already resolves this contract directly from `users` fields with no missing field found.

### BUSINESS OWNER

- UI/ROUTE: `/dashboard/edit-business`, `/dashboard` (owner views)
- API: `src/pages/api/business/{profile,update}.ts`, `src/lib/business360.ts` (`ownership`, `membership`, `seller` lanes)
- COLLECTION: `businesses`, `business_claims`, `ownership_reviews`, `business_memberships`, `sellers`
- REQUIRED RELATIONSHIPS: `business_claims.{businessId,userId}`, `ownership_reviews.{businessId,userId}`, `sellers.{userId, businessId|business_id}`, `business_memberships.businessId`
- INDEXES BEFORE THIS PASS: `business_claims` and `ownership_reviews` had the correct unique compound index (`businessId_1_userId_1`). `sellers` and `business_memberships` had **no index at all** on the fields `person360.ts`/`business360.ts` query in production on every 360 resolution (`sellers.userId`, `sellers.businessId`, `sellers.business_id`, `business_memberships.businessId`).
- CLASSIFICATION: `MISSING INDEX` → **FIXED**. See Production DB Change #1 below.

### DIRECTORY

- UI/ROUTE: `/business-directory`, `/business/[slug]`
- API: `src/pages/api/search/businesses.ts`, `src/lib/directory/publicBusinessQuery.ts`, `src/lib/directory/completeness.ts`
- COLLECTION: `businesses`
- REQUIRED FIELDS: `status`, `alias`/`slug`, `completenessScore`/`isComplete`/`qualityScore`/`directoryVisibilityApproved`, `city`/`state`/`address`/`phone`/`website`/`image`/`description`/`category`
- INDEXES: 17 indexes present including `alias_approved_unique`, `uniq_businesses_slug`, geo/text/composite indexes — `READY`.
- PRE-EXISTING GAP (fixed in the prior session, logged in ledger entry 15): `completenessScore` drift after enrichment writes outside the 180-minute restamp window. Already fixed and verified (commit `b234b97`). `CLASSIFICATION: READY (fix already applied and proven)`.
- `directory_listings` collection: only 1 index (`_id_`), only 2 live documents. Query patterns in `business360.ts` filter it by `businessIdReal`/`businessId`, but at 2 documents this is not a proven production performance/correctness gap — collection appears legacy/near-unused relative to the canonical `businesses` collection. `CLASSIFICATION: LEGACY / FRAGMENTED (no action — insufficient volume to justify an index; flagged for owner awareness only)`.

### CLAIM / OWNERSHIP VERIFICATION

- UI/ROUTE: `/admin/claim-verification`
- API: `src/pages/api/admin/founding-memberships.ts`, `src/lib/founding-membership.ts`
- COLLECTION: `business_claims`, `ownership_reviews`, `businesses`
- CLASSIFICATION: `READY` — this lane was already marked `COMPLETE` in `CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md` §18 (commit chain `b51f6e2` → `fb8c11c`) with its own normal-check classifier, verdict counts, and dedicated tests. No new gap found this pass.

---

### Production DB Change #1 — Batch 1 index hardening

- COLLECTION: `sellers` (×3 indexes), `business_memberships` (×1 index)
- CHANGE: created `sellers.userId_1`, `sellers.businessId_1`, `sellers.business_id_1`, `business_memberships.businessId_1` — all background, non-unique, purely additive indexes matching fields already queried by `person360.ts`/`business360.ts` in production.
- SCRIPT: `scripts/audit-batch1-indexes.mjs` (dry-run by default, `--apply` to write; idempotent — safe to re-run)
- RECORDS MATCHED: N/A (index operation, not a document write)
- RECORDS CHANGED: N/A — 4 indexes created, 0 pre-existing (verified via dry-run before apply)
- WHY REQUIRED: proven production query patterns with zero supporting index; correctness/latency risk grows with `sellers`/`business_memberships` collection size.
- CURRENT PRODUCTION UI SAFE: `YES` — index creation does not alter query results, response shape, or existing behavior; verified homepage/business-directory/marketplace all `200` after apply.
- FUTURE UI READY: `YES`
- STATUS: `APPLIED / VERIFIED`

---

## BATCH 2 — SELLER, MARKETPLACE, PRODUCTS, ORDERS, PAYMENTS/STRIPE

_(pending)_

## BATCH 3 — FOUNDING MEMBERSHIP, BLACK CARD, ADVERTISING/SPONSORSHIP, AFFILIATE, CONSULTANT/CREATOR

_(pending)_

## BATCH 4 — JOBS, EMPLOYERS, APPLICANTS, STUDENT/OPPORTUNITIES, LEARNING/ENTITLEMENTS

_(pending)_

## BATCH 5 — SUPPORT, BUSINESS360, PERSON↔BUSINESS, PERSON360, ACTIVITY360, ECONOMICACTIVITY360, ANALYTICS/EVENTS, BMEV RECORDS

_(pending)_
