# BLACK OPEN DEFECTS AND CLOSURE QUEUE

_Last updated: 2026-08-05 America/Los_Angeles_

## Current canonical execution state

- Canonical repository: `/Users/blackforge/workspace/bwe/repos/repo_clean`
- Canonical branch: `friday-release-candidate`
- Canonical HEAD: `d57aecd3455b2f0eb8c02849bfb388a16c196ef1`
- Dirty-tree preservation snapshot: `/Users/blackforge/workspace/bwe/snapshots/repo_clean-2026-08-03T04-31-39-146Z`
- Complete file manifest: `docs/recovery/BWE_COMPLETE_FILE_MANIFEST_CURRENT.csv`

## Current ordered execution queue — reconciled 2026-08-05

1. **CQ-1 — Founder monthly-billing contradiction**
   - Status: COMPLETE
   - Severity: High
   - Current reality:
     - `/pricing` and `/founding-membership` say Founding Member is monthly
     - `/checkout?plan=founder` copy already says monthly
     - canonical Stripe checkout authority now matches the public monthly founder offer
     - `/black-card` and `/black-card/join` now use `Founding Member plan` copy instead of the stale `Founding plan` wording
   - Exact files:
     - `src/pages/api/stripe/checkout.ts`
     - `src/pages/checkout/index.tsx`
     - `src/pages/pricing.tsx`
     - `scripts/test-pricing-billing-alignment.mjs`
   - Proof:
     - Commit: `72806abd827e57494bdd3ddb8525328a0ff0f0d8`
     - `node scripts/test-pricing-billing-alignment.mjs` pass on Tuesday, August 4, 2026
     - `npm run typecheck` pass on Tuesday, August 4, 2026
     - `node scripts/runtime-check.mjs` pass on Tuesday, August 4, 2026
   - Next action:
     - no further pricing contradiction remains; preserve proof and reopen only on regression

2. **CQ-2 — Founding membership resume-checkout availability regression**
   - Status: COMPLETE
   - Severity: High
   - Current reality:
     - legacy `ownership_review_pending` now normalizes to the same pending-review state as `ownership_verification_pending`
     - pending-review businesses are no longer claimable through the resume-checkout path
   - Exact files:
     - `src/lib/founding-membership.ts`
     - `src/lib/founding-membership/__tests__/resume-checkout-tests.mjs`
   - Proof:
     - Commit: `49bc7223a52dd59e1c1a873e9d08009a8f9ba7ac`
     - `node src/lib/founding-membership/__tests__/resume-checkout-tests.mjs` pass on Tuesday, August 4, 2026
     - `node src/lib/founding-membership/__tests__/claim-reconciliation-tests.mjs` pass on Tuesday, August 4, 2026
     - `node src/lib/founding-membership/__tests__/platform-queue-tests.mjs` pass on Tuesday, August 4, 2026
     - `npm run typecheck` pass on Tuesday, August 4, 2026
     - `node scripts/runtime-check.mjs` pass on Tuesday, August 4, 2026
   - Next action:
     - keep the normalized alias coverage in place while continuing broader claim-verification reconciliation

