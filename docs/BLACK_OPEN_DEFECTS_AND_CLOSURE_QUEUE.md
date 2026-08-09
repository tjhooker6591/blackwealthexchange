# BLACK OPEN DEFECTS AND CLOSURE QUEUE

_Last updated: 2026-08-09 America/Los_Angeles_

## Current canonical execution state

- Program phase: `POST-RECOVERY STABILIZATION / REVENUE READINESS`
- Canonical repository: `/Users/blackforge/workspace/bwe/repos/repo_clean`
- Canonical branch: `friday-release-candidate`
- Latest runtime checkpoint SHA: `ee5e834e0643d0eae95b7a0821fe5542c8bdd7a6`
- Current git HEAD verified live during session: `ee5e834e0643d0eae95b7a0821fe5542c8bdd7a6`
- Dirty-tree preservation snapshot: `/Users/blackforge/workspace/bwe/snapshots/repo_clean-2026-08-03T04-31-39-146Z`
- Complete file manifest: `docs/recovery/BWE_COMPLETE_FILE_MANIFEST_CURRENT.csv`
- Runtime application countdown: `2` preserved dirty runtime follow-through files remain intentionally untouched in the working tree: `src/pages/api/auth/signup.ts` for `DA-09` and `src/pages/black-business-websites.tsx` for `DA-08`
- External validation dependencies only:
  - `BWE-10` owner-authorized final marketplace payment verification
  - `BWE-13` second-machine auth/runtime parity proof
- Current non-blocked execution target:
  - `DA-08` brand / SEO consistency
  - `DA-09` social / site offer alignment follows after `DA-08`
- Current preserved public state:
  - `P1 directory fallback`: COMPLETE
  - `P1 marketplace product visibility`: COMPLETE
  - `P1 homepage featured sponsors`: COMPLETE
  - `P1 directory sponsor sidebar`: COMPLETE
  - `Claim This Listing / Claim Your Listing`: CORRECT — PRESERVE
  - `Legitimate marketplace products`: `3`
  - `QA product`: EXCLUDED
  - `Change-impact audit`: COMPLETE — NO ADDITIONAL MAJOR REGRESSION FOUND

## Current ordered execution queue — reconciled 2026-08-09

0. **CQ-0 — Marketplace public quality**
   - Status: COMPLETE
   - Severity: High
   - Current reality:
     - the canonical local runtime and `/api/marketplace/get-products?debug=1` both resolve to `bwes-cluster`
     - the three legitimate owner products (`Pamfa hoodies`, `Pamfa sneakers`, and `Thomas Hooker author`) are again publicly visible in marketplace listing, product-detail, homepage count, and shop-overview surfaces
     - the Saturday, August 8, 2026 P1 regression root cause was the Thursday, August 6, 2026 `expiresAt` eligibility gate introduced in `b4a1bce`, not wrong-DB routing and not product deletion or unpublishing
     - legacy `expiresAt` metadata no longer zeroes legitimate active inventory, while unpublished, deleted, and QA/test listings remain excluded from the public catalog contract
     - public SSR no longer leaks `Seller name pending`, `Seller profile details pending`, or similar internal scaffolding
     - direct product checkout runtime still blocks stale unavailable listings at the product visibility layer before any real paid proof is attempted
   - Exact files:
     - `src/pages/api/marketplace/add-product.ts`
     - `src/pages/api/marketplace/check-expired.ts`
     - `src/lib/checkout/createProductCheckoutSession.ts`
     - `src/lib/marketplace/publicCatalog.ts`
     - `src/pages/api/marketplace/get-product.ts`
     - `src/pages/api/marketplace/get-products.ts`
     - `src/pages/marketplace/index.tsx`
     - `src/pages/marketplace/product/[id].tsx`
     - `src/pages/shop-black-owned-products.tsx`
     - `src/pages/api/stats/inventory.ts`
     - `src/lib/support/releases.ts`
   - Proof:
     - Commits:
       - `b4a1bce24161c097b052a011b809eb0d33a3e2b2`
       - `97fb3a18933e22d5dcba9f2b8ba96e2b6ac295a5`
     - `npm run typecheck` pass on Saturday, August 8, 2026
     - `node scripts/runtime-check.mjs` pass on Saturday, August 8, 2026
     - localhost checks on Saturday, August 8, 2026:
       - `/api/marketplace/get-products?limit=12&page=1&debug=1` returns `3` products from `_debug.usedDbName: "bwes-cluster"`
       - `/api/stats/inventory` returns `"products":3`
       - `/marketplace` returns `200` and renders `Showing 3 products • 3 total`
       - `/marketplace/product/680d23a3dc57cdf2efedf784` returns `200`
       - `/marketplace/product/680d2a27dc57cdf2efedf785` returns `200`
       - `/marketplace/product/69644a50d65b1e1ace411a0d` returns `200`
       - `/shop-black-owned-products` returns `200` and lists the same three products
       - canonical local DB proof shows the QA product `69b1b4367784b2ea30971f4c` is absent from `bwes-cluster`
   - Next action:
     - keep `BWE-10` as the remaining external paid-proof blocker; local Stripe is not configured, but the safe structural audit passed and the remaining closure dependency is owner-authorized final payment verification rather than new checkout development

