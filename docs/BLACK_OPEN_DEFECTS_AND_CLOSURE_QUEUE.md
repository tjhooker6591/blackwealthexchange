# BLACK OPEN DEFECTS AND CLOSURE QUEUE

_Last updated: 2026-03-16 America/Los_Angeles_

> This file separates **verified-from-code risks** and **continuity-remembered unresolved items**.

## 1) Verified open defects / risks (code-audit backed)

## D1 — Mixed auth/session architecture can drift

- **Severity:** High
- **Proof status:** Verified architectural risk (not yet proven user-facing defect in this audit)
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

2. **CQ-2: Auth/session parity proof**
   - verify single expected session behavior across protected/admin APIs.
   - Rationale: auth break invalidates all other proofs.

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
