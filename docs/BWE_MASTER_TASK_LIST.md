## CURRENT SESSION HANDOFF

- timestamp: 2026-08-07 PDT
- program phase: `POST-RECOVERY STABILIZATION / REVENUE READINESS`
- canonical repository: `/Users/blackforge/workspace/bwe/repos/repo_clean`
- branch: `friday-release-candidate`
- latest runtime checkpoint SHA: `97fb3a18933e22d5dcba9f2b8ba96e2b6ac295a5`
- current git HEAD verified live during session: `97fb3a18933e22d5dcba9f2b8ba96e2b6ac295a5`
- last completed workstream: `DA-05 marketplace public quality`
- current active workstream: `DA-06 release history`
- DA-01 current result: `COMPLETE`
- BWE-02 current result: `COMPLETE`
- last runtime commit SHA: `97fb3a18933e22d5dcba9f2b8ba96e2b6ac295a5`
- unresolved runtime application files: `0`
- exact production files changed:
  - `75f4dd1850c720ce94015c5beb4bbff98f34b40c` -> ownership/profile/media + organization runtime closure
  - `ddeb5f20591669d4d8832f27d4f31b0ba13fd3c1` -> challenge runtime closure
  - `0e6995d39035f33722f1d98e74dac9afaf22c0d6` -> admin/support/claim-verification runtime closure
  - `0ccea48737dd2ff8d8b96bf7d00c59080e765161` -> public/dashboard/marketplace/search/runtime closure
  - `c890bb30f410d7a9234aab017b4f965b39f11035` -> post-recovery runtime guardrail stabilization for durable localhost validation
  - `b4a1bce24161c097b052a011b809eb0d33a3e2b2` -> marketplace public catalog quality closure
  - `97fb3a18933e22d5dcba9f2b8ba96e2b6ac295a5` -> marketplace post-hook runtime formatting settle
- exact production files committed:
  - `75f4dd1850c720ce94015c5beb4bbff98f34b40c` -> `src/lib/directoryOwnership.ts`, `src/lib/directoryProfileContract.ts`, `src/lib/directoryPublicMedia.ts`, `src/pages/api/business/media.ts`, `src/pages/api/business/profile.ts`, `src/pages/api/business/update.ts`, `src/pages/business-directory/[alias].tsx`, `src/pages/dashboard/edit-business.tsx`, `src/pages/edit-business.tsx`, `src/pages/api/organizations/claim.ts`, `src/pages/organizations/[slug].tsx`
  - `ddeb5f20591669d4d8832f27d4f31b0ba13fd3c1` -> `src/components/challenge/ChallengeShareCard.tsx`, `src/pages/admin/challenge.tsx`, `src/pages/api/admin/challenge.ts`, `src/pages/api/challenge/creators.ts`, `src/pages/api/challenge/join.ts`, `src/pages/api/challenge/stats.ts`, `src/pages/challenge.tsx`, `src/pages/challenge/creators.tsx`
  - `0e6995d39035f33722f1d98e74dac9afaf22c0d6` -> `src/lib/adminBusinessStatus.ts`, `src/lib/adminFinanceSummary.ts`, `src/pages/admin/claim-verification.tsx`, `src/pages/admin/dashboard.tsx`, `src/pages/admin/directory-approvals.tsx`, `src/pages/admin/subscriptions.tsx`, `src/pages/admin/support/tickets.tsx`, `src/pages/admin/support/tickets/[id].tsx`, `src/pages/api/admin/financial-class/repair.ts`, `src/pages/api/admin/support.ts`, `src/pages/api/admin/support/[id].ts`
  - `0ccea48737dd2ff8d8b96bf7d00c59080e765161` -> `src/components/dashboards/UserDashboard.tsx`, `src/lib/businessSubmission.ts`, `src/lib/db/courses.ts`, `src/lib/db/orders.ts`, `src/lib/directory/publicVisibility.ts`, `src/lib/marketplace/orderLifecycle.ts`, `src/lib/marketplace/paymentLinkage.ts`, `src/pages/advertise/banner-ads.tsx`, `src/pages/advertise/featured-sponsor.tsx`, `src/pages/advertising/checkout.tsx`, `src/pages/api/news/black.ts`, `src/pages/api/search/businesses.ts`, `src/pages/black-entertainment-news.tsx`, `src/pages/index.tsx`, `src/pages/real-estate-investment.tsx`, `src/pages/real-estate-toolkit.tsx`, `src/pages/real-estate.tsx`, `src/pages/search-results.tsx`, `src/pages/support.tsx`
  - `b4a1bce24161c097b052a011b809eb0d33a3e2b2` -> `src/lib/checkout/createProductCheckoutSession.ts`, `src/lib/marketplace/publicCatalog.ts`, `src/pages/api/marketplace/get-product.ts`, `src/pages/api/marketplace/get-products.ts`, `src/pages/marketplace/index.tsx`, `src/pages/marketplace/product/[id].tsx`
  - `97fb3a18933e22d5dcba9f2b8ba96e2b6ac295a5` -> `src/lib/marketplace/publicCatalog.ts`, `src/pages/api/marketplace/get-products.ts`, `src/pages/marketplace/index.tsx`
- runtime application files still dirty:
  - none