1. **CQ-1 — Founder monthly-billing contradiction**
   - Status: COMPLETE
   - Severity: High
   - Current reality:
     - `/pricing` and `/founding-membership` say Founding Member is monthly
     - `/checkout?plan=founder` copy already says monthly
     - canonical Stripe checkout authority now matches the public monthly founder offer
     - `/black-card` and `/black-card/join` now use `Founding Member plan` copy instead of the stale `Founding plan` wording
   - Exact files:
     - `src/pages/api/stripe/checkout.ts`
     - `src/pages/checkout/index.tsx`
     - `src/pages/pricing.tsx`
     - `scripts/test-pricing-billing-alignment.mjs`
   - Proof:
     - Commit: `72806abd827e57494bdd3ddb8525328a0ff0f0d8`
     - `node scripts/test-pricing-billing-alignment.mjs` pass on Tuesday, August 4, 2026
     - `npm run typecheck` pass on Tuesday, August 4, 2026
     - `node scripts/runtime-check.mjs` pass on Tuesday, August 4, 2026
   - Next action:
     - no further pricing contradiction remains; preserve proof and reopen only on regression

2. **CQ-2 — Founding membership resume-checkout availability regression**
   - Status: COMPLETE
   - Severity: High
   - Current reality:
     - legacy `ownership_review_pending` now normalizes to the same pending-review state as `ownership_verification_pending`
     - pending-review businesses are no longer claimable through the resume-checkout path
   - Exact files:
     - `src/lib/founding-membership.ts`
     - `src/lib/founding-membership/__tests__/resume-checkout-tests.mjs`
   - Proof:
     - Commit: `49bc7223a52dd59e1c1a873e9d08009a8f9ba7ac`
     - `node src/lib/founding-membership/__tests__/resume-checkout-tests.mjs` pass on Tuesday, August 4, 2026
     - `node src/lib/founding-membership/__tests__/claim-reconciliation-tests.mjs` pass on Tuesday, August 4, 2026
     - `node src/lib/founding-membership/__tests__/platform-queue-tests.mjs` pass on Tuesday, August 4, 2026
     - `npm run typecheck` pass on Tuesday, August 4, 2026
     - `node scripts/runtime-check.mjs` pass on Tuesday, August 4, 2026
   - Next action:
     - keep the normalized alias coverage in place while continuing broader claim-verification reconciliation

