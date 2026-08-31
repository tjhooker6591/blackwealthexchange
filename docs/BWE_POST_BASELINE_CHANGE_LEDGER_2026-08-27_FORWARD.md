# BWE Post-Baseline Change Ledger

Date range: 2026-08-27 forward

Baseline starting point: `bf6bdc32db071a3e3a8d38f8dccd6d5b7c3f6b99`

Runtime baseline preserved:

- Experience 2.0 runtime baseline: `80c971734635b57b2921a0b31918acb5868faa8d`
- Baseline source: `f3d8e33d2fd81ef929df66cc721684e2d7c8d2cb`
- Baseline artifact head: `bf6bdc32db071a3e3a8d38f8dccd6d5b7c3f6b99`
- Baseline world-class index: `381 / 1000`
- Baseline release completion: `67%`
- Starting DB operations: `35`

## Master program anchor

- ACTIVE POST-BASELINE WORKSTREAM: `WORKSTREAM 002 — LIBRARY OF BLACK HISTORY`
- CURRENT PHASE: `POST-BASELINE EXECUTION`
- PHASE 0 — RELEASE STABILIZATION: `COMPLETE`
- PHASE 1 — BWE EXPERIENCE 2.0: `COMPLETE`
- NEXT MAJOR PHASE AFTER APPROVED HISTORY CHECKPOINT: `PHASE 2 — UNIFIED PLATFORM CORE`
- CURRENT WORLD-CLASS INDEX: `381 / 1000`
- CURRENT RELEASE COMPLETION: `67%`
- BUSINESS INDEPENDENCE STAGE: `BI-0`
- ECONOMIC SCALE STAGE: `PRE-ES-0`
- BWE-10 INTERNAL: `GO`
- BWE-10 OWNER TRANSACTION: `PENDING`
- BWE-10 LIVE PROOF: `PENDING`
- BWE-13: `EXTERNAL PROOF PENDING`
- REVENUE EVIDENCE: `NONE NEW`
- BMEV EVIDENCE: `NONE NEW`
- RULE: `the active Black History workstream remains approved but does not replace the broader BWE master roadmap`

## Workstream 001

Name: `BWE IDENTITY + BLACK HISTORY RESTORATION`

Date: `2026-08-29`

Runtime commit:

- `be02d5842733d25f9f9216de0f03cb9dba138fb7` `restore founder declaration and black history discoverability`

## First Recovery Checkpoint

ABOUT CURRENT VERSION:

- `bf6bdc32db071a3e3a8d38f8dccd6d5b7c3f6b99:src/pages/about.tsx`

ABOUT LAST FULL FOUNDER VERSION:

- `a05401b2fae20856fcc0decb63e9e57f3dc4972f:src/pages/about.tsx`

ABOUT CONTENT REMOVED:

- The baseline `about.tsx` replaced the founder-authored declaration and related substantive sections with a shorter founder-led platform summary.
- Removed or materially compressed material included the founding declaration, mission, Black unity, diaspora unity, pro-ourselves statement, constitutional/legal affirmation, economic history, generational prosperity language, founding principle body, and the closing BWE declaration.
- Git evidence: `e932d910f63fd9beeb27d64e99f78d432e841ae0` moved the full founding message behind a link, and `832d09461d606b3da4a876d9e043441bc61d56ee` further replaced the last full declaration content on `/founding-principle`.

LIBRARY FILE EXISTS:

- `YES`

LIBRARY CURRENT ROUTE:

- `/library-of-black-history` -> `200`

LIBRARY LAST FULL VERSION:

- `c98a7eb5e0ba5f6d1be4506b01f3cf0d1147b35c:src/pages/library-of-black-history.tsx`

LIBRARY CONTENT:

- `FULL`

LIBRARY NAVIGATION:

- `LOST / REDUCED`

CAUSE:

- The route itself was preserved and expanded, not removed.
- Git shows the owner-visible issue was discoverability loss:
  - `33e64bc` included an explicit homepage Black History CTA.
  - `fda66fd`, `106ff72`, and `d6405cc` progressively condensed homepage quick-access/history entry points.
  - The baseline kept a link in `src/pages/more.tsx`, but the library was no longer surfaced from the homepage, learning hub, or footer.

RECOVERY ACTION:

- Restore founder-authored About substance on `/about`.
- Restore declaration-centered substance on `/founding-principle`.
- Preserve the current substantive history library route.
- Restore discoverability from home, learning, about, and footer surfaces without cluttering primary navigation.

## Post-Baseline Counters

POST-BASELINE UNIQUE APPLICATION FILE COUNT:

- `6`

POST-BASELINE UNIQUE REPOSITORY FILE COUNT:

- `7`

POST-BASELINE ADDED:

- `2`

POST-BASELINE MODIFIED:

- `5`

POST-BASELINE DELETED:

- `0`

POST-BASELINE RENAMED:

- `0`

## 8. Seller payout onboarding public-quality correction

DATE:

- `2026-08-31`

WORKSTREAM:

- `BWE EXPERIENCE 2.0 PUBLIC QUALITY`

CHANGE TYPE:

- `FIXED`

FILES:

