## Owner Manual Verification Matrix

- Purpose: the practical, step-by-step checklist for the owner to execute
  manually (tomorrow, per owner decision) to close out the one remaining
  Phase 8 gate and confirm overall platform health across every role.
- No secret values appear anywhere in this document.

### MongoDB credential rotation (the P0 / Critical gate)

Perform in this order. Do not skip steps or reorder them.

1. In the MongoDB Atlas console, create a new database user (or rotate
   the existing `bwes_admin` user's password) with equivalent
   permissions.
2. Update the `MONGODB_URI` environment variable everywhere it is
   configured: local `.env.local`, Preview environment config, Production
   environment config. Use the new credential in each.
3. **Verify localhost connectivity**: restart the local dev server, run
   `npm run check:p2-regression` and confirm 26/26 pass with the new
   credential.
4. **Verify Preview connectivity** (when a Preview environment/deployment
   exists): confirm the app boots and a basic read (e.g. the homepage or
   `/api/search/businesses`) succeeds against the new credential.
5. **Verify Production connectivity**: confirm the app boots and a basic
   read succeeds against the new credential, during a low-traffic window
   if possible.
6. **Revoke the old credential** in the Atlas console (delete or disable
   the old database user / rotate its password to something discarded).
7. **Prove the old credential no longer authenticates**: attempt a
   connection with the old credential (from a safe, isolated context) and
   confirm it is rejected.
8. **Confirm the application remains healthy** after revocation: re-run
   `npm run check:p2-regression` (or the equivalent check against
   Preview/Production) once more, post-revocation.
9. Only after steps 1-8 are all proven, update the Phase 8 control record
   (`2026-09-06-phase8-closure-report.md` and
   `2026-09-06-phase8-red-team-ledger.md`, finding P8-SECRET-001/RT-004)
   to CLOSED, with the proof steps referenced. Do not mark it closed
   before this proof exists.
10. Separately, decide whether to rewrite git history to purge the old
    credential from past commits (`git filter-repo`/BFG). This is
    optional and independent of steps 1-9 -- the credential is already
    inert once revoked -- but if pursued, it is disruptive (rewrites
    commit hashes, requires a force-push, breaks any other existing
    clones of this repository) and should be scheduled deliberately, not
    done casually.

### PUBLIC (unauthenticated visitor)

- [ ] Homepage loads, Featured Sponsors section renders correctly
      post-correction (see the sponsor CTA section of today's work)
- [ ] Business Directory search returns results
- [ ] Marketplace loads and product listings are browsable
- [ ] Job listings are browsable
- [ ] A referral link (`?ref=BWE-XXXXXXXX` or the app's real referral URL
      shape) still tracks correctly under the new rate limits

### USER

- [ ] Signup works
- [ ] Login works
- [ ] Password reset (forgot-password -> email -> reset) works end to end
- [ ] Save business / save product / save search / save opportunity work
- [ ] Follow / unfollow a business works (now rate-limited -- confirm
      normal usage is unaffected)
- [ ] Leave a business review (now rate-limited -- confirm normal usage
      is unaffected)
- [ ] Wealth Builder (budget/debts/transactions/goals) loads and saves

### BUSINESS OWNER

- [ ] Claim/verify a business listing
- [ ] Edit own business profile (confirm cannot edit another business's
      profile if you have a second test business available)
- [ ] View own business reviews and follower count

### SELLER

- [ ] Seller onboarding / Stripe Connect account link works
- [ ] Add/edit a product
- [ ] View own orders; fulfillment status update works

### EMPLOYER

- [ ] Post a job
- [ ] View own applicants (confirm cannot view another employer's
      applicants)
- [ ] Update an applicant's status (confirm cannot update another
      employer's applicant)

### CREATOR

- [ ] Creator profile / onboarding status loads correctly

### ADMIN

- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] Directory listing approval/moderation works
- [ ] The 4 routes fixed in RT-007 (get-directory-listings,
      featured-products, directory-duplicates index + resolve) all work
      correctly for a real admin
- [ ] Confirm a non-admin cannot reach any admin route

### STRIPE

- [ ] Checkout flow works for a real (non-live, test-mode if available)
      purchase
- [ ] Webhook events are received and processed (check
      `payments`/`bmev_records` for a test event)
- [ ] Subscription cancellation works
- [ ] No unauthorized live charge was made during any of this testing

### MONGODB CREDENTIAL ROTATION

See the dedicated section above -- steps 1 through 10.

### MOBILE

- [ ] Mobile app can log in against the current API (Bearer token flow)
- [ ] Session persists correctly via `expo-secure-store`
- [ ] Native iOS runtime security testing: still DEFERRED (requires
      Xcode/Simulator, not available in the engineering environment used for
      Phase 8)
- [ ] Native Android runtime security testing: still DEFERRED (requires
      Android SDK/emulator, not available in the engineering environment
      used for Phase 8)

### SECURITY

- [ ] MongoDB credential rotation proof complete (see above)
- [ ] `npm audit --omit=dev --audit-level=critical` still passes
- [ ] Owner account (`tjameshooker@gmail.com`) confirmed unchanged:
      admin role intact, all business/Black Card/founding relationships
      intact, no lockout
- [ ] Independent penetration test: schedule if/when ready (still
      PENDING, not performed by this engineering session)

### PRODUCTION OPERATIONS

- [ ] CI (`.github/workflows/ci.yml`) dependency-audit and secret-scan
      gates actually execute once this repo has a real hosted git remote
      (currently a Phase-7-documented external gate -- the remote is a local
      filesystem path)
- [ ] Backup/restore exercise performed against a disposable test
      cluster (see the procedure in the Phase 8 interim findings record,
      P8-15) -- still PENDING, not performed by this engineering session
- [ ] Confirm no push/merge/deploy has occurred from this engineering
      session (all work remains local on `friday-release-candidate`)