- tests/proofs completed in this recovery closure cycle:
  - `node src/lib/directory/__tests__/ownership-resolution-tests.mjs` pass on Thursday, August 6, 2026
  - `node src/lib/founding-membership/__tests__/claim-reconciliation-tests.mjs` pass on Thursday, August 6, 2026
  - `node src/lib/founding-membership/__tests__/claim-verification-joins-tests.mjs` pass on Thursday, August 6, 2026 after correcting a stale assertion in the focused join proof
  - `node src/lib/founding-membership/__tests__/platform-queue-tests.mjs` pass on Thursday, August 6, 2026
  - `node src/lib/founding-membership/__tests__/transition-helper-tests.mjs` pass on Thursday, August 6, 2026
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-directory-ownership.mjs` pass on Thursday, August 6, 2026
  - `node scripts/runtime-proof-business-parity.mjs` pass on Thursday, August 6, 2026
  - `node tmp/phase2-authorized-edit-business-full-proof.mjs` pass on Thursday, August 6, 2026
  - `node tmp/phase2-denial-probe.mjs` pass on Thursday, August 6, 2026
  - `node tmp/phase2-disputed-revoked-browser-proof.mjs` pass on Thursday, August 6, 2026
  - `node tmp/phase2-claim-queue-media-proof.mjs` pass on Thursday, August 6, 2026
  - `npm run typecheck` pass on Thursday, August 6, 2026
  - `/`, `/business-directory`, `/challenge`, `/challenge/creators`, `/real-estate`, `/real-estate-investment`, `/real-estate-toolkit`, `/black-entertainment-news`, `/advertising/checkout`, `/search-results?search=atlanta`, `/support`, `/pricing`, `/checkout?plan=founder`, and `/black-card` return `200` on localhost:3000 on Thursday, August 6, 2026
- unresolved blockers/data dependencies:
  - `repo_clean` still has a large pre-existing dirty working tree and is not clean
  - normal `git commit` hooks trigger repo-wide `eslint src/ --fix` plus `prettier --write .`, which creates broad churn and must be handled carefully
  - `BWE-10 Marketplace checkout / fulfillment proof` remains an external validation dependency pending one authorized real payment completion + webhook fulfillment capture
  - `BWE-13 Auth/session parity` remains an external validation dependency pending second-machine parity capture
- current dirty-tree count: `395` file-level git status entries (`git status --porcelain=v1 -uall`)
- exact next workstream: `DA-06 release history` while preserving `BWE-10` and `BWE-13` as external proof blockers
- exact first action for the next session: preserve the zero-runtime-file state, continue release-history/public-trust stabilization, and reopen marketplace only if new reproducible evidence contradicts the DA-05 closure
- production/deployment status: no deploy this session; no production Mongo writes; no Stripe production mutations
- dirty-tree preservation snapshot: `/Users/blackforge/workspace/bwe/snapshots/repo_clean-2026-08-04T16-51-54-0700-session-close`

## CHECKPOINT BASELINE PRESERVATION

- historical checkpoint HEAD: `6ab62cd35813dbe2c5dfa66e3947d0645ddcb839`
- historical checkpoint commits since prior baseline:
  - `72806abd827e57494bdd3ddb8525328a0ff0f0d8`
  - `49bc7223a52dd59e1c1a873e9d08009a8f9ba7ac`
  - `6ab62cd35813dbe2c5dfa66e3947d0645ddcb839`
- historical checkpoint manifest rows: `475`
- historical checkpoint dirty-tree entries: `445`

## CURRENT CANONICAL PROGRAM STATUS — 2026-08-07

- total unique canonical workstreams: `30`
- complete: `20`
- active: `2`
- pending: `6`
- blocked: `2`
- superseded: `0`

| ID     | Workstream                                                                | Status   | Last Commit | Next Action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BWE-01 | Business signup -> claim routing                                          | PENDING  | `842ba7f`   | Run a current browser proof for Business Owner signup through claim-mode redirect and record exact route/API evidence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| BWE-02 | Claim verification + admin claim queue                                    | COMPLETE | `64286f9`   | Public listing discovery, claim initiation routing, admin queue visibility, `Request More Evidence`, `Verify Ownership`, verified profile/media access, and denial/revoke behavior are now proven current.                                                                                                                                                                                                                                                                                                                                                                            |
| BWE-03 | Verified-business ownership resolution + claimed-business profile editing | COMPLETE | `5310b59`   | No implementation work pending; preserve proof assets and only reopen on regression.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| BWE-04 | Disputed/revoked ownership denial                                         | COMPLETE | `20fb839`   | No implementation work pending; preserve runtime and unit-proof coverage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| BWE-05 | PAMFA address / ZIP / Directions behavior                                 | COMPLETE | `02d15c6`   | No implementation work pending; preserve the address-normalization proof and only reopen on regression.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| BWE-06 | Safe website/social partial updates                                       | COMPLETE | `6505f78`   | No implementation work pending; preserve partial-update contract test coverage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| BWE-07 | Business profile image/logo behavior                                      | COMPLETE | `75f4dd1`   | Owned-business profile/media/logo runtime subset is now committed in canonical history and re-proven through ownership/profile/media runtime proofs on Thursday, August 6, 2026.                                                                                                                                                                                                                                                                                                                                                                                                      |
| BWE-08 | Organization/church/nonprofit ownership and editing                       | COMPLETE | `5c36c51`   | No implementation work pending; preserve organization ownership/runtime proof coverage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| BWE-09 | Marketplace product detail                                                | COMPLETE | `97fb3a1`   | Public product detail now hides expired listings, removes placeholder seller copy, and renders an immediate unavailable state for stale product URLs.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| BWE-10 | Marketplace checkout / fulfillment proof                                  | BLOCKED  | `c797e3a`   | External validation dependency: one authorized real payment completion plus webhook/DB/UI fulfillment evidence for one canonical marketplace order.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| BWE-11 | Black Card                                                                | COMPLETE | `84968bb`   | Canonical Black Card runtime bundle is now committed; public plan-copy, entitlements, member auth flows, dashboard card UX, join flow, and admin list proof are current and green.                                                                                                                                                                                                                                                                                                                                                                                                    |
| BWE-12 | Pricing / revenue readiness                                               | COMPLETE | `7c22d03`   | Pricing, checkout, payment-success/cancel, and webhook billing-language surfaces are now aligned and proven current.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| BWE-13 | Auth/session parity                                                       | BLOCKED  | `c626bcf`   | Local proofs pass; remaining external validation dependency is cross-machine parity capture on the second dev environment.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| BWE-14 | Admin dashboard normalization                                             | COMPLETE | `0e6995d`   | The remaining preserved admin/support/claim-verification normalization bundle is now committed in canonical history and no unresolved runtime admin normalization file remains dirty.                                                                                                                                                                                                                                                                                                                                                                                                 |
| BWE-15 | Finance-admin summary                                                     | COMPLETE | `9f94a83`   | No implementation work pending; preserve finance test and focused admin runtime proof evidence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| BWE-16 | Directory/media stale-image handling                                      | COMPLETE | `21565e4`   | Revalidated on Saturday, August 8, 2026: stale `/uploads/...` media remains suppressed, and public listings without legitimate business media now fall back to the approved neutral BWE placeholder instead of category portrait stock images.                                                                                                                                                                                                                                                                                                                                        |
| BWE-17 | Business-approval queue count / pagination                                | COMPLETE | `df4a9ae`   | No implementation work pending; preserve admin queue/browser proof.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| BWE-18 | Sponsor -> business linkage / ordinary search / sponsored-business API    | COMPLETE | `f098f49`   | Reconciled again on Saturday, August 8, 2026: homepage and directory sponsor surfaces now render the verified eight-card schedule-backed sponsor set again, while ordinary directory search still promotes only genuinely linked public businesses instead of fabricating sponsor-backed listings.                                                                                                                                                                                                                                                                                    |
| DA-01  | Member conversion attribution (recent joins)                              | COMPLETE | `analysis`  | Eight-member scope resolved: `1` business-owner signup and `7` general-user signups, with no linked claim, ownership, or paid-membership records and no source attribution available from current telemetry.                                                                                                                                                                                                                                                                                                                                                                          |
| DA-02  | Directory count reconciliation                                            | COMPLETE | `b4f3e6f`   | Public/search/UI/claim totals reconcile at `365`; raw businesses reconcile at `2272` only after surfacing the separate `duplicate_review` bucket (`24`) beside the `1633` main approval queue.                                                                                                                                                                                                                                                                                                                                                                                        |
| DA-03  | Pricing and Black Card consistency                                        | COMPLETE | `35f93c5`   | Founder monthly billing, Black Card public copy, entitlements, member auth flows, and admin list proof are current; no remaining pricing/plan contradiction is established in canonical runtime evidence.                                                                                                                                                                                                                                                                                                                                                                             |
| DA-04  | Account-type onboarding                                                   | PENDING  | `842ba7f`   | Audit and prove Business Owner, Seller, Employer, and General User onboarding entry/redirect/end states.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| DA-05  | Marketplace public quality                                                | COMPLETE | `97fb3a1`   | Public marketplace quality remains closed after the Saturday, August 8, 2026 P1 reconciliation: the shared public-catalog contract now restores the three legitimate owner products in canonical `bwes-cluster`, stops legacy `expiresAt` metadata from zeroing valid active inventory, and still excludes unpublished, deleted, and QA/test listings.                                                                                                                                                                                                                                |
| DA-06  | Release history                                                           | ACTIVE   | `pending`   | Reconcile public release/history content to proven live functionality only. Current DA-06 closure work corrected public inventory copy, support metadata defaults across category plus alias/entry routes, storefront asset trust, and homepage sponsor/public-catalog truthfulness; the temporary zero-inventory conclusion was reversed on Saturday, August 8, 2026 after reconciling the canonical marketplace catalog, and the same day’s follow-up corrections also restored sponsor surfaces and neutral directory fallback media discovered during the DA-06/DA-07 transition. |
| DA-07  | Founder identity / trust                                                  | PENDING  | `pending`   | Audit founder-story and identity surfaces for factual and trust alignment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| DA-08  | Brand / SEO consistency                                                   | PENDING  | `pending`   | PARTIALLY SATISFIED during DA-06: public titles/canonicals/metadata were corrected across release, storefront, about, support category routes, and support alias/entry routes; continue with remaining broader brand/SEO normalization only.                                                                                                                                                                                                                                                                                                                                          |
| DA-09  | Social / site offer alignment                                             | PENDING  | `pending`   | PARTIALLY SATISFIED during DA-06: materially false marketplace/public-availability language was corrected on homepage, storefront, release notes, shop overview, and signup welcome messaging; continue with remaining broader marketing alignment only.                                                                                                                                                                                                                                                                                                                              |
| DA-10  | Claim-focused content strategy                                            | PENDING  | `pending`   | Preserve and restate the agreed `70/20/10` strategy on current public/editorial surfaces.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| DA-11  | Sponsor basic search                                                      | COMPLETE | `f098f49`   | Same underlying lane as BWE-18; closure audit confirms PAMFA works as an ordinary public business after sponsor expiry and the remaining names fail because no linked public business/source row exists.                                                                                                                                                                                                                                                                                                                                                                              |
| DA-12  | Scalable legitimacy / ownership verification                              | ACTIVE   | `5310b59`   | Current owner verification is strong for normal flows; next step is automated normal checks + admin review routing for exceptions.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## COMPLETE EVIDENCE REGISTER

### BWE-03 — Verified-business ownership resolution + claimed-business profile editing

- Commit chain:
  - `83cb043`
  - `3b00e03`
  - `6505f78`
  - `15a4e68`
  - `20fb839`
  - `f355441`
  - `5310b59`
- Exact files:
  - `src/pages/api/business/profile.ts`
  - `src/pages/api/business/update.ts`
  - `src/pages/business/profile.tsx`
  - `src/pages/business/[slug].tsx`
  - `src/pages/business-directory/[alias].tsx`
  - `src/lib/directoryOwnership.ts`
  - `src/lib/directoryProfileContract.ts`
- Test evidence:
  - `node src/lib/directory/__tests__/ownership-resolution-tests.mjs` pass
  - `node src/lib/directory/__tests__/profile-contract-tests.mjs` pass
- Runtime/browser evidence:
  - `node scripts/runtime-proof-business-parity.mjs` pass on Tuesday, August 4, 2026
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-directory-ownership.mjs` pass on Tuesday, August 4, 2026

