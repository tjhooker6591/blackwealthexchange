# BWE World-Class Phase 1 Execution Tracker

**Companion to:** `docs/BWE_WORLD_CLASS_MASTER_PLAN_PHASE1.md`  
**Purpose:** Live daily execution tracker for Phase 1 delivery.  
**Status model (canonical):** `NOT STARTED` | `IN PROGRESS` | `BLOCKED` | `READY FOR REVIEW` | `DONE`

---

## 0) Phase 1 command center

## Current sprint

- **Sprint Name:** Foundation Sprint — Trust + Discovery + Conversion
- **Duration:** 10 business days
- **Sprint Status:** IN PROGRESS

## Priority legend

- **P0:** Must deliver now, high compounding impact
- **P1:** Important and near-term, depends on P0 completion
- **P2:** Valuable follow-on work

---

## A) Phase 1 workstreams

## WS1 — Homepage clarity and conversion (P0)

- **Objective:** Make value proposition and top user paths instantly clear; increase first-action conversion.
- **Why it matters:** Homepage is the highest-leverage entry and trust gate.
- **Exact deliverables:**
  1. Hero rewrite with explicit value proposition and trust framing.
  2. 4–6 top-intent CTA lanes (Find, Buy, Hire, Promote, Learn, Create/Music).
  3. Confidence strip (verification/trust proof, outcomes proof, platform legitimacy).
  4. CTA instrumentation events wired.
- **Dependencies:** WS8 analytics instrumentation baseline.
- **Status:** NOT STARTED
- **Blockers:** None yet.
- **Proof / acceptance criteria:**
  - Homepage renders new hierarchy in production-like runtime.
  - CTA events emitted and visible in analytics stream.
  - First-action baseline + post-change delta measurable.

## WS2 — Search/navigation dominance (P0)

- **Objective:** Make discovery across businesses/products/jobs/music/opportunities fastest path on platform.
- **Why it matters:** Search quality controls usefulness, speed, and conversion.
- **Exact deliverables:**
  1. Search entry hierarchy and scoped tabs (Business/Product/Jobs/Music/Opportunities).
  2. Filter UX pass with trust signals visible in result cards.
  3. Relevance pass for top intents and route clarity cleanup.
  4. Search event instrumentation (search-start, filter-apply, result-click, conversion).
- **Dependencies:** WS8 analytics baseline; trust marker spec from WS3.
- **Status:** NOT STARTED
- **Blockers:** Needs final event schema names.
- **Proof / acceptance criteria:**
  - Search CTR uplift measurable.
  - Filter interactions tracked.
  - Result cards show trust signals in prioritized surfaces.

## WS3 — Trust signal layer (P0)

- **Objective:** Standardize visible trust, verification, and quality signals across discovery and conversion surfaces.
- **Why it matters:** Trust drives conversion and reduces fraud/spam harm.
- **Exact deliverables:**
  1. Unified trust marker taxonomy (verified, completeness, moderation state, test/internal marker).
  2. Trust chips on key cards/pages (directory, marketplace, jobs, consulting queues where applicable).
  3. Moderation state display where decisions occur.
- **Dependencies:** Existing moderation APIs and admin status models.
- **Status:** NOT STARTED
- **Blockers:** Taxonomy signoff required.
- **Proof / acceptance criteria:**
  - Shared trust marker definitions documented and implemented in code.
  - Visible trust markers on at least 3 priority surfaces.

## WS4 — Revenue-path optimization (P0)

- **Objective:** Increase conversion in top monetization funnels without broad rewrites.
- **Why it matters:** Immediate cashflow + compounding growth runway.
- **Exact deliverables:**
  1. Advertising/sponsorship funnel friction audit + fixes.
  2. Marketplace conversion path tightening (trust + clarity points).
  3. Premium business visibility/directory monetization clarity pass.
- **Dependencies:** WS1/WS3 trust + clarity improvements; WS8 measurement.
- **Status:** NOT STARTED
- **Blockers:** Need baseline conversion metrics first.
- **Proof / acceptance criteria:**
  - Funnel conversion deltas measurable for 3 revenue paths.

