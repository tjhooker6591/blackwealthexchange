# Production Auth/Session Audit — 2026-04-09 (Audit-Only)

## Scope + constraints
- This document is audit/review only.
- No direct production DB edits, credential changes, admin-access changes, env mutations, or manual production session cleanup.
- Goal: isolate likely root cause(s) for production logout/session-timeout defects and classify required change path.

---

## Current observation
1. Production logout appears to fail (user remains effectively logged in after logout action).
2. Session timeout behavior appears inconsistent with expected expiry behavior.

## Current risk
- **Security/user-trust risk:** stale authenticated sessions after logout can keep protected routes accessible.
- **Operational risk:** contradictory cookie/session settings across auth entry points can cause environment-specific behavior and hard-to-reproduce auth defects.

## Root-cause status
- **Likely root cause identified (code-level):** cookie attribute mismatch between issuance paths and logout clearing behavior.
- **Still requires production verification:** confirm actual host/domain and cookie attributes seen in production response headers.

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

---

## Most likely production logout failure mode

### Candidate A (high confidence): cookie clearing domain mismatch
- If a user session cookie was created as **host-only** (no `domain` attribute), clearing it with `domain=.blackwealthexchange.com` does **not** remove that host-only cookie.
- `logout.ts` in production currently always clears with explicit domain, which can miss host-only cookies issued by signup path.

### Candidate B (medium confidence): mixed timeout model creates "not timing out" reports
- Users created/signed-in via signup can have 7-day sessions while login path expects 30-minute behavior.
- This can be perceived as timeout enforcement failure if operational expectation is 30 minutes globally.

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
- **Current:** audit-only (in progress)
- **Likely next:** narrow controlled release fix
- **Not indicated yet:** broader auth/session redesign (unless policy decision requires it)