### BWE-04 — Disputed/revoked ownership denial

- Commit: `20fb839`
- Exact files:
  - `src/lib/directoryOwnership.ts`
  - `src/pages/api/business/profile.ts`
  - `src/pages/api/business/update.ts`
- Test evidence:
  - `node src/lib/directory/__tests__/ownership-resolution-tests.mjs` pass
- Runtime/browser evidence:
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-directory-ownership.mjs` pass with denied updates before verification and after revoke

### BWE-06 — Safe website/social partial updates

- Commit: `6505f78`
- Exact files:
  - `src/lib/directoryProfileContract.ts`
  - `src/pages/api/business/update.ts`
- Test evidence:
  - `node src/lib/directory/__tests__/profile-contract-tests.mjs` pass
- Runtime/browser evidence:
  - `node scripts/runtime-proof-business-parity.mjs` pass with protected ownership fields preserved and partial public/profile updates persisting

### BWE-08 — Organization/church/nonprofit ownership and editing

- Commit chain:
  - `5c36c51`
  - `ccb32f9`
  - `5310b59`
- Exact files:
  - `src/pages/api/organizations/claim.ts`
  - `src/pages/api/organizations/[slug]/owner-profile.ts`
  - `src/pages/api/admin/organizations/claims.ts`
  - `src/pages/organizations/[slug].tsx`
- Test evidence:
  - organization ownership logic validated through live proof scripts
- Runtime/browser evidence:
  - `node scripts/runtime-proof-organization-ownership-sequence.mjs` pass on Tuesday, August 4, 2026
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-repro-org-verify.mjs` pass on Tuesday, August 4, 2026

### BWE-05 — PAMFA address / ZIP / Directions behavior

- Commit: `02d15c6f93216df8b0917c350dc8a471ccbc417c`
- Exact files:
  - `src/lib/directoryProfileContract.ts`
  - `src/pages/business/[slug].tsx`
  - `src/pages/business-directory/[alias].tsx`
  - `src/lib/directory/__tests__/location-normalization-tests.mjs`
- Test evidence:
  - `node src/lib/directory/__tests__/location-normalization-tests.mjs` pass
  - `npm run typecheck` pass
