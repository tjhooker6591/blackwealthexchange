# BLACK DETAILED CONTINUITY MASTER

_Last updated: 2026-03-16 America/Los_Angeles_

- **Audit pack baseline commit:** `b0646a9` (`docs(audit): add read-only continuity and system audit pack`)

## 1) Canonical locations

- **Canonical repo path:** `/Users/blackforge/workspace/bwe/repos/repo_clean`
- **Canonical status artifact:** `/Users/blackforge/workspace/bwe/repos/repo_clean/docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md`

## 2) Current git state (verified from repo)

- **Branch:** `release/friday-clean`
- **Working tree:** **DIRTY** (pre-existing edits detected)
- Modified files observed:
  - `docs/BWE_PHASE1_IMPLEMENTATION_CHECKLIST_S1.md`
  - `src/pages/advertise/custom.tsx`
  - `src/pages/api/music/creator-onboarding.ts`
  - `src/pages/api/searchBusinesses.js`
  - `src/pages/api/sponsored-businesses.ts`
  - `src/pages/business-directory.tsx`
  - `src/pages/music.tsx`
  - `src/pages/music/pricing.tsx`

## 3) Preserved continuity summary (remembered/docs)

### From workspace continuity + memory files

- User identity: **Thomas**.
- User preference: maintain persistent notes/progress continuity.
- Prior sessions indicate substantial work on:
  - webhook/payment fulfillment hardening
  - admin moderation/consulting lead workflows
  - instrumentation coverage expansion
  - homepage/UX polish

### From canonical status artifact

Source: `docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md`

- Major workstreams are mostly labeled **PARTIAL** or **BLOCKED BY PAYMENT COMPLETION**.
- Explicitly blocked areas include end-to-end paid proof for marketplace, pricing, courses, sponsorship/ads, and digital entitlement.
- Cross-machine parity still listed as **BLOCKED BY ENV/CONFIG**.

## 4) Exact current platform state (verified from code + status doc)

### Verified from code

- Next.js Pages Router app (not App Router primary).
- Multi-domain platform in one codebase: auth, directory/search, marketplace, jobs, consulting, advertising, affiliate, music, admin.
- Stripe has **multiple checkout entry points** and a canonical webhook shim (`/api/stripe-webhook` -> `/api/stripe/webhook-handler`).
- MongoDB collections are heavily feature-specific; many route handlers write directly to collections.
- Admin moderation exists for consulting + advertising requests with explicit PATCH/DELETE moderation semantics.

### Remembered from continuity docs

- Release trajectory aimed at “world-class” confidence but still proof-gap constrained.
- Significant prior hardening done; final closure depends on explicit runtime and payment-completion evidence.

## 5) Known priorities (current)

### Governing directive override (effective 2026-06-28 through 2027-06-30)

- Canonical directive: `docs/BWE_12_MONTH_REVENUE_FIRST_GOVERNING_DIRECTIVE_2026-06-28.md`
- This supersedes prior general expansion priorities, feature-roadmap assumptions, multi-brand plans, and conflicting growth instructions.
- BWE is the only active business-building priority in this period.
- BlackForge is to operate as revenue-enablement engineer, platform-reliability owner, payment-integrity owner, business-activation systems builder, sponsor-proof systems builder, customer-outcome instrumentation builder, and operational evidence reporter.
- Active offer focus is limited to:
  1. Verified Business Growth Membership
  2. Sponsored Visibility Campaigns
  3. Business Growth and Capital-Readiness Services
- Frozen from active expansion unless directly required for those offers: Travel Map, Wealth Builder, Black Card expansion, creator/music expansion, entertainment lanes, broad marketplace/jobs expansion, speculative AI, unrelated modernization, decorative dashboards/admin, large visual redesigns, and new brands/product families.

### Operational priorities under the directive

1. **Finish minimum safe recovery/continuity only**:
   - prove canonical repo/deployment/data baseline sufficiently safe for controlled development, then stop recovery sprawl.
2. **Payment-completion evidence on revenue-critical flows**:
   - prove paid checkout -> webhook -> fulfillment -> visible state for critical funnels.
3. **Revenue Gate reclassification**:
   - classify every active/planned workstream as Revenue Critical, Trust or Payment Critical, Customer Fulfillment, Maintenance, Deferred, or Retired.
4. **Revenue activation support only**:
   - prioritize tasks that help acquire, onboard, fulfill, measure, report, and renew paying BWE customers.
5. **Cross-machine parity only to the extent needed for safe controlled operation**:
   - do not allow parity work to expand into a broad research program.

## 6) Known open defects / unresolved risk items (continuity + code audit)

> Note: status doc currently marks many as PARTIAL/BLOCKED rather than OPEN DEFECT. Below are operationally open risks.

- End-to-end paid proof missing for core commerce flows.
- Multiple auth/session mechanisms in same codebase (`session_token` JWT + NextAuth session) increase integration drift risk.
- Mixed DB-name resolution patterns (`getMongoDbName()`, hardcoded `bwes-cluster`, fallback defaults) can cause environment skew.
- Legacy + canonical route overlap (`searchBusinesses.js` vs `/api/search/businesses`, multiple checkout endpoints).
- Working tree already dirty before new implementation, reducing release confidence until isolated.

## 7) Closure queue (priority order)

1. **Freeze baseline and confirm dirty-tree provenance** (must-do first).
2. **Run canonical release validation matrix** on current branch.
3. **Execute one paid canonical run per high-risk funnel**:
   - marketplace product
   - ad/directory purchase
   - plan/course entitlement
4. **Capture DB-level proof artifacts** for webhook reconciliation + final state.
5. **Cross-machine parity capture** with same commit/env contract.
6. **Update canonical status docs with hard evidence only**.

## 8) Recommended immediate next action

Proceed to the highest-value global release gate: canonical paid checkout/webhook fulfillment proof for marketplace (`/api/checkout/create-session` -> `/api/stripe/webhook-handler` -> persisted order/payment final state + UI confirmation), with explicit evidence logging (routes hit, session IDs, webhook event IDs, collection records, UI final states).

## 10) Recent closure updates (031626)

- Profile persistence + profile asset upload/display/manage issues are closed.
  - Anchor commit: `676aae2`.
- Business Directory search/filtering matrix issue is closed.
  - Anchor commit: `8e0be1b`.
- Global release readiness remains blocked by broader proof gates outside those closed slices.

## 9) Source set used for this continuity capture

- Workspace continuity files:
  - `/Users/blackforge/.openclaw/workspace/BOOTSTRAP.md`
  - `/Users/blackforge/.openclaw/workspace/AGENTS.md`
  - `/Users/blackforge/.openclaw/workspace/USER.md`
  - `/Users/blackforge/.openclaw/workspace/MEMORY.md`
  - `/Users/blackforge/.openclaw/workspace/IDENTITY.md`
  - `/Users/blackforge/.openclaw/workspace/TOOLS.md`
  - `/Users/blackforge/.openclaw/workspace/SOUL.md`
  - `/Users/blackforge/.openclaw/workspace/HEARTBEAT.md`
  - `/Users/blackforge/.openclaw/workspace/memory/*` (recent)
- Canonical project docs:
  - `/Users/blackforge/workspace/bwe/repos/repo_clean/docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md`
- Repository inspection:
  - `package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`
  - `src/pages/*` and `src/pages/api/*` key architecture files
  - `src/lib/*` and selected `src/lib/db/*`
  - git status/branch metadata
