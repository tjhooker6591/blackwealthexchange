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

### SELLER

- COLLECTION: `sellers` (21 docs). Fields observed populated: `stripeAccountId`, `userId`, `businessId`.
- INDEXES: after Batch 1 fix, `userId`, `businessId`, `business_id`, `email` (unique) all present.
- CLASSIFICATION: `READY`

### MARKETPLACE / PRODUCTS

- UI/ROUTE: `/marketplace`, `/sellers/add-product`
- API: `src/pages/api/marketplace/*`
- COLLECTION: `products` (3 docs)
- OBSERVATION: 2 of 3 sampled products have `sellerId` but no direct `businessId` field. This is **not** a gap — `src/lib/marketplace/businessAttribution.ts` (`resolveCanonicalMarketplaceBusinessId`) already deterministically resolves product → business via the seller's `businessId` as a designed fallback, and `business360.ts` already uses this resolver rather than assuming `product.businessId` is always populated.
- INDEXES: `businessId`, `business_id`, `sellerId` created this batch (previously only `_id_`).
- CLASSIFICATION: `READY` (fallback resolution already implemented; index gap fixed)

### ORDERS

- COLLECTION: `orders` (152 docs), unique `orderId` index pre-existing.
- OBSERVATION: sampled orders are sparse — some carry only `userId`, others only `productId`+`status`, several lack `businessId`/`business_id` directly. `business360.ts` already compensates via `productLinkedOrders` (resolves orders by `productId` when `businessId` is absent), so business-level order visibility is not broken.
- INDEXES: `businessId`, `business_id`, `productId` created this batch (previously only the unique `orderId` index — meaning every `business360.ts` commerce-lane query against 152 orders was doing a full collection scan).
- CLASSIFICATION: `MISSING INDEX` → **FIXED**. Field-level `orders.businessId` backfill (deriving it once via the same product→seller→business chain the code already trusts) is a legitimate future optimization but not applied now — current fallback path is already correct, so this is deferred as non-urgent rather than a proven-necessary gap.

### PAYMENTS / STRIPE-STORED BWE DATA

- COLLECTION: `payments` (25 docs), `financial_ledger` (0 docs, feature-flag gated via `ledgerEnabled`), `user_entitlements` (5 indexes, in use)
- INDEXES: `payments` already had `stripeSessionId`, `paymentIntentId`, `userId+createdAt`, `type+itemId+status`, `fulfillmentStatus+entitlementStatus+updatedAt`. Added `businessId`, `metadata.businessId`, `productId` this batch (proven by `business360.ts` commerce-lane query patterns).
- `financial_ledger` has 6 indexes including a unique `webhookEventId` dedupe key (correct idempotency design) and `stripeSessionId`/`revenueStream`/`createdAt`/`paymentStatus`. `0` documents currently — the ledger write path exists in `webhook-handler.ts` but is gated behind a `ledgerEnabled` flag, so this is a feature-flag/rollout state, not a DB defect. `CLASSIFICATION: READY (correctly indexed, currently inactive by design)`.
- `bmev_records`: collection did not exist in production at all (0 docs, namespace not yet created) prior to this batch. Added `businessId`, `buyerUserId`, and a unique `economicTransactionId` index (matching the dedupe key `src/lib/economics/marketplaceBmev.ts` already uses for its `updateOne(..., {upsert:true})` call) so the collection is index-ready the first time a verified marketplace webhook writes to it. `CLASSIFICATION: MISSING INDEX` → **FIXED**. `CLASSIFICATION: MISSING DATA (expected — no verified paid marketplace webhook has completed against this canonical repo/env yet; not a defect, just unproven volume)`.

---

### Production DB Change #2 — Batch 2 index hardening

- COLLECTIONS: `products` (×3), `orders` (×3), `payments` (×3), `bmev_records` (×3, incl. 1 unique)
- SCRIPT: `scripts/audit-batch2-indexes.mjs` (dry-run by default, `--apply` to write; idempotent)
- RECORDS MATCHED/CHANGED: N/A (index operations only; 0 documents touched)
- WHY REQUIRED: `orders` (152 docs) had zero supporting index for the `businessId`/`business_id`/`productId` query patterns `business360.ts` already runs in production on every commerce-lane resolution — every such query was a full collection scan. `products`/`payments` had partial coverage; `bmev_records` had none because the collection had never been created.
- CURRENT PRODUCTION UI SAFE: `YES` — verified homepage/marketplace/`getBusiness`/`check:vertical-regression` all pass after apply; index creation changes no query results.
- FUTURE UI READY: `YES` — `bmev_records` is now index-ready ahead of the first real verified marketplace transaction.
- STATUS: `APPLIED / VERIFIED`

---

## BATCH 3 — FOUNDING MEMBERSHIP, BLACK CARD, ADVERTISING/SPONSORSHIP, AFFILIATE, CONSULTANT/CREATOR