- Runtime/browser evidence:
  - `node scripts/runtime-check.mjs` pass on Tuesday, August 4, 2026
  - `/business/pamfa-united-citizens` returns `200`, renders `30349`, and exposes `Directions`
  - `/business-directory/pamfa-united-citizens` returns `200`, renders `30349`, and exposes `Directions`

### BWE-15 — Finance-admin summary

- Commit: `9f94a83516760f5bd00e9393fd5aaa8a72f5052c`
- Exact files:
  - `src/lib/__tests__/admin-finance-summary-tests.mjs`
  - `src/lib/adminFinanceSummary.ts`
  - `src/pages/admin/financial-review.tsx`
- Test evidence:
  - `node src/lib/__tests__/admin-finance-summary-tests.mjs` pass
- Runtime/browser evidence:
  - focused admin browser pass on `/admin/financial-review` and `/admin/revenue` on Tuesday, August 4, 2026

### BWE-16 — Directory/media stale-image handling

- Commit: `21565e4bc45997ba77f40c09412432cc575bce4e`
- Exact files:
  - `src/pages/business-directory.tsx`
  - `src/lib/__tests__/image-resolver-tests.mjs`
- Test evidence:
  - `node src/lib/__tests__/image-resolver-tests.mjs` pass
- Runtime/browser evidence:
  - focused browser proof confirmed `/business-directory` no longer requests stale `/uploads/hwhh0zbo60csk4oh4yhpj8fau.png`
  - Saturday, August 8, 2026 follow-up proof confirmed `/business-directory` now renders the neutral `/images/fallback/bwe-default.jpg` placeholder for listings without legitimate business media and no longer surfaces the prior portrait-style `/images/fallback/food.jpg` or `/images/fallback/retail.jpg` fallbacks on the public directory surface

### BWE-18 — Sponsor -> business linkage / ordinary search / sponsored-business API

- Commit chain:
  - `6ab62cd`
  - `44fe307`
  - `9e4e97d`
  - `f098f49`
- Exact files:
  - `src/lib/advertising/sponsorListings.ts`
  - `src/pages/api/search/businesses.ts`
  - `src/pages/api/sponsored-businesses.ts`
  - `src/lib/directory/__tests__/sponsor-listings-tests.mjs`
- Test evidence:
  - `node src/lib/directory/__tests__/sponsor-listings-tests.mjs` pass
  - `npm run typecheck` pass
- Runtime/browser evidence:
  - `/api/sponsored-businesses` now returns `{"ok":true,"sponsors":[],"meta":{"source":"none_active"}}` after expired schedule fallback filtering
  - `/api/search/businesses?search=Pamfa%20United%20Citizens&sponsoredFirst=1` returns the same PAMFA business `_id` `6a45de2d3278d888ed5d0730` with `isSponsored: false`, proving ordinary public listing visibility survives expired sponsorship
  - `/api/search/businesses?search=TitanEra&sponsoredFirst=1` returns `0` because there is no linked public BWE business record
  - `/business/pamfa-united-citizens` returns `200`
  - Wednesday, August 5, 2026 read-only sponsor-source audit confirms:
    - PAMFA is the only named sponsor with a real public BWE business record (`6a45de2d3278d888ed5d0730`)
    - `TitanEra`, `Guardians of the Forgotten Realm`, `The Last Nephilim`, `Millianious`, and `Tiana Song Sprouts` each have historical paid sponsor rows but no linked public business record
    - `Thomas Hooker Sr.` has no exact sponsor/ad source row; only related historical rows exist under `Thomas Hooker Author` and `Thomas Hooker Publisher`
    - full matrix recorded in `docs/audit-evidence/2026-08-05-sponsor-reconciliation.md`
  - Saturday, August 8, 2026 post-recovery correction confirmed the stricter sponsor runtime had over-suppressed public sponsor surfaces; `/api/sponsored-businesses` now returns `8` sponsor cards from canonical schedule data, homepage `Featured Sponsors` renders the same set, and `/business-directory` sponsor rail/sidebar render again while ordinary search remains restricted to genuinely linked public businesses only

### BWE-17 — Business-approval queue count / pagination

- Commit: `df4a9aedc74c078a351367966eaf9db82ff5ba26`
- Exact files:
  - `src/pages/admin/business-approvals.tsx`
- Test evidence:
  - `npm run typecheck` pass
- Runtime/browser evidence:
  - `/api/admin/dashboard-stats` pending businesses `1633`
  - `/api/admin/get-pending-businesses` total `1633`
  - `/admin/business-approvals` shows `1-25 of 1633`
  - focused admin route proof had no console or failed-network errors

### DA-02 — Directory count reconciliation

- Commit: `b4f3e6ffdb0d061ddb218f0137ebdd1db4fbf584`
- Exact files:
  - `src/lib/adminBusinessStatus.ts`
  - `src/pages/api/admin/get-pending-businesses.ts`
  - `src/pages/api/admin/dashboard-stats.ts`
  - `src/pages/api/admin/metrics/command-center.ts`
  - `src/pages/admin/dashboard.tsx`
  - `src/pages/admin/business-approvals.tsx`
  - `src/lib/__tests__/admin-business-status-tests.mjs`
- Count matrix:
  - raw business records: `2272`
  - public directory/search/UI/claim total: `365`
  - admin business approvals queue: `1633`
  - admin duplicate-review queue: `24`
  - admin approved bucket: `583`
  - admin rejected bucket: `32`
  - admin pending-work rollup: `1759`
  - admin directory listings population: `3`
- Root cause:
  - admin business totals were omitting `duplicate_pending_review` records, so `24` real businesses were outside the dashboard reconciliation even though public pagination and public search totals were already correct
- Test evidence:
  - `node src/lib/__tests__/admin-business-status-tests.mjs` pass
  - `npm run typecheck` pass
- Runtime/browser evidence:
  - `node scripts/runtime-check.mjs` pass on Wednesday, August 5, 2026
  - `/api/search/businesses?page=1&limit=20` and page 2 both return `total: 365` with different record sets
  - `/api/search/businesses?mode=claim&page=1&limit=20` also returns `total: 365`, proving claim mode currently shares the ordinary public directory population
  - `/api/admin/get-pending-businesses?page=1&limit=25` and page 2 both return `total: 1633` with different record sets
  - `/api/admin/dashboard-stats` now returns `businesses.total: 2272`, `pending: 1633`, `approved: 583`, `rejected: 32`, `duplicateReview: 24`
  - focused browser proof on `/business-directory`, `/admin/business-approvals`, and `/admin/dashboard?hideTests=1` completed with no console errors and no failed network requests
  - full read-only matrix recorded in `docs/audit-evidence/2026-08-05-directory-count-reconciliation.md`

