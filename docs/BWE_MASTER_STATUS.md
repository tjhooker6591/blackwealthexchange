# BWE Master Status

Last updated commit: 59d45ae

## Overall platform status

- Revenue-first owner directive is now in force for the period 2026-06-28 through 2027-06-30. Canonical directive: `docs/BWE_12_MONTH_REVENUE_FIRST_GOVERNING_DIRECTIVE_2026-06-28.md`.
- All previous broad expansion framing is subordinate to the new Revenue Gate.
- Core web/app routes appear functional in prior local proof cycles, but revenue readiness is still not closed because end-to-end paid fulfillment proof and collected-revenue evidence remain incomplete.
- Current active technical mandate is no longer broad platform expansion. It is: minimum safe recovery closure, payment integrity, business inventory activation, sponsor fulfillment proof, customer operations support, and revenue activation for the three approved offers.
- Marketplace checkout-session creation has prior local proof, but actual collected-revenue and webhook-fulfilled final-state proof remain the real business gate.
- Existing growth, creator, travel, and other expansion documents remain historical context, not active authorization, unless they directly support the approved BWE offers or another Revenue Gate condition.

## Complete

- Password reset lifecycle hardening (hash-only token, expiry/reuse protection, throttling)
- Security headers + CSP baseline
- Route smoke checklist and scripts
- Critical DB index verification script
- P2 role/access regression harness and pass
- DB control docs set
- Growth strategy doc set
- Persistent master operating docs + release doc enforcement
- Runtime healthcheck gate (`check:runtime-health`)
- Referral engine v1 APIs (`/api/referrals/code`, `/api/referrals/track`)

## Incomplete

- Release hygiene clean-tree state (repo still has pre-existing unrelated modifications)
- End-to-end production promotion rehearsal with final release bundle
- Full P2 product vertical deep verification (marketplace/advertising/jobs/admin) beyond baseline script

## Verify-next

- Runtime stability under repeated restart cycles (dev/build/start)
- Monetization flows (checkout/webhook) in controlled preview
- Recruiting consulting admin workflow v1.1
- Wedge decision from live platform data (not assumptions)

## Closure slices (local continuation)

- Titan Security access-control hardening: **advanced**
  - Admin APIs now require verified JWT-backed admin auth in all environments for key high-risk endpoints (`dashboard-stats`, `organizations/approve`, affiliate admin APIs, consulting leads API).
  - Commit: `4bc7227`.
- Payment/webhook hardening: **advanced (partial closure)**
  - Stripe checkout now enforces configured secret, amount bounds, out-of-stock purchase blocking, and env-safe DB selection.
  - Webhook now rejects non-live events in production.
  - Commit: `93b9099`.
- Continuity/workflow integrity: **advanced**
  - P2 harness now hard-fails early when runtime is unhealthy to avoid false regression noise and preserve audit integrity.
  - Commit: `1ec81b3`.
- Scale-readiness improvements: **advanced (partial closure)**
  - Admin affiliates listing now applies projection, sort, and bounded per-status limits to reduce payload/load.
  - Commit: `59d45ae`.

## Latest accepted commits

- 59d45ae (scale readiness: bounded/projected admin affiliates payloads)
- 1ec81b3 (workflow integrity: runtime preflight guard in p2 regression harness)
- 93b9099 (payment/webhook hardening: checkout guards + production live-mode webhook gate)
- 4bc7227 (access-control hardening: unified verified admin auth across critical admin APIs)
- 14e83a9 (critical-path script fix: restore missing cookie parser; role/auth checks now execute end-to-end)
- 14c7c13 (admin tools typing fix + Stripe API version alignment in marketplace readiness)
- cf4060d (RC finalization docs + canonical route/link updates for preview handoff)
- 23f9a48 (canonical route cleanup: inclusive-job-descriptions + backward redirect)
- d1ec8ec (critical-path completion verifier added)
- e6d3505 (finalized referral/docs/link/runtime-health updates)

## Latest risks

- Runtime cache/chunk instability can surface as 500/text-only render if process/start sequence is inconsistent.
- Preview deployment is blocked until branch push/auth is available tomorrow.
- Local runtime can drift into mismatched env/process states (wrong repo/port/env export) and silently invalidate checkout verification if not pinned before audit.
- Inventory guard policy is still undefined: products with `stock=0` currently still create checkout sessions (follow-up decision required).

## Next execution order

1. Push preview candidate branch and execute full Preview validation suite
2. Verify Preview env parity (`APP_URL/NEXTAUTH_URL`, Mongo vars, auth secrets, Stripe/webhook/email vars)
3. Run Preview smoke/regression pack (critical paths + vertical regression + protected-role checks + key APIs)
4. Produce final GO/NO-GO promotion card for production with env diff + rollback target
5. Start wedge selection using live supply/search/readiness data pull
