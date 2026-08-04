# BLACK OPEN DEFECTS AND CLOSURE QUEUE

_Last updated: 2026-08-04 America/Los_Angeles_

## Current canonical execution state

- Canonical repository: `/Users/blackforge/workspace/bwe/repos/repo_clean`
- Canonical branch: `friday-release-candidate`
- Canonical HEAD: `c626bcfe1737620d864d2b0a9b85bf028293f195`
- Dirty-tree preservation snapshot: `/Users/blackforge/workspace/bwe/snapshots/repo_clean-2026-08-03T04-31-39-146Z`
- Complete file manifest: `docs/recovery/BWE_COMPLETE_FILE_MANIFEST_CURRENT.csv`

### Confirmed recent closures in canonical history

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