## WS5 — Consulting/moderation parity (P1)

- **Objective:** Keep moderation controls consistent, auditable, and scalable across intake queues.
- **Why it matters:** Operational trust and queue hygiene at scale.
- **Exact deliverables:**
  1. Confirm parity matrix across consulting/ads/intern and remaining queues.
  2. Close any status/action/note/delete parity gaps.
  3. Ensure QA/test distinction + suppression controls are consistent.
- **Dependencies:** Existing admin queue work (recently shipped).
- **Status:** IN PROGRESS
- **Blockers:** Remaining parity matrix not fully documented.
- **Proof / acceptance criteria:**
  - Every tracked queue supports required moderation action set or has explicit exception note.

## WS6 — Music platform integration (P1)

- **Objective:** Make music a primary engagement and monetization pathway, not a silo.
- **Why it matters:** Creator economy drives repeat engagement + distribution + revenue.
- **Exact deliverables:**
  1. Homepage + nav placement for music/creator pathway.
  2. Search discoverability for music entities.
  3. Creator onboarding + monetization funnel instrumentation.
- **Dependencies:** WS1 homepage structure, WS2 search, WS8 analytics.
- **Status:** NOT STARTED
- **Blockers:** Finalized creator funnel definitions needed.
- **Proof / acceptance criteria:**
  - Music/creator entry points visible in primary paths.
  - Funnel events flowing.

## WS7 — Performance hardening (P1)

- **Objective:** Improve speed/stability on top traffic and revenue routes.
- **Why it matters:** Faster product = higher trust and conversion.
- **Exact deliverables:**
  1. Top-route perf profile (mobile-first) with prioritized fixes.
  2. Image/asset optimization pass and deferred non-critical loads.
  3. Core Web Vitals scorecard for top routes.
- **Dependencies:** route priority list from analytics.
- **Status:** NOT STARTED
- **Blockers:** Route-level baseline report pending.
- **Proof / acceptance criteria:**
  - p75 metrics improve on target routes.
  - No critical runtime regression introduced.

## WS8 — Weekly operating scoreboard / analytics (P0)

- **Objective:** Eliminate guesswork with measurable funnel + trust + revenue telemetry.
- **Why it matters:** All optimization depends on reliable measurement.
- **Exact deliverables:**
  1. Event schema lock for homepage/search/revenue/creator/admin trust funnels.
  2. Instrumentation for core conversion events.
  3. Weekly scoreboard draft with named metric owners.
- **Dependencies:** none (foundation workstream).
- **Status:** NOT STARTED
- **Blockers:** Metric ownership assignment pending.
- **Proof / acceptance criteria:**
  - Core event payloads validated in runtime.
  - Weekly dashboard can be generated without manual guessing.

## WS9 — Free student portal activation (P0)

- **Objective:** Make student opportunity surfaces (scholarships/internships/mentorship/career guidance) a primary growth and mission engine.
- **Why it matters:** Expands mission reach, trust, and long-term ecosystem participation.
- **Exact deliverables:**
  1. Student portal pathways elevated in homepage/nav/search discovery.
  2. Student opportunity taxonomy and trust markers (deadline freshness/source quality).
  3. Clear progression CTAs from student content to platform action.
- **Dependencies:** WS1 homepage, WS2 search, WS8 instrumentation.
- **Status:** NOT STARTED
- **Blockers:** Need canonical route ownership for student-opportunity pages.
- **Proof / acceptance criteria:**
  - Student-opportunity discoverability events and conversion starts measurable.
  - Student CTA pathways visible in primary navigation surfaces.

## WS10 — Free education + history-to-action layer (P0)

- **Objective:** Position practical education and Black economic history as core product surfaces that drive economic action.
- **Why it matters:** Mission integrity and behavior change require context + action, not content alone.
- **Exact deliverables:**
  1. Education pathway modules (finance/budgeting/saving/debt/investing/ownership/entrepreneurship) mapped to platform actions.
  2. History/economic-truth pathway linked to present-day participation actions.
  3. Education-to-action CTA instrumentation and conversion tracking.
