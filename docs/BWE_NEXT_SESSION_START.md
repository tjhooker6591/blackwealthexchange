# BWE Next Session Start

## Current accepted state

- P1 stabilization accepted
- P2 role/access regression accepted
- DB documentation/process system established
- growth architecture docs created
- marketplace products visible again on recovered runtime
- checkout route recovered by runtime env correction (`STRIPE_SECRET_KEY` was missing)
- marketplace Buy Now matrix now GO
- local validation runtime currently in live Stripe mode
- inventory-policy follow-up remains: `stock=0` products still create checkout sessions

## Finished in recent cycle

- auth reset hardening
- CSP/headers baseline
- smoke/index scripts
- role guard fixes and regression harness
- DB process docs + checks
- growth strategy doc set

## Next

1. Push preview candidate branch
2. Execute full Preview validation suite
3. Verify Preview env parity (`APP_URL/NEXTAUTH_URL`, Mongo vars, auth secrets, Stripe/webhook/email vars)
4. Run Preview smoke/regression checks (critical paths + vertical regression + protected-role checks + key APIs)
5. Produce final GO/NO-GO for production with rollback SHA

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