- `src/pages/api/stripe/create-account-link.ts`
- `src/pages/api/stripe/account-status.ts`
- `src/pages/marketplace/become-a-seller.tsx`
- `src/components/dashboards/SellerDashboard.tsx`
- `src/components/StripeSetupCard.tsx`

WHY CHANGED:

- Correct the seller Stripe onboarding handoff so customer-facing seller pages stop leaking raw technical errors and can handle payout setup failures safely.

FUNCTIONALITY CHANGED:

- Aligned the Stripe account-link API response with the existing seller onboarding clients.
- Added customer-safe payout error messages on seller setup and seller dashboard surfaces.
- Preserved signed-out redirects and safe incomplete/invalid seller handling without changing Stripe ownership, webhook configuration, or payment architecture.

FUNCTIONALITY PRESERVED:

- Seller setup progress remains intact.
- Stripe Connect onboarding path remains intact.
- No production deployment, live transaction, or DB migration was performed.

RUNTIME COMMIT:

- `745740050f2fe7476452f43abdab090d23203577`

VALIDATION:

- `npm run typecheck`
- `node scripts/runtime-check.mjs`
- `node scripts/check-critical-paths.mjs`
- Browser proof on seller mobile states at `375px`, `390px`, and `430px`
- Signed-out Stripe endpoint behavior verified locally

STATUS:

- `COMMITTED`

## 9. Public internal-language and copy-hygiene sweep

DATE:

- `2026-08-31`

WORKSTREAM:

- `BWE EXPERIENCE 2.0 PUBLIC QUALITY`

CHANGE TYPE:

- `FIXED`

FILES:

- `src/components/NavBar.tsx`
- `src/pages/index.tsx`
- `src/pages/marketplace/index.tsx`
- `src/pages/resources/index.tsx`

WHY CHANGED:

- Remove customer-facing internal operating language and improve first-time clarity on the homepage without redesigning the accepted Experience 2.0 foundation.

FUNCTIONALITY CHANGED:

- Replaced internal phase/preservation/status language with customer-facing copy.
- Added a concise BWE introduction and three clear entry paths on the homepage.
- Repositioned Founding Membership lower in the homepage hierarchy.
- Removed internal-language badges from marketplace and resources public surfaces.

FUNCTIONALITY PRESERVED:

- Existing hero/search behavior remains intact.
- Existing Explore BWE and Start Here paths remain intact.
- Existing marketplace/resources routes remain intact.

RUNTIME COMMIT:

- `99e8a8f958a13b0ae50707b2eabaf31ba2441133`

VALIDATION:

- `npm run typecheck`
- `node scripts/runtime-check.mjs`
- `node scripts/check-critical-paths.mjs`
- Browser proof on `/`, `/library-of-black-history`, and `/library-of-black-history/west-africa` at `375px`, `390px`, `430px`, and desktop

STATUS:

- `COMMITTED`

POST-BASELINE DB WRITES:

- `0`

CURRENT TOTAL DB OPERATIONS:

- `35`

## File Change Records

### 1. Founding content source

DATE:

- `2026-08-29`

WORKSTREAM:

- `BWE IDENTITY + BLACK HISTORY RESTORATION`

CHANGE TYPE:

- `ADDED`

FILE:

- `foundingContent.ts`

RELATIVE PATH:

- `src/lib/foundingContent.ts`

ABSOLUTE PATH:

- `/Users/blackforge/workspace/bwe/repos/repo_clean/src/lib/foundingContent.ts`

WHY CHANGED:

- Centralize founder-authored About and Founding Principle source text so the restored declaration remains consistent across both routes.

FUNCTIONALITY CHANGED:

- Added a shared source for restored founder declaration, unity, legal affirmation, economic history, values, founding principle, and closing declaration content.

FUNCTIONALITY PRESERVED:

- No runtime behavior, API behavior, or database behavior changed.

RUNTIME COMMIT:

- `be02d5842733d25f9f9216de0f03cb9dba138fb7`

VALIDATION:

- `npm run typecheck` PASS
- Browser route validation PASS on `/about` and `/founding-principle`

STATUS:

- `COMMITTED`

## Workstream 001 Correction

Name: `FOUNDING PRINCIPLE WORDING-FIDELITY + UI CORRECTION`

Date: `2026-08-30`

Status:

- Corrected the public Founding Principle presentation without undoing the Workstream 001 recovery.
- Preserved `src/lib/foundingContent.ts`, `/about`, `/founding-principle`, `/library-of-black-history`, homepage History link, learning History link, footer History link, and the existing post-baseline ledger.

Wording-fidelity audit summary:

- `FOUNDING WORDING DIFFERENCES FOUND`: `8`
- `FORMATTING ONLY`: `1`
- `GRAMMAR / TYPOGRAPHY`: `1`
- `SUBSTANTIVE EDITORIAL CHANGE`: `6`
- `UNAPPROVED SUBSTANTIVE DIFFERENCES RESTORED`: `6`

Substantive differences restored to owner wording:

- `A deliberate, strategic stand` -> `A deliberate and strategic stand`
- `rightfully given` -> `freely given`
- `foundations that were never permitted to exist` -> `foundations never permitted to exist`
- `mimic unity` -> `perform unity`
- `sacred bond` -> `bond`
- `economic disparities we face today` -> `every economic disparity we face today`

Formatting / grammar retained or corrected:

- Restored the comma structure in `our voices, our dollars, our vision`
- Preserved the grammar correction `history's denial` in place of the historical source typo `histories denial`

Internal public engineering copy:

- Removed `This route preserves the founder-authored declaration at the core of BWE and keeps it separate from the platform's broader history library.` from the public Founding Principle page.

Presentation correction summary:

- Rebuilt the Founding Principle hero into a two-line premium headline plus a separate declaration lead paragraph.
- Moved related links to a quieter `Related Paths` section near the bottom of the page.
- Shifted the page from stacked cards to long-form editorial sections with restrained separators, narrower reading width, and controlled rhetorical callouts.
- Restructured `/about` so it remains distinct from `/founding-principle` while preserving owner-authored language where quoted or excerpted.

Correction file set:

- `src/lib/foundingContent.ts`
- `src/pages/about.tsx`
- `src/pages/founding-principle.tsx`
- `docs/BWE_POST_BASELINE_CHANGE_LEDGER_2026-08-27_FORWARD.md`

Post-baseline counters after correction:

- `POST-BASELINE UNIQUE APPLICATION FILE COUNT`: `6`
- `POST-BASELINE UNIQUE REPOSITORY FILE COUNT`: `7`
- `POST-BASELINE ADDED`: `2`
- `POST-BASELINE MODIFIED`: `5`

## Workstream 002 Checkpoint

Name: `LIBRARY OF BLACK HISTORY — BLOCK 4`

Date: `2026-08-31`

Status:

- Added Block 4 to the live `library-of-black-history` route without replacing Blocks 1-3, the Truth Mirror, route identity, search, or filters.
- Preserved the accepted Egypt / Kemet / Nile Valley / Nubia / Kush material and advanced the active build into African government, rulers, women and queen-mother power, writing systems, oral knowledge, education, science, technology, Benin, Igbo-Ukwu, and Great Zimbabwe.
- Made the smallest safe architecture improvement by moving new Block 4 content into a dedicated source module while keeping the existing route and navigation intact.

Runtime/content file set:

- `src/lib/black-history-block4.ts`
- `src/pages/library-of-black-history.tsx`
- `docs/BWE_BLACK_HISTORY_CONTENT_ARCHITECTURE.md`
- `docs/BWE_BLACK_HISTORY_COVERAGE_GAP_MATRIX.md`
- `docs/BWE_BLACK_HISTORY_RESEARCH_AND_SOURCE_LEDGER.md`
- `docs/BWE_POST_BASELINE_CHANGE_LEDGER_2026-08-27_FORWARD.md`

## Workstream 002 Checkpoint

Name: `LIBRARY OF BLACK HISTORY — BLOCK 5 PUBLIC EXPERIENCE CORRECTION`

Date: `2026-08-31`

Status:

- Preserved the already-started Block 5 history slice and left its accepted runtime and control checkpoints intact.
- Converted `/library-of-black-history` from one giant public history page into a shorter library entrance with search, chapter pathways, and a reduced Truth Mirror footprint.
- Promoted completed history into real chapter routes for reading without exposing internal workstream or block language on the public surface.
- Kept all completed history content and source access while moving myth/evidence, school-gap, and source-heavy material behind cleaner disclosures.
- Stopped after the public/mobile architecture correction and did not begin Block 6.

Runtime/content file set:

- `src/pages/library-of-black-history.tsx`
- `src/pages/library-of-black-history/[chapter].tsx`
- `src/components/history/black-history-ui.tsx`
- `src/lib/black-history-foundations.ts`

Control file set:

- `docs/BWE_BLACK_HISTORY_CONTENT_ARCHITECTURE.md`
- `docs/BWE_POST_BASELINE_CHANGE_LEDGER_2026-08-27_FORWARD.md`
- `docs/BWE_WORLD_CLASS_MEASUREMENT_HISTORY.md`

Public-structure correction:

- Old public problem:
  - the route exposed internal build language, roadmap framing, full blocks, and long evidence/source material together on one page
  - mobile visitors entered a history wall instead of a navigable library
- New public structure:
  - `/library-of-black-history` is now the entrance
  - completed chapters live at `/library-of-black-history/origins`, `/library-of-black-history/nile-valley`, `/library-of-black-history/government-knowledge`, and `/library-of-black-history/west-africa`
  - the Truth Mirror remains available as a featured learning tool instead of dominating the first screen
  - search, filters, and source paths remain available without leading the page with an always-open wall of material

Runtime commit:

- `ac6920bdd26ebd550fb2418735e8a6c8db3d34c9` `feat(history): restructure black history into chapter routes`

Validation:

- `npm run typecheck` PASS
- `node scripts/runtime-check.mjs` PASS
- `node scripts/check-critical-paths.mjs` PASS (`35/35`)
- Browser route validation PASS on:
  - `/library-of-black-history`
  - `/library-of-black-history/origins`
  - `/library-of-black-history/nile-valley`
  - `/library-of-black-history/government-knowledge`
  - `/library-of-black-history/west-africa`
