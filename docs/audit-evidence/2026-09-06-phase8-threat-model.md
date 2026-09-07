## Phase 8 -- Security Inventory & Threat Model (P8-00)

- Timestamp: Sunday, September 6, 2026
- Canonical repo: `/Users/blackforge/workspace/bwe/repos/repo_clean`
- Branch: `friday-release-candidate`

### System overview

BWE (Black Wealth Exchange) is a Next.js (Pages Router) application backed
by MongoDB Atlas, with Stripe for payments, custom JWT-based authentication
(no third-party identity provider), a Cloudinary integration for some
image assets, an Expo/React Native mobile client consuming the same API
surface as the web client, and an optional OpenAI-backed natural-language
"AI Mode" feature layered strictly on top of server-scoped data.

### Assets (ranked by sensitivity)

1. **Production MongoDB database** -- every collection: user credentials
   (bcrypt hashes), financial records (Wealth Builder), payment/Stripe
   identifiers, Black Card membership data, business/seller/employer
   accounts, private messaging, applicant data. Compromise here is the
   single largest possible loss event. See RT-004 / P8-SECRET-001 --
   already found exposed and partially remediated this pass.
2. **Session-signing secret (`JWT_SECRET`)** -- controls forgery of any
   session, including admin. Reviewed (`src/lib/env.ts`): hard-fails on
   missing, no hardcoded fallback, rejects mismatched dual secrets.
3. **Stripe secret key / webhook signing secret** -- controls payment
   integrity. Webhook signature verification and idempotent upserts
   confirmed correct this pass; no client-supplied price ever trusted.
4. **The owner identity (`tjameshooker@gmail.com`)** -- explicitly
   protected throughout this phase; never used as a test target, never
   modified, verified unchanged at every checkpoint (see the interim
   findings record).
5. **Admin authority** -- previously enforceable only via a stale JWT
   claim (RT-001); now re-verified against the database on every request.
6. **User-uploaded files** (avatars, resumes, business media, product
   images) -- a path to stored XSS or arbitrary content hosting if
   unvalidated (RT-005 found and fixed for resumes; other upload routes
   were already correctly implemented).
7. **Public trust-signal content** (reviews, follower counts, directory
   listings) -- lower sensitivity than the above, but a real target for
   abuse/manipulation at volume (RT-006).

### Trust boundaries

- **Browser <-> Next.js API routes**: the primary boundary. Enforced via
  `session_token` httpOnly cookie (30 min TTL) + CSRF same-origin check
  (`src/middleware.ts` + `src/lib/security/csrf.ts`) for cookie-authenticated
  state-changing requests.
- **Mobile app <-> API routes**: same JWT, delivered via `Authorization:
Bearer` instead of a cookie (added in Phase 7); stored in
  `expo-secure-store` (OS keychain), not `AsyncStorage` -- confirmed this
  pass.
- **Application <-> MongoDB Atlas**: a single shared connection string
  (`MONGODB_URI`) with no per-collection or per-role database credential
  separation -- the application's own authorization logic is the only
  boundary between, e.g., a compromised regular-user code path and admin
  collections. This makes every route's own authorization check
  load-bearing; there is no database-level compartmentalization as a
  backstop. (This is the reason P8-02/P8-03's route-level authorization
  sampling was the highest-value work in this phase.)
- **Application <-> Stripe**: outbound API calls with the secret key;
  inbound webhook calls verified by signature before being trusted.
- **Application <-> OpenAI** (AI Mode only): outbound only, receives
  already-server-scoped data plus the user's raw query text; the model has
  no tool-calling capability and cannot reach any data beyond what was
  already fetched server-side before the call -- confirmed this pass.

### Actors / roles

`user`, `business` (owner), `seller`, `employer`, `creator`, `admin`, plus
the single protected owner identity, who may legitimately hold several of
these roles simultaneously. Role is resolved server-side per request
(`accountType` claim +, for admin, a live DB re-check as of this phase);
page-level role gating in `middleware.ts` is UX-only and is not treated as
the security boundary -- API-level checks are, consistent with "hidden UI
is not authorization."

### Top threats considered and their disposition this phase

| Threat                                              | Disposition                                                                                                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stale/forged admin authority                        | Found live (RT-001), fixed, retested PASS                                                                                                                                   |
| Session survives account-owner-initiated revocation | Found live (RT-002), fixed, retested PASS                                                                                                                                   |
| Hardcoded identity-based backdoor                   | Found live (RT-003), fixed, retested PASS                                                                                                                                   |
| Committed infrastructure credential                 | Found live (RT-004), partially remediated, **owner action pending**                                                                                                         |
| Unvalidated file persisted to a public path         | Found live (RT-005), fixed, retested PASS                                                                                                                                   |
| Public-content abuse/spam at volume                 | Found live (RT-006, two routes), fixed, retested PASS                                                                                                                       |
| Cross-tenant data access (BOLA/IDOR)                | Live-attacked across business/employer/admin surfaces (P8-02) and sampled across mutation-route patterns (P8-03): none found                                                |
| Mass assignment                                     | Sampled across the full API surface (P8-03): none found                                                                                                                     |
| SQL/NoSQL injection                                 | Sampled across the full API surface: none found                                                                                                                             |
| SSRF / open redirect                                | Checked (P8-04): no user-controlled fetch target or redirect target found                                                                                                   |
| Stored XSS via sanitizer bypass                     | `sanitize-html` had two live advisories; patched (P8-11)                                                                                                                    |
| Checkout price manipulation                         | Reviewed: price always server-resolved by product id, never client-supplied                                                                                                 |
| Webhook replay / non-idempotent payment processing  | Reviewed: consistently upsert-keyed by Stripe event/session id                                                                                                              |
| AI prompt injection leaking cross-user data         | Reviewed: architecturally prevented -- the model has no data access beyond what was already session-scoped server-side                                                      |
| Supply-chain (vulnerable dependency)                | `sanitize-html`/`qs` patched; `postcss`/`sharp` documented as an accepted, deferred risk pending a Next.js major upgrade; CI now gates future Critical-severity regressions |
| Missing MFA on high-value accounts                  | Real, documented gap -- not remediated this phase (feature-scale work, not a hardening fix)                                                                                 |
| No dedicated security/audit event log               | Real, documented gap -- DETECT/ALERT stages currently rely on ephemeral console output, not a queryable log                                                                 |
| Backup/restore capability unproven                  | Documented as RESTORE EXERCISE PENDING -- OWNER/EXTERNAL GATE, not claimed as verified                                                                                      |

### Not in scope for this document

A full field-by-field data dictionary of every one of the ~100+ MongoDB
collections, and an exhaustive live attack of all 295 API routes, are both
larger efforts than this threat model attempts -- see "Coverage" in the
red-team ledger and the P8-05 classification in the interim findings
record for what was actually covered.