### FOUNDING MEMBERSHIP

- Already covered under Batch 1 CLAIM/OWNERSHIP VERIFICATION — this lane is `COMPLETE` per `CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md` §18. `CLASSIFICATION: READY`.

### BLACK CARD

- COLLECTION: `black_card_memberships` (6 indexes incl. unique `sourceStripeSessionId`, `userId+status`, `tier+status`), `black_card_cards` (7 indexes incl. unique `cardIdCanonical`, unique `publicVerificationId`, `userId+issuedAt`, `membershipId+issueVersion`), `black_card_digital_requests` (4 indexes incl. `userId+status`, `email+status`, `createdAt`).
- CLASSIFICATION: `READY` — already fully indexed to the query patterns `person360.ts` uses (`blackCard` lane), including at only 2 documents per collection. No gap found.

### ADVERTISING / SPONSORSHIP

- UI/ROUTE: `/advertising`, `/advertise-with-us`, `/dashboard` sponsor views
- API: advertising checkout/admin routes; `src/lib/business360.ts` `advertising` lane
- COLLECTION: `ad_purchases` (5 docs), `advertising_requests` (24 docs), `featured_sponsor_schedule` (10 docs)
- INDEXES BEFORE THIS PASS: all three had only the default `_id_` index, despite `business360.ts` querying all three by `businessId` in production on every advertising-lane resolution.
- CLASSIFICATION: `MISSING INDEX` → **FIXED**. See Production DB Change #3.

### AFFILIATE

- COLLECTION: `affiliates` (3 docs) — `person360.ts` resolves the affiliate overlay via `findOneTracked('affiliates', { userId })`, but `affiliates` had no `userId` index (only `_id_`).
- `affiliate_conversions`/`affiliate_payouts` collections referenced in `docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md` §12 do not exist as literal collection names in the current codebase — actual attribution/payout state lives inside `affiliates` itself plus the admin payout routes (`src/pages/api/admin/{get-payouts,complete-payout}.ts`), which were not re-audited field-by-field this pass (already logged as hardened in §12 with duplicate-request/double-complete protection).
- CLASSIFICATION: `MISSING INDEX` → **FIXED** (`affiliates.userId`). Full conversion→payout field contract deferred to a future batch if the owner wants deeper affiliate-specific review; not blocking.

### CONSULTANT / CREATOR

- COLLECTION: `consultant_profiles` (7 indexes, but **no `userId` index** despite `person360.ts` querying `findOneTracked('consultant_profiles', { userId })`), `consultant_moderation_escalations` (renamed/actual collection behind the `/admin/consultant-escalations` API — 0 docs, 0 indexes beyond `_id_`, despite the API always filtering by `status` and sorting by `updatedAt`/`escalatedAt`/`createdAt`), `consulting_intake` (5 docs, queried by `email` and `type`, no supporting index), `employer_consultant_contact_requests` (8 docs, queried by both `employerId` and `consultantId` with no index), `employer_consultant_pipeline` (8 docs, queried by `employerId` with no index).
- CLASSIFICATION: `MISSING INDEX` (5 collections) → **FIXED**. See Production DB Change #3.
- "CREATOR" (music/creator commerce) fields live inside `sellers`/`users` (`creatorSubtype`, `creatorPlanStatus`, `creatorReady`, `creatorOnboardingStatus`) and were already covered by the Batch 1/2 `sellers` index fixes plus the pre-existing `users` collection shape. `CLASSIFICATION: READY`.

---

### Production DB Change #3 — Batch 3 index hardening

- COLLECTIONS: `ad_purchases`, `advertising_requests`, `featured_sponsor_schedule`, `affiliates`, `consultant_profiles`, `employer_consultant_contact_requests` (×2), `employer_consultant_pipeline`, `consultant_moderation_escalations`, `consulting_intake`
- SCRIPT: `scripts/audit-batch3-indexes.mjs` (dry-run by default, `--apply` to write; idempotent)
- RECORDS MATCHED/CHANGED: N/A (index operations only; 0 documents touched)
- WHY REQUIRED: every one of these 10 index gaps corresponds to a query filter/sort already running in production code (`business360.ts` advertising lane; `person360.ts` affiliate/consultant lanes; admin consultant-escalation and employer-consultant APIs) against a collection that previously had no supporting index beyond `_id_`.
- CURRENT PRODUCTION UI SAFE: `YES` — verified homepage/black-card/advertising `200`, `check-critical-paths` `35/35` after apply.
- FUTURE UI READY: `YES`
- STATUS: `APPLIED / VERIFIED`

---

## BATCH 4 — JOBS, EMPLOYERS, APPLICANTS, STUDENT/OPPORTUNITIES, LEARNING/ENTITLEMENTS

### JOBS / EMPLOYERS / APPLICANTS

