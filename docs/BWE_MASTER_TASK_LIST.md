# BWE Master Task List

Legend: `complete` | `in-progress` | `incomplete` | `verify-next`
Owner default: `BlackForge`

## P0
1. Full reset lifecycle proof + hardening
- status: complete
- owner/agent: BlackForge
- proof required: e2e reset lifecycle, reuse fail, expiry fail, TTL, no raw token
- dependencies: env + Mongo access
- last updated commit: c259c67

2. Env centralization on critical auth/data routes
- status: complete
- owner/agent: BlackForge
- proof required: lint/build + route/API checks
- dependencies: env.ts helpers
- last updated commit: f5a8f5f

3. DB documentation/process system
- status: complete
- owner/agent: BlackForge
- proof required: check:db-docs output
- dependencies: docs + checker script
- last updated commit: c8bac4e

## P1
4. Built-runtime stabilization standard
- status: complete
- owner/agent: BlackForge
- proof required: build + smoke
- dependencies: startable runtime
- last updated commit: 9f8e5a1

5. Security headers + CSP
- status: complete
- owner/agent: BlackForge
- proof required: curl header proof
- dependencies: next.config headers
- last updated commit: 9f8e5a1

6. Critical DB index verification
- status: complete
- owner/agent: BlackForge
- proof required: check:critical-indexes output
- dependencies: Mongo access
- last updated commit: 9f8e5a1

## P2
7. Role-by-role regression verification
- status: complete
- owner/agent: BlackForge
- proof required: check:p2-regression pass
- dependencies: seeded role accounts in harness
- last updated commit: 7dddecf

8. Vertical regressions (marketplace/ads/jobs/admin)
- status: verify-next
- owner/agent: BlackForge
- proof required: scenario matrix + screenshots/logs
- dependencies: stable runtime + seeded data
- last updated commit: pending

## P3
9. Cross-site design consistency pass
- status: incomplete
- owner/agent: BlackForge
- proof required: before/after visual set
- dependencies: design freeze for launch scope
- last updated commit: pending

10. Recruiting v1.1 admin workflow
- status: verify-next
- owner/agent: BlackForge
- proof required: intake->pipeline->status transitions
- dependencies: admin UI/API extension
- last updated commit: pending