3. **CQ-3 — Sponsor search / sponsor API linkage gap**
   - Status: COMPLETE
   - Severity: High
   - Current reality:
     - DISCOVERED DURING: `DA-06` / `DA-07` transition on Saturday, August 8, 2026
     - IMPACTS: `DA-06`, `BWE-18`, homepage featured sponsors, directory sponsor rail/sidebar, public trust/history surfaces
     - the focused August 4, 2026 sponsor repair kept ordinary search strict correctly, but it over-suppressed public sponsor surfaces by requiring linked public businesses for every sponsor card and by filtering the recent historical schedule fallback down to zero
     - canonical source data still contains the verified sponsor schedule set for `Pamfa United Citizen`, `TitanEra`, `Thomas Hooker Author`, `Thomas Hooker Publisher`, `Guardians of the Forgotten Realm`, `The Last Nephilim`, `Millianious`, and `Tiana Song Sprouts`
     - ordinary directory search remains intentionally strict: `Pamfa United Citizens` still resolves to the real public PAMFA business and `TitanEra` still returns zero linked public-business results because no public business record exists
     - `/api/sponsored-businesses` now returns the verified eight-card sponsor set again by using a hybrid contract: linked public business route when it exists, approved featured-sponsor profile fallback when no public business listing exists
     - homepage `Featured Sponsors` and directory sponsor surfaces render again without fabricating business listings or duplicating sponsor identities
   - Exact files:
     - `src/lib/advertising/sponsorListings.ts`
     - `src/pages/api/search/businesses.ts`
     - `src/pages/api/sponsored-businesses.ts`
     - `src/lib/directory/__tests__/sponsor-listings-tests.mjs`
   - Proof:
     - Commits:
       - `6ab62cd35813dbe2c5dfa66e3947d0645ddcb839`
       - `44fe30733858aaff116d0daa3894a3aa1e9c961a`
       - `9e4e97d462506d69fc334f6bc5603e0228f34739`
       - `f098f497949155064b426c610e89f01c1706c47b`
     - `node src/lib/directory/__tests__/sponsor-listings-tests.mjs` pass on Tuesday, August 4, 2026
     - `npm run typecheck` pass on Tuesday, August 4, 2026
     - `node scripts/runtime-check.mjs` pass on Tuesday, August 4, 2026
     - live API checks on Tuesday, August 4, 2026 show the stricter state that later proved over-suppressive for public sponsor surfaces:
       - `/api/sponsored-businesses` returns `{"ok":true,"sponsors":[],"meta":{"source":"none_active"}}`
       - `/api/search/businesses?search=Pamfa%20United%20Citizens&sponsoredFirst=1` returns PAMFA with `isSponsored: false`
       - `/api/search/businesses?search=TitanEra&sponsoredFirst=1` returns `0`
       - expired schedule fallback rows no longer drive sponsor promotion
     - Wednesday, August 5, 2026 read-only sponsor-source audit recorded the seven-name matrix in `docs/audit-evidence/2026-08-05-sponsor-reconciliation.md`
     - Saturday, August 8, 2026 correction proof shows:
       - `/api/sponsored-businesses` returns `8` sponsor cards with source `featured_sponsor_schedule_recent_verified_fallback`
       - homepage `Featured Sponsors` renders the same named set without the prior empty-state copy
       - `/business-directory` sponsor rail/sidebar render the same named set without the prior empty-state copy
   - Next action:
     - none in sponsor runtime code; keep ordinary search/business promotion strict and treat future sponsor-name gaps as source-data/linkage work unless the shared sponsor API or featured-profile fallback regresses again

4. **CQ-4 — Directory neutral fallback media**
   - Status: COMPLETE
   - Severity: High
   - Current reality:
     - DISCOVERED DURING: `DA-06` / `DA-07` transition on Saturday, August 8, 2026
     - IMPACTS: `BWE-16`, public directory trust, search card media, storefront/public credibility
     - the shared resolver introduced on Sunday, August 2, 2026 in `21565e4` correctly suppressed stale `/uploads/...` media, but it also changed public listings with no legitimate business media from the neutral approved placeholder to category stock fallbacks such as `/images/fallback/food.jpg` and `/images/fallback/retail.jpg`
     - those fallback assets contain real portrait photography and were incorrectly reused across unrelated listings such as `Kimball House`, `Boon Boona Coffee`, `BLK & Bold`, `The Sip`, and `Bankhead Seafood`
     - public listings without legitimate media now resolve to the approved neutral `/default-image.jpg`, while valid remote business media still renders and stale `/uploads/...` media remains suppressed
   - Exact files:
     - `src/lib/imageResolver.ts`
     - `src/lib/__tests__/image-resolver-tests.mjs`
     - `src/pages/business-directory.tsx`
   - Proof:
     - `node src/lib/__tests__/image-resolver-tests.mjs` pass on Saturday, August 8, 2026
     - focused browser proof on Saturday, August 8, 2026 confirms `/business-directory` contains `/default-image.jpg` and no longer surfaces `/images/fallback/food.jpg`, `/images/fallback/retail.jpg`, or the later black/logo fallback on the public directory surface
   - Next action:
     - preserve the neutral fallback rule and reopen only if public directory/search cards begin surfacing unrelated portrait/stock fallback media again or stop resolving to `/default-image.jpg`

5. **CQ-5 — PAMFA public address presentation gap**
   - Status: COMPLETE
   - Severity: Medium
   - Current reality:
     - malformed live location data is now normalized at render time without mutating production records
     - PAMFA public business pages load, render `30349`, and expose `Directions`
   - Exact files:
     - `src/lib/directoryProfileContract.ts`
     - `src/pages/business/[slug].tsx`
     - `src/pages/business-directory/[alias].tsx`
     - `src/lib/directory/__tests__/location-normalization-tests.mjs`
   - Proof:
     - Commit: `02d15c6f93216df8b0917c350dc8a471ccbc417c`
     - `node src/lib/directory/__tests__/location-normalization-tests.mjs` pass on Tuesday, August 4, 2026
     - `npm run typecheck` pass on Tuesday, August 4, 2026
     - `node scripts/runtime-check.mjs` pass on Tuesday, August 4, 2026
     - `/business/pamfa-united-citizens` returns `200`, renders `30349`, and exposes `Directions`
     - `/business-directory/pamfa-united-citizens` returns `200`, renders `30349`, and exposes `Directions`
   - Next action:
     - no implementation work pending; preserve proof and reopen only on regression

