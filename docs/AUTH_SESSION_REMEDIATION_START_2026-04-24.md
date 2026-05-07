# Auth/Session Remediation Start — 2026-04-24

## Lane selected

Production auth/session audit closure (OPEN DEFECT).

## Scope guardrail

- In scope: logout/session policy consistency, cookie scope alignment, runtime proof collection.
- Out of scope: Learn, Entitlements, Music, Black Card, Stripe payment/payout behavior changes.

## Execution plan

1. Standardize cookie issuance policy across login/signup (domain, sameSite, maxAge model).
2. Make logout clear both host-only and domain-scoped cookie variants.
3. Add/refresh runtime proof script for auth session matrix:
   - login cookie attributes
   - signup cookie attributes
   - logout clear behavior
   - protected route behavior after logout
4. Capture local evidence packet and prepare narrow production-fix PR scope.

## First actions started now

- Opened remediation lane with explicit scope controls.
- Defined implementation sequence and proof matrix to execute next.
- Prepared to implement minimal code patch only in auth/session endpoints and auth hook paths.
