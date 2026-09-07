## Phase 8 -- Fortress Security & Adversarial Assurance -- Interim Findings Record

- Timestamp: Sunday, September 6, 2026
- Canonical repo: `/Users/blackforge/workspace/bwe/repos/repo_clean`
- Branch: `friday-release-candidate`
- Starting HEAD: `3be876a39f4df6136d131f7700cca1d65a2c1253` (Phase 7 closed PARTIAL, ledger #32)
- Status of this record: **INTERIM** -- Phase 8 is in progress, not closed. This
  captures verified findings and fixes to date; it is not the Phase 8 closure
  report and does not claim internal hardening is complete.

### Method

- Read-only source review plus live adversarial testing against a running
  localhost instance, using a fixed set of disposable QA accounts
  (`qa.p8.<role>.<letter>@bwe.local`, seeded by
  `scripts/security/qa-seed-accounts.mjs`) across every role: user, business,
  seller, employer, admin, and a "compromised user" placeholder.
- The protected owner identity (`tjameshooker@gmail.com`) was never logged
  into, never used for destructive testing, and never modified. Its state was
  read-only verified (via direct, scoped DB projection queries) before and
  after every auth/session/role-related change in this record.
- No real customer account was used for any destructive or adversarial test.
- No secret value is reproduced anywhere in this record; findings involving
  credentials are described by type, location, and severity only.

### Owner account integrity checkpoints (read-only verification, each auth-related change)

| After commit                              | isAdmin | tokenVersion | blackCardStatus | claimedBusinessId          |
| ----------------------------------------- | ------- | ------------ | --------------- | -------------------------- |
| `87691e3` (admin re-verification)         | `true`  | `50`         | `active`        | `6a45de2d3278d888ed5d0730` |
| `7125502` (reset-password tokenVersion)   | `true`  | `50`         | `active`        | `6a45de2d3278d888ed5d0730` |
| `f1bfbd0` (hardcoded admin email removed) | `true`  | `50`         | `active`        | `6a45de2d3278d888ed5d0730` |
| `97e75b8` (resume upload fix)             | `true`  | `50`         | `active`        | `6a45de2d3278d888ed5d0730` |

Owner account: unchanged across every security fix landed so far. No
destructive test was ever performed against it.

### Findings and fixes (chronological)

#### P8-AUTH-002 -- Admin privilege revocation not enforced in real time -- HIGH -- FIXED

- Component: `src/lib/adminAuth.ts` (`requireAdminFromRequest`, used by ~80
  admin API routes)
- Issue: Admin authority was determined purely from claims baked into the
  session JWT at login time. Revoking `isAdmin` in the database (or the
  account being disabled) did not take effect until the token's own 30-minute
  expiry -- privilege revocation, part of the incident-response REVOKE stage,
  did not actually revoke access promptly.
- Fix: Added `verifyAdminStillAuthorizedInDb`, a real-time DB re-check against
  the canonical `users.isAdmin` flag (or the pre-existing `ADMIN_EMAILS` env
  allowlist), called from `requireAdminFromRequest`. Fails closed on error.
  Zero changes required at any of the ~80 call sites.
- Verification: QA admin account (`qa.p8.admin@bwe.local`) -- fresh login
  succeeded against a real admin route (200); after bumping `tokenVersion` to
  simulate revocation with the same cookie replayed, the same route returned 403. Owner account unaffected (still allow-listed via `canonicalUser.isAdmin`
  branch).
- Commit: `87691e3`

#### P8-AUTH-001 -- Password reset did not invalidate existing sessions -- HIGH -- FIXED

- Component: `src/pages/api/auth/reset-password.ts`
- Issue: `logout.ts` correctly increments `tokenVersion` on logout (the
  platform's session-revocation mechanism), but `reset-password.ts` updated
  the password hash without doing the same -- a session token issued before a
  password reset (e.g. a stolen/compromised session) kept working for its
  full remaining lifetime, defeating the entire point of resetting a password
  because of suspected compromise.
- Fix: Added `$inc: { tokenVersion: 1 }` to the same `updateMany` call that
  sets the new password hash, across all four account collections.
- Verification: QA account (`qa.p8.user.a@bwe.local`) -- captured a pre-reset
  session; confirmed valid; called the real reset endpoint with a genuine
  token; re-tested the identical pre-reset cookie -- now correctly rejected
  (`{user: null}`). Fresh login with the new password produced a new, valid
  session. Note: `/api/auth/me` always returns HTTP 200; auth failure is
  signaled in the response body (`user: null`), not the status code -- an
  earlier status-code-only test methodology produced a false negative on this
  exact fix before the correct body-based test confirmed it works.
- Commit: `7125502`

#### P8-AUTH-003 -- Hardcoded admin-email privilege escalation -- HIGH -- FIXED

- Component: `src/pages/api/auth/login.ts`
- Issue: A hardcoded constant (`blackwealth24@gmail.com`) granted
  `isAdmin: true` in the session JWT to any account matching that literal
  email string, independent of the `users.isAdmin` database flag.
  `signup.ts` performs no mailbox-ownership verification, so any unclaimed
  email is self-registrable -- this was a self-registrable privilege
  escalation path (a hardcoded-identity backdoor pattern).
- Verified before fixing: the email did not exist in the database and was
  not in the `ADMIN_EMAILS` allowlist, so no live account was actually
  escalated by this code at the time of the fix -- the risk was in the code
  path, not an active compromised account.
- Fix: Replaced the hardcoded check with the same operator-controlled
  `ADMIN_EMAILS` env allowlist mechanism `adminAuth.ts` already uses.
- Verification: QA admin (DB `isAdmin:true`) unaffected; QA non-admin
  unaffected; the removed email still cannot log in (account does not
  exist) -- behavior unchanged for real accounts, escalation path removed.
- Commit: `f1bfbd0`

#### P8-11 -- Vulnerable dependencies (sanitize-html, qs) -- MODERATE -- FIXED; postcss/sharp DEFERRED

- `sanitize-html` <=2.17.6: stored-XSS sanitizer-bypass advisories
  (SVG SMIL scheme-policy bypass; `</textarea/>` solidus-close bypass).
  This is the only HTML sanitizer in the codebase and sanitizes real
  user-submitted content (job postings, support tickets, consulting intake,
  business profile copy) before render -- directly exploitable if bypassed.
  Bumped to 2.17.7.
- `qs` 6.15.0 (transitive via the Stripe SDK): `qs.stringify` DoS on crafted
  input. Pinned to 6.16.0 via `package.json` `overrides`.
- `postcss`/`sharp`: both require a breaking `next` major-version bump
  (16.3.4) to resolve via `npm audit fix --force`. Deliberately NOT applied
  -- this pass cannot safely regression-test a Next.js major upgrade.
  Documented as an open, separately-planned supply-chain item.
- Verification: `npm audit --production` 5 vulnerabilities (2 moderate, 3
  high) -> 3 high (postcss/sharp only). `npm run build` and 26/26
  `check:p2-regression` pass.
- Commit: `3eb7af7`

#### P8-SECRET-001 -- Exposed live production database credential -- CRITICAL -- PARTIALLY REMEDIATED, OWNER ACTION REQUIRED

- Component: `connect.js` (repo root)
- Issue: A hardcoded, live MongoDB Atlas connection string (full admin
  username + password for the production `bwes-cluster`) has been committed
  to git since the repository's first commit and remained present in the
  current tracked working tree. Also contained a hardcoded bcrypt hash
  associated with the owner's email from a one-off historical seeding
  script.
- Verified (booleans only, no raw values ever printed to any log, report, or
  commit message):
  - The cluster host and username are identical to the currently active
    `MONGODB_URI` -- this is the live, currently-valid production password,
    not a stale/rotated-away one.
  - The password segment is byte-identical to the current active
    `MONGODB_URI` password.
  - The embedded bcrypt hash does NOT match the owner's current live
    password hash in the database (the owner has since changed it), so that
    specific historical hash is not usable against the live account today.
- Remediation performed (safe, bounded, non-destructive): replaced the
  file's contents with a placeholder; removed both the live credential and
  the exposed hash from the current tree. The file is kept in place (not
  deleted) because five existing scripts read it as a legacy fallback
  `MONGODB_URI` source -- a fallback that is always short-circuited by the
  env var actually being set in every real environment, and that should
  never have depended on a hardcoded credential.
- Verification: confirmed no functional regression to `dev`/`build`
  (Next.js's own env loading) or production/CI (env injected by the hosting
  platform). The only affected path was invoking a standalone
  `scripts/*.mjs` check without an explicit env source, which had been
  silently succeeding via the exposed credential; re-ran with
  `--env-file=.env.local` -- 26/26 `check:p2-regression` pass.
- **OWNER ACTION REQUIRED (not performed by this session):**
  1. Rotate the `bwes_admin` MongoDB Atlas password immediately -- an
     external Atlas-console action outside this repository's reach.
  2. Update the hosting platform's `MONGODB_URI` (and anywhere else this
     credential is configured) to the new value once rotated.
  3. Decide whether to rewrite git history to purge the old credential from
     every past commit (`git filter-repo`/BFG). This is a separate, far more
     disruptive action (rewrites commit hashes, requires a force-push,
     breaks any other existing clones) than the safe content-only removal
     performed here, and was explicitly NOT performed without direct owner
     authorization.
- Commit: `4cebd3e`

#### P8-UPLOAD-001 -- Resume upload wrote unvalidated files to public disk before checking type -- HIGH -- FIXED

- Component: `src/pages/api/profile/resume.ts`
- Issue: Unlike every other local-disk upload route in the codebase
  (`avatar.ts`, `business/media.ts`, `marketplace/add-product.ts`, all of
  which stage in `os.tmpdir()` and validate by content signature before
  moving into the public directory), `resume.ts` wrote directly into the
  publicly-served `public/uploads/resumes/` during formidable parsing, using
  the client-supplied filename's extension, and only checked that extension
  AFTER the file was already saved -- with no cleanup on rejection. An
  attacker could get an arbitrary file, with arbitrary content and an
  arbitrary extension, persisted unvalidated in a public directory.
- Fix: Added `src/lib/security/documentUploadValidation.ts`
  (`validateUploadedDocumentFile`), magic-byte detection for real PDF, legacy
  `.doc` (OLE compound file), and `.docx` (zip) content -- independent of any
  client-supplied filename or MIME type. `resume.ts` now stages in
  `os.tmpdir()`, validates content signature and size, deletes the temp file
  and returns 400 on rejection, and only moves accepted files into the public
  directory under a fresh server-generated UUID name.
- Verification: QA account -- an HTML/script payload disguised with a `.pdf`
  extension was correctly rejected (400) with zero files left on disk
  (previously this exact payload would have persisted); a real minimal PDF
  (`%PDF-` signature) was correctly accepted (200) and saved under a fresh
  UUID name. Test artifacts cleaned up.
- Commit: `97e75b8`

### Live adversarial cross-tenant / escalation tests -- no defect found

All performed against real running routes with QA accounts, never real
users or the owner:

- **Business-vs-business profile edit (`PATCH /api/business/update`).**
  Set up a fully verified ownership claim (`business_claims` +
  `ownership_reviews`, both `ownership_verified`) for QA business.a. Business
  A could update its own listing (200); the identical request against
  Business B's `businessId` (no claim on B) was correctly rejected with 403
  `Forbidden: ownership verification required`. `resolveVerifiedOwnership`
  requires a matching `claimedByUserId`/`managedByUserId`/`ownerUserIds` on
  the business doc AND a verified `business_claims` row AND a verified
  `ownership_reviews` row -- not just an email match. Test data cleaned up
  after.
- **Employer-vs-employer applicant status (`PATCH /api/employer/applicants/status`).**
  Created a job + applicant owned by QA employer.b. QA employer.a's session
  attempted to change that applicant's status: correctly rejected with 403
  `Access denied` (route resolves the applicant's job, checks
  `job.employerEmail === payload.email`). Test data cleaned up after.
- **Employer-vs-employer applicant list (`GET /api/employer/applicants?jobId=...`).**
  QA employer.a requested employer.b's `jobId` directly: correctly rejected
  with 403 (the route only accepts a `jobId` present in the caller's own
  `jobs` query).
- **Non-admin escalation (`GET /api/admin/get-directory-listings`).** QA
  regular user (`qa.p8.user.a`, DB `isAdmin:false`) attempted a real admin
  API directly: correctly rejected with 403 `Forbidden` (validates the
  `requireAdminFromRequest` + `verifyAdminStillAuthorizedInDb` fix from
  P8-AUTH-002 works end to end against production admin routes, not just in
  isolation).
- **User-collection ownership (`GET/POST/DELETE /api/user/collections/[id]/items`).**
  Source-reviewed (not live-attacked): the handler resolves the collection by
  `{_id, userId: session.userId}` before any read/write, so a non-owned
  collection id 404s before any item operation can run. No live test needed
  beyond source confirmation given the identical pattern already proven live
  on `business/update.ts`.

### Positive findings (reviewed, no fix needed)

- **Stripe checkout price integrity**
  (`src/lib/checkout/createProductCheckoutSession.ts`): unit price is always
  resolved server-side from the product's DB record by `productId`; no
  client-supplied price/amount field is ever trusted.
- **Stripe webhook idempotency**
  (`src/pages/api/stripe/webhook-handler.ts`): every handler upserts against
  a stable key (Stripe session id or `event.id`), sampled across dozens of
  `updateOne(..., {upsert:true})` call sites, not just one or two --
  consistent, thorough idempotent design.
- **NoSQL injection surface**: grep sweep across `src/pages/api/**` for
  unsafe query construction from raw request input (`$where`, spreading
  `req.body`/`req.query` directly into a Mongo filter) found none.
- **CSRF middleware** (`src/middleware.ts` + `src/lib/security/csrf.ts`):
  covers `/api/:path*` via same-origin enforcement for cookie-authenticated
  state-changing requests; confirmed live (blocked cross-origin
  `PATCH`/`POST` attempts made without a matching `Origin` header during this
  session's own adversarial testing).
- **Security headers** (`next.config.js`): X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, HSTS with preload, Permissions-Policy, and a real CSP are
  all already present. CSP's `script-src` still includes
  `'unsafe-inline' 'unsafe-eval'` -- a known weakness, deliberately not
  blindly tightened without dedicated QA coverage of every page; documented
  as an accepted architectural risk for this pass rather than an
  unverified fix.
- **Env/secret handling** (`src/lib/env.ts`): no hardcoded fallback secrets;
  hard-fails on a missing `JWT_SECRET`; rejects mismatched dual secrets;
  rejects localhost Mongo URIs and non-HTTPS `APP_URL` outside local dev.
- **Image upload validation** (`avatar.ts`, `business/media.ts`,
  `marketplace/add-product.ts` via `imageUploadValidation.ts`): magic-byte
  content detection, not client-declared MIME/extension; server-generated
  filenames; explicit type allowlist excluding SVG/GIF.
- **BWE AI Mode** (`/api/v1/ai/mode.ts` + `src/lib/ai/{intent,grounding,answer}.ts`):
  the "saved" domain strictly scopes to `session.userId` and returns empty
  with `requiresAuth:true` when unauthenticated -- no cross-user leakage
  path. The optional LLM prose layer (`tryLlmAnswer`) has no tool/function-calling
  capability and only ever receives data already scoped server-side before
  the call; a prompt-injection attempt in the user's query text cannot
  reach any data beyond what was already fetched for that session. The
  system prompt explicitly forbids mentioning any fact not present in the
  provided grounding JSON. The response is rendered via plain JSX text
  interpolation client-side (`{response.answer}`), not
  `dangerouslySetInnerHTML` -- no stored/reflected XSS path through AI
  output.
- **Mobile session storage** (`mobile/src/storage/session.ts`): uses
  `expo-secure-store` (OS keychain/keystore-backed), not `AsyncStorage` --
  correct MASVS-STORAGE practice for an authentication credential.
- **Mobile network security** (`mobile/app.json`): no
  cleartext-traffic/App-Transport-Security exception is declared, so the app
  correctly inherits each platform's secure-by-default HTTPS-only posture.

### Known gaps (documented, not fixed -- feature-scale work, not hardening)

- **No MFA/passkey support anywhere in the codebase.** A real architectural
  gap for admin and other high-value accounts. Building MFA is a feature
  project (enrollment, backup codes, admin-enforced policy), not a
  hardening fix within this pass's scope -- logged as an owner-facing
  recommendation.
- **No dedicated security/audit event log.** `logHealthEvent` /
  `system_health_logs` exists but is a generic health-check logger wired
  into only 3 routes (AI mode, login, Stripe webhook), not a structured,
  queryable security-event log for the DETECT/ALERT stages of incident
  response. Failed-login and permission-denial events currently only reach
  ephemeral `console.info`/`console.error` output. A dedicated
  `security_events` collection with admin-facing querying/alerting is a
  reasonable follow-up, not attempted in this pass.
- **CSP `script-src` still permits `'unsafe-inline' 'unsafe-eval'`.**
  Documented above as an accepted risk pending dedicated regression
  coverage, not fixed in this pass.

### Regression status at this checkpoint

- `npm run typecheck`: pass (after every commit in this record).
- `npm run build`: pass.
- `check:p2-regression`: 26/26 pass (after every commit in this record; note
  standalone script invocations now require `MONGODB_URI` in the
  environment explicitly -- e.g. `--env-file=.env.local` -- following the
  P8-SECRET-001 fix, matching the secure behavior every real deployment
  already used).

### Update 2 -- P8-03, P8-05, P8-08, P8-09, P8-15 (commits `a083c12`, `7cc034a`)

#### P8-03 -- Broader API-surface sampling (BOLA / mass assignment)

Two systematic grep-based sweeps across all 295 routes in
`src/pages/api/**`, beyond the routes already live-tested above:

- **Mutation handlers without a recognizable auth pattern.** 9 candidates
  (`profile.ts`, `wealth-builder/profile.ts`,
  `wealth-builder/debts|goals|transactions|budget/[id].ts`,
  `travel-map/saved/index.ts`, `user/save-job.ts`, `jobs/[id].ts`). All 9
  were false positives -- each uses a different, equally-valid auth
  pattern the sweep's keyword list didn't match (inline `jwt.verify`, or
  the dedicated `requireWealthUser` helper in
  `src/lib/wealth-builder/auth.ts`, itself confirmed to be a real JWT
  verification, not a stub). Every Wealth Builder route
  (`financial_debts`/`financial_transactions`/`financial_profiles` --
  HIGHLY SENSITIVE data) scopes its Mongo filter to `{_id, userId:
auth.userId, accountType: "user"}` before any read/update/delete.
- **`deleteOne`/`updateOne`/`findOneAndUpdate`/`findOneAndDelete` filtered
  by `_id` alone** (the classic raw-IDOR shape, if reachable without a
  prior ownership check). 5 candidates
  (`marketplace/delete-product.ts`, `marketplace/update-order-fulfillment.ts`,
  `admin/approve-directory-listing.ts`, `jobs/[id].ts` PUT and DELETE).
  All 5 perform an explicit ownership/admin check (`findOne` first,
  compare `sellerId`/`userId`/admin decoded claim, 403 on mismatch)
  immediately before the bare-`_id` mutation -- the pattern is
  verify-then-mutate-by-id, not missing verification.
- **Mass assignment** (`$set: { ...req.body }` or `$set: req.body`/`fields`
  spread directly into a Mongo update without an explicit field
  allowlist): zero matches across the entire API surface. Every route
  reviewed builds its own explicit update object.

No new defects found in this pass. Given 295 total routes, this and the
live cross-tenant tests above constitute representative, not exhaustive,
coverage -- see Known gaps below.

#### P8-05 -- Database / privacy data classification

Based on the ~100+ distinct collections referenced across
`src/pages/api/**` (sampled via `.collection("...")` call sites), grouped
by classification:

| Classification   | Examples                                                                                                                                                                                                            | Notes                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGHLY SENSITIVE | `users`/`sellers`/`businesses`/`employers` (password hash, tokenVersion), `financial_profiles`, `financial_transactions`, `financial_debts`, `financial_ledger`, `black_card_cards`, `payments`, Stripe identifiers | Password hashes and Stripe identifiers never appear in any API response reviewed in this session; Wealth Builder financial collections are scoped per-user server-side (see P8-03 above). |
| CONFIDENTIAL     | `applicants`, `applicant_messages`, `messages`, `marketplace_messages`, `business_claims`, `entity_ownerships`, `consulting_intake`                                                                                 | Applicant/employer messaging and claim-verification data; confirmed scoped to the owning employer/user in every route reviewed this session (P8-02 live tests, P8-03 sampling).           |
| INTERNAL         | `admin_metrics_snapshots`, `admin_moderation_audit`, `black_card_admin_audit`, `financial_class_admin_audit`, `api_rate_limits`, `system_health_logs`, `flow_events`                                                | Operational/audit data, admin-only surfaces (gated by the P8-AUTH-002-hardened `requireAdminFromRequest`).                                                                                |
| PUBLIC           | `businesses` (approved listing fields), `directory_listings`, `jobs` (approved), `business_reviews`, `courses`, `certificates`                                                                                      | Intentionally public directory/marketplace/jobs content; `business_reviews` POST now rate-limited (P8-08 above) precisely because it is public, persistent, trust-affecting content.      |

This is a representative classification of the major collection groups
identified during this session's route review, not an exhaustive
per-field data-dictionary audit of every one of the ~100+ collections
observed -- a full field-by-field data dictionary is a larger,
separately-scoped documentation effort.

#### P8-09 -- Infrastructure / edge security

Observable from this repository:

- Security headers (X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, HSTS w/ preload, Permissions-Policy, CSP) are
  configured in `next.config.js` and confirmed present (reviewed prior to
  this update).
- No `vercel.json` (or equivalent hosting-platform config file) exists in
  this repo -- deployment target, regions, and any edge/WAF rules are
  configured entirely outside version control, on the hosting platform
  itself.
- `.github/workflows/ci.yml` now runs a Critical-only `npm audit` gate and
  a `gitleaks` secret-scan job on every push/PR (commit `7cc034a`), closing
  the "would this have been caught automatically" gap for both P8-11 and
  P8-SECRET-001-class findings going forward. As previously documented for
  Phase 7, this repo's git remote is a local filesystem path, not a hosted
  GitHub remote, so neither CI gate can actually execute yet -- this is a
  prepared safeguard, not a currently-running one.

**Owner-required, not verifiable from this repository:** MongoDB Atlas
network access rules / IP allowlisting, hosting-platform WAF/DDoS
protection, hosting-platform environment-variable injection and secret
storage, GitHub branch-protection rules once a real remote exists. None of
these are claimed as verified here.

#### P8-15 -- Backup / disaster recovery

No backup or restore configuration, script, or runbook exists anywhere in
this repository. The only "backup" artifacts present are ad-hoc,
per-operation JSON snapshots that various one-off maintenance scripts
write before a scripted data change (e.g.
`scripts/recovery/out/manual-visibility-19-backup.json`) -- a good
practice for those specific scripted operations, but not a systematic
database backup/DR mechanism.

MongoDB Atlas (the hosting platform for this database, confirmed via the
`mongodb+srv://...mongodb.net` connection string) typically offers
continuous backup / point-in-time recovery as a cluster-tier console
setting -- entirely outside this repository's reach to configure or
verify.

Per the phase's explicit rule, this is NOT reported as "BACKUP RESTORE
PASS." Status: **RESTORE EXERCISE PENDING -- OWNER/EXTERNAL GATE.**

Recommended safe test procedure (owner-performed, not run in this
session): in the Atlas console, confirm continuous backup / point-in-time
recovery is enabled for the `bwes-cluster` cluster; then, against a
disposable **test** cluster restored from a snapshot (never the live
production cluster), verify the restored data matches an expected known
state, verify the application can connect to the restored instance with
its normal `MONGODB_URI` shape, and time the restore to establish a real
RTO figure. This should not be performed against production without a
maintenance window and explicit owner sign-off.

### Closure conclusion

This is an interim checkpoint, not Phase 8 closure. Eight Critical/High/Moderate
findings have been fixed and verified end to end with QA-only testing; live
cross-tenant adversarial testing across business, employer, and admin
surfaces found no additional authorization defects; a broader API-surface
sampling pass (P8-03) across mutation-route auth patterns and mass-assignment
risk found no additional defects. The owner account has been verified
unchanged at every checkpoint. One Critical finding (P8-SECRET-001) requires
an owner-performed external action (Atlas password rotation) that cannot be
completed from this session. A representative (not exhaustive) data
classification (P8-05) and infrastructure/backup-DR status (P8-09, P8-15)
have been documented, with owner-required/external items explicitly called
out rather than claimed as verified. Remaining Phase 8 checklist items
(formal threat model document, exhaustive per-route API-inventory coverage,
the formal internal red-team findings ledger, and the formal closure
report) are not yet complete.