### DA-01 — Member conversion attribution

- Commit: none in production runtime code
- Exact files:
  - none in application runtime
- Scope:
  - eight most recent real role-account joins across `users`, `businesses`, `sellers`, and `employers`, excluding test/admin/internal accounts and imported non-signup business rows
- Findings:
  - `1` Business Owner
  - `7` General Users
  - `0` Sellers
  - `0` Employers
  - no linked claims
  - no linked ownership reviews
  - no linked founding or paid membership conversions
  - no linked source/search attribution for the seven General User records
  - the prior six-member closure was corrected by accounting for two additional general-user joins already present in the same query window
- Root cause:
  - not a proven runtime defect; this lane closes as a data/measurement result
  - current telemetry is insufficient to attribute search/find/claim intent at the individual-member level for these six joins
- Runtime/browser evidence:
  - localhost remained healthy on port `3000`
  - the six-member matrix and collection-level proof are recorded in `docs/audit-evidence/2026-08-05-member-conversion-attribution.md`

## SCOPE TRACEABILITY

| Scope Item                                                | Canonical Workstream ID | Status   | Last Commit | Evidence                                                                                                                                                                       | Remaining Requirement                                                                               |
| --------------------------------------------------------- | ----------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Business signup -> claim routing                          | `BWE-01`                | PENDING  | `842ba7f`   | historical implementation exists; current browser proof not yet re-captured in canonical reconciliation                                                                        | run current Business Owner signup -> claim-mode redirect proof and record exact route/API evidence  |
| Claim Verification                                        | `BWE-02`                | COMPLETE | `64286f9`   | business listing -> claim route, admin queue transitions, verified access, media handling, and denial coverage are all re-proven on Thursday, August 6, 2026                   | preserve proof and reopen only on regression                                                        |
| Ownership Verification                                    | `DA-12`                 | ACTIVE   | `5310b59`   | business ownership and org verification proofs pass on August 4, 2026                                                                                                          | add scalable automated normal checks plus admin-review exception routing                            |
| Founding Membership payment/status/evidence/admin         | `BWE-02`                | COMPLETE | `64286f9`   | current business-claim admin workflow remains coupled to founding-membership records, but the live queue/admin/payment evidence path is proven working                         | preserve proof and reopen only on regression                                                        |
| claimed-business profile editing                          | `BWE-03`                | COMPLETE | `5310b59`   | ownership-resolution and profile-contract tests pass; runtime business/profile parity proof passes                                                                             | none beyond regression watch                                                                        |
| verified-business ownership resolution                    | `BWE-03`                | COMPLETE | `5310b59`   | runtime ownership parity proof passes; canonical API/profile routes are aligned                                                                                                | none beyond regression watch                                                                        |
| disputed/revoked ownership denial                         | `BWE-04`                | COMPLETE | `20fb839`   | denial behavior validated in ownership proof suite                                                                                                                             | none beyond regression watch                                                                        |
| PAMFA address/ZIP/Directions                              | `BWE-05`                | COMPLETE | `02d15c6`   | location-normalization test passes; both PAMFA public routes render `30349` and `Directions`                                                                                   | none beyond regression watch                                                                        |
| business image/logo                                       | `BWE-07`                | COMPLETE | `75f4dd1`   | owned-business profile/media/logo runtime subset is now committed and re-proven through the shared ownership/profile/media proof set on Thursday, August 6, 2026               | preserve proof and reopen only on regression                                                        |
| safe website/social partial updates                       | `BWE-06`                | COMPLETE | `6505f78`   | profile-contract tests and runtime profile parity proof pass                                                                                                                   | none beyond regression watch                                                                        |
| organization/church/nonprofit ownership/editing           | `BWE-08`                | COMPLETE | `5310b59`   | organization claim/owner proofs pass live on August 4, 2026                                                                                                                    | none beyond regression watch                                                                        |
| marketplace product detail                                | `BWE-09`                | COMPLETE | `97fb3a1`   | expired public product detail routes now resolve to an immediate unavailable state and no seller-placeholder copy remains in SSR HTML                                          | none beyond regression watch                                                                        |
| marketplace checkout                                      | `BWE-10`                | BLOCKED  | `c797e3a`   | checkout matrix code exists; canonical paid completion/webhook fulfillment proof remains an external validation dependency                                                     | obtain one safe authorized paid completion and fulfillment evidence                                 |
| Black Card functionality                                  | `BWE-11`                | COMPLETE | `84968bb`   | Black Card runtime bundle, dashboard card UX, join flow, admin digital-request surface, and live auth/entitlement/admin/browser proofs all pass on Thursday, August 6, 2026    | preserve proof and reopen only on regression                                                        |
| pricing/revenue readiness                                 | `BWE-12`                | COMPLETE | `7c22d03`   | pricing page, checkout founder cadence, payment success/cancel messaging, and webhook billing-language surfaces are now aligned and proven current on Thursday, August 6, 2026 | preserve proof and reopen only on regression                                                        |
| auth/session parity                                       | `BWE-13`                | BLOCKED  | `c626bcf`   | local auth/session proof matrix passes; second-machine parity remains an external validation dependency                                                                        | capture second-machine parity evidence                                                              |
| admin dashboard normalization                             | `BWE-14`                | COMPLETE | `0e6995d`   | the remaining admin/support/claim-verification normalization bundle is committed in canonical history and no unresolved runtime admin normalization file remains dirty         | preserve proof and reopen only on regression                                                        |
| finance-admin summary                                     | `BWE-15`                | COMPLETE | `9f94a83`   | admin-finance-summary test passes; focused admin runtime proof captured                                                                                                        | none beyond regression watch                                                                        |
| directory/media stale-image handling                      | `BWE-16`                | COMPLETE | `21565e4`   | image-resolver test passes; stale upload request remains suppressed; neutral BWE fallback is restored for listings without legitimate media                                    | none beyond regression watch                                                                        |
| business-approval pagination/count                        | `BWE-17`                | COMPLETE | `df4a9ae`   | pending count/API/page text all align at `1633`; paging controls present                                                                                                       | none beyond regression watch                                                                        |
| sponsor/business ordinary search                          | `BWE-18`                | COMPLETE | `f098f49`   | ordinary search stays strict for linked public businesses only, while homepage/directory sponsor surfaces again render the verified eight-card historical sponsor schedule set | none in runtime code; future work only if source-data/business linkage is created outside this lane |
| Direct Assessment 01 — Member conversion attribution      | `DA-01`                 | COMPLETE | `analysis`  | eight most recent real joins are now classified; seven are general-user signups, one is a business-owner signup, and no downstream claim/membership linkage is present         | none beyond future telemetry improvements or claim-lane follow-up                                   |
| Direct Assessment 02 — Directory count reconciliation     | `DA-02`                 | COMPLETE | `b4f3e6f`   | public/search/UI totals reconcile at `365`; admin totals now reconcile `2272` raw businesses by surfacing a separate `24` duplicate-review bucket                              | none beyond regression watch                                                                        |
| Direct Assessment 03 — Pricing and Black Card consistency | `DA-03`                 | COMPLETE | `35f93c5`   | founder cadence defect is closed and Black Card pricing/copy/runtime proofs now pass                                                                                           | none beyond regression watch                                                                        |
| Direct Assessment 04 — Account-type onboarding            | `DA-04`                 | PENDING  | `842ba7f`   | onboarding code exists but current path-by-path proof is missing                                                                                                               | audit Business Owner, Seller, Employer, and General User onboarding end states                      |