- **Dependencies:** WS1 information hierarchy, WS8 instrumentation.
- **Status:** NOT STARTED
- **Blockers:** Needs final mapping of history pages to action destinations.
- **Proof / acceptance criteria:**
  - Education/history CTA-to-action funnel measurable.
  - Learning surfaces include explicit next actions to ecosystem participation.

---

## B) First sprint breakdown (Foundation Sprint)

> Ordered exactly in execution sequence.  
> Checkbox = execution tracking state.

## Sprint task list

- [ ] **S1-T01 (P0) Event schema lock + instrumentation map**
  - **Scope:** Define canonical events and payload keys for homepage/search/revenue/consulting/music/admin trust.
  - **Expected output:** `docs/` event map + implementation checklist by route/component.
  - **Dependency:** None.
  - **Acceptance criteria:** Event dictionary approved; owner per funnel assigned.
  - **Status:** NOT STARTED

- [ ] **S1-T02 (P0) Implement analytics baseline on core entry + conversion points**
  - **Scope:** Wire events in homepage CTAs, search actions, result clicks, key monetization funnel entries.
  - **Expected output:** Runtime-verified event emission in dev/preview logs.
  - **Dependency:** S1-T01
  - **Acceptance criteria:** Events fire once per user action (no duplicate spam); payloads pass schema check.
  - **Status:** NOT STARTED

- [ ] **S1-T03 (P0) Homepage clarity pass (copy + CTA hierarchy + trust strip)**
  - **Scope:** Reframe hero + top paths + confidence signals; explicitly include student portal + education/history entry pathways while preserving current brand direction.
  - **Expected output:** Updated homepage modules + measurable CTA structure.
  - **Dependency:** S1-T01 (for event tags), S1-T02 partial.
  - **Acceptance criteria:** All top CTA blocks instrumented; no route breakage; improved first-action funnel start.
  - **Status:** NOT STARTED

- [ ] **S1-T04 (P0) Search/navigation intent pass (tabs/filters/relevance hooks)**
  - **Scope:** Improve search-first flow for businesses/products/jobs/music/opportunities.
  - **Expected output:** Updated search UX and relevance control points.
  - **Dependency:** S1-T01/S1-T02 (events), WS3 trust taxonomy draft.
  - **Acceptance criteria:** Search interactions tracked; key intents reachable in fewer steps.
  - **Status:** NOT STARTED

- [ ] **S1-T05 (P0) Trust marker MVP on priority discovery cards**
  - **Scope:** Add standardized trust chips/status indicators where users decide.
  - **Expected output:** Shared marker component + deployment on priority surfaces.
  - **Dependency:** WS3 trust taxonomy + existing moderation state fields.
  - **Acceptance criteria:** Marker consistency verified on target surfaces; no ambiguity in status display.
  - **Status:** NOT STARTED

- [ ] **S1-T06 (P1) Revenue-path optimization pass #1 (ads + marketplace + directory premium)**
  - **Scope:** Remove friction in top three monetization paths.
  - **Expected output:** Funnel UX fixes and tracked conversion points.
  - **Dependency:** S1-T02/S1-T03/S1-T05.
  - **Acceptance criteria:** Baseline vs post-change conversion comparison produced.
  - **Status:** NOT STARTED

- [ ] **S1-T07 (P1) Music platform placement in primary ecosystem entry points**
  - **Scope:** Integrate music/creator path into homepage/nav/search visibility.
  - **Expected output:** Clear route placement + instrumentation in creator/music funnel.
  - **Dependency:** S1-T03, S1-T04, S1-T02.
  - **Acceptance criteria:** Music/creator funnel starts measurable and visible in nav/home/search.
  - **Status:** NOT STARTED

