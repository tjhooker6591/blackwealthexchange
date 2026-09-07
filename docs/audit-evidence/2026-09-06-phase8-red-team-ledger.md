## Phase 8 -- Internal Adversarial Red Team -- Findings Ledger

- Timestamp: Sunday, September 6, 2026
- Canonical repo: `/Users/blackforge/workspace/bwe/repos/repo_clean`
- Branch: `friday-release-candidate`
- Scope: localhost only, against a running dev instance. No Production
  testing performed.
- Actors used: disposable QA accounts only
  (`qa.p8.<role>.<letter>@bwe.local`, seeded by
  `scripts/security/qa-seed-accounts.mjs`). The protected owner identity
  (`tjameshooker@gmail.com`) and no real customer account were ever used as
  an attack target or attacker identity.
- Status of this record: reflects testing performed through commit
  `06c74ac`. This is not an exhaustive test of all 295 API routes; see
  "Coverage" at the end.

### Finding format

Each row: ID | Severity | Component | Attack path | Reproducibility |
Exploitability | Business impact | Remediation | Fix commit | Retest result

---

**RT-001**

- Severity: High
- Component: `src/lib/adminAuth.ts` (`requireAdminFromRequest`)
- Attack path: An account holding a valid session JWT with `isAdmin: true`
  baked in at login time retains full admin API access for the token's
  entire 30-minute lifetime even after an operator revokes `isAdmin` in the
  database. No re-verification against current DB state occurred on any of
  the ~80 admin routes.
- Reproducibility: 100% (deterministic -- log in as admin, revoke in DB,
  replay the same cookie).
- Exploitability: A previously-legitimate admin whose access is revoked
  mid-session (e.g. during an active incident-response REVOKE step) retains
  admin capability for up to 30 minutes after revocation.
- Business impact: Incident response cannot promptly cut off a compromised
  or terminated admin's access; directly undermines the REVOKE stage of the
  DETECT->ALERT->CONTAIN->REVOKE->ROTATE->INVESTIGATE->RECOVER->NOTIFY->LEARN
  lifecycle this phase is meant to establish.
- Remediation: Added `verifyAdminStillAuthorizedInDb`, a real-time DB
  re-check (`users.isAdmin` or the `ADMIN_EMAILS` env allowlist) inside
  `requireAdminFromRequest`. Fails closed on error.
- Fix commit: `87691e3`
- Retest result: PASS. QA admin session valid pre-revocation (200), same
  cookie rejected (403) immediately after simulated revocation
  (`tokenVersion` bump), with no route-level changes needed.

---

**RT-002**

- Severity: High
- Component: `src/pages/api/auth/reset-password.ts`
- Attack path: A stolen/compromised session token remained valid for its
  full remaining lifetime even after the account owner reset their password
  specifically to invalidate a suspected compromise -- `reset-password.ts`
  updated the password hash but never incremented `tokenVersion`, unlike
  the correct pattern already used in `logout.ts`.
- Reproducibility: 100%.
- Exploitability: An attacker holding a stolen session cookie is
  unaffected by the victim resetting their password; the attacker's access
  survives the exact remediation step meant to end it.
- Business impact: Defeats the primary self-service incident-response
  action available to a compromised user; directly undermines the ROTATE
  stage of the incident lifecycle.
- Remediation: Added `$inc: { tokenVersion: 1 }` to the password-update
  `updateMany` call, mirroring `logout.ts`.
- Fix commit: `7125502`
- Retest result: PASS. Pre-reset session cookie rejected (`{user: null}`)
  immediately after a real password reset; fresh login with the new
  password produces a valid new session.

---

**RT-003**

- Severity: High
- Component: `src/pages/api/auth/login.ts`
- Attack path: A hardcoded email constant (`blackwealth24@gmail.com`)
  received `isAdmin: true` in its session JWT purely by string match,
  independent of the `users.isAdmin` database flag. `signup.ts` performs no
  mailbox-ownership verification, so any attacker could self-register that
  exact (unclaimed) email and be granted admin claims at login.
- Reproducibility: 100% if the email is unclaimed (confirmed unclaimed at
  time of testing).
- Exploitability: Full account-registration-based privilege escalation to
  admin claims, contingent only on that literal email string remaining
  unregistered. No DB tampering or credential theft required.
- Business impact: A hardcoded identity-based backdoor is a Critical-class
  pattern in general; assessed High here specifically because the email
  was unclaimed and not present in the live admin allowlist at discovery
  time, so no account was actively escalated -- but the code path itself
  was live and exploitable at any time before the fix.
- Remediation: Replaced the hardcoded check with the existing
  operator-controlled `ADMIN_EMAILS` env allowlist mechanism.
- Fix commit: `f1bfbd0`
- Retest result: PASS. QA admin (DB-flagged) unaffected; QA non-admin
  unaffected; the formerly-hardcoded email still cannot log in (no such
  account exists) -- escalation path removed with no behavior change to
  any real account.

---

**RT-004**

- Severity: Critical
- Component: `connect.js` (repo root)
- Attack path: A live, currently-valid MongoDB Atlas admin credential
  (full read/write to the production database) has been committed to git
  since the repository's first commit and remained in the tracked working
  tree. Anyone with repository read access (past or present collaborators,
  clones, backups) has standing full database access.