6. **CQ-6 — Marketplace paid completion proof**
   - Status: BLOCKED
   - Severity: High
   - Dependency:
     - one authorized real payment completion + webhook fulfillment evidence
   - Next action:
     - perform one canonical paid marketplace run only when payment-proof execution is explicitly authorized and safe

7. **CQ-7 — Cross-machine auth/runtime parity capture**
   - Status: BLOCKED
   - Severity: Medium
   - Dependency:
     - second development environment runtime access
   - Next action:
     - replay the current local auth/session proof matrix on the second machine

### DA-02 closure note — Wednesday, August 5, 2026

- Status: COMPLETE
- Current reality:
  - public directory, public search API, business-directory UI, and current claim mode all resolve to the same public business population: `365`
  - raw business records total `2272`
  - the main admin business-approval queue remains `1633`
  - admin approved and rejected buckets remain `583` and `32`
  - a separate `duplicate_pending_review` population of `24` records existed outside the prior dashboard reconciliation
  - the true runtime defect was missing duplicate-review bucket accounting in admin totals, not a defect in public search or public pagination
- Exact files:
  - `src/lib/adminBusinessStatus.ts`
  - `src/pages/api/admin/get-pending-businesses.ts`
  - `src/pages/api/admin/dashboard-stats.ts`
  - `src/pages/api/admin/metrics/command-center.ts`
  - `src/pages/admin/dashboard.tsx`
  - `src/pages/admin/business-approvals.tsx`
  - `src/lib/__tests__/admin-business-status-tests.mjs`
- Proof:
  - Commit: `b4f3e6ffdb0d061ddb218f0137ebdd1db4fbf584`
  - `node src/lib/__tests__/admin-business-status-tests.mjs` pass on Wednesday, August 5, 2026
  - `npm run typecheck` pass on Wednesday, August 5, 2026
  - `node scripts/runtime-check.mjs` pass on Wednesday, August 5, 2026
  - `/api/search/businesses?page=1&limit=20` and page 2 both report `total: 365` with different records
  - `/api/admin/get-pending-businesses?page=1&limit=25` and page 2 both report `total: 1633` with different records
  - `/api/admin/dashboard-stats` now reconciles `2272 = 1633 pending + 583 approved + 32 rejected + 24 duplicate review`
  - browser proof on `/business-directory`, `/admin/business-approvals`, and `/admin/dashboard?hideTests=1` completed with no console or failed-network errors
- Next action:
  - move forward to `DA-01` unless a regression reopens directory-count parity

### DA-01 closure note — Wednesday, August 5, 2026

- Status: COMPLETE
- Current reality:
  - the eight most recent real role-account joins were identified from current canonical data
  - the eight-member scope contains `1` Business Owner signup and `7` General User signups
  - the earlier six-member checkpoint was reconciled as a scope-truncation mistake, not a data-loss problem; two additional general-user records were present in the same `users` collection and analysis window
  - no linked `business_claims`, `ownership_reviews`, `business_memberships`, `membership_onboarding`, `membership_fulfillment`, `payments`, `subscription_events`, `entity_ownerships`, `referral_events`, or user-linked `flow_events` were found for those eight members
  - source attribution below the persisted `accountType` is not available from current linked data
  - no live application defect was established from this lane; the dominant result is measurement gap plus expected non-claim behavior for seven general-user signups
- Proof:
  - read-only Mongo audit completed on Wednesday, August 5, 2026
  - full anonymized matrix recorded in `docs/audit-evidence/2026-08-05-member-conversion-attribution.md`
- Next action:
  - use this DA-01 result as input to the ongoing claim-verification and onboarding assessment lanes rather than reopening runtime code without stronger evidence

### BWE-02 closure note — Thursday, August 6, 2026

- Status: COMPLETE
- Current reality:
  - verified-business ownership access, post-verification business editing, and revoke/dispute denial remain green from current runtime proof
  - the only confirmed live defect in the remaining business-side admin claim flow was terminology drift, and commit `64286f9a0b0c356f2bf93391e3265d95042a502a` already normalized that flow to `Request More Evidence`
  - the remaining business-claim coupling to the founding-membership admin surface is legacy implementation structure, not a newly proven user-visible defect in the current canonical workflow
  - current end-to-end proof now covers public listing discovery, claim initiation routing, pending queue presence, `Request More Evidence`, `Verify Ownership`, verified profile access, media update/delete, unrelated-user denial, and revoke/dispute denial