### BWE-02 closure — Thursday, August 6, 2026

- Status: COMPLETE
- Commit: `64286f9a0b0c356f2bf93391e3265d95042a502a`
- Exact files:
  - `src/lib/founding-membership.ts`
  - `src/pages/api/admin/founding-memberships.ts`
  - `src/pages/admin/claim-verification.tsx`
  - `src/lib/founding-membership/__tests__/claim-reconciliation-tests.mjs`
  - `src/lib/founding-membership/__tests__/claim-verification-joins-tests.mjs`
  - `src/lib/founding-membership/__tests__/transition-helper-tests.mjs`
- Current reality:
  - verified-business ownership resolution, protected profile loading, protected profile patching, and revoke/dispute denial remain green from current runtime proof
  - the business-side admin claim queue terminology defect is closed and current runtime proof shows the founding-membership-backed queue still delivers the intended business claim verification workflow
  - the remaining split between business claims and founding-membership structures is legacy implementation shape, not a newly proven user-facing defect
  - business search -> claim routing, queue presence, `Request More Evidence`, `Verify Ownership`, verified owner access, profile/media editing, and denial behavior are all now proven current
- Proof:
  - `node src/lib/directory/__tests__/ownership-resolution-tests.mjs` pass
  - `node src/lib/founding-membership/__tests__/claim-reconciliation-tests.mjs` pass
  - `node src/lib/founding-membership/__tests__/claim-verification-joins-tests.mjs` pass
  - `node src/lib/founding-membership/__tests__/platform-queue-tests.mjs` pass
  - `node src/lib/founding-membership/__tests__/transition-helper-tests.mjs` pass
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-directory-ownership.mjs` pass
  - `node scripts/runtime-proof-business-parity.mjs` pass
  - `node tmp/phase2-authorized-edit-business-full-proof.mjs` pass
  - `node tmp/phase2-denial-probe.mjs` pass
  - `node tmp/phase2-disputed-revoked-browser-proof.mjs` pass
  - `node tmp/phase2-claim-queue-media-proof.mjs` pass
  - `npm run typecheck` pass
- Next action:
  - preserve closure evidence and continue with `BWE-12 Pricing / revenue readiness`

## CURRENT APPLICATION FILE CHANGE SUMMARY

- Application files created:
  - none recorded in the focused August 4, 2026 closure sequence
- Application files modified:
  - `src/pages/api/stripe/checkout.ts`
  - `src/lib/founding-membership.ts`
  - `src/lib/advertising/sponsorListings.ts`
  - `src/pages/api/sponsored-businesses.ts`
  - `src/pages/api/search/businesses.ts`
  - `src/lib/adminBusinessStatus.ts`
  - `src/pages/api/admin/get-pending-businesses.ts`
  - `src/pages/api/admin/dashboard-stats.ts`
  - `src/pages/api/admin/metrics/command-center.ts`
  - `src/pages/admin/dashboard.tsx`
  - `src/pages/admin/business-approvals.tsx`
  - `src/lib/directoryProfileContract.ts`
  - `src/pages/business/[slug].tsx`
  - `src/pages/business-directory/[alias].tsx`
  - `src/pages/black-card/index.tsx`
- Application files deleted:
  - none recorded in the focused August 4, 2026 closure sequence
- Test/proof files created:
  - `scripts/test-pricing-billing-alignment.mjs`
  - `src/lib/directory/__tests__/location-normalization-tests.mjs`
- Test/proof files modified:
  - `src/lib/founding-membership/__tests__/resume-checkout-tests.mjs`
  - `src/lib/directory/__tests__/sponsor-listings-tests.mjs`
  - `src/lib/__tests__/admin-business-status-tests.mjs`
- Files committed and commit SHA:
  - `72806abd827e57494bdd3ddb8525328a0ff0f0d8` -> `src/pages/api/stripe/checkout.ts`, `scripts/test-pricing-billing-alignment.mjs`
  - `49bc7223a52dd59e1c1a873e9d08009a8f9ba7ac` -> `src/lib/founding-membership.ts`, `src/lib/founding-membership/__tests__/resume-checkout-tests.mjs`
  - `6ab62cd35813dbe2c5dfa66e3947d0645ddcb839` -> `src/lib/advertising/sponsorListings.ts`, `src/pages/api/sponsored-businesses.ts`, `src/pages/api/search/businesses.ts`, `src/lib/directory/__tests__/sponsor-listings-tests.mjs`
  - `02d15c6f93216df8b0917c350dc8a471ccbc417c` -> `src/lib/directoryProfileContract.ts`, `src/pages/business/[slug].tsx`, `src/pages/business-directory/[alias].tsx`, `src/lib/directory/__tests__/location-normalization-tests.mjs`
  - `35f93c5a1d8a9fdf663bd372c8d66a682dcd5fa0` -> `src/pages/black-card/index.tsx`
  - `468c78e487958f01f8dbf958783e03818a3a3e23` -> `scripts/runtime-proof-black-card-entitlements.mjs`
  - `d6b6a421a303adbd1dcdf641a5b24858bab06008` -> `scripts/runtime-proof-black-card-auth.mjs`
  - `f098f497949155064b426c610e89f01c1706c47b` -> `src/lib/advertising/sponsorListings.ts`, `src/pages/api/search/businesses.ts`, `src/pages/api/sponsored-businesses.ts`
  - `b4f3e6ffdb0d061ddb218f0137ebdd1db4fbf584` -> `src/lib/adminBusinessStatus.ts`, `src/pages/api/admin/get-pending-businesses.ts`, `src/pages/api/admin/dashboard-stats.ts`, `src/pages/api/admin/metrics/command-center.ts`, `src/pages/admin/dashboard.tsx`, `src/pages/admin/business-approvals.tsx`, `src/lib/__tests__/admin-business-status-tests.mjs`
- Application files still dirty/uncommitted:
  - `src/lib/adminBusinessStatus.ts`
  - `src/lib/adminFinanceSummary.ts`
  - `src/lib/black-card-membership.ts`
  - `src/lib/black-card-state.ts`
  - `src/lib/businessSubmission.ts`
  - `src/lib/directoryOwnership.ts`
  - `src/lib/directoryPublicMedia.ts`
  - `src/pages/admin/business-approvals.tsx`
  - `src/pages/admin/claim-verification.tsx`
  - `src/pages/admin/black-card.tsx`
  - `src/pages/api/admin/black-card/cards.ts`
  - `src/pages/api/admin/black-card/digital-requests.ts`
  - `src/pages/api/black-card/digital-request.ts`
  - `src/pages/api/black-card/member-summary.ts`
  - `src/components/black-card/PremiumDigitalCard.tsx`
  - `src/pages/black-card/join.tsx`
  - `src/pages/dashboard/black-card.tsx`
  - full exact inventory remains authoritative in `docs/recovery/BWE_COMPLETE_FILE_MANIFEST_CURRENT.csv`
- Application files requiring classification:
  - `src/lib/adminFinanceSummary.ts` post-commit indentation-only churn
  - `src/lib/adminBusinessStatus.ts` preserved admin-normalization lane changes

### Black Card Dirty Runtime File Classification — 2026-08-04

- `VALID CURRENT WORK`
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
- `ACTIVE`
  - none inside the Black Card runtime subset after current proof sweep
- `SUPERSEDED`
  - none inside the Black Card runtime subset after current proof sweep
- `NEEDS REVIEW`
  - none inside the Black Card runtime subset after current proof sweep
- Interpretation:
  - these files are still dirty in canonical git state, but current August 4, 2026 runtime evidence shows working Black Card behavior rather than a newly discovered live defect
  - `BWE-11` therefore remains `ACTIVE` for canonical closure/commit hygiene, not because current runtime behavior is failing

### BWE-11 closure — Thursday, August 6, 2026

- Status: COMPLETE
- Commit: `84968bbc4917a7d3a52e478e0bedb04a8250b793`
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
- Current reality:
  - the previously preserved dirty Black Card runtime subset is now committed as canonical recovered functionality
  - authenticated Black Card dashboard, digital card rendering, verification link, join-page plan mapping, rewards earn/redeem, entitlement gating, admin redemption review, and admin digital-request visibility all remain green from current live proof
  - the stale admin/browser proof assumptions were corrected; no new Black Card runtime defect was proven in this closure cycle
  - the remaining `pricingLabelsFixed` browser expectation belongs to `BWE-12 Pricing / revenue readiness`, not to the closed Black Card runtime lane
- Proof:
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-black-card-auth.mjs` pass
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-black-card-admin.mjs` pass
  - `npm run proof:black-card-entitlements` pass
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-owner-blackcard-ui.mjs` pass for current Black Card runtime behavior, with the remaining pricing-label expectation reclassified to `BWE-12`
  - `npm run typecheck` pass
  - localhost `200` proofs remain current for `/`, `/business-directory`, `/black-card`, and `/black-card/join`