3. **CQ-3 — Sponsor search / sponsor API linkage gap**
   - Status: COMPLETE
   - Severity: High
   - Current reality:
     - expired `featured_sponsor_schedule` fallback rows no longer remain promotable after the focused August 4, 2026 sponsor repair
     - ordinary directory search with `search=Pamfa United Citizens` still returns the linked PAMFA business, but now correctly reports `isSponsored: false` because the March-May 2026 sponsorship has expired
     - ordinary directory search with `search=TitanEra` returns zero sponsor-linked results
     - `/api/sponsored-businesses` now returns `none_active` instead of resurfacing expired PAMFA schedule rows
     - the remaining named sponsor gaps close as source-data classification, not as a remaining sponsor runtime defect
     - current paid historical sponsor rows exist for `TitanEra`, `Guardians of the Forgotten Realm`, `The Last Nephilim`, `Millianious`, and `Tiana Song Sprouts`, but they still do not resolve to public BWE business records because no linked public business exists
     - `Thomas Hooker Sr.` still does not have an exact sponsor/ad source row; only related historical rows exist for `Thomas Hooker Author` and `Thomas Hooker Publisher`
     - PAMFA remains the only reconciled named sponsor with a real public BWE business and ordinary search visibility
   - Exact files:
     - `src/lib/advertising/sponsorListings.ts`
     - `src/pages/api/search/businesses.ts`
     - `src/pages/api/sponsored-businesses.ts`
     - `src/lib/directory/__tests__/sponsor-listings-tests.mjs`
   - Proof:
     - Commits:
       - `6ab62cd35813dbe2c5dfa66e3947d0645ddcb839`
       - `44fe30733858aaff116d0daa3894a3aa1e9c961a`
       - `9e4e97d462506d69fc334f6bc5603e0228f34739`
       - `f098f497949155064b426c610e89f01c1706c47b`
     - `node src/lib/directory/__tests__/sponsor-listings-tests.mjs` pass on Tuesday, August 4, 2026
     - `npm run typecheck` pass on Tuesday, August 4, 2026
     - `node scripts/runtime-check.mjs` pass on Tuesday, August 4, 2026
     - live API checks on Tuesday, August 4, 2026 show:
       - `/api/sponsored-businesses` returns `{"ok":true,"sponsors":[],"meta":{"source":"none_active"}}`
       - `/api/search/businesses?search=Pamfa%20United%20Citizens&sponsoredFirst=1` returns PAMFA with `isSponsored: false`
       - `/api/search/businesses?search=TitanEra&sponsoredFirst=1` returns `0`
       - expired schedule fallback rows no longer drive sponsor promotion
     - Wednesday, August 5, 2026 read-only sponsor-source audit recorded the seven-name matrix in `docs/audit-evidence/2026-08-05-sponsor-reconciliation.md`
   - Next action:
     - none in sponsor runtime code; treat any future missing sponsor-name resolution as data creation/linkage work outside this closed defect lane

4. **CQ-4 — PAMFA public address presentation gap**
   - Status: COMPLETE
   - Severity: Medium
   - Current reality:
     - malformed live location data is now normalized at render time without mutating production records
     - PAMFA public business pages load, render `30349`, and expose `Directions`
   - Exact files:
     - `src/lib/directoryProfileContract.ts`
     - `src/pages/business/[slug].tsx`
     - `src/pages/business-directory/[alias].tsx`
     - `src/lib/directory/__tests__/location-normalization-tests.mjs`
   - Proof:
     - Commit: `02d15c6f93216df8b0917c350dc8a471ccbc417c`
     - `node src/lib/directory/__tests__/location-normalization-tests.mjs` pass on Tuesday, August 4, 2026
     - `npm run typecheck` pass on Tuesday, August 4, 2026
     - `node scripts/runtime-check.mjs` pass on Tuesday, August 4, 2026
     - `/business/pamfa-united-citizens` returns `200`, renders `30349`, and exposes `Directions`
     - `/business-directory/pamfa-united-citizens` returns `200`, renders `30349`, and exposes `Directions`
   - Next action:
     - no implementation work pending; preserve proof and reopen only on regression

5. **CQ-5 — Marketplace paid completion proof**
   - Status: BLOCKED
   - Severity: High
   - Dependency:
     - real payment completion + webhook fulfillment evidence
   - Next action:
     - perform one canonical paid marketplace run only when payment-proof execution is authorized and safe

6. **CQ-6 — Cross-machine auth/runtime parity capture**
   - Status: BLOCKED
   - Severity: Medium
   - Dependency:
     - second development environment runtime access
   - Next action:
     - replay the current local auth/session proof matrix on the second machine

### DA-02 closure note — Wednesday, August 5, 2026

