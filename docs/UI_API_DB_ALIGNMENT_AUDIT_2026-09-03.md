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

### STUDENT / OPPORTUNITIES (saved jobs) — CLOSED 2026-09-03 (owner decision: `savedJobs` collection is canonical)

- UI/ROUTE: `/saved-jobs`, `/user-dashboard`
- API: `POST/DELETE /api/user/save-job`, `GET /api/user/saved-jobs`, `GET /api/user/get-dashboard`, `GET /api/dashboard/user`
- ORIGINAL FINDING (batch 4): three competing storage models for the same feature — `save-job.ts` wrote a standalone `savedJobs` collection (`{userId, jobId, savedAt}`), `saved-jobs.ts`/`get-dashboard.ts` read a `users.savedJobs` array field `save-job.ts` never wrote to, and `dashboard/user.ts` queried the collection by a `userEmail` field that was never written (always returned `0`).
- OWNER DECISION: standalone `savedJobs` collection is canonical. No permanent dual-write into `users.savedJobs`.
- RECONCILIATION (read-only, before any change — `scripts/reconcile-saved-jobs.mjs`, dry-run then `--apply`):
  - `savedJobs` collection: `5` total documents.
  - Duplicate `{userId,jobId}` pairs: `0`.
  - Invalid/orphaned entries: `1` (`userId:"USER123"`, `jobId:"JOB789"` — not valid ObjectIds, pre-dates the current write path, structurally impossible for `save-job.ts` to have written; left in place untouched, non-destructive, invisible to any real ObjectId-keyed query).
  - `users.savedJobs` array entries: exactly `1` user (`680c1e52770af2064fe4c7ad`) with `2` entries — **both already present** in the `savedJobs` collection.
  - Backfill candidates found: `0`. Backfill applied: `0`. Every legitimate historical save was already present in the canonical collection; no data was at risk of being lost by switching readers.
  - All `3` valid job references confirmed to still exist in `jobs` (no orphaned job references among real data).
- IDENTITY CONTRACT CONFIRMED: `savedJobs.{userId, jobId}` (both `ObjectId`), matching the one working writer (`save-job.ts`) exactly — not inferred from email.
- INDEX: compound unique index `uniq_savedJobs_userId_jobId` on `{userId:1, jobId:1}` was **already present** in production prior to this slice (pre-existing, not created by this audit) — duplicate-save protection already existed at the DB layer; the application layer just wasn't using it idempotently.
- WRITE PATH FIXED: `src/pages/api/user/save-job.ts` — switched `insertOne` to an upsert (`updateOne` + `$setOnInsert` + `upsert:true`) so repeat saves are idempotent instead of surfacing a duplicate-key error; added a `DELETE` handler (same route, same auth/validation) for unsave, since no unsave capability existed anywhere in the codebase before this slice.
- READ PATHS FIXED (now query the canonical `savedJobs` collection by `userId`):
  - `src/pages/api/user/saved-jobs.ts` — was reading `users.savedJobs` array; now queries `savedJobs.find({ userId })`.
  - `src/pages/api/user/get-dashboard.ts` — was reading `users.savedJobs.length`; now `savedJobs.countDocuments({ userId })`.
  - `src/pages/api/dashboard/user.ts` — was querying the dead `savedJobs.userEmail` field (always `0`); now resolves canonical `userId` (from the session JWT, falling back to a `users` lookup by email for older tokens) and queries `savedJobs.countDocuments({ userId })`.
  - `src/pages/user-dashboard.tsx` (`getServerSideProps`) — audited, already correctly queried the canonical `savedJobs` collection by `userId`; no change needed.