- Exact files:
  - `src/lib/founding-membership.ts`
  - `src/pages/api/admin/founding-memberships.ts`
  - `src/pages/admin/claim-verification.tsx`
  - `src/lib/founding-membership/__tests__/claim-reconciliation-tests.mjs`
  - `src/lib/founding-membership/__tests__/claim-verification-joins-tests.mjs`
  - `src/lib/founding-membership/__tests__/transition-helper-tests.mjs`
- Proof:
  - Commit: `64286f9a0b0c356f2bf93391e3265d95042a502a`
  - `node src/lib/directory/__tests__/ownership-resolution-tests.mjs` pass on Thursday, August 6, 2026
  - `node src/lib/founding-membership/__tests__/claim-reconciliation-tests.mjs` pass on Thursday, August 6, 2026
  - `node src/lib/founding-membership/__tests__/claim-verification-joins-tests.mjs` pass on Thursday, August 6, 2026
  - `node src/lib/founding-membership/__tests__/platform-queue-tests.mjs` pass on Thursday, August 6, 2026
  - `node src/lib/founding-membership/__tests__/transition-helper-tests.mjs` pass on Thursday, August 6, 2026
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-directory-ownership.mjs` pass on Thursday, August 6, 2026
  - `node scripts/runtime-proof-business-parity.mjs` pass on Thursday, August 6, 2026
  - `node tmp/phase2-authorized-edit-business-full-proof.mjs` pass on Thursday, August 6, 2026
  - `node tmp/phase2-denial-probe.mjs` pass on Thursday, August 6, 2026
  - `node tmp/phase2-disputed-revoked-browser-proof.mjs` pass on Thursday, August 6, 2026
  - `node tmp/phase2-claim-queue-media-proof.mjs` pass on Thursday, August 6, 2026
  - `npm run typecheck` pass on Thursday, August 6, 2026 before closure review
  - localhost `200` proofs remain current for `/`, `/business-directory`, `/signup`, and `/founding-membership`
- Next action:
  - preserve the proof set and reopen only on regression; next active bundle is Pricing / revenue readiness

### BWE-11 closure note — Thursday, August 6, 2026

- Status: COMPLETE
- Current reality:
  - the preserved Black Card runtime subset is now committed as canonical recovered functionality
  - Black Card auth, entitlements, rewards earn/redeem, admin redemption review, dashboard digital-card UX, join-page tier mapping, verification link, and admin digital-request visibility are all green from current live proof
  - the stale Black Card admin/browser proof assumptions were corrected in the support proof harnesses; no new Black Card runtime defect was proven in this closure cycle
  - the remaining pricing-label expectation belongs to `BWE-12 Pricing / revenue readiness`, not to the closed `BWE-11` runtime lane
- Exact files:
  - `src/components/black-card/PremiumDigitalCard.tsx`
  - `src/lib/black-card-membership.ts`
  - `src/lib/black-card-state.ts`
  - `src/pages/admin/black-card.tsx`
  - `src/pages/api/admin/black-card/cards.ts`
  - `src/pages/api/admin/black-card/digital-requests.ts`
  - `src/pages/api/black-card/digital-request.ts`
  - `src/pages/api/black-card/member-summary.ts`
  - `src/pages/black-card/join.tsx`
  - `src/pages/dashboard/black-card.tsx`
  - `scripts/runtime-proof-black-card-admin.mjs`
  - `scripts/runtime-proof-owner-blackcard-ui.mjs`
- Proof:
  - Commit: `84968bbc4917a7d3a52e478e0bedb04a8250b793`
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-black-card-auth.mjs` pass on Thursday, August 6, 2026
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-black-card-admin.mjs` pass on Thursday, August 6, 2026
  - `npm run proof:black-card-entitlements` pass on Thursday, August 6, 2026
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-owner-blackcard-ui.mjs` pass on Thursday, August 6, 2026 for current Black Card runtime behavior, with the remaining pricing-label expectation reclassified to `BWE-12`
  - `npm run typecheck` pass on Thursday, August 6, 2026
  - localhost `200` proofs remain current for `/`, `/business-directory`, `/black-card`, and `/black-card/join`
- Next action:
  - preserve the proof set and continue with `BWE-12 Pricing / revenue readiness`

### BWE-12 closure note — Thursday, August 6, 2026

- Status: COMPLETE
- Current reality:
  - the pricing, checkout, payment-success/cancel, and webhook billing-language surfaces are now aligned in canonical runtime history
  - `/pricing` now explicitly states `Premium includes the Standard Black Card` and `Founding Member includes the Signature Black Card`
  - `/checkout?plan=founder` confirms monthly founder billing cadence in current live runtime
  - `/payment-success` and `/payment-cancel` remain live and aligned with the current checkout and membership messaging
  - the remaining `src/pages/api/stripe/webhook-handler.ts` delta was preserved formatting churn on already-proven billing-language logic and is now closed in canonical history