- Status: COMPLETE
- Current reality:
  - public directory, public search API, business-directory UI, and current claim mode all resolve to the same public business population: `365`
  - raw business records total `2272`
  - the main admin business-approval queue remains `1633`
  - admin approved and rejected buckets remain `583` and `32`
  - a separate `duplicate_pending_review` population of `24` records existed outside the prior dashboard reconciliation
  - the true runtime defect was missing duplicate-review bucket accounting in admin totals, not a defect in public search or public pagination
- Exact files:
  - `src/lib/adminBusinessStatus.ts`
  - `src/pages/api/admin/get-pending-businesses.ts`
  - `src/pages/api/admin/dashboard-stats.ts`
  - `src/pages/api/admin/metrics/command-center.ts`
  - `src/pages/admin/dashboard.tsx`
  - `src/pages/admin/business-approvals.tsx`
  - `src/lib/__tests__/admin-business-status-tests.mjs`
- Proof:
  - Commit: `b4f3e6ffdb0d061ddb218f0137ebdd1db4fbf584`
  - `node src/lib/__tests__/admin-business-status-tests.mjs` pass on Wednesday, August 5, 2026
  - `npm run typecheck` pass on Wednesday, August 5, 2026
  - `node scripts/runtime-check.mjs` pass on Wednesday, August 5, 2026
  - `/api/search/businesses?page=1&limit=20` and page 2 both report `total: 365` with different records
  - `/api/admin/get-pending-businesses?page=1&limit=25` and page 2 both report `total: 1633` with different records
  - `/api/admin/dashboard-stats` now reconciles `2272 = 1633 pending + 583 approved + 32 rejected + 24 duplicate review`
  - browser proof on `/business-directory`, `/admin/business-approvals`, and `/admin/dashboard?hideTests=1` completed with no console or failed-network errors
- Next action:
  - move forward to `DA-01` unless a regression reopens directory-count parity

### DA-01 closure note — Wednesday, August 5, 2026

- Status: COMPLETE
- Current reality:
  - the eight most recent real role-account joins were identified from current canonical data
  - the eight-member scope contains `1` Business Owner signup and `7` General User signups
  - the earlier six-member checkpoint was reconciled as a scope-truncation mistake, not a data-loss problem; two additional general-user records were present in the same `users` collection and analysis window
  - no linked `business_claims`, `ownership_reviews`, `business_memberships`, `membership_onboarding`, `membership_fulfillment`, `payments`, `subscription_events`, `entity_ownerships`, `referral_events`, or user-linked `flow_events` were found for those eight members
  - source attribution below the persisted `accountType` is not available from current linked data
  - no live application defect was established from this lane; the dominant result is measurement gap plus expected non-claim behavior for seven general-user signups
- Proof:
  - read-only Mongo audit completed on Wednesday, August 5, 2026
  - full anonymized matrix recorded in `docs/audit-evidence/2026-08-05-member-conversion-attribution.md`
- Next action:
  - use this DA-01 result as input to the ongoing claim-verification and onboarding assessment lanes rather than reopening runtime code without stronger evidence

### Confirmed recent closures in canonical history

- Black Card entitlement proof CSRF alignment: commit `468c78e487958f01f8dbf958783e03818a3a3e23`
  - file:
    - `scripts/runtime-proof-black-card-entitlements.mjs`
  - defect:
    - proof script was failing authenticated Black Card POST checks at middleware because it did not send same-origin headers required by current CSRF protection
  - proof:
    - `npm run proof:black-card-entitlements` now passes on Tuesday, August 4, 2026
    - `node scripts/runtime-check.mjs` passed