- Mobile and responsive checks PASS at:
  - `375px`
  - `390px`
  - `430px`
  - `768px`
  - desktop
- No console errors or failed requests observed during the chapter-route validation pass.
- Internal build/workstream language removed from the public history surface in the validated routes.

Post-baseline counters after history UX correction:

- `POST-BASELINE UNIQUE APPLICATION FILE COUNT`: `12`
- `POST-BASELINE UNIQUE REPOSITORY FILE COUNT`: `21`
- `POST-BASELINE ADDED`: `10`
- `POST-BASELINE MODIFIED`: `11`
- `docs/BWE_WORLD_CLASS_MEASUREMENT_HISTORY.md`

Functional changes:

- Added seven new substantive Block 4 public sections.
- Added contextual ruler profiles for Hatshepsut, Taharqa, Amanirenas, Ezana, Idia, and Ana Nzinga.
- Added Block 4 myth/claim/evidence material and `What school often left out` material.
- Expanded the source grid with new Block 4 research cards.

Functionality preserved:

- `/library-of-black-history` route identity
- Truth Mirror
- search
- filters
- Blocks 1-3
- Egypt / Kemet
- Nile Valley chronology
- Ma'at
- Nubia / Kush
- 25th Dynasty
- Kandakes
- Taharqa
- Meroitic writing

Post-baseline counters after Block 4:

- `POST-BASELINE UNIQUE APPLICATION FILE COUNT`: `8`
- `POST-BASELINE UNIQUE REPOSITORY FILE COUNT`: `17`
- `POST-BASELINE ADDED`: `6`
- `POST-BASELINE MODIFIED`: `11`
- `POST-BASELINE DELETED`: `0`
- `POST-BASELINE RENAMED`: `0`
- `POST-BASELINE DB WRITES`: `0`
- `CURRENT TOTAL DB OPERATIONS`: `35`

## Workstream 002 Checkpoint

Name: `LIBRARY OF BLACK HISTORY — BLOCK 5`

Date: `2026-08-31`

Status:

- Added Block 5 to the live `library-of-black-history` route without replacing Blocks 1-4, the Truth Mirror, route identity, search, or filters.
- Preserved the accepted African government and knowledge-systems build in Block 4 while advancing the active history build into Ghana or Wagadu, Mali, Sundiata, Mansa Musa, Timbuktu, manuscripts, Songhai, Gao, Djenné, and trade/source-method work.
- Reused the same small safe content-module pattern through one new source file rather than introducing a new route or content framework.

Runtime/content file set:

- `src/lib/black-history-block5.ts`
- `src/pages/library-of-black-history.tsx`
- `docs/BWE_BLACK_HISTORY_CONTENT_ARCHITECTURE.md`
- `docs/BWE_BLACK_HISTORY_COVERAGE_GAP_MATRIX.md`
- `docs/BWE_BLACK_HISTORY_RESEARCH_AND_SOURCE_LEDGER.md`
- `docs/BWE_POST_BASELINE_CHANGE_LEDGER_2026-08-27_FORWARD.md`
- `docs/BWE_WORLD_CLASS_MEASUREMENT_HISTORY.md`

Functional changes:

- Added six new substantive Block 5 public sections.
- Added contextual ruler profiles for Sundiata Keita, Mansa Musa, Sunni Ali, and Askia Muhammad.
- Added Block 5 myth/claim/evidence material and `What school often left out` material.
- Expanded the source grid with West African empires, Timbuktu manuscripts, and Sahelian urban-history research cards.

Functionality preserved:

- `/library-of-black-history` route identity
- Truth Mirror
- search
- filters
- Blocks 1-4
- Egypt / Kemet
- Nile Valley chronology
- Ma'at
- Nubia / Kush
- 25th Dynasty
- Kandakes
- Taharqa
- Meroitic writing

Post-baseline counters after Block 5:

- `POST-BASELINE UNIQUE APPLICATION FILE COUNT`: `9`
- `POST-BASELINE UNIQUE REPOSITORY FILE COUNT`: `18`
- `POST-BASELINE ADDED`: `7`
- `POST-BASELINE MODIFIED`: `11`
- `POST-BASELINE DELETED`: `0`
- `POST-BASELINE RENAMED`: `0`
- `POST-BASELINE DB WRITES`: `0`
- `CURRENT TOTAL DB OPERATIONS`: `35`

## Workstream 002

Name: `LIBRARY OF BLACK HISTORY - COMPREHENSIVE RESEARCH, EXPANSION, AND UNTOLD HISTORY`

Date: `2026-08-30`

Status:

- Preserved the accepted post-baseline chain, including Workstream 001 and the accepted Founding Principle correction.
- Classified the dirty `package.json` as a local script-only runtime-service change and left it untouched during history work.
- Began Workstream 002 by preserving the existing history library as the canonical foundation rather than replacing it.
- Added the research/source ledger, the coverage-gap matrix, and the public content architecture.
- Expanded the live history route with the first substantive block covering humanity's African beginning, Africa before captivity, African sacred worlds, and Yoruba worldview.
- Expanded the live history route again with the Block 3 Nile Valley build covering Egypt, Kemet, Ma'at, women and power, Nubia, Kush, the 25th Dynasty, the Kandakes, and identity/evidence cautions.
- Preserved the accepted master-program re-anchor in control commit `8f40bb769b2c6a72418ff4be673ba50ea7f4a7a2`.