- Exact files:
  - `src/pages/pricing.tsx`
  - `src/pages/checkout/index.tsx`
  - `src/pages/payment-success.tsx`
  - `src/pages/payment-cancel.tsx`
  - `src/pages/api/stripe/webhook-handler.ts`
- Proof:
  - Commits:
    - `5f523b0b51cf65b991fd337a476365efb1c71b20`
    - `48759062ed5862fc36eb3bdfc88926a72c757749`
    - `7c22d03adf86d878cfe60efc32643d9aa23370b5`
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-owner-blackcard-ui.mjs` pass on Thursday, August 6, 2026 with `pricingLabelsFixed: true`
  - `node scripts/test-pricing-billing-alignment.mjs` pass on Thursday, August 6, 2026
  - `npm run typecheck` pass on Thursday, August 6, 2026
  - localhost `200` proofs remain current for `/`, `/pricing`, `/checkout?plan=founder`, and `/black-card`
- Next action:
  - preserve the proof set and continue with `BWE-07 Business profile image/logo behavior`

### Confirmed recent closures in canonical history

- Black Card entitlement proof CSRF alignment: commit `468c78e487958f01f8dbf958783e03818a3a3e23`
  - file:
    - `scripts/runtime-proof-black-card-entitlements.mjs`
  - defect:
    - proof script was failing authenticated Black Card POST checks at middleware because it did not send same-origin headers required by current CSRF protection
  - proof:
    - `npm run proof:black-card-entitlements` now passes on Tuesday, August 4, 2026
    - `node scripts/runtime-check.mjs` passed

- Black Card auth/runtime proof CSRF alignment: commit `d6b6a421a303adbd1dcdf641a5b24858bab06008`
  - file:
    - `scripts/runtime-proof-black-card-auth.mjs`
  - defect:
    - proof script was underreporting reward earn/redeem behavior because authenticated POST checks were missing same-origin headers required by current CSRF protection
  - proof:
    - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-black-card-auth.mjs` now passes on Tuesday, August 4, 2026
    - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-black-card-admin.mjs` passes on Tuesday, August 4, 2026
    - `node scripts/runtime-check.mjs` passed

- Black Card public plan-name normalization: commit `35f93c5a1d8a9fdf663bd372c8d66a682dcd5fa0`
  - file:
    - `src/pages/black-card/index.tsx`
  - defect:
    - Black Card landing still exposed stale `Founding plan` wording after monthly founder billing had already been normalized elsewhere
  - proof:
    - `rg -n "Founding plan|Included with Founding$|Included with Founding plan|Founding Member plan" src/pages/black-card src/pages/pricing.tsx` now shows only `Founding Member plan` strings on the active public Black Card surfaces on Tuesday, August 4, 2026
    - `npm run typecheck` passed
    - `node scripts/runtime-check.mjs` passed
  - closure note:
    - `DA-03` is closed from canonical runtime evidence; `BWE-11` is also now closed by the focused runtime bundle commit `84968bbc4917a7d3a52e478e0bedb04a8250b793`, so any remaining public pricing-copy inconsistency belongs to `BWE-12`

- Commit integrity check on Tuesday, August 4, 2026:
  - `9f94a83516760f5bd00e9393fd5aaa8a72f5052c` remains intact in canonical history
  - `21565e4bc45997ba77f40c09412432cc575bce4e` remains intact in canonical history

- Admin business approvals pagination/count repair: accepted focused canonical fix on Tuesday, August 4, 2026
  - file:
    - `src/pages/admin/business-approvals.tsx`
  - defect:
    - page rendered only the first 25 pending businesses with no total or paging controls, which made the normalized dashboard pending-business count appear inconsistent
  - proof:
    - `/api/admin/dashboard-stats` pending businesses matched `/api/admin/get-pending-businesses` summary total (`1633`)
    - `/admin/business-approvals` now shows `Showing 1-25 of 1633 pending businesses`
    - `/admin/business-approvals` now exposes paging controls instead of a silent first-page slice
    - focused admin browser pass succeeded on `/admin/dashboard`, `/admin/command-center`, `/admin/financial-review`, `/admin/revenue`, `/admin/directory-approvals`, and `/admin/business-approvals`
    - no console errors or failed requests in that focused admin browser pass
    - `npm run typecheck` passed
    - `node scripts/runtime-check.mjs` passed

- Finance admin summary lane: commit `9f94a83516760f5bd00e9393fd5aaa8a72f5052c`
  - files:
    - `src/lib/adminFinanceSummary.ts`
    - `src/lib/__tests__/admin-finance-summary-tests.mjs`
    - `src/pages/admin/financial-review.tsx`
  - proof:
    - monthly finance totals count paid/completed revenue only
    - legacy payment fallback reads the real stored metadata shape
    - finance summary test passed
    - `npm run typecheck` passed
- Directory legacy image suppression: commit `21565e4bc45997ba77f40c09412432cc575bce4e`
  - files:
    - `src/pages/business-directory.tsx`
    - `src/lib/__tests__/image-resolver-tests.mjs`
  - proof:
    - `/business-directory` no longer requests stale `/uploads/hwhh0zbo60csk4oh4yhpj8fau.png`
    - page renders/searches correctly
    - no console errors in focused browser proof
    - image resolver test passed
    - `npm run typecheck` passed

### Preservation/classification note

- `src/lib/adminFinanceSummary.ts` is modified again in the working tree after commit `9f94a83516760f5bd00e9393fd5aaa8a72f5052c`.
- Current diff versus that commit is indentation-only hook/formatter churn, not a newly confirmed finance behavior defect.
- Preserve/classify it through the manifest; do not discard it casually.

> This file separates **verified-from-code risks** and **continuity-remembered unresolved items**.

## 1) Verified open defects / risks (code-audit backed)

## D1 — Mixed auth/session architecture can drift

- **Severity:** High
- **Proof status:** Verified architectural risk with one legacy user-facing defect now closed in canonical history
- **Evidence:** `session_token` JWT widely used + NextAuth route present.
- **Impacted files/routes:**
  - `src/pages/api/auth/[...nextauth].ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/me.ts`
  - multiple JWT-decoding APIs (marketplace/admin/stripe endpoints)
- **Validation path:**
  1. login through custom auth
  2. validate protected API access
  3. test NextAuth path
  4. verify no split-session paradox
  5. keep legacy NextAuth-only pages from bypassing canonical session behavior

## D2 — Mixed Mongo DB name resolution

- **Severity:** High
- **Proof status:** Verified from code
- **Evidence:** mixture of `getMongoDbName()`, hardcoded `bwes-cluster`, and fallback env patterns.
- **Impacted files/routes:**
  - `src/pages/api/stripe/account-status.ts` (hardcoded)
  - `src/pages/api/admin/affiliate-attribution.ts` (hardcoded)
  - many routes using helper-based DB resolution
- **Validation path:**
  1. run env matrix check
  2. confirm all critical flows read/write expected DB in each environment

## D3 — Overlapping canonical/legacy route surfaces

- **Severity:** Medium-High
- **Proof status:** Verified from route inventory
- **Evidence:** dual search endpoints and multiple checkout/session creators.
- **Impacted routes:**
  - `/api/search/businesses` vs `/api/searchBusinesses.js`
  - `/api/checkout/create-session` vs `/api/stripe/checkout` and ad-specific checkout routes
- **Validation path:**
  1. map frontend callers to endpoint
  2. assert one canonical per funnel
  3. deprecate/guard legacy paths

## D4 — Dirty working tree before closure run

- **Severity:** Medium (release confidence)
- **Proof status:** Verified from git status
- **Impacted files:** pre-existing modified set on branch
- **Validation path:** isolate and classify existing edits before any final release proof.

## 2) Continuity-remembered unresolved items (status doc backed)

Source: `docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md`

- Marketplace paid completion proof missing.
- Pricing upgrade paid entitlement proof missing.
- Course/digital entitlement paid proof missing.
- Sponsorship/ad paid fulfillment proof incomplete.
- Cross-machine parity evidence incomplete.
- Seller/connect and music creator final-state proof incomplete.

## 3) Ordered closure queue (with rationale)

1. **CQ-1: Baseline hygiene pass**
   - lock commit baseline, classify dirty files.
   - Rationale: avoids false attribution during proof runs.
   - Current state: evidence snapshot + file-level manifest refreshed on Tuesday, August 4, 2026 from `git status --porcelain=v1 -uall`; `repo_clean` remains dirty and not yet globally reconciled/clean.

2. **CQ-2: Auth/session parity proof**
   - verify single expected session behavior across protected/admin APIs.
   - Rationale: auth break invalidates all other proofs.

- Current state: base canonical pass committed on Monday, August 3, 2026; continuation remains active on Tuesday, August 4, 2026 for business/profile, directory ownership, and organization-claim parity proofs already present in the working tree.
- Commit: `c626bcfe1737620d864d2b0a9b85bf028293f195`
- Closed findings:
- `/api/auth/me` contract is anonymous `200` for missing/invalid `session_token`, not `401`
- CSRF-protected logout succeeds when invoked as same-origin POST, which matches browser callers
- `/user-dashboard` was the one live split-session defect: it still required NextAuth and rejected valid canonical JWT sessions
- a `next-auth.session-token` cookie alone does not unlock protected admin routes
- admin queue count mismatch reported after normalization was narrowed to a closed pagination/visibility defect on `/admin/business-approvals`, not a remaining dashboard/API count defect
- Continuation scope now in flight:
  - `scripts/runtime-proof-business-parity.mjs`
  - `scripts/runtime-proof-directory-ownership.mjs`
  - `scripts/runtime-repro-org-verify.mjs`
  - `scripts/debug-business-parity-state.mjs`
  - `scripts/debug-org-resolver.mjs`
- Exact files:
  - `src/pages/user-dashboard.tsx`
  - `scripts/runtime-proof-auth-session-matrix.mjs`
  - `scripts/runtime-proof-auth-session-advanced.mjs`
- Proof:
  - `npm run proof:auth-session-matrix` pass
  - `npm run proof:auth-session-advanced` pass
  - `npm run typecheck` pass

3. **CQ-3: Canonical checkout/webhook proof (marketplace)**
   - run one fully paid transaction and capture order/payment/webhook evidence.
   - Rationale: highest launch-critical revenue path.

4. **CQ-4: Ad/directory paid fulfillment proof**
   - prove paid -> listing/ad state update -> visible slot/render.
   - Rationale: key monetization + moderation confidence.

5. **CQ-5: Course/music entitlement proof**
   - paid plan/course -> entitlement persisted -> gated destination works.
   - Rationale: avoids false success pages without delivery.

6. **CQ-6: Cross-machine parity capture**
   - replicate same checklist on both machines.
   - Rationale: release confidence requires reproducibility.

7. **CQ-7: Doc hardening**
   - update canonical status files with concrete evidence IDs only.
   - Rationale: preserves continuity integrity for next sessions.

## 4) Recommended validation artifact format (for each closure item)

- route/flow name
- user/account role used
- checkout session ID (if applicable)
- webhook event ID
- DB collections + record IDs changed
- UI final state screenshot/path
- pass/fail + timestamp

## 5) 2026-03-16 issue-pass status (031626 release issues)

### Verified fixed in code + focused proof

- Profile asset visibility/management completion closed.
  - Scope closed: profile persistence + avatar upload/display/manage + resume upload/display/manage.
  - Proof: backend upload/replace/remove + persisted GET checks; frontend `/profile` display/manage + refresh persistence checks.
  - Commit: `676aae2`.
- Business Directory search/filtering matrix issue closed.
  - Scope closed: keyword/category/state/filter combinations, no-result behavior, mobile/desktop sanity, sponsored visibility confirmation.
  - Confirmed defect fixed: server-paged double-filter mismatch causing zero visible cards despite non-zero totals in category-only and category+state scenarios.
  - Commit: `8e0be1b`.

- Compact search sponsored visibility restored on `/search-results`.
  - Proof: `Sponsored Partners` + sponsored badges visible at 320/360/390/1280.
  - Screenshots: `/tmp/bwe-proof/search-results-320.png`, `...360.png`, `...390.png`, `...1280.png`.
- Mobile job listing card overlap/wrapping fixed on `/job-listings`.
  - Proof: no button overlap and no horizontal overflow at 320/360/390.
  - Screenshots: `/tmp/bwe-proof/job-listings-320-v2.png`, `...360-v2.png`, `...390-v2.png`.
- Mentorship broken links corrected to working targets.
  - SEO Career -> `https://www.seo-usa.org/career/` (200 after redirect).
  - Posse Program -> `https://www.possefoundation.org/` (200).
- Search Opportunities All/Any filtering logic corrected for level/mode/field wildcards.
- Profile persistence fixed (`/api/profile` now JWT-auth + Mongo read/write).
  - Proof run with disposable test account shows PATCH name persists across follow-up GET.
- Profile picture upload fixed (`/api/profile/image` now present via avatar alias and compatible response shape).
- Resume upload fixed (`/api/profile/resume` implemented).
- Financial literacy post-purchase path clarified (`/payment-success` now links to financial literacy and course dashboard).

### Still open / triage

- No open blocker remains for the Business Directory matrix issue from 031626.

### Release gate note

- Release readiness remains blocked on broader global gates (conversion/admin/payment/parity proof), not on the now-closed profile-assets or directory-matrix issues.
