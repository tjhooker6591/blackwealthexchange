# BWE World-Class Decision Log

Last updated: 2026-08-25

## Decision entries

### 2026-08-25 | BWE-WC-001

- SUBJECT: `BWE North Star`
- DECISION: BWE is treated as a world-class economic technology platform, not a simple directory, generic marketplace, or disconnected community site.
- WHY: Product, engineering, measurement, and roadmap decisions need a shared long-term intent so release work does not collapse into fragmented page-by-page thinking.
- ALTERNATIVES:
  - treat BWE as a business directory plus add-ons
  - treat each surface as an independent product line
- DEPENDENCIES:
  - canonical master plan
  - program board
  - scorecard
- IMPACT:
  - every workstream must map to the platform flywheel
  - all future reporting must include master-plan alignment
- OWNER APPROVAL STATUS: `APPROVED`
- SUPERSEDES: `none`
- SUPERSEDED BY: `none`

### 2026-08-25 | BWE-WC-002

- SUBJECT: `Separate release completion from world-class maturity`
- DECISION: Current release completion and the 1000-point world-class index are tracked independently.
- WHY: Release stabilization can finish before the larger platform reaches world-class maturity.
- ALTERNATIVES:
  - merge all future roadmap work into current release completion
  - treat release completion as equivalent to world-class maturity
- DEPENDENCIES:
  - scorecard methodology
  - program board state model
- IMPACT:
  - prevents denominator inflation
  - preserves honest release reporting
- OWNER APPROVAL STATUS: `APPROVED`
- SUPERSEDES: `none`
- SUPERSEDED BY: `none`

### 2026-08-25 | BWE-WC-003

- SUBJECT: `Phase 0 gating rule`
- DECISION: Major runtime restructuring for BWE Experience 2.0 does not begin until Phase 0 release stabilization closes, unless explicitly approved as design-only preparation.
- WHY: Current release proof, parity, payment truth, and production readiness are still the controlling risk factors.
- ALTERNATIVES:
  - start large UI/runtime restructuring immediately
  - run Phase 0 and Phase 1 engineering in parallel without owner gating
- DEPENDENCIES:
  - auth/env parity
  - cross-machine parity
  - paid fulfillment proof
  - release closure
- IMPACT:
  - keeps current release denominator stable
  - reduces regression risk during proof work
- OWNER APPROVAL STATUS: `APPROVED`
- SUPERSEDES: `none`
- SUPERSEDED BY: `none`

### 2026-08-25 | BWE-WC-004

- SUBJECT: `Evidence-based world-class scoring`
- DECISION: World-class points require implemented and proven behavior; planned work, documents, mockups, and route existence alone earn zero.
- WHY: Score inflation would make the control system untrustworthy.
- ALTERNATIVES:
  - award roadmap or design-intent points before proof
  - use subjective optimism scoring
- DEPENDENCIES:
  - scorecard
  - measurement history
- IMPACT:
  - keeps the scorecard honest
  - forces evidence-led execution
- OWNER APPROVAL STATUS: `APPROVED`
- SUPERSEDES: `none`
- SUPERSEDED BY: `none`

### 2026-08-25 | BWE-WC-005

- SUBJECT: `Owner decision gates`
- DECISION: Roadmap changes, DB changes outside prior safe authorization, paid fulfillment proof, and ownership-truth changes require explicit owner approval.
- WHY: These areas affect truth, money, and trust.
- ALTERNATIVES:
  - allow broad autonomous change once engineering confidence is high
- DEPENDENCIES:
  - master plan
  - DB tracking ledger
  - current build status
- IMPACT:
  - protects production truth
  - clarifies escalation boundaries
- OWNER APPROVAL STATUS: `APPROVED`
- SUPERSEDES: `none`
- SUPERSEDED BY: `none`

### 2026-08-25 | BWE-WC-006

- SUBJECT: `Business Independence becomes a permanent planning axis`
- DECISION: BWE planning, measurement, and prioritization must track Business Independence / revenue readiness separately from release completion and world-class maturity.
- WHY: BWE is intended to become a real operating company and long-term owner income source, but short-term revenue pressure must not override safety, trust, or architecture.
- ALTERNATIVES:
  - treat revenue as implied by world-class progress
  - optimize only for product maturity without company-readiness controls
- DEPENDENCIES:
  - master plan
  - program board
  - measurement history
- IMPACT:
  - future workstreams must report business-independence stage and evidence metrics
  - revenue claims now require explicit evidence discipline
- OWNER APPROVAL STATUS: `APPROVED`
- SUPERSEDES: `none`
- SUPERSEDED BY: `none`

### 2026-08-25 | BWE-WC-007

- SUBJECT: `1%-5% Black economic-circulation North Star and BMEV`
- DECISION: BWE adopts a permanent long-term objective of facilitating, processing, originating, or verifiably influencing `1% to 5%` of Black American annual buying power through the BWE ecosystem, measured through BMEV without double counting.
- WHY: The platform mission is not merely feature completion or company revenue; it is durable economic circulation at meaningful scale.
- ALTERNATIVES:
  - use only platform revenue as the long-term success metric
  - treat economic-impact claims without a formal accounting model
- DEPENDENCIES:
  - economic-attribution design
  - payment truth
  - event/data foundation
- IMPACT:
  - future strategic prioritization must include BMEV enablement
  - BMEV, GMV, collected revenue, and impact estimates must remain separate
- OWNER APPROVAL STATUS: `APPROVED`
- SUPERSEDES: `none`
- SUPERSEDED BY: `none`

### 2026-08-25 | BWE-WC-008

- SUBJECT: `Preserve existing functionality before changing established systems`
- DECISION: Before recommending or making a change to an existing system, identify the current implementation, proven functionality, production dependencies, likely scope of the observed difference, and regression risk; preserve the working path and make the smallest necessary change.
- WHY: Local-only gaps, data-specific anomalies, or environment differences must not be mistaken for product defects that justify broad replacement.
- ALTERNATIVES:
  - redesign established systems when a cleaner architecture appears available
  - treat local proof gaps as sufficient reason to modify production-critical flows
- DEPENDENCIES:
  - runtime/code inspection
  - environment classification
  - regression validation
- IMPACT:
  - protects existing working flows such as Stripe checkout/webhooks from unnecessary disruption
  - forces local-vs-production classification before change proposals
- OWNER APPROVAL STATUS: `APPROVED`
- SUPERSEDES: `none`
- SUPERSEDED BY: `none`

### 2026-08-25 | BWE-WC-009

- SUBJECT: `Stripe owner-only transaction control`
- DECISION: Real Stripe transaction execution, real payment confirmation, and production Stripe configuration changes remain owner-only unless explicitly delegated. Black's role is readiness, code, validation, observation, evidence, and reporting.
- WHY: Stripe governs real money, customer trust, and owner-controlled economics. Engineering readiness does not authorize acting as the owner.
- ALTERNATIVES:
  - allow engineering readiness to imply permission to execute live transactions
  - allow autonomous Stripe configuration changes during proof work
- DEPENDENCIES:
  - BWE-10 paid-fulfillment readiness
  - owner authorization gates
  - evidence-only post-transaction verification
- IMPACT:
  - clarifies the correct BWE-10 execution model
  - keeps real-payment authority with the owner while preserving engineering validation responsibilities
- OWNER APPROVAL STATUS: `APPROVED`
- SUPERSEDES: `none`
- SUPERSEDED BY: `none`
