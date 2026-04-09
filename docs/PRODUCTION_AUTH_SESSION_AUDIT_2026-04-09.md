# Production Auth/Session Audit — 2026-04-09 (Audit-Only)

## Scope + constraints

- This document is audit/review only.
- No direct production DB edits, credential changes, admin-access changes, env mutations, or manual production session cleanup.
- Goal: isolate root cause(s) for production logout/session-timeout defects and classify required change path.

---

## Current observation

1. Production logout appears to fail (user remains effectively logged in after logout action).
2. Session timeout behavior appears inconsistent with expected expiry behavior.

## Current risk

- **Security/user-trust risk:** stale authenticated sessions after logout can keep protected routes accessible.
- **Operational risk:** contradictory cookie/session settings across auth entry points can cause environment-specific behavior and hard-to-reproduce auth defects.

## Root-cause status

- **Root cause identified (code-level):** inconsistent cookie issuance + inconsistent timeout model + logout clear-scope mismatch.
- **Production verification still required for evidence pack only:** capture live response headers/cookies to document environment proof; root-cause classification is no longer ambiguous.

---

## Code-path findings (exact files/routes)

### Logout behavior

- **Route used by frontend hooks/components:** `POST /api/auth/logout`
  - `src/hooks/useAuth.ts`
  - `src/components/dashboards/DashboardFrame.tsx`
  - `src/components/NavBar.tsx`
- **Logout handler:**
  - `src/pages/api/auth/logout.ts`
  - Clears cookies using `domain=.blackwealthexchange.com` when `NODE_ENV=production`.

### Session validation

- `src/pages/api/auth/me.ts`
  - Reads `session_token` cookie and verifies JWT.
  - Returns 401 on missing/invalid/expired token.

### Cookie issuance

- **Login path:** `src/pages/api/auth/login.ts`
  - JWT expiry: `30m`.
  - Cookie options: `sameSite=lax`, `path=/`, **domain=.blackwealthexchange.com in prod**, `maxAge=30m`.
- **Signup path:** `src/pages/api/auth/signup.ts`
  - JWT expiry: `7d`.
  - Cookie options: `sameSite=strict`, `path=/`, **no domain attribute**, `maxAge=7d`.

### Auth middleware/session protection

- Wide API usage relies on `session_token` verification in route handlers.
- Representative shared helper path:
  - `src/lib/auth.ts` (`getUserFromRequest`)

### Timeout behavior

- Effective timeout differs by issuance path:
  - Login: 30-minute JWT + cookie maxAge 30m.
  - Signup: 7-day JWT + cookie maxAge 7d.

### Exact cookie/TTL matrix (from code)

- `session_token`
  - Login (`/api/auth/login`): `httpOnly=true`, `secure=prod`, `sameSite=lax`, `path=/`, `domain=.blackwealthexchange.com` (prod), `maxAge=1800`, JWT `exp=30m`.
  - Signup (`/api/auth/signup`): `httpOnly=true`, `secure=prod`, `sameSite=strict`, `path=/`, `domain=host-only` (no domain attribute), `maxAge=604800`, JWT `exp=7d`.
  - Logout clear (`/api/auth/logout`): clears with `sameSite=lax`, `path=/`, `domain=.blackwealthexchange.com` (prod), `maxAge=-1`, `expires=epoch`.
- `accountType`
  - Login: domain-scoped to `.blackwealthexchange.com` in prod, `sameSite=lax`, `maxAge=1800`.
  - Signup: host-only, `sameSite=strict`, `maxAge=604800`.
  - Logout clear: domain-scoped clear in prod.

---

## Production audit conclusion

### Confirmed root cause #1: logout clear mismatch by cookie scope/attributes

- Signup issues host-only cookies (no `domain`), but production logout clears domain-scoped cookies (`domain=.blackwealthexchange.com`).
- Host-only and domain-scoped cookies are distinct; clearing only one scope can leave the other active.
- Therefore logout failure can occur specifically because clear attributes do not match issuance attributes.

### Confirmed root cause #2: timeout inconsistency from mixed session model

- Login path is 30m (`maxAge=1800`, JWT exp 30m), while signup path is 7d (`maxAge=604800`, JWT exp 7d).
- This is a direct model mismatch and explains observed timeout inconsistency reports.

---

## Recommendation (audit output)

1. **Narrow controlled release fix (app code):**
   - Normalize auth cookie issuance across login + signup (same domain/samesite/ttl strategy).
   - Logout should clear both host-only and domain-scoped variants of session cookies.
2. **Narrow controlled release fix (auth/session design):**
   - Decide a single intended session TTL policy (e.g., 30m sliding vs absolute duration).
   - Apply consistently across all auth issuance points.
3. **Verification plan (pre-fix + post-fix):**
   - Capture production response headers for login/signup/logout.
   - Validate actual cookie attributes in browser storage for the production host.
   - Re-test logout and protected-route access immediately after logout and after TTL expiry.

---

## Change class

- **Primary:** app code
- **Secondary:** auth/session design
- **Possible tertiary (if env mismatch discovered):** env/config

---

## Needs classification (current)

- **Current:** audit conclusion complete (code-path level), production evidence capture pending for closure packet.
- **Recommended next:** narrow controlled release fix.
- **Not indicated yet:** broader auth/session redesign (only needed if product policy intentionally requires dual TTL modes).
