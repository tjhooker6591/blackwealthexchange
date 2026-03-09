# BWE Next Session Start

## Current accepted state
- P1 stabilization accepted
- P2 role/access regression accepted
- DB documentation/process system established
- growth architecture docs created

## Finished in recent cycle
- auth reset hardening
- CSP/headers baseline
- smoke/index scripts
- role guard fixes and regression harness
- DB process docs + checks
- growth strategy doc set

## Next
1. Stabilize runtime strategy for repeatable non-500 launches
2. Run vertical regression matrix (marketplace/ads/jobs/admin)
3. Prepare clean release branch + promotion package

## Must not forget
- update master docs after each major pass
- provide exact proof + commit hashes
- keep DB docs aligned with DB changes

## First commands to run
- `npm run lint`
- `npm run build`
- `npm run smoke:routes`
- `npm run check:critical-indexes`
- `npm run check:db-docs`
- `npm run check:p2-regression`
- `npm run check:release-hygiene`