- [ ] **S1-T08 (P1) Performance hardening pass on top routes**
  - **Scope:** Speed improvements for top entry + monetization routes.
  - **Expected output:** Perf report + fixes + CWV deltas.
  - **Dependency:** Route priority from analytics (S1-T02).
  - **Acceptance criteria:** p75 improvements demonstrated; no stability regressions.
  - **Status:** NOT STARTED

- [ ] **S1-T09 (P1) Weekly operating scoreboard v1**
  - **Scope:** Build weekly report template from instrumented metrics.
  - **Expected output:** Repeatable scoreboard doc/process with owner mapping.
  - **Dependency:** S1-T01/S1-T02.
  - **Acceptance criteria:** Weekly report can be generated with live data.
  - **Status:** NOT STARTED

- [ ] **S1-T10 (P0) Student portal elevation pass (scholarships/internships/mentorship/career guidance)**
  - **Scope:** Promote student-opportunity surfaces in homepage/nav/search with clear progression CTAs.
  - **Expected output:** Updated IA/CTA placement and mapped progression routes to action.
  - **Dependency:** S1-T03, S1-T04, S1-T02.
  - **Acceptance criteria:** Student opportunity funnel starts and progression clicks measurable.
  - **Status:** NOT STARTED

- [ ] **S1-T11 (P0) Education + history-to-action pathway pass**
  - **Scope:** Connect finance/ownership/history learning routes to concrete platform actions.
  - **Expected output:** Action CTA framework across education/history surfaces + tracked events.
  - **Dependency:** S1-T03, S1-T02.
  - **Acceptance criteria:** Education/history CTA-to-action conversion events live and validated.
  - **Status:** NOT STARTED

---

## C) Daily operating section (live)

## Today’s focus

1. Finalize event schema and ownership (S1-T01).
2. Start instrumentation baseline on homepage/search (S1-T02 partial).

## Current blockers

- Metric owner assignment not formally documented yet.
- Final trust taxonomy definitions need signoff for marker consistency.

## Next 3 highest-value tasks

1. **S1-T02** Baseline instrumentation (P0)
2. **S1-T03** Homepage clarity pass with student/education/history entry paths (P0)
3. **S1-T10** Student portal elevation pass (P0)

## Proof needed before closing sprint

- Event telemetry validates across core funnels.
- Homepage CTA funnel delta measured.
- Search-assisted conversion baseline + improvement captured.
- Trust markers visible and consistent on target surfaces.
- Top-route performance deltas documented.
- Music/creator funnel entry and conversion telemetry live.
- Student portal opportunity funnel (discover -> click -> apply/start) telemetry live.
- Education/history CTA-to-action funnel telemetry live.

---

## D) Immediate start task (exact first bounded execution task)

**Start now:** **S1-T01 (P0) Event schema lock + instrumentation map**

### Why this first

Every other sprint objective (homepage optimization, search improvements, revenue optimization, music integration, performance ROI validation) requires clean measurement.

### Bounded output to produce immediately

1. Event schema table with canonical names + required payloads.
2. Route/component mapping table for where each event fires.
3. Owner + QA checklist for each funnel event group.

### Definition of done for immediate task

- Event schema doc committed.
- Mapping checklist committed.
- Ready-to-implement event tickets created in execution order.

---

## E) Workstream status board (snapshot)

- WS1 Homepage clarity and conversion: **NOT STARTED**
- WS2 Search/navigation dominance: **NOT STARTED**
- WS3 Trust signal layer: **NOT STARTED**
- WS4 Revenue-path optimization: **NOT STARTED**
- WS5 Consulting/moderation parity: **IN PROGRESS**
- WS6 Music platform integration: **NOT STARTED**
- WS7 Performance hardening: **NOT STARTED**
- WS8 Weekly operating scoreboard/analytics: **NOT STARTED**
- WS9 Free student portal activation: **NOT STARTED**
- WS10 Free education + history-to-action layer: **NOT STARTED**

---

## F) Notes

- Keep this tracker as the daily operating source of truth.
- Update task statuses only with evidence links (PR, commit, runtime proof, metrics snapshot).
- Do not add net-new scope to sprint without explicit reprioritization.