- Reproducibility: 100% -- trivial `git log -p` / file read, no exploit
  code required.
- Exploitability: Complete, unauthenticated (from the application's
  perspective) compromise of the entire production database -- every
  collection, every user's data, financial records, Black Card data,
  payment identifiers -- for anyone who has ever had read access to this
  repository.
- Business impact: Maximum. This is the single most severe finding in this
  pass.
- Remediation: Replaced `connect.js`'s contents with a placeholder,
  removing the live credential and an associated exposed historical bcrypt
  hash from the current tree.
- Fix commit: `4cebd3e`
- Retest result: PARTIAL -- content removed and verified from the current
  tree; the credential itself has NOT been confirmed rotated (external
  Atlas-console action, owner-required, not performed in this session) and
  the old value still exists in git history. **This finding is not fully
  closed until the owner rotates the Atlas password.**

---

**RT-005**

- Severity: High
- Component: `src/pages/api/profile/resume.ts`
- Attack path: Unlike every other local-disk upload route in this
  codebase, resume uploads were written directly into the
  publicly-served `public/uploads/resumes/` directory during formidable
  parsing, using the client-supplied filename's extension, with the
  extension allowlist check happening only AFTER the file was already
  saved there -- and no cleanup occurred on rejection. An attacker could
  upload a file with arbitrary content and an arbitrary extension; it
  would persist on public disk even though the API responded 400.
- Reproducibility: 100% before the fix (confirmed live: an HTML/script
  payload disguised with a `.pdf` extension was accepted onto disk by
  formidable, then rejected by the app's own extension check, leaving the
  file behind).
- Exploitability: Requires the resulting UUID-named path to be discovered
  or guessed (cryptographically random, high entropy) to actually be
  fetched by a third party -- meaningfully reduces but does not eliminate
  real-world exploitability. The underlying control failure (validate
  after persisting, no cleanup, no content-signature check) is a genuine
  defect regardless.
- Business impact: Potential stored content of arbitrary type served from
  the platform's own public origin; policy violation of "never persist
  unvalidated user content to a public path."
- Remediation: Added `src/lib/security/documentUploadValidation.ts`
  (magic-byte PDF/DOC/DOCX detection); `resume.ts` now stages in
  `os.tmpdir()`, validates content signature before any public-directory
  write, deletes the temp file and returns 400 on rejection.
- Fix commit: `97e75b8`
- Retest result: PASS. Disguised HTML payload correctly rejected (400)
  with zero files left on disk; a real minimal PDF correctly accepted
  (200) and saved under a fresh server-generated name.

---

**RT-006**

- Severity: Medium
- Component: `src/pages/api/business/reviews.ts`, `src/pages/api/business/follow.ts`
- Attack path: Neither route had any rate limiting. An authenticated
  session (including one obtained via automated signup, which itself is
  only lightly rate-limited) could post review-bombing/fake reviews across
  many different businesses, or cycle follow/unfollow rapidly, with no
  throttling.
- Reproducibility: 100%.
- Exploitability: Requires only a valid authenticated session; no
  privilege escalation needed, just volume.
- Business impact: Public trust-signal manipulation (fake/bombing reviews
  affecting displayed business ratings; artificial follower-count
  inflation); notification spam to business owners via follow cycling.
- Remediation: Extended the existing DB-backed `hitApiRateLimit` helper to
  both routes (reviews: 10/user + 20/IP per 10 min; follow: 30/user +
  60/IP per 10 min).
- Fix commit: `a083c12`
- Retest result: PASS. 8 rapid reviews against distinct businesses
  succeeded, the 9th+ correctly returned 429; normal single-follow usage
  unaffected by the new limiter.

---

### Tested and found NOT vulnerable (negative findings, recorded for completeness)

| Attack attempted                                            | Component                               | Result                                  |
| ----------------------------------------------------------- | --------------------------------------- | --------------------------------------- |
| Business A edits Business B's profile (no claim on B)       | `PATCH /api/business/update`            | 403 Forbidden -- correctly rejected     |
| Employer A changes Employer B's applicant status            | `PATCH /api/employer/applicants/status` | 403 Access denied -- correctly rejected |
| Employer A lists Employer B's applicants via `jobId`        | `GET /api/employer/applicants`          | 403 Access denied -- correctly rejected |
| Non-admin QA user calls a real admin API directly           | `GET /api/admin/get-directory-listings` | 403 Forbidden -- correctly rejected     |
| Malicious HTML/script disguised as `.pdf`                   | `POST /api/profile/resume` (post-fix)   | 400 rejected, zero files persisted      |
| Cross-origin state-changing request without matching Origin | CSRF middleware (`src/middleware.ts`)   | Blocked -- "CSRF validation failed"     |

### Coverage

This ledger reflects the specific attack paths tested live plus the
broader source-level sampling described in the Phase 8 interim findings
record (`2026-09-06-phase8-fortress-security-interim.md`, P8-03). It is
representative sampling across the highest-value targets (auth, admin,
cross-tenant business/employer data, uploads, public trust-signal
mutation routes), not an exhaustive live attack of all 295 API routes.
Routes not explicitly listed above were not live-attacked in this pass.