- Black Card auth/runtime proof CSRF alignment: commit `d6b6a421a303adbd1dcdf641a5b24858bab06008`
  - file:
    - `scripts/runtime-proof-black-card-auth.mjs`
  - defect:
    - proof script was underreporting reward earn/redeem behavior because authenticated POST checks were missing same-origin headers required by current CSRF protection
  - proof:
    - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-black-card-auth.mjs` now passes on Tuesday, August 4, 2026
    - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-black-card-admin.mjs` passes on Tuesday, August 4, 2026
    - `node scripts/runtime-check.mjs` passed

- Black Card public plan-name normalization: commit `35f93c5a1d8a9fdf663bd372c8d66a682dcd5fa0`
  - file:
    - `src/pages/black-card/index.tsx`
  - defect:
    - Black Card landing still exposed stale `Founding plan` wording after monthly founder billing had already been normalized elsewhere
  - proof:
    - `rg -n "Founding plan|Included with Founding$|Included with Founding plan|Founding Member plan" src/pages/black-card src/pages/pricing.tsx` now shows only `Founding Member plan` strings on the active public Black Card surfaces on Tuesday, August 4, 2026
    - `npm run typecheck` passed
    - `node scripts/runtime-check.mjs` passed
  - closure note:
    - `DA-03` is now closed from canonical runtime evidence; `BWE-11` remains active only for canonical Black Card runtime file closure/classification, not for a newly established live pricing defect

- Commit integrity check on Tuesday, August 4, 2026:
  - `9f94a83516760f5bd00e9393fd5aaa8a72f5052c` remains intact in canonical history
  - `21565e4bc45997ba77f40c09412432cc575bce4e` remains intact in canonical history

- Admin business approvals pagination/count repair: accepted focused canonical fix on Tuesday, August 4, 2026
  - file:
    - `src/pages/admin/business-approvals.tsx`
  - defect:
    - page rendered only the first 25 pending businesses with no total or paging controls, which made the normalized dashboard pending-business count appear inconsistent
  - proof:
    - `/api/admin/dashboard-stats` pending businesses matched `/api/admin/get-pending-businesses` summary total (`1633`)
    - `/admin/business-approvals` now shows `Showing 1-25 of 1633 pending businesses`
    - `/admin/business-approvals` now exposes paging controls instead of a silent first-page slice
    - focused admin browser pass succeeded on `/admin/dashboard`, `/admin/command-center`, `/admin/financial-review`, `/admin/revenue`, `/admin/directory-approvals`, and `/admin/business-approvals`
    - no console errors or failed requests in that focused admin browser pass
    - `npm run typecheck` passed
    - `node scripts/runtime-check.mjs` passed

- Finance admin summary lane: commit `9f94a83516760f5bd00e9393fd5aaa8a72f5052c`
  - files:
    - `src/lib/adminFinanceSummary.ts`
    - `src/lib/__tests__/admin-finance-summary-tests.mjs`
    - `src/pages/admin/financial-review.tsx`
  - proof:
    - monthly finance totals count paid/completed revenue only
    - legacy payment fallback reads the real stored metadata shape
    - finance summary test passed
    - `npm run typecheck` passed
- Directory legacy image suppression: commit `21565e4bc45997ba77f40c09412432cc575bce4e`
  - files:
    - `src/pages/business-directory.tsx`
    - `src/lib/__tests__/image-resolver-tests.mjs`
  - proof:
    - `/business-directory` no longer requests stale `/uploads/hwhh0zbo60csk4oh4yhpj8fau.png`
    - page renders/searches correctly
    - no console errors in focused browser proof
    - image resolver test passed
    - `npm run typecheck` passed

### Preservation/classification note

- `src/lib/adminFinanceSummary.ts` is modified again in the working tree after commit `9f94a83516760f5bd00e9393fd5aaa8a72f5052c`.
- Current diff versus that commit is indentation-only hook/formatter churn, not a newly confirmed finance behavior defect.
- Preserve/classify it through the manifest; do not discard it casually.

> This file separates **verified-from-code risks** and **continuity-remembered unresolved items**.

## 1) Verified open defects / risks (code-audit backed)