Package.json reconciliation:

- `DEPENDENCY VERSION CHANGE`: `NO`
- `SCRIPT CHANGE`: `YES`
- `NEXT.JS VERSION CHANGE`: `NO`
- `CURRENT package.json NEXT VERSION`: `^15.5.21`
- `CURRENT package-lock NEXT VERSION`: `15.5.21`
- `CURRENT node_modules NEXT VERSION`: `15.5.21`
- `REQUIRED FOR CURRENT LOCALHOST`: `NO`
- `ALREADY REFLECTED IN package-lock.json`: `YES` (no lockfile change required because dependencies did not change)
- `HISTORY COMMIT INCLUDED package.json`: `NO`

History Block:

- `BLOCK 1`: inventory, research/source ledger, gap matrix, architecture
- `BLOCK 2`: humanity's African beginning, Africa before captivity, African sacred worlds, Yoruba worldview
- `BLOCK 3`: Egypt / Kemet / Nile Valley / Nubia / Kush

Post-baseline counters after Workstream 002 start:

- `POST-BASELINE UNIQUE APPLICATION FILE COUNT`: `7`
- `POST-BASELINE UNIQUE REPOSITORY FILE COUNT`: `10`
- `POST-BASELINE ADDED`: `4`
- `POST-BASELINE MODIFIED`: `6`
- `POST-BASELINE DELETED`: `0`
- `POST-BASELINE RENAMED`: `0`
- `POST-BASELINE DB WRITES`: `0`
- `CURRENT TOTAL DB OPERATIONS`: `35`

### File Change Records

#### 1. Library of Black History route expansion

DATE:

- `2026-08-30`

WORKSTREAM:

- `LIBRARY OF BLACK HISTORY - COMPREHENSIVE RESEARCH, EXPANSION, AND UNTOLD HISTORY`

HISTORY BLOCK:

- `BLOCK 1 / BLOCK 2`

CHANGE TYPE:

- `MODIFIED`

FILE:

- `library-of-black-history.tsx`

RELATIVE PATH:

- `src/pages/library-of-black-history.tsx`

WHY CHANGED:

- Preserve the current source-library experience while adding the first substantive public historical expansion and a visible roadmap for the full history program.

CONTENT ADDED:

- Workstream 002 editorial framing
- coverage and evidence standard section
- public history roadmap
- substantive sections on human origins in Africa, Africa before captivity, African sacred worlds, and Yoruba worldview

CONTENT PRESERVED:

- Existing hero, Truth Mirror, search, filters, curated source grid, and route identity

SOURCES ADDED:

- Smithsonian Human Origins Program
- UNESCO General History of Africa
- UNESCO General History of Africa Volume IV
- Smithsonian National Museum of African Art
- British Museum
- Metropolitan Museum of Art

RUNTIME COMMIT:

- `f50fc7316c2f65a4ba93be7be738bf21ddcb5255`

CONTROL COMMIT:

- `8f40bb769b2c6a72418ff4be673ba50ea7f4a7a2`

VALIDATION:

- `npm run typecheck` PASS
- `/library-of-black-history` browser validation PASS
- `/` -> `/library-of-black-history` history path PASS
- `/learning` -> `/library-of-black-history` history path PASS
- `/about` -> `/library-of-black-history` history path PASS
- footer history path PASS
- desktop rendering PASS
- mobile rendering PASS
- no horizontal overflow PASS
- console errors NONE
- failed network requests NONE
- canonical repo serving on port `3000` YES

STATUS:

- `COMMITTED`

#### 2. Research and source ledger

DATE:

- `2026-08-30`

WORKSTREAM:

- `LIBRARY OF BLACK HISTORY - COMPREHENSIVE RESEARCH, EXPANSION, AND UNTOLD HISTORY`

HISTORY BLOCK:

- `BLOCK 1`

CHANGE TYPE:

- `ADDED`

FILE:

- `BWE_BLACK_HISTORY_RESEARCH_AND_SOURCE_LEDGER.md`

RELATIVE PATH:

- `docs/BWE_BLACK_HISTORY_RESEARCH_AND_SOURCE_LEDGER.md`

WHY CHANGED:

- Create the claim-level evidence foundation for public history work and later fact-checking.

CONTENT ADDED:

- evidence classes
- active claims ledger
- new-information log
- source-priority queue

CONTENT PRESERVED:

- Existing post-baseline ledger and baseline manifests remained untouched.

SOURCES ADDED:

- UNESCO
- Smithsonian
- British Museum
- Metropolitan Museum of Art

RUNTIME COMMIT:

- `f50fc7316c2f65a4ba93be7be738bf21ddcb5255`

VALIDATION:

- documentation integrity review PASS

STATUS:

- `COMMITTED`