- Next action:
  - preserve closure evidence and continue with `BWE-12 Pricing / revenue readiness`

### BWE-12 closure — Thursday, August 6, 2026

- Status: COMPLETE
- Commits:
  - `5f523b0b51cf65b991fd337a476365efb1c71b20`
  - `48759062ed5862fc36eb3bdfc88926a72c757749`
  - `7c22d03adf86d878cfe60efc32643d9aa23370b5`
- Exact files:
  - `src/pages/pricing.tsx`
  - `src/pages/checkout/index.tsx`
  - `src/pages/payment-success.tsx`
  - `src/pages/payment-cancel.tsx`
  - `src/pages/api/stripe/webhook-handler.ts`
- Current reality:
  - `/pricing` now explicitly states `Premium includes the Standard Black Card` and `Founding Member includes the Signature Black Card`
  - `/checkout?plan=founder` confirms monthly founder billing cadence in live runtime
  - `/payment-success` and `/payment-cancel` remain live and aligned with the current checkout/membership messaging
  - the remaining `src/pages/api/stripe/webhook-handler.ts` delta was preserved formatting churn on already-proven billing-language logic and is now closed in canonical history
- Proof:
  - `DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/runtime-proof-owner-blackcard-ui.mjs` pass with `pricingLabelsFixed: true`
  - `node scripts/test-pricing-billing-alignment.mjs` pass
  - `npm run typecheck` pass
  - localhost `200` proofs remain current for `/`, `/pricing`, `/checkout?plan=founder`, and `/black-card`
- Next action:
  - preserve closure evidence and continue with `BWE-07 Business profile image/logo behavior`

# BWE Master Task List

Legend: `complete` | `in-progress` | `incomplete` | `verify-next`
Owner default: `BlackForge`

Revenue-first governing directive override is in force: `docs/BWE_12_MONTH_REVENUE_FIRST_GOVERNING_DIRECTIVE_2026-06-28.md`

Before any item remains active, it must pass the Revenue Gate and be classed as one of:

- Revenue Critical
- Trust or Payment Critical
- Customer Fulfillment
- Maintenance
- Deferred
- Retired

Historical items below must be reclassified before further implementation.

## P0

1. Full reset lifecycle proof + hardening

- status: complete
- owner/agent: BlackForge
- proof required: e2e reset lifecycle, reuse fail, expiry fail, TTL, no raw token
- dependencies: env + Mongo access
- last updated commit: c259c67

2. Env centralization on critical auth/data routes

- status: complete
- owner/agent: BlackForge
- proof required: lint/build + route/API checks
- dependencies: env.ts helpers
- last updated commit: f5a8f5f

3. DB documentation/process system

- status: complete
- owner/agent: BlackForge
- proof required: check:db-docs output
- dependencies: docs + checker script
- last updated commit: c8bac4e

## P1

4. Built-runtime stabilization standard

- status: complete
- owner/agent: BlackForge
- proof required: build + smoke
- dependencies: startable runtime
- last updated commit: 9f8e5a1

5. Security headers + CSP

- status: complete
- owner/agent: BlackForge
- proof required: curl header proof
- dependencies: next.config headers
- last updated commit: 9f8e5a1

6. Critical DB index verification

- status: complete
- owner/agent: BlackForge
- proof required: check:critical-indexes output
- dependencies: Mongo access
- last updated commit: 9f8e5a1

## P2

7. Role-by-role regression verification

- status: complete
- owner/agent: BlackForge
- proof required: check:p2-regression pass
- dependencies: seeded role accounts in harness
- last updated commit: 7dddecf