- COLLECTION: `jobs` (9 docs, only had a partial 2dsphere geo index), `employers` (15 docs, only `_id_`), `applicants` (10 docs, correct unique `jobId+userId` index already present but no `email` index despite `dashboard/user.ts` querying `applicants.countDocuments({ email })`).
- INDEXES BEFORE THIS PASS: none of `jobs.userId`, `jobs.businessId`/`business_id`, `employers.userId`, `employers.businessId`/`business_id`, `applicants.email` existed, despite all six being active query patterns in `person360.ts`/`business360.ts`/`dashboard/user.ts`.
- CLASSIFICATION: `MISSING INDEX` (7 fields) → **FIXED**. See Production DB Change #4.

### STUDENT / OPPORTUNITIES (saved jobs)

- UI/ROUTE: `/saved-jobs`
- API: `POST /api/user/save-job`, `GET /api/user/saved-jobs`, `GET /api/user/get-dashboard`, `GET /api/dashboard/user`
- **FINDING — real, proven `API ↔ DB CONTRACT MISMATCH` (not fixed this pass, flagged for owner decision):**
  - `src/pages/api/user/save-job.ts` (the only write path) inserts into a **standalone `savedJobs` collection**: `{ userId: ObjectId, jobId: ObjectId, savedAt }`.
  - `src/pages/api/user/saved-jobs.ts` (the read path backing the `/saved-jobs` page) reads from a **`savedJobs` array field embedded on the `users` document** — a completely different storage model that `save-job.ts` never writes to.
  - `src/pages/api/user/get-dashboard.ts` also reads the `users.savedJobs` array field (consistent with `saved-jobs.ts`, inconsistent with `save-job.ts`).
  - `src/pages/api/dashboard/user.ts` queries the `savedJobs` collection with `countDocuments({ userEmail: email })` — but `save-job.ts` never writes a `userEmail` field, only `userId`. This call will always return `0` regardless of actual saved-job activity.
  - Production data confirms real user impact: the `savedJobs` collection has `5` documents (real save actions), but only `1` user document currently has a non-empty `users.savedJobs` array — meaning most "save job" actions are invisible on `/saved-jobs` and in `get-dashboard.ts`'s saved-job count, and `dashboard/user.ts`'s saved-job count is permanently `0`.
  - CLASSIFICATION: `API ↔ DB CONTRACT MISMATCH`. **Not fixed this pass** — this requires picking a canonical storage model (dual-write `save-job.ts` into `users.savedJobs` via `$addToSet`, or migrate the read paths onto the `savedJobs` collection and fix `dashboard/user.ts`'s field name) and is an application-behavior change, not a pure additive DB-only fix. Per the owner's stop conditions ("ambiguous relationship" / "genuinely new scope"), this is held for explicit owner direction on which model is canonical before any write path is changed. Index added on the existing `savedJobs.userId` field regardless, since that field is correct and used by the collection's one working writer.

### LEARNING / ENTITLEMENTS

- COLLECTION: `user_entitlements` (1 doc, already well-indexed: unique `userId+accountType+productKey`, `productKey+status+tier`, unique `stripeSubscriptionId`, `updatedAt`). `courses` (1 doc, only `_id_`). `course_enrollments` collection does not exist yet in production (0 docs, matches `docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md` §15 "Digital-product access" being `BLOCKED BY PAYMENT COMPLETION` — no canonical paid course run has completed yet, so this is expected absence, not a defect).
- CLASSIFICATION: `user_entitlements` → `READY`. `courses`/`course_enrollments` → `MISSING DATA (expected — feature not yet exercised end-to-end in production; matches known status-doc blocker, not a new gap)`.

---

### Production DB Change #4 — Batch 4 index hardening

- COLLECTIONS: `jobs` (×3), `employers` (×3), `applicants` (×1), `savedJobs` (×1)
- SCRIPT: `scripts/audit-batch4-indexes.mjs` (dry-run by default, `--apply` to write; idempotent)
- RECORDS MATCHED/CHANGED: N/A (index operations only; 0 documents touched)
- WHY REQUIRED: proven production query patterns in `person360.ts`, `business360.ts`, and `dashboard/user.ts` with zero supporting index.
- CURRENT PRODUCTION UI SAFE: `YES` — verified homepage/job-listings `200`, `check-critical-paths` `35/35` after apply.
- FUTURE UI READY: `YES` for the indexed fields. The `savedJobs` contract mismatch remains open and is explicitly **not** future-UI-ready until an owner decision is made on the canonical storage model.
- STATUS: `APPLIED / VERIFIED` (indexes); `savedJobs` contract mismatch `DEFERRED — OWNER DECISION REQUIRED`.

---

## BATCH 5 — SUPPORT, BUSINESS360, PERSON↔BUSINESS, PERSON360, ACTIVITY360, ECONOMICACTIVITY360, ANALYTICS/EVENTS, BMEV RECORDS

_(pending)_