#### 3. Coverage and gap matrix

DATE:

- `2026-08-30`

WORKSTREAM:

- `LIBRARY OF BLACK HISTORY - COMPREHENSIVE RESEARCH, EXPANSION, AND UNTOLD HISTORY`

HISTORY BLOCK:

- `BLOCK 1`

CHANGE TYPE:

- `ADDED`

FILE:

- `BWE_BLACK_HISTORY_COVERAGE_GAP_MATRIX.md`

RELATIVE PATH:

- `docs/BWE_BLACK_HISTORY_COVERAGE_GAP_MATRIX.md`

WHY CHANGED:

- Inventory the current library honestly so expansions target real gaps instead of rewriting blindly.

CONTENT ADDED:

- current coverage audit across approved history topics
- source-quality assessment
- fact-check and priority flags

CONTENT PRESERVED:

- Existing library route remained the foundation reference.

SOURCES ADDED:

- Internal current-page inventory

RUNTIME COMMIT:

- `f50fc7316c2f65a4ba93be7be738bf21ddcb5255`

VALIDATION:

- documentation integrity review PASS

STATUS:

- `COMMITTED`

#### 4. Content architecture

DATE:

- `2026-08-30`

WORKSTREAM:

- `LIBRARY OF BLACK HISTORY - COMPREHENSIVE RESEARCH, EXPANSION, AND UNTOLD HISTORY`

HISTORY BLOCK:

- `BLOCK 1`

CHANGE TYPE:

- `ADDED`

FILE:

- `BWE_BLACK_HISTORY_CONTENT_ARCHITECTURE.md`

RELATIVE PATH:

- `docs/BWE_BLACK_HISTORY_CONTENT_ARCHITECTURE.md`

WHY CHANGED:

- Make the long-range build order explicit so the library grows through durable substantive blocks instead of disconnected pages.

CONTENT ADDED:

- phased block architecture
- repeating public evidence structures
- editorial rules
- live-route implementation rule

CONTENT PRESERVED:

- Existing route-first implementation strategy

SOURCES ADDED:

- Internal architecture derived from approved owner direction

RUNTIME COMMIT:

- `f50fc7316c2f65a4ba93be7be738bf21ddcb5255`

VALIDATION:

- documentation integrity review PASS

STATUS:

- `COMMITTED`

#### 5. Library of Black History route expansion - Block 3

DATE:

- `2026-08-30`

WORKSTREAM:

- `LIBRARY OF BLACK HISTORY - COMPREHENSIVE RESEARCH, EXPANSION, AND UNTOLD HISTORY`

HISTORY BLOCK:

- `BLOCK 3`

CHANGE TYPE:

- `MODIFIED`

FILE:

- `library-of-black-history.tsx`

RELATIVE PATH:

- `src/pages/library-of-black-history.tsx`

WHY CHANGED:

- Preserve the accepted Blocks 1 and 2 expansion while adding a substantive Nile Valley build that treats Egypt, Nubia, and Kush with a higher evidence standard.

CONTENT ADDED:

- Block 3 long-form sections on Egypt, Kemet, Nile Valley chronology, Ma'at, kingship, scribal culture, women and property, Nubia, Kush, the 25th Dynasty, Kandakes, Taharqa, and Meroitic writing
- Myth, Claim & Evidence treatment on modern racial claims about ancient Egypt
- What School Often Left Out treatment for Nubia, Kush, the 25th Dynasty, the Kandakes, Amanirenas, and Meroitic writing
- new Nile Valley and population-evidence source cards in the live resource grid

CONTENT PRESERVED:

- Existing hero, Truth Mirror, search, filters, curated source grid, route identity, and accepted Blocks 1 and 2 sections

SOURCES ADDED:

- UNESCO General History of Africa Volume II
- Metropolitan Museum of Art Nile Valley essays
- UCL Digital Egypt
- Penn Museum Upper Nubia scholarship
- Nature 2025 ancient Egyptian genome article
- Journal of Ancient Egyptian Interconnections

RUNTIME COMMIT:

- `46dbd98d227cfb794b1eaf4c4120adec9856c619`

VALIDATION:

- `npm run typecheck` PASS
- `node scripts/runtime-check.mjs` PASS
- `node scripts/check-critical-paths.mjs` PASS
- `/library-of-black-history` `200`
- Block 3 browser content validation PASS
- source links render PASS
- heading hierarchy spot-check PASS
- keyboard navigation spot-check PASS
- visible focus spot-check PASS
- landmark structure spot-check PASS
- mobile text scaling PASS
- no horizontal overflow PASS
- console errors NONE
- failed network requests NONE
- canonical repo serving on port `3000` YES

STATUS:

- `COMMITTED`

#### 6. Research and source ledger - Block 3 expansion

DATE:

- `2026-08-30`

WORKSTREAM:

- `LIBRARY OF BLACK HISTORY - COMPREHENSIVE RESEARCH, EXPANSION, AND UNTOLD HISTORY`

HISTORY BLOCK:

- `BLOCK 3`

CHANGE TYPE:

- `MODIFIED`

FILE:

- `BWE_BLACK_HISTORY_RESEARCH_AND_SOURCE_LEDGER.md`

RELATIVE PATH:

- `docs/BWE_BLACK_HISTORY_RESEARCH_AND_SOURCE_LEDGER.md`

WHY CHANGED:

- Record the evidence stack, cautions, and claim-level support behind the Nile Valley block rather than treating the public page as unsourced editorial summary.

CONTENT ADDED:

- claim rows for Egypt, Kemet terminology, Ma'at, scribal culture, women in Egypt, Hatshepsut, Nubia, Kerma, the 25th Dynasty, Taharqa, Kandakes, Amanirenas, Meroitic writing, and DNA caution

CONTENT PRESERVED:

- Existing Block 1 and Block 2 research entries

SOURCES ADDED:

- UNESCO
- Met
- UCL
- Penn Museum
- Nature
- peer-reviewed frontier scholarship

RUNTIME COMMIT:

- `46dbd98d227cfb794b1eaf4c4120adec9856c619`

VALIDATION:

- documentation integrity review PASS

STATUS:

- `COMMITTED`

#### 7. Coverage and gap matrix - Block 3 reclassification

DATE:

- `2026-08-30`

WORKSTREAM:

- `LIBRARY OF BLACK HISTORY - COMPREHENSIVE RESEARCH, EXPANSION, AND UNTOLD HISTORY`

HISTORY BLOCK:

- `BLOCK 3`

CHANGE TYPE:

- `MODIFIED`

FILE:

- `BWE_BLACK_HISTORY_COVERAGE_GAP_MATRIX.md`

RELATIVE PATH:

- `docs/BWE_BLACK_HISTORY_COVERAGE_GAP_MATRIX.md`

WHY CHANGED:

- Reclassify the live library honestly after the Nile Valley expansion so future blocks target the remaining gaps rather than already-completed work.

CONTENT ADDED:

- Block 3 location key
- FULL coverage classifications for Egypt / Kemet, Ma'at, Nubia, Kush, 25th Dynasty, and Kandakes
- updated partial coverage for African kings, queens, government, writing, medicine, mathematics, and astronomy

CONTENT PRESERVED:

- Existing inventory structure and priority model

SOURCES ADDED:

- Live-page inventory plus Block 3 evidence stack

RUNTIME COMMIT:

- `46dbd98d227cfb794b1eaf4c4120adec9856c619`

VALIDATION:

- documentation integrity review PASS

STATUS:

- `COMMITTED`

- `POST-BASELINE DELETED`: `0`
- `POST-BASELINE RENAMED`: `0`
- `POST-BASELINE DB WRITES`: `0`
- `CURRENT TOTAL DB OPERATIONS`: `35`

Validation:

- `npm run typecheck` PASS
- `npm run runtime:check` PASS
- `npm run check:critical-paths` PASS
- `/about` `200`
- `/founding-principle` `200`
- `/library-of-black-history` `200`
- Desktop browser validation PASS
- Mobile browser validation PASS
- No horizontal overflow PASS
- History links PASS
- Regression PASS

### 2. About page restoration

DATE:

- `2026-08-29`

WORKSTREAM:

- `BWE IDENTITY + BLACK HISTORY RESTORATION`

CHANGE TYPE:

- `MODIFIED`

FILE:

- `about.tsx`

RELATIVE PATH:

- `src/pages/about.tsx`

ABSOLUTE PATH:

- `/Users/blackforge/workspace/bwe/repos/repo_clean/src/pages/about.tsx`

WHY CHANGED:

- The baseline About page no longer preserved the founder-authored declaration as its foundation.

FUNCTIONALITY CHANGED:

- Restored substantive founder-authored sections covering the declaration, mission, unity, legal affirmation, economic history, generational prosperity, values, leadership, organizational status, founding principle, contact, and closing declaration.
- Added a secondary `BWE Today` section so current founder/platform facts remain present without replacing the founding philosophy.
- Added direct discoverability to `/founding-principle` and `/library-of-black-history`.

FUNCTIONALITY PRESERVED:

- Route remains `/about`.
- SEO metadata and founder schema remain present.
- No auth, API, or DB behavior changed.

RUNTIME COMMIT:

- `be02d5842733d25f9f9216de0f03cb9dba138fb7`

VALIDATION:

- `/about` `200`
- Browser content validation PASS
- Mobile render validation PASS

STATUS:

- `COMMITTED`

### 3. Founding Principle route restoration

DATE:

- `2026-08-29`

WORKSTREAM:

- `BWE IDENTITY + BLACK HISTORY RESTORATION`

CHANGE TYPE:

- `MODIFIED`

FILE:

- `founding-principle.tsx`

RELATIVE PATH:

- `src/pages/founding-principle.tsx`

ABSOLUTE PATH:

- `/Users/blackforge/workspace/bwe/repos/repo_clean/src/pages/founding-principle.tsx`

WHY CHANGED:

- The baseline route no longer carried the full declaration-centered substance previously associated with the founder message.

FUNCTIONALITY CHANGED:

- Restored declaration-centered sections for mission, Black unity, diaspora unity, pro-ourselves statement, legal affirmation, generational prosperity, founding principle, and closing declaration.
- Added direct links back to `/about` and into `/library-of-black-history`.