8. Vertical regressions (marketplace/ads/jobs/admin)

- status: complete (route/regression baseline)
- owner/agent: BlackForge
- proof required: scenario matrix + screenshots/logs
- dependencies: stable runtime + seeded data
- last updated commit: 7dddecf

## P2.5

9. Referral engine v1 foundation

- status: complete
- owner/agent: BlackForge
- proof required: auth code endpoint + track endpoint + DB docs backfill
- dependencies: auth session + Mongo
- last updated commit: 3a2e174

## P2.6

11. Runtime/link integrity gates

- status: complete
- owner/agent: BlackForge
- proof required: `check:runtime-health` + `check:internal-links` pass
- dependencies: running app instance
- last updated commit: e6d3505

## P2.7

12. Canonical route typo cleanup (`inclusive-job-descriptions`)

- status: complete
- owner/agent: BlackForge
- proof required: critical-path pass + typo redirect verification
- dependencies: next.config redirect + canonical page path
- last updated commit: 23f9a48

## P2.8

13. Marketplace buy-button completion matrix + fixes

- status: complete
- owner/agent: BlackForge
- proof required: full buy-button matrix, failing paths, runtime/env correction, checkout-session recovery, rerun GO
- dependencies: runtime pinned to recovered app URL + Atlas Mongo + STRIPE_SECRET_KEY present
- notes: local validation ran in live Stripe mode; inventory-policy follow-up remains because `stock=0` products still create checkout sessions
- last updated commit: c797e3a

## P2.9

14. Critical-path harness reliability fix

- status: complete
- owner/agent: BlackForge
- proof required: `check:critical-paths` pass including authenticated role checks
- dependencies: login endpoint + cookie capture
- last updated commit: 14e83a9

## P3

9. Cross-site design consistency pass

- status: incomplete
- owner/agent: BlackForge
- proof required: before/after visual set
- dependencies: design freeze for launch scope
- last updated commit: pending

10. Recruiting v1.1 admin workflow

- status: verify-next
- owner/agent: BlackForge
- proof required: intake->pipeline->status transitions
- dependencies: admin UI/API extension
- last updated commit: pending

11. Lane 3 backlog: business detail image trust improvement

- status: incomplete
- owner/agent: BlackForge
- proof required: business image precedence + category fallback matrix + persistence proof + trust QA screenshots
- dependencies: Lane 3 search quality/trust window (do not execute during Lane 2)
- requirements:
  - use business-provided image/logo first
  - if missing, use category-specific fallback imagery
  - do not use one generic fallback across all businesses
  - do not hotlink random web images
  - use licensed/public/approved sources only
  - store selected fallback image/source metadata for consistency per listing
  - unknown categories use premium BWE-branded fallback
- last updated commit: pending

## Lane Issue Log and Closure Verification (mandatory)

### P0 stable baseline issue log (2026-04-30)

- Issue name: Login session persistence failure (kicked back to login)
- Description: User could login but session did not persist and returned to login.
- When/where: P0 stability sweep during Lane 2 closure attempts.
- Root cause: auth role/collection drift + cookie scope mismatch for localhost/proto handling.
- Files involved: `src/pages/api/auth/login.ts`, `src/pages/api/auth/me.ts`, `src/pages/api/auth/logout.ts`, `src/pages/api/auth/signup.ts`, `src/middleware.ts`
- Fix applied: cross-collection role fallback in login/me; localhost-safe cookie domain/secure handling.
- Date/time resolved: 2026-04-30 PDT

- Issue name: Cookie/session handling issue
- Description: session cookie/accountType cookie not consistently reused across follow-up auth checks.
- When/where: auth validation during P0.
- Root cause: cookie attribute mismatch for local host/protocol and role lookup assumptions.
- Files involved: `src/pages/api/auth/login.ts`, `src/pages/api/auth/me.ts`, `src/pages/api/auth/logout.ts`, `src/pages/api/auth/signup.ts`
- Fix applied: host-aware cookie policy in auth routes and resilient identity resolution.
- Date/time resolved: 2026-04-30 PDT

- Issue name: One-click/navigation delay (5-6s)
- Description: delayed click response/navigation reported by user.
- When/where: homepage/core navigation P0 report.
- Root cause: request-path overhead in search endpoint (`count`/prep path) and auth-path overhead investigations.
- Files involved: `src/pages/api/search/businesses.ts`, `src/middleware.ts`
- Fix applied: remove request-path count logic; reduce prep overhead; middleware localhost redirect guard.
- Date/time resolved: 2026-04-30 PDT (user-validated P0 closure)

- Issue name: Search count/data-trust issue (incorrect inventory numbers)
- Description: homepage displayed low page-limited totals instead of true inventory counts.
- When/where: homepage hero stat cards.
- Root cause: homepage consumed search pagination `total` after search count-path optimization.
- Files involved: `src/pages/index.tsx`, `src/pages/api/search/businesses.ts`, `src/pages/api/stats/inventory.ts`
- Fix applied: separated global inventory stats to dedicated endpoint.
- Date/time resolved: 2026-04-30 PDT

- Issue name: Middleware/redirect behavior issue
- Description: local runtime API calls redirected unexpectedly under production mode behavior.
- When/where: middleware HTTPS enforcement and protected-route redirects.
- Root cause: HTTPS redirect enforced without localhost exemption.
- Files involved: `src/middleware.ts`
- Fix applied: localhost bypass for HTTPS redirect enforcement.
- Date/time resolved: 2026-04-30 PDT

### Issue Verification Block (required)

- Issue: Login session persistence failure
  - Original behavior: Login then bounce to login window.
  - Root cause: role collection drift + cookie scope mismatch.
  - Fix: auth fallback + host-aware cookie settings.
  - Re-test result: PASS

- Issue: Cookie/session handling issue
  - Original behavior: session cookie not reliably honored.
  - Root cause: domain/secure mismatch in local host contexts.
  - Fix: localhost cookie overrides in login/signup/logout.
  - Re-test result: PASS

- Issue: One-click/navigation delay
  - Original behavior: 5-6 second click delay.
  - Root cause: heavy search cold prep/count path and redirect overhead.
  - Fix: removed count path from search request and tightened prep path.
  - Re-test result: PASS

- Issue: Search count/data-trust issue
  - Original behavior: homepage counts showed page-limited values.
  - Root cause: search totals reused for global stats.
  - Fix: dedicated `/api/stats/inventory` endpoint and homepage wiring.
  - Re-test result: PASS

- Issue: Middleware/redirect behavior issue
  - Original behavior: unintended local redirects.
  - Root cause: strict production HTTPS redirect without localhost carve-out.
  - Fix: localhost bypass in middleware.
  - Re-test result: PASS