## D1 — Mixed auth/session architecture can drift

- **Severity:** High
- **Proof status:** Verified architectural risk with one legacy user-facing defect now closed in canonical history
- **Evidence:** `session_token` JWT widely used + NextAuth route present.
- **Impacted files/routes:**
  - `src/pages/api/auth/[...nextauth].ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/me.ts`
  - multiple JWT-decoding APIs (marketplace/admin/stripe endpoints)
- **Validation path:**
  1. login through custom auth
  2. validate protected API access
  3. test NextAuth path
  4. verify no split-session paradox
  5. keep legacy NextAuth-only pages from bypassing canonical session behavior

## D2 — Mixed Mongo DB name resolution

- **Severity:** High
- **Proof status:** Verified from code
- **Evidence:** mixture of `getMongoDbName()`, hardcoded `bwes-cluster`, and fallback env patterns.
- **Impacted files/routes:**
  - `src/pages/api/stripe/account-status.ts` (hardcoded)
  - `src/pages/api/admin/affiliate-attribution.ts` (hardcoded)
  - many routes using helper-based DB resolution
- **Validation path:**
  1. run env matrix check
  2. confirm all critical flows read/write expected DB in each environment

## D3 — Overlapping canonical/legacy route surfaces

- **Severity:** Medium-High
- **Proof status:** Verified from route inventory
- **Evidence:** dual search endpoints and multiple checkout/session creators.
- **Impacted routes:**
  - `/api/search/businesses` vs `/api/searchBusinesses.js`
  - `/api/checkout/create-session` vs `/api/stripe/checkout` and ad-specific checkout routes
- **Validation path:**
  1. map frontend callers to endpoint
  2. assert one canonical per funnel
  3. deprecate/guard legacy paths

## D4 — Dirty working tree before closure run

- **Severity:** Medium (release confidence)
- **Proof status:** Verified from git status
- **Impacted files:** pre-existing modified set on branch
- **Validation path:** isolate and classify existing edits before any final release proof.

## 2) Continuity-remembered unresolved items (status doc backed)

Source: `docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md`

- Marketplace paid completion proof missing.
- Pricing upgrade paid entitlement proof missing.
- Course/digital entitlement paid proof missing.
- Sponsorship/ad paid fulfillment proof incomplete.
- Cross-machine parity evidence incomplete.
- Seller/connect and music creator final-state proof incomplete.

## 3) Ordered closure queue (with rationale)

1. **CQ-1: Baseline hygiene pass**
   - lock commit baseline, classify dirty files.
   - Rationale: avoids false attribution during proof runs.
   - Current state: evidence snapshot + file-level manifest refreshed on Tuesday, August 4, 2026 from `git status --porcelain=v1 -uall`; `repo_clean` remains dirty and not yet globally reconciled/clean.

2. **CQ-2: Auth/session parity proof**
   - verify single expected session behavior across protected/admin APIs.
   - Rationale: auth break invalidates all other proofs.

- Current state: base canonical pass committed on Monday, August 3, 2026; continuation remains active on Tuesday, August 4, 2026 for business/profile, directory ownership, and organization-claim parity proofs already present in the working tree.
- Commit: `c626bcfe1737620d864d2b0a9b85bf028293f195`
- Closed findings:
- `/api/auth/me` contract is anonymous `200` for missing/invalid `session_token`, not `401`
- CSRF-protected logout succeeds when invoked as same-origin POST, which matches browser callers
- `/user-dashboard` was the one live split-session defect: it still required NextAuth and rejected valid canonical JWT sessions
- a `next-auth.session-token` cookie alone does not unlock protected admin routes
- admin queue count mismatch reported after normalization was narrowed to a closed pagination/visibility defect on `/admin/business-approvals`, not a remaining dashboard/API count defect
- Continuation scope now in flight:
  - `scripts/runtime-proof-business-parity.mjs`
  - `scripts/runtime-proof-directory-ownership.mjs`
  - `scripts/runtime-repro-org-verify.mjs`
  - `scripts/debug-business-parity-state.mjs`
  - `scripts/debug-org-resolver.mjs`