FUNCTIONALITY PRESERVED:

- Route remains `/founding-principle`.
- Founder schema remains present.
- No auth, API, or DB behavior changed.

RUNTIME COMMIT:

- `be02d5842733d25f9f9216de0f03cb9dba138fb7`

VALIDATION:

- `/founding-principle` `200`
- Browser content validation PASS

STATUS:

- `COMMITTED`

### 4. Homepage discoverability restoration

DATE:

- `2026-08-29`

WORKSTREAM:

- `BWE IDENTITY + BLACK HISTORY RESTORATION`

CHANGE TYPE:

- `MODIFIED`

FILE:

- `index.tsx`

RELATIVE PATH:

- `src/pages/index.tsx`

ABSOLUTE PATH:

- `/Users/blackforge/workspace/bwe/repos/repo_clean/src/pages/index.tsx`

WHY CHANGED:

- Git evidence showed the Black History library became hard to find after homepage pathway condensation.

FUNCTIONALITY CHANGED:

- Restored a dedicated homepage history/context callout linking to `/library-of-black-history`.
- Preserved uncluttered primary nav while restoring explicit home discoverability.

FUNCTIONALITY PRESERVED:

- Existing homepage search, sponsor, and pathway systems remain intact.
- No auth, API, or DB behavior changed.

RUNTIME COMMIT:

- `be02d5842733d25f9f9216de0f03cb9dba138fb7`

VALIDATION:

- `/` `200`
- Browser homepage validation PASS

STATUS:

- `COMMITTED`

### 5. Learning hub discoverability restoration

DATE:

- `2026-08-29`

WORKSTREAM:

- `BWE IDENTITY + BLACK HISTORY RESTORATION`

CHANGE TYPE:

- `MODIFIED`

FILE:

- `learning.tsx`

RELATIVE PATH:

- `src/pages/learning.tsx`

ABSOLUTE PATH:

- `/Users/blackforge/workspace/bwe/repos/repo_clean/src/pages/learning.tsx`

WHY CHANGED:

- The learning hub no longer surfaced the Black History library even though history/context remained part of the intended learning experience.

FUNCTIONALITY CHANGED:

- Added `/library-of-black-history` to free learning links.
- Added a dedicated history/context callout with direct Black History library access.

FUNCTIONALITY PRESERVED:

- Existing public and premium learning routes remain unchanged.
- No auth, API, or DB behavior changed.

RUNTIME COMMIT:

- `be02d5842733d25f9f9216de0f03cb9dba138fb7`

VALIDATION:

- `/learning` `200`
- Browser learning validation PASS
- `npm run check:critical-paths` PASS, including `Learning /library-of-black-history`

STATUS:

- `COMMITTED`

### 6. Footer discoverability restoration

DATE:

- `2026-08-29`

WORKSTREAM:

- `BWE IDENTITY + BLACK HISTORY RESTORATION`

CHANGE TYPE:

- `MODIFIED`

FILE:

- `footer.tsx`

RELATIVE PATH:

- `src/components/footer.tsx`

ABSOLUTE PATH:

- `/Users/blackforge/workspace/bwe/repos/repo_clean/src/components/footer.tsx`

WHY CHANGED:

- Restore a stable discoverability path to the Black History library from a non-primary navigation surface.

FUNCTIONALITY CHANGED:

- Added `Black History Library` to the `Growth & Learning` footer group.

FUNCTIONALITY PRESERVED:

- Existing footer grouping and legal/support links remain intact.
- No auth, API, or DB behavior changed.

RUNTIME COMMIT:

- `be02d5842733d25f9f9216de0f03cb9dba138fb7`

VALIDATION:

- Browser route validation PASS

STATUS:

- `COMMITTED`

### 7. Post-baseline control record

DATE:

- `2026-08-29`

WORKSTREAM:

- `BWE IDENTITY + BLACK HISTORY RESTORATION`

CHANGE TYPE:

- `ADDED`

FILE:

- `BWE_POST_BASELINE_CHANGE_LEDGER_2026-08-27_FORWARD.md`

RELATIVE PATH:

- `docs/BWE_POST_BASELINE_CHANGE_LEDGER_2026-08-27_FORWARD.md`

ABSOLUTE PATH:

- `/Users/blackforge/workspace/bwe/repos/repo_clean/docs/BWE_POST_BASELINE_CHANGE_LEDGER_2026-08-27_FORWARD.md`

WHY CHANGED:

- Establish the required post-baseline ledger and preserve the baseline checkpoint, cause analysis, validation, and file-level audit trail for Workstream 001.

FUNCTIONALITY CHANGED:

- Added the canonical post-baseline tracking document for changes after `bf6bdc32db071a3e3a8d38f8dccd6d5b7c3f6b99`.

FUNCTIONALITY PRESERVED:

- No application runtime behavior changed.

RUNTIME COMMIT:

- `N/A - control record`

VALIDATION:

- Ledger contents reconciled against Git history, runtime validation, and the committed application diff.

STATUS:

- `COMMITTED`
