# BWE Top-Tier 90-Day Execution Plan

## Purpose

Build BWE into a world-class operating company, not just a feature-rich website.

## Where this lives

- `docs/BWE_TOP_TIER_90_DAY_EXECUTION_PLAN.md`

## North-Star Outcomes (90 days)

1. Reliable platform operations (high uptime, low incident impact)
2. Trusted financial/revenue truth across all streams
3. Support and trust/safety systems with measurable SLAs
4. Conversion and retention growth engine running weekly
5. Executive operating cadence with decision-quality dashboards

---

## Phase 1 (Days 1-30): Stabilize + Instrument

### 1) Reliability and release discipline

- Define SLOs: uptime, API error rate, p95 latency
- Add route health monitors + failure logging standards
- Release checklist with go/no-go gates
- Incident playbook and severity policy

### 2) Revenue and data integrity

- Canonical revenue schema by stream
- Reconciliation checks (order → ledger → dashboard)
- Snapshot pipeline design for admin metrics

### 3) Support/trust operations baseline

- SLA targets: first response and resolution windows
- Escalation matrix and ownership model
- Trust/safety queue standards and audit trail

### 4) Executive operating system v1

- Command Center quality gates
- Weekly executive review format
- Top priorities + blocker governance

---

## Phase 2 (Days 31-60): Optimize + Scale

### 1) Conversion growth engine

- Funnel instrumentation for all core flows
- Weekly experiment cycle (hypothesis, launch, readout)
- Drop-off reduction on onboarding + checkout

### 2) Support quality and trust hardening

- Escalation rate reduction plan
- Repeat issue pattern elimination
- Fraud/dispute detection improvements

### 3) Product/engineering operating maturity

- Workstream risk scoring
- Blocker aging policy
- Release confidence scoring

---

## Phase 3 (Days 61-90): World-class execution

### 1) Performance and UX excellence

- Core Web Vitals targets per critical route
- Mobile UX polish and accessibility pass
- Premium design consistency across all admin and user surfaces

### 2) Leadership intelligence

- Snapshot-first metrics with trend comparisons
- Automated “what’s going well / needs attention / at risk”
- Monthly strategic cutline process

### 3) Staffing and ownership scaling

- Define clear owners for each operating lane
- Hiring map by bottleneck (support, growth, eng, moderation)
- KPI accountability by owner and lane

---

## Operating Lanes (must run every week)

- Reliability & Releases
- Revenue & Finance Integrity
- Support & CX
- Trust & Safety
- Growth & Partnerships
- Product & Engineering
- Staffing & Enablement
- Executive Decisioning

## Weekly KPI Pack (minimum)

- Revenue total + MoM + top driver + risk stream
- Support volume + escalation rate + SLA compliance
- Pending approvals + trust incidents + disputes
- Deployment health + failure count + route health
- Growth: new users/businesses/sellers/employers + campaign outcomes

## Non-negotiable standards

- No fake metrics
- No unresolved critical incidents ignored
- No launches without release readiness gates
- No dashboard without source-status transparency

## Immediate next 7 actions

1. Implement `admin_metrics_snapshots` with nightly job and fallback logic
2. Wire system health logging into all major API failure points
3. Finalize release record writer to `releases` on every deploy
4. Add SLA timers + first-response timestamp in support tickets
5. Add trust/safety incident taxonomy and queue workflows
6. Create weekly CEO review template in docs
7. Add owner assignments for each operating lane