- Exact files:
  - `src/pages/user-dashboard.tsx`
  - `scripts/runtime-proof-auth-session-matrix.mjs`
  - `scripts/runtime-proof-auth-session-advanced.mjs`
- Proof:
  - `npm run proof:auth-session-matrix` pass
  - `npm run proof:auth-session-advanced` pass
  - `npm run typecheck` pass

3. **CQ-3: Canonical checkout/webhook proof (marketplace)**
   - run one fully paid transaction and capture order/payment/webhook evidence.
   - Rationale: highest launch-critical revenue path.

4. **CQ-4: Ad/directory paid fulfillment proof**
   - prove paid -> listing/ad state update -> visible slot/render.
   - Rationale: key monetization + moderation confidence.

5. **CQ-5: Course/music entitlement proof**
   - paid plan/course -> entitlement persisted -> gated destination works.
   - Rationale: avoids false success pages without delivery.

6. **CQ-6: Cross-machine parity capture**
   - replicate same checklist on both machines.
   - Rationale: release confidence requires reproducibility.

7. **CQ-7: Doc hardening**
   - update canonical status files with concrete evidence IDs only.
   - Rationale: preserves continuity integrity for next sessions.

## 4) Recommended validation artifact format (for each closure item)

- route/flow name
- user/account role used
- checkout session ID (if applicable)
- webhook event ID
- DB collections + record IDs changed
- UI final state screenshot/path
- pass/fail + timestamp

## 5) 2026-03-16 issue-pass status (031626 release issues)

### Verified fixed in code + focused proof

- Profile asset visibility/management completion closed.
  - Scope closed: profile persistence + avatar upload/display/manage + resume upload/display/manage.
  - Proof: backend upload/replace/remove + persisted GET checks; frontend `/profile` display/manage + refresh persistence checks.
  - Commit: `676aae2`.
- Business Directory search/filtering matrix issue closed.
  - Scope closed: keyword/category/state/filter combinations, no-result behavior, mobile/desktop sanity, sponsored visibility confirmation.
  - Confirmed defect fixed: server-paged double-filter mismatch causing zero visible cards despite non-zero totals in category-only and category+state scenarios.
  - Commit: `8e0be1b`.

- Compact search sponsored visibility restored on `/search-results`.
  - Proof: `Sponsored Partners` + sponsored badges visible at 320/360/390/1280.
  - Screenshots: `/tmp/bwe-proof/search-results-320.png`, `...360.png`, `...390.png`, `...1280.png`.
- Mobile job listing card overlap/wrapping fixed on `/job-listings`.
  - Proof: no button overlap and no horizontal overflow at 320/360/390.
  - Screenshots: `/tmp/bwe-proof/job-listings-320-v2.png`, `...360-v2.png`, `...390-v2.png`.
- Mentorship broken links corrected to working targets.
  - SEO Career -> `https://www.seo-usa.org/career/` (200 after redirect).
  - Posse Program -> `https://www.possefoundation.org/` (200).
- Search Opportunities All/Any filtering logic corrected for level/mode/field wildcards.
- Profile persistence fixed (`/api/profile` now JWT-auth + Mongo read/write).
  - Proof run with disposable test account shows PATCH name persists across follow-up GET.
- Profile picture upload fixed (`/api/profile/image` now present via avatar alias and compatible response shape).
- Resume upload fixed (`/api/profile/resume` implemented).
- Financial literacy post-purchase path clarified (`/payment-success` now links to financial literacy and course dashboard).

### Still open / triage

- No open blocker remains for the Business Directory matrix issue from 031626.

### Release gate note

- Release readiness remains blocked on broader global gates (conversion/admin/payment/parity proof), not on the now-closed profile-assets or directory-matrix issues.