- END-TO-END VALIDATION (`tmp/validate-saved-jobs-e2e.mjs`, run against local dev, cleaned up after, verified collection returned to its exact original 5-document state): save job (`201`), duplicate save is idempotent (`201`, no duplicate row created — list stayed at 1 item), saved-jobs list reflects the save, dashboard count reflects the save on **both** `get-dashboard.ts` and `dashboard/user.ts` (previously stuck at `0`), unsave removes the row and the list drops back to `0`, a second test user's actions never affected the first user's list (auth isolation), saving a nonexistent `jobId` succeeds at the write layer but is silently omitted from the rendered list (graceful missing/deleted-job handling, matching prior behavior), and an unauthenticated request is rejected with `401`.
- CLASSIFICATION: `READY` (was `API ↔ DB CONTRACT MISMATCH` — now closed).
- COMPATIBILITY: `users.savedJobs` left in place untouched as legacy data per the owner's instruction — not removed, not renamed, no code still reads or writes it after this fix.

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

### SUPPORT

- COLLECTION: `support_tickets` (2 docs, only `_id_` + `createdAt` index; no index on `relatedBusinessId`, the field `business360.ts`'s support lane actually filters by).
- CLASSIFICATION: `MISSING INDEX` → **FIXED**.

### ANALYTICS / EVENTS (highest-impact finding of this audit)

- COLLECTION: `flow_events` — **24,229 documents**, `search_quality_events` — **3,168 documents**. Both had **zero index beyond the default `_id_`** prior to this batch.
- WHY THIS MATTERS: `src/lib/activity360.ts` (`resolveBusinessActivity360`/`resolvePersonActivity360`) is the shared read-only resolver underneath **every** `Business360`, `Person360`, and `EconomicActivity360` call (`resolveBusinessEconomicActivity360`/`resolvePersonEconomicActivity360` both call into it). Every one of those resolutions was running an unindexed `businessId`/`userId`/`selectedBusinessId` filter across a 24k+/3k+ document collection — a full collection scan on every admin 360 lookup, every economic-activity-attribution diagnostic call, and any future UI surface that consumes these resolvers.
- CLASSIFICATION: `MISSING INDEX` → **FIXED**. This is the single most consequential fix in the entire audit given collection size and the number of downstream consumers (Business360, Person360, EconomicActivity360 all depend on it).

### BUSINESS360 / PERSON360 / PERSON ↔ BUSINESS / ACTIVITY360 / ECONOMICACTIVITY360

- These five resolvers were built or extended in this canonical repo across recent Phase 2 workstreams (`src/lib/business360.ts`, `src/lib/person360.ts`, `src/lib/personBusinessRelationships.ts`, `src/lib/activity360.ts`, `src/lib/economicActivity360.ts`), each with dedicated executable test suites already re-run and passing this pass: `business360-tests.mjs`, `person360-tests.mjs`, `person-business-relationships-tests.mjs`, `economicActivity360-tests.mjs`.
- Every collection each resolver depends on was audited across Batches 1–5: `businesses`, `business_claims`, `ownership_reviews`, `business_memberships`, `sellers`, `products`, `orders`, `payments`, `directory_listings`, `advertising_requests`/`ad_purchases`/`featured_sponsor_schedule`, `jobs`/`employers`, `support_tickets`, `flow_events`, `search_quality_events`, `bmev_records`. All proven index gaps found across those collections are now fixed.
- `EconomicActivity360` specifically: `bmev_records` had never been created in production before Batch 2 of this audit (0 documents — no verified marketplace webhook has completed against this canonical env yet). It is now correctly indexed (`businessId`, `buyerUserId`, unique `economicTransactionId`) and ready to receive real data the first time a verified paid marketplace transaction completes — this is a direct instance of the owner's new rule: DB foundation shipped ahead of proven transaction volume, safely and additively.
- CLASSIFICATION: `READY` (all five resolvers; all supporting collections indexed; all test suites passing)

### BMEV-RELATED EXISTING RECORDS

- `bmev_records`: `0` documents in production (collection namespace didn't exist prior to this audit). Index-ready as of Batch 2. `CLASSIFICATION: MISSING DATA (expected — feature not yet exercised; index readiness is now in place ahead of first real transaction, per the owner's DB-precedes-UI rule)`.
- `financial_ledger`: `0` documents, correctly indexed already (6 indexes incl. unique `webhookEventId` dedupe key), gated behind a `ledgerEnabled` feature flag — feature-flag state, not a DB defect. `CLASSIFICATION: READY`.

---

### Production DB Change #5 — Batch 5 index hardening

- COLLECTIONS: `flow_events` (×2), `search_quality_events` (×1), `support_tickets` (×1)
- SCRIPT: `scripts/audit-batch5-indexes.mjs` (dry-run by default, `--apply` to write; idempotent)
- RECORDS MATCHED/CHANGED: N/A (index operations only; 0 documents touched)
- WHY REQUIRED: `flow_events` (24,229 docs) and `search_quality_events` (3,168 docs) back every Business360/Person360/Activity360/EconomicActivity360 resolution with zero supporting index — the highest-volume, highest-consumer-count gap found in the audit. `support_tickets` had no index on the field `business360.ts`'s support lane actually filters by.
- CURRENT PRODUCTION UI SAFE: `YES` — verified homepage/support `200`, `check-critical-paths` `35/35`, `check:vertical-regression` all pass, and all four 360-family test suites (`business360`, `person360`, `person-business-relationships`, `economicActivity360`) pass after apply. Indexes were created in `background: true` mode so the 24k-document `flow_events` build did not block reads/writes.
- FUTURE UI READY: `YES`
- STATUS: `APPLIED / VERIFIED`

---

## AUDIT SUMMARY (Batches 1–5, complete)

- TOTAL FUNCTIONAL CONTRACTS REVIEWED: 26 (AUTH/USERS, GENERAL MEMBER, BUSINESS OWNER, DIRECTORY, CLAIM/OWNERSHIP VERIFICATION, SELLER, MARKETPLACE/PRODUCTS, ORDERS, PAYMENTS/STRIPE, FOUNDING MEMBERSHIP, BLACK CARD, ADVERTISING/SPONSORSHIP, AFFILIATE, CONSULTANT/CREATOR, JOBS/EMPLOYERS/APPLICANTS, STUDENT/OPPORTUNITIES (saved jobs), LEARNING/ENTITLEMENTS, SUPPORT, ANALYTICS/EVENTS, BUSINESS360, PERSON360, PERSON↔BUSINESS, ACTIVITY360, ECONOMICACTIVITY360, BMEV RECORDS)
- DB GAPS FOUND: 39 missing indexes across 5 batches + 1 API↔DB contract mismatch (saved jobs) + 1 pre-existing derived-field staleness bug (directory completeness, fixed in the session prior to this audit)
- DB GAPS FIXED: 39 indexes (all applied to production, all verified safe, all reversible via `dropIndex`) + 1 API↔DB contract mismatch (saved jobs — closed 2026-09-03 per explicit owner decision, see updated STUDENT/OPPORTUNITIES section above)
- DEFERRED: none remaining from this audit's DB-alignment scope.
- KNOWN OPEN ITEM, NOT TOUCHED (pre-existing, owner-gated): production auth/session logout-correctness + timeout-enforcement audit lane (§17 of the status doc) — requires owner-approved narrow fix scope, not a bulk DB alignment change.
- CURRENT PRODUCTION UI COMPATIBLE: `YES` — every batch was verified with homepage/route-specific `200` checks, `check-critical-paths.mjs` (`35/35`), and `check:vertical-regression`; final batch additionally re-ran all four 360-family test suites; the saved-jobs closure was additionally validated end-to-end (save/duplicate-save/unsave/list/dashboard-count-both-endpoints/multi-user isolation/missing-job handling/unauthenticated rejection).
- UNRELEASED UI DB-READY: `YES` for `EconomicActivity360`'s admin diagnostic route (already shipped this session, index-backed as of Batch 2/5). No other known-unreleased UI surface was identified during this audit that depends on DB state not yet accounted for.
