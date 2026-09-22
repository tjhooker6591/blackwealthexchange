# BWE Complete File Change Manifest — Last 16 Days

- Window start: `2026-08-12 00:00:00 -0700`
- Window end: `2026-08-27 23:59:59 -0700`
- Generated from: Git history on branch `friday-release-candidate`
- Current HEAD at generation: `94b0f45957a48e1100445e98ba1c2509e9eda223`
- Manifest rule: exact Git-derived file activity within the 16-day calendar window above

## APPLICATION / PRODUCTION FILES

- Count: `81`

| File                                  | Type | Path                                                      | First commit                                 | Last commit |   Commits | Status            | Category           |
| ------------------------------------- | ---- | --------------------------------------------------------- | -------------------------------------------- | ----------- | --------: | ----------------- | ------------------ | --------- |
| next.config.ts                        | M    | `next.config.ts`                                          | `5cec09e`                                    | `5cec09e`   |         1 | tracked-present   | config             |
| package-lock.json                     | M    | `package-lock.json`                                       | `a05a941`                                    | `b614b91`   |         9 | tracked-present   | config             |
| package.json                          | M    | `package.json`                                            | `a05a941`                                    | `b614b91`   |         7 | tracked-present   | config             |
| footer.tsx                            | M    | `src/components/footer.tsx`                               | `c996a1b`                                    | `a5dfc66`   |         2 | tracked-present   | component          |
| NavBar.tsx                            | M    | `src/components/NavBar.tsx`                               | `a5dfc66`                                    | `a5dfc66`   |         1 | tracked-present   | component          |
| button.tsx                            | M    | `src/components/ui/button.tsx`                            | `a5dfc66`                                    | `a5dfc66`   |         1 | tracked-present   | component          |
| card.tsx                              | M    | `src/components/ui/card.tsx`                              | `a5dfc66`                                    | `a5dfc66`   |         1 | tracked-present   | component          |
| instrumentation.ts                    | A    | `src/instrumentation.ts`                                  | `5cec09e`                                    | `5cec09e`   |         1 | tracked-present   | application-source |
| image-upload-security-tests.mjs       | A    | `src/lib/__tests__/image-upload-security-tests.mjs`       | `ea47465`                                    | `ea47465`   |         1 | tracked-present   | library            |
| legacy-write-route-security-tests.mjs | A    | `src/lib/__tests__/legacy-write-route-security-tests.mjs` | `6cc5b8a`                                    | `6cc5b8a`   |         1 | tracked-present   | library            |
| sharp-runtime-defense-tests.mjs       | A    | `src/lib/__tests__/sharp-runtime-defense-tests.mjs`       | `5cec09e`                                    | `5cec09e`   |         1 | tracked-present   | library            |
| businessSubmission.ts                 | M    | `src/lib/businessSubmission.ts`                           | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | library            |
| createProductCheckoutSession.ts       | M    | `src/lib/checkout/createProductCheckoutSession.ts`        | `665a119`                                    | `665a119`   |         1 | tracked-present   | library            |
| marketplaceBmev.ts                    | A    | `src/lib/economics/marketplaceBmev.ts`                    | `665a119`                                    | `665a119`   |         1 | tracked-present   | library            |
| firebase.ts                           | D    | `src/lib/firebase.ts`                                     | `b614b91`                                    | `b614b91`   |         1 | deleted-in-window | library            |
| founding-membership.ts                | M    | `src/lib/founding-membership.ts`                          | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | library            |
| package1-tests.ts                     | M    | `src/lib/marketplace/__tests__/package1-tests.ts`         | `665a119`                                    | `665a119`   |         1 | tracked-present   | library            |
| businessAttribution.ts                | A    | `src/lib/marketplace/businessAttribution.ts`              | `665a119`                                    | `665a119`   |         1 | tracked-present   | library            |
| paymentLinkage.ts                     | M    | `src/lib/marketplace/paymentLinkage.ts`                   | `665a119`                                    | `665a119`   |         1 | tracked-present   | library            |
| imageUploadValidation.ts              | A    | `src/lib/security/imageUploadValidation.ts`               | `ea47465`                                    | `ea47465`   |         1 | tracked-present   | library            |
| lifecycle-tests.mjs                   | A    | `src/lib/studentHub/__tests__/lifecycle-tests.mjs`        | `a49dbc0`                                    | `a49dbc0`   |         1 | tracked-present   | library            |
| repository-tests.mjs                  | A    | `src/lib/studentHub/__tests__/repository-tests.mjs`       | `a49dbc0`                                    | `a49dbc0`   |         1 | tracked-present   | library            |
| catalog.ts                            | A    | M                                                         | `src/lib/studentHub/catalog.ts`              | `7845d42`   | `8b3bf7e` | 2                 | tracked-present    | library   |
| legacy.ts                             | A    | `src/lib/studentHub/legacy.ts`                            | `8b3bf7e`                                    | `8b3bf7e`   |         1 | tracked-present   | library            |
| lifecycle.ts                          | A    | `src/lib/studentHub/lifecycle.ts`                         | `8b3bf7e`                                    | `8b3bf7e`   |         1 | tracked-present   | library            |
| public.ts                             | A    | `src/lib/studentHub/public.ts`                            | `a49dbc0`                                    | `a49dbc0`   |         1 | tracked-present   | library            |
| repository.ts                         | A    | `src/lib/studentHub/repository.ts`                        | `a49dbc0`                                    | `a49dbc0`   |         1 | tracked-present   | library            |
| \_app.tsx                             | M    | `src/pages/_app.tsx`                                      | `a5dfc66`                                    | `a5dfc66`   |         1 | tracked-present   | page               |
| business-approvals.tsx                | M    | `src/pages/admin/business-approvals.tsx`                  | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | page               |
| claim-verification.tsx                | M    | `src/pages/admin/claim-verification.tsx`                  | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | page               |
| dashboard.tsx                         | M    | `src/pages/admin/dashboard.tsx`                           | `b91b90c`                                    | `b91b90c`   |         1 | tracked-present   | page               |
| student-hub.tsx                       | A    | M                                                         | `src/pages/admin/student-hub.tsx`            | `38d1681`   | `a49dbc0` | 2                 | tracked-present    | page      |
| dashboard-stats.ts                    | M    | `src/pages/api/admin/dashboard-stats.ts`                  | `55b539c`                                    | `55b539c`   |         1 | tracked-present   | api-route          |
| student-hub.ts                        | A    | M                                                         | `src/pages/api/admin/student-hub.ts`         | `38d1681`   | `a49dbc0` | 2                 | tracked-present    | api-route |
| me.ts                                 | M    | `src/pages/api/auth/me.ts`                                | `c7ecbc3`                                    | `c7ecbc3`   |         1 | tracked-present   | api-route          |
| create.ts                             | M    | `src/pages/api/business/create.ts`                        | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | api-route          |
| media.ts                              | M    | `src/pages/api/business/media.ts`                         | `ea47465`                                    | `ea47465`   |         1 | tracked-present   | api-route          |
| generate.ts                           | M    | `src/pages/api/certificates/generate.ts`                  | `c7ea4ff`                                    | `c7ea4ff`   |         1 | tracked-present   | api-route          |
| enroll.ts                             | M    | `src/pages/api/courses/enroll.ts`                         | `c7ea4ff`                                    | `c7ea4ff`   |         1 | tracked-present   | api-route          |
| internships.ts                        | A    | M                                                         | `src/pages/api/feeds/internships.ts`         | `7845d42`   | `a49dbc0` | 2                 | tracked-present    | api-route |
| scholarships.ts                       | A    | M                                                         | `src/pages/api/feeds/scholarships.ts`        | `7845d42`   | `a49dbc0` | 2                 | tracked-present    | api-route |
| evidence.ts                           | M    | `src/pages/api/founding-membership/evidence.ts`           | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | api-route          |
| add-product.ts                        | M    | `src/pages/api/marketplace/add-product.ts`                | `ea47465`                                    | `ea47465`   |         1 | tracked-present   | api-route          |
| create.ts                             | M    | `src/pages/api/marketplace/create.ts`                     | `421de3e`                                    | `421de3e`   |         1 | tracked-present   | api-route          |
| order-confirmation.ts                 | A    | `src/pages/api/marketplace/order-confirmation.ts`         | `665a119`                                    | `665a119`   |         1 | tracked-present   | api-route          |
| send.ts                               | M    | `src/pages/api/messages/send.ts`                          | `421de3e`                                    | `421de3e`   |         1 | tracked-present   | api-route          |
| latest.ts                             | A    | M                                                         | `src/pages/api/opportunities/latest.ts`      | `7845d42`   | `a49dbc0` | 2                 | tracked-present    | api-route |
| avatar.ts                             | M    | `src/pages/api/profile/avatar.ts`                         | `ea47465`                                    | `ea47465`   |         1 | tracked-present   | api-route          |
| add.ts                                | M    | `src/pages/api/savedjobs/add.ts`                          | `2512a12`                                    | `2512a12`   |         1 | tracked-present   | api-route          |
| webhook-handler.ts                    | M    | `src/pages/api/stripe/webhook-handler.ts`                 | `c996a1b`                                    | `665a119`   |         3 | tracked-present   | api-route          |
| opportunities.ts                      | A    | M                                                         | `src/pages/api/student-hub/opportunities.ts` | `7845d42`   | `a49dbc0` | 3                 | tracked-present    | api-route |
| create.ts                             | M    | `src/pages/api/support/create.ts`                         | `2512a12`                                    | `2512a12`   |         1 | tracked-present   | api-route          |
| black-business-websites.tsx           | M    | `src/pages/black-business-websites.tsx`                   | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | page               |
| index.tsx                             | M    | `src/pages/black-card/index.tsx`                          | `fad902f`                                    | `fad902f`   |         1 | tracked-present   | page               |
| grants.tsx                            | M    | `src/pages/black-student-opportunities/grants.tsx`        | `8b3bf7e`                                    | `a49dbc0`   |         2 | tracked-present   | page               |
| index.tsx                             | M    | `src/pages/black-student-opportunities/index.tsx`         | `7845d42`                                    | `faff2cd`   |         4 | tracked-present   | page               |
| internships.tsx                       | M    | `src/pages/black-student-opportunities/internships.tsx`   | `8b3bf7e`                                    | `a49dbc0`   |         2 | tracked-present   | page               |
| mentorship.tsx                        | M    | `src/pages/black-student-opportunities/mentorship.tsx`    | `8b3bf7e`                                    | `a49dbc0`   |         2 | tracked-present   | page               |
| scholarships.tsx                      | M    | `src/pages/black-student-opportunities/scholarships.tsx`  | `8b3bf7e`                                    | `a49dbc0`   |         2 | tracked-present   | page               |
| business-directory.tsx                | M    | `src/pages/business-directory.tsx`                        | `aec329c`                                    | `aec329c`   |         1 | tracked-present   | page               |
| course-dashboard.tsx                  | M    | `src/pages/course-dashboard.tsx`                          | `b9efc79`                                    | `b9efc79`   |         1 | tracked-present   | page               |
| course-enrollment.tsx                 | M    | `src/pages/course-enrollment.tsx`                         | `b9efc79`                                    | `b9efc79`   |         1 | tracked-present   | page               |
| financial-literacy.tsx                | M    | `src/pages/financial-literacy.tsx`                        | `b9efc79`                                    | `b9efc79`   |         1 | tracked-present   | page               |
| evidence.tsx                          | M    | `src/pages/founding-membership/evidence.tsx`              | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | page               |
| index.tsx                             | M    | `src/pages/index.tsx`                                     | `ceeb595`                                    | `94b0f45`   |         5 | tracked-present   | page               |
| job-listings.tsx                      | M    | `src/pages/job-listings.tsx`                              | `aec329c`                                    | `aec329c`   |         1 | tracked-present   | page               |
| jobs.tsx                              | M    | `src/pages/jobs.tsx`                                      | `aec329c`                                    | `aec329c`   |         1 | tracked-present   | page               |
| learning.tsx                          | M    | `src/pages/learning.tsx`                                  | `b9efc79`                                    | `b9efc79`   |         1 | tracked-present   | page               |
| index.tsx                             | M    | `src/pages/marketplace/index.tsx`                         | `ceeb595`                                    | `ac8831a`   |         2 | tracked-present   | page               |
| [id].tsx                              | M    | `src/pages/marketplace/product/[id].tsx`                  | `ceeb595`                                    | `ac8831a`   |         2 | tracked-present   | page               |
| music.tsx                             | M    | `src/pages/music.tsx`                                     | `706273a`                                    | `706273a`   |         1 | tracked-present   | page               |
| join.tsx                              | M    | `src/pages/music/join.tsx`                                | `706273a`                                    | `706273a`   |         1 | tracked-present   | page               |
| pricing.tsx                           | M    | `src/pages/music/pricing.tsx`                             | `706273a`                                    | `706273a`   |         1 | tracked-present   | page               |
| payment-success.tsx                   | M    | `src/pages/payment-success.tsx`                           | `665a119`                                    | `665a119`   |         1 | tracked-present   | page               |
| pricing.tsx                           | M    | `src/pages/pricing.tsx`                                   | `fad902f`                                    | `fad902f`   |         1 | tracked-present   | page               |
| articles.tsx                          | M    | `src/pages/resources/articles.tsx`                        | `94b0f45`                                    | `94b0f45`   |         1 | tracked-present   | page               |
| index.tsx                             | M    | `src/pages/resources/index.tsx`                           | `94b0f45`                                    | `94b0f45`   |         1 | tracked-present   | page               |
| start-here.tsx                        | M    | `src/pages/start-here.tsx`                                | `ceeb595`                                    | `ac8831a`   |         2 | tracked-present   | page               |
| marketplace.tsx                       | M    | `src/pages/support/marketplace.tsx`                       | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | page               |
| releases.tsx                          | M    | `src/pages/support/releases.tsx`                          | `c996a1b`                                    | `c996a1b`   |         1 | tracked-present   | page               |
| globals.css                           | M    | `src/styles/globals.css`                                  | `a5dfc66`                                    | `aec329c`   |         4 | tracked-present   | style              |

## FULL REPOSITORY FILES

- Count: `98`

| File                                                       | Type | Path                                                             | First commit                                                      | Last commit |   Commits | Status            | Category           |
| ---------------------------------------------------------- | ---- | ---------------------------------------------------------------- | ----------------------------------------------------------------- | ----------- | --------: | ----------------- | ------------------ | ------------- |
| pre-commit                                                 | M    | `.husky/pre-commit`                                              | `34a4141`                                                         | `34a4141`   |         1 | tracked-present   | other              |
| .lintstagedrc.json                                         | M    | `.lintstagedrc.json`                                             | `34a4141`                                                         | `34a4141`   |         1 | tracked-present   | other              |
| 81426-1453_DB_TRACKING.md                                  | A    | M                                                                | `docs/81426-1453_DB_TRACKING.md`                                  | `fee9f4b`   | `08ba0cc` | 2                 | tracked-present    | documentation |
| BLACK_NEXT_SESSION_START_HERE.md                           | M    | `docs/BLACK_NEXT_SESSION_START_HERE.md`                          | `5fa47a0`                                                         | `5fa47a0`   |         1 | tracked-present   | documentation      |
| BLACK_OPEN_DEFECTS_AND_CLOSURE_QUEUE.md                    | M    | `docs/BLACK_OPEN_DEFECTS_AND_CLOSURE_QUEUE.md`                   | `88273e1`                                                         | `d567218`   |         4 | tracked-present   | documentation      |
| BWE_13_SECOND_MACHINE_PARITY_PROCEDURE.md                  | A    | `docs/BWE_13_SECOND_MACHINE_PARITY_PROCEDURE.md`                 | `fc01848`                                                         | `fc01848`   |         1 | tracked-present   | documentation      |
| BWE_MASTER_TASK_LIST.md                                    | M    | `docs/BWE_MASTER_TASK_LIST.md`                                   | `88273e1`                                                         | `d567218`   |         4 | tracked-present   | documentation      |
| BWE_RUNNING_APPLICATION_FILE_CHANGES_2026-08-06_FORWARD.md | A    | M                                                                | `docs/BWE_RUNNING_APPLICATION_FILE_CHANGES_2026-08-06_FORWARD.md` | `1638a25`   | `03afd4b` | 11                | tracked-present    | documentation |
| BWE_WORLD_CLASS_DECISION_LOG.md                            | A    | M                                                                | `docs/BWE_WORLD_CLASS_DECISION_LOG.md`                            | `ea8f750`   | `1754ca6` | 3                 | tracked-present    | documentation |
| BWE_WORLD_CLASS_GAP_REGISTER.md                            | A    | M                                                                | `docs/BWE_WORLD_CLASS_GAP_REGISTER.md`                            | `ea8f750`   | `fc01848` | 4                 | tracked-present    | documentation |
| BWE_WORLD_CLASS_MEASUREMENT_HISTORY.md                     | A    | M                                                                | `docs/BWE_WORLD_CLASS_MEASUREMENT_HISTORY.md`                     | `ea8f750`   | `03afd4b` | 12                | tracked-present    | documentation |
| BWE_WORLD_CLASS_PLATFORM_MASTER_PLAN.md                    | A    | M                                                                | `docs/BWE_WORLD_CLASS_PLATFORM_MASTER_PLAN.md`                    | `ea8f750`   | `1754ca6` | 3                 | tracked-present    | documentation |
| BWE_WORLD_CLASS_PLATFORM_SCORECARD.md                      | A    | M                                                                | `docs/BWE_WORLD_CLASS_PLATFORM_SCORECARD.md`                      | `ea8f750`   | `03afd4b` | 8                 | tracked-present    | documentation |
| BWE_WORLD_CLASS_PROGRAM_BOARD.md                           | A    | M                                                                | `docs/BWE_WORLD_CLASS_PROGRAM_BOARD.md`                           | `ea8f750`   | `a5dfc66` | 7                 | tracked-present    | documentation |
| CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md                    | M    | `docs/CURRENT_BUILD_ALL_WORKSTREAMS_STATUS.md`                   | `88273e1`                                                         | `03afd4b`   |        21 | tracked-present   | documentation      |
| PAMFA_SELLER_BUSINESS_OWNER_DECISION_PACKET_2026-08-26.md  | A    | `docs/PAMFA_SELLER_BUSINESS_OWNER_DECISION_PACKET_2026-08-26.md` | `ac2405a`                                                         | `ac2405a`   |         1 | tracked-present   | documentation      |
| BWE_COMPLETE_FILE_MANIFEST_CURRENT.csv                     | M    | `docs/recovery/BWE_COMPLETE_FILE_MANIFEST_CURRENT.csv`           | `d567218`                                                         | `d567218`   |         1 | tracked-present   | documentation      |
| next.config.ts                                             | M    | `next.config.ts`                                                 | `5cec09e`                                                         | `5cec09e`   |         1 | tracked-present   | config             |
| package-lock.json                                          | M    | `package-lock.json`                                              | `a05a941`                                                         | `b614b91`   |         9 | tracked-present   | config             |
| package.json                                               | M    | `package.json`                                                   | `a05a941`                                                         | `b614b91`   |         7 | tracked-present   | config             |
| footer.tsx                                                 | M    | `src/components/footer.tsx`                                      | `c996a1b`                                                         | `a5dfc66`   |         2 | tracked-present   | component          |
| NavBar.tsx                                                 | M    | `src/components/NavBar.tsx`                                      | `a5dfc66`                                                         | `a5dfc66`   |         1 | tracked-present   | component          |
| button.tsx                                                 | M    | `src/components/ui/button.tsx`                                   | `a5dfc66`                                                         | `a5dfc66`   |         1 | tracked-present   | component          |
| card.tsx                                                   | M    | `src/components/ui/card.tsx`                                     | `a5dfc66`                                                         | `a5dfc66`   |         1 | tracked-present   | component          |
| instrumentation.ts                                         | A    | `src/instrumentation.ts`                                         | `5cec09e`                                                         | `5cec09e`   |         1 | tracked-present   | application-source |
| image-upload-security-tests.mjs                            | A    | `src/lib/__tests__/image-upload-security-tests.mjs`              | `ea47465`                                                         | `ea47465`   |         1 | tracked-present   | library            |
| legacy-write-route-security-tests.mjs                      | A    | `src/lib/__tests__/legacy-write-route-security-tests.mjs`        | `6cc5b8a`                                                         | `6cc5b8a`   |         1 | tracked-present   | library            |
| sharp-runtime-defense-tests.mjs                            | A    | `src/lib/__tests__/sharp-runtime-defense-tests.mjs`              | `5cec09e`                                                         | `5cec09e`   |         1 | tracked-present   | library            |
| businessSubmission.ts                                      | M    | `src/lib/businessSubmission.ts`                                  | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | library            |
| createProductCheckoutSession.ts                            | M    | `src/lib/checkout/createProductCheckoutSession.ts`               | `665a119`                                                         | `665a119`   |         1 | tracked-present   | library            |
| marketplaceBmev.ts                                         | A    | `src/lib/economics/marketplaceBmev.ts`                           | `665a119`                                                         | `665a119`   |         1 | tracked-present   | library            |
| firebase.ts                                                | D    | `src/lib/firebase.ts`                                            | `b614b91`                                                         | `b614b91`   |         1 | deleted-in-window | library            |
| founding-membership.ts                                     | M    | `src/lib/founding-membership.ts`                                 | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | library            |
| package1-tests.ts                                          | M    | `src/lib/marketplace/__tests__/package1-tests.ts`                | `665a119`                                                         | `665a119`   |         1 | tracked-present   | library            |
| businessAttribution.ts                                     | A    | `src/lib/marketplace/businessAttribution.ts`                     | `665a119`                                                         | `665a119`   |         1 | tracked-present   | library            |
| paymentLinkage.ts                                          | M    | `src/lib/marketplace/paymentLinkage.ts`                          | `665a119`                                                         | `665a119`   |         1 | tracked-present   | library            |
| imageUploadValidation.ts                                   | A    | `src/lib/security/imageUploadValidation.ts`                      | `ea47465`                                                         | `ea47465`   |         1 | tracked-present   | library            |
| lifecycle-tests.mjs                                        | A    | `src/lib/studentHub/__tests__/lifecycle-tests.mjs`               | `a49dbc0`                                                         | `a49dbc0`   |         1 | tracked-present   | library            |
| repository-tests.mjs                                       | A    | `src/lib/studentHub/__tests__/repository-tests.mjs`              | `a49dbc0`                                                         | `a49dbc0`   |         1 | tracked-present   | library            |
| catalog.ts                                                 | A    | M                                                                | `src/lib/studentHub/catalog.ts`                                   | `7845d42`   | `8b3bf7e` | 2                 | tracked-present    | library       |
| legacy.ts                                                  | A    | `src/lib/studentHub/legacy.ts`                                   | `8b3bf7e`                                                         | `8b3bf7e`   |         1 | tracked-present   | library            |
| lifecycle.ts                                               | A    | `src/lib/studentHub/lifecycle.ts`                                | `8b3bf7e`                                                         | `8b3bf7e`   |         1 | tracked-present   | library            |
| public.ts                                                  | A    | `src/lib/studentHub/public.ts`                                   | `a49dbc0`                                                         | `a49dbc0`   |         1 | tracked-present   | library            |
| repository.ts                                              | A    | `src/lib/studentHub/repository.ts`                               | `a49dbc0`                                                         | `a49dbc0`   |         1 | tracked-present   | library            |
| \_app.tsx                                                  | M    | `src/pages/_app.tsx`                                             | `a5dfc66`                                                         | `a5dfc66`   |         1 | tracked-present   | page               |
| business-approvals.tsx                                     | M    | `src/pages/admin/business-approvals.tsx`                         | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | page               |
| claim-verification.tsx                                     | M    | `src/pages/admin/claim-verification.tsx`                         | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | page               |
| dashboard.tsx                                              | M    | `src/pages/admin/dashboard.tsx`                                  | `b91b90c`                                                         | `b91b90c`   |         1 | tracked-present   | page               |
| student-hub.tsx                                            | A    | M                                                                | `src/pages/admin/student-hub.tsx`                                 | `38d1681`   | `a49dbc0` | 2                 | tracked-present    | page          |
| dashboard-stats.ts                                         | M    | `src/pages/api/admin/dashboard-stats.ts`                         | `55b539c`                                                         | `55b539c`   |         1 | tracked-present   | api-route          |
| student-hub.ts                                             | A    | M                                                                | `src/pages/api/admin/student-hub.ts`                              | `38d1681`   | `a49dbc0` | 2                 | tracked-present    | api-route     |
| me.ts                                                      | M    | `src/pages/api/auth/me.ts`                                       | `c7ecbc3`                                                         | `c7ecbc3`   |         1 | tracked-present   | api-route          |
| create.ts                                                  | M    | `src/pages/api/business/create.ts`                               | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | api-route          |
| media.ts                                                   | M    | `src/pages/api/business/media.ts`                                | `ea47465`                                                         | `ea47465`   |         1 | tracked-present   | api-route          |
| generate.ts                                                | M    | `src/pages/api/certificates/generate.ts`                         | `c7ea4ff`                                                         | `c7ea4ff`   |         1 | tracked-present   | api-route          |
| enroll.ts                                                  | M    | `src/pages/api/courses/enroll.ts`                                | `c7ea4ff`                                                         | `c7ea4ff`   |         1 | tracked-present   | api-route          |
| internships.ts                                             | A    | M                                                                | `src/pages/api/feeds/internships.ts`                              | `7845d42`   | `a49dbc0` | 2                 | tracked-present    | api-route     |
| scholarships.ts                                            | A    | M                                                                | `src/pages/api/feeds/scholarships.ts`                             | `7845d42`   | `a49dbc0` | 2                 | tracked-present    | api-route     |
| evidence.ts                                                | M    | `src/pages/api/founding-membership/evidence.ts`                  | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | api-route          |
| add-product.ts                                             | M    | `src/pages/api/marketplace/add-product.ts`                       | `ea47465`                                                         | `ea47465`   |         1 | tracked-present   | api-route          |
| create.ts                                                  | M    | `src/pages/api/marketplace/create.ts`                            | `421de3e`                                                         | `421de3e`   |         1 | tracked-present   | api-route          |
| order-confirmation.ts                                      | A    | `src/pages/api/marketplace/order-confirmation.ts`                | `665a119`                                                         | `665a119`   |         1 | tracked-present   | api-route          |
| send.ts                                                    | M    | `src/pages/api/messages/send.ts`                                 | `421de3e`                                                         | `421de3e`   |         1 | tracked-present   | api-route          |
| latest.ts                                                  | A    | M                                                                | `src/pages/api/opportunities/latest.ts`                           | `7845d42`   | `a49dbc0` | 2                 | tracked-present    | api-route     |
| avatar.ts                                                  | M    | `src/pages/api/profile/avatar.ts`                                | `ea47465`                                                         | `ea47465`   |         1 | tracked-present   | api-route          |
| add.ts                                                     | M    | `src/pages/api/savedjobs/add.ts`                                 | `2512a12`                                                         | `2512a12`   |         1 | tracked-present   | api-route          |
| webhook-handler.ts                                         | M    | `src/pages/api/stripe/webhook-handler.ts`                        | `c996a1b`                                                         | `665a119`   |         3 | tracked-present   | api-route          |
| opportunities.ts                                           | A    | M                                                                | `src/pages/api/student-hub/opportunities.ts`                      | `7845d42`   | `a49dbc0` | 3                 | tracked-present    | api-route     |
| create.ts                                                  | M    | `src/pages/api/support/create.ts`                                | `2512a12`                                                         | `2512a12`   |         1 | tracked-present   | api-route          |
| black-business-websites.tsx                                | M    | `src/pages/black-business-websites.tsx`                          | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | page               |
| index.tsx                                                  | M    | `src/pages/black-card/index.tsx`                                 | `fad902f`                                                         | `fad902f`   |         1 | tracked-present   | page               |
| grants.tsx                                                 | M    | `src/pages/black-student-opportunities/grants.tsx`               | `8b3bf7e`                                                         | `a49dbc0`   |         2 | tracked-present   | page               |
| index.tsx                                                  | M    | `src/pages/black-student-opportunities/index.tsx`                | `7845d42`                                                         | `faff2cd`   |         4 | tracked-present   | page               |
| internships.tsx                                            | M    | `src/pages/black-student-opportunities/internships.tsx`          | `8b3bf7e`                                                         | `a49dbc0`   |         2 | tracked-present   | page               |
| mentorship.tsx                                             | M    | `src/pages/black-student-opportunities/mentorship.tsx`           | `8b3bf7e`                                                         | `a49dbc0`   |         2 | tracked-present   | page               |
| scholarships.tsx                                           | M    | `src/pages/black-student-opportunities/scholarships.tsx`         | `8b3bf7e`                                                         | `a49dbc0`   |         2 | tracked-present   | page               |
| business-directory.tsx                                     | M    | `src/pages/business-directory.tsx`                               | `aec329c`                                                         | `aec329c`   |         1 | tracked-present   | page               |
| course-dashboard.tsx                                       | M    | `src/pages/course-dashboard.tsx`                                 | `b9efc79`                                                         | `b9efc79`   |         1 | tracked-present   | page               |
| course-enrollment.tsx                                      | M    | `src/pages/course-enrollment.tsx`                                | `b9efc79`                                                         | `b9efc79`   |         1 | tracked-present   | page               |
| financial-literacy.tsx                                     | M    | `src/pages/financial-literacy.tsx`                               | `b9efc79`                                                         | `b9efc79`   |         1 | tracked-present   | page               |
| evidence.tsx                                               | M    | `src/pages/founding-membership/evidence.tsx`                     | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | page               |
| index.tsx                                                  | M    | `src/pages/index.tsx`                                            | `ceeb595`                                                         | `94b0f45`   |         5 | tracked-present   | page               |
| job-listings.tsx                                           | M    | `src/pages/job-listings.tsx`                                     | `aec329c`                                                         | `aec329c`   |         1 | tracked-present   | page               |
| jobs.tsx                                                   | M    | `src/pages/jobs.tsx`                                             | `aec329c`                                                         | `aec329c`   |         1 | tracked-present   | page               |
| learning.tsx                                               | M    | `src/pages/learning.tsx`                                         | `b9efc79`                                                         | `b9efc79`   |         1 | tracked-present   | page               |
| index.tsx                                                  | M    | `src/pages/marketplace/index.tsx`                                | `ceeb595`                                                         | `ac8831a`   |         2 | tracked-present   | page               |
| [id].tsx                                                   | M    | `src/pages/marketplace/product/[id].tsx`                         | `ceeb595`                                                         | `ac8831a`   |         2 | tracked-present   | page               |
| music.tsx                                                  | M    | `src/pages/music.tsx`                                            | `706273a`                                                         | `706273a`   |         1 | tracked-present   | page               |
| join.tsx                                                   | M    | `src/pages/music/join.tsx`                                       | `706273a`                                                         | `706273a`   |         1 | tracked-present   | page               |
| pricing.tsx                                                | M    | `src/pages/music/pricing.tsx`                                    | `706273a`                                                         | `706273a`   |         1 | tracked-present   | page               |
| payment-success.tsx                                        | M    | `src/pages/payment-success.tsx`                                  | `665a119`                                                         | `665a119`   |         1 | tracked-present   | page               |
| pricing.tsx                                                | M    | `src/pages/pricing.tsx`                                          | `fad902f`                                                         | `fad902f`   |         1 | tracked-present   | page               |
| articles.tsx                                               | M    | `src/pages/resources/articles.tsx`                               | `94b0f45`                                                         | `94b0f45`   |         1 | tracked-present   | page               |
| index.tsx                                                  | M    | `src/pages/resources/index.tsx`                                  | `94b0f45`                                                         | `94b0f45`   |         1 | tracked-present   | page               |
| start-here.tsx                                             | M    | `src/pages/start-here.tsx`                                       | `ceeb595`                                                         | `ac8831a`   |         2 | tracked-present   | page               |
| marketplace.tsx                                            | M    | `src/pages/support/marketplace.tsx`                              | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | page               |
| releases.tsx                                               | M    | `src/pages/support/releases.tsx`                                 | `c996a1b`                                                         | `c996a1b`   |         1 | tracked-present   | page               |
| globals.css                                                | M    | `src/styles/globals.css`                                         | `a5dfc66`                                                         | `aec329c`   |         4 | tracked-present   | style              |

## CURRENT UNTRACKED ITEMS

- Count: `162`
- `.tmp/adminBusinessStatus-testable.mjs`
- `.tmp/adminBusinessStatus.mjs`
- `.tmp/adminFinanceSummary-testable.mjs`
- `.tmp/directoryOwnership-env-stub.mjs`
- `.tmp/directoryOwnership-testable.mjs`
- `.tmp/directoryProfileContract-testable.mjs`
- `.tmp/directoryPublicVisibility-testable.mjs`
- `.tmp/founding-membership-testable.mjs`
- `.tmp/image-upload-security-tests/business-media.mjs`
- `.tmp/image-upload-security-tests/client-stub.mjs`
- `.tmp/image-upload-security-tests/directory-ownership-stub.mjs`
- `.tmp/image-upload-security-tests/env-stub.mjs`
- `.tmp/image-upload-security-tests/formidable-stub.mjs`
- `.tmp/image-upload-security-tests/image-upload-validation.mjs`
- `.tmp/image-upload-security-tests/marketplace-add-product.mjs`
- `.tmp/image-upload-security-tests/profile-avatar.mjs`
- `.tmp/image-upload-security-tests/spoofed.gif`
- `.tmp/image-upload-security-tests/spoofed.tiff`
- `.tmp/image-upload-security-tests/spoofed.v`
- `.tmp/image-upload-security-tests/unknown.bin`
- `.tmp/imageResolver-testable.mjs`
- `.tmp/legacy-write-route-security-tests/certificates-generate.mjs`
- `.tmp/legacy-write-route-security-tests/client-stub.mjs`
- `.tmp/legacy-write-route-security-tests/courses-enroll.mjs`
- `.tmp/legacy-write-route-security-tests/env-stub.mjs`
- `.tmp/legacy-write-route-security-tests/marketplace-create.mjs`
- `.tmp/legacy-write-route-security-tests/messages-send.mjs`
- `.tmp/legacy-write-route-security-tests/savedjobs-add.mjs`
- `.tmp/legacy-write-route-security-tests/seller-session-stub.mjs`
- `.tmp/legacy-write-route-security-tests/support-create.mjs`
- `.tmp/pbq.mjs`
- `.tmp/phase2-audit-after-axios.json`
- `.tmp/phase2-audit-after-firebase.json`
- `.tmp/phase2-audit-after-next.json`
- `.tmp/phase2-audit-after-postcss.json`
- `.tmp/phase2-current-pre-firebase-removal.json`
- `.tmp/phase2-next-lane-audit.json`
- `.tmp/phase2-npm-audit.json`
- `.tmp/publicBusinessQuery-live.mjs`
- `.tmp/publicBusinessQuery-testable.mjs`
- `.tmp/sharp-runtime-defense-tests/instrumentation.mjs`
- `.tmp/sharp-runtime-defense-tests/sample.vips`
- `.tmp/sponsorListings-live-testable.mjs`
- `.tmp/sponsorListings-testable.mjs`
- `.tmp/sponsored-businesses-debug.mjs`
- `.tmp/student-hub-tests/catalog-lifecycle.mjs`
- `.tmp/student-hub-tests/catalog-testable.mjs`
- `.tmp/student-hub-tests/lifecycle-testable.mjs`
- `.tmp/student-hub-tests/repository-testable.mjs`
- `docs/audit-evidence/2026-08-05-sponsor-reconciliation.md`
- `public/uploads/businesses/09f7c83c-970c-4bc0-87c6-77d590c6b668.png`
- `public/uploads/businesses/1bab2704-1153-4597-a67d-b9010abb7a55.jpg`
- `public/uploads/businesses/5087fb46-bd2c-4579-9851-8095d08bddc9.jpg`
- `public/uploads/businesses/88d10e79-c8a4-442c-b529-5e887a616714.jpg`
- `public/uploads/businesses/a0db09e2-4c26-4f3d-ae4d-9722c22aaaa8.png`
- `public/uploads/businesses/be888d1c-b8ae-429c-ba01-f4639a08bb23.jpg`
- `public/uploads/businesses/bf09ac83-45a7-438e-b502-4e17ae75c000.jpg`
- `public/uploads/businesses/e33c253a-b9fc-411a-adfe-ae607db53438.jpg`
- `public/uploads/businesses/e4f8536c-2b22-4448-9ee6-e2d97e0d54e3.jpg`
- `scripts/debug-business-parity-state.mjs`
- `scripts/debug-org-resolver.mjs`
- `scripts/recovery/out/production-businesses-readonly-audit-2026-07-02.json`
- `scripts/runtime-proof-business-parity.mjs`
- `scripts/runtime-proof-directory-ownership.mjs`
- `scripts/runtime-repro-org-verify.mjs`
- `tmp/admin-proof-artifacts-v2/admin-dashboard.png`
- `tmp/admin-proof-artifacts-v2/guest-dashboard.png`
- `tmp/admin-proof-artifacts/admin-business_approvals.png`
- `tmp/admin-proof-artifacts/admin-command_center.png`
- `tmp/admin-proof-artifacts/admin-dashboard.png`
- `tmp/admin-proof-artifacts/admin-directory_approvals.png`
- `tmp/admin-proof-artifacts/admin-financial_review.png`
- `tmp/admin-proof-artifacts/admin-revenue.png`
- `tmp/admin-proof-artifacts/guest-business_approvals.png`
- `tmp/admin-proof-artifacts/guest-command_center.png`
- `tmp/admin-proof-artifacts/guest-dashboard.png`
- `tmp/admin-proof-artifacts/guest-directory_approvals.png`
- `tmp/admin-proof-artifacts/guest-financial_review.png`
- `tmp/admin-proof-artifacts/guest-revenue.png`
- `tmp/admin-proof-pass-20260825-v2.mjs`
- `tmp/admin-proof-pass-20260825.mjs`
- `tmp/admin-route-check.mjs`
- `tmp/logs/bwe-dev-3000-20260729-091805.log`
- `tmp/logs/bwe-dev-3000.log`
- `tmp/phase1-apply-product-description-fix.js`
- `tmp/phase1-learning-ui-proof.mjs`
- `tmp/phase1-music-ui-proof.mjs`
- `tmp/phase1-product-description-backup.json`
- `tmp/phase1-product-description-proof.json`
- `tmp/phase1-ui-proof-20260826-learning/course-dashboard-guest.png`
- `tmp/phase1-ui-proof-20260826-learning/course-enrollment.png`
- `tmp/phase1-ui-proof-20260826-learning/financial-literacy-desktop.png`
- `tmp/phase1-ui-proof-20260826-learning/financial-literacy-mobile.png`
- `tmp/phase1-ui-proof-20260826-learning/learning-desktop.png`
- `tmp/phase1-ui-proof-20260826-music/music-desktop.png`
- `tmp/phase1-ui-proof-20260826-music/music-join-guest.png`
- `tmp/phase1-ui-proof-20260826-music/music-mobile.png`
- `tmp/phase1-ui-proof-20260826-music/music-pricing-guest.png`
- `tmp/phase1-ui-proof-20260826-pricing-blackcard/blackcard-desktop.png`
- `tmp/phase1-ui-proof-20260826-pricing-blackcard/blackcard-mobile.png`
- `tmp/phase1-ui-proof-20260826-pricing-blackcard/pricing-desktop.png`
- `tmp/phase1-ui-proof-20260826-pricing-blackcard/pricing-mobile.png`
- `tmp/phase1-ui-proof-20260826-refined/home-desktop.png`
- `tmp/phase1-ui-proof-20260826-refined/home-mobile.png`
- `tmp/phase1-ui-proof-20260826-refined/marketplace-desktop.png`
- `tmp/phase1-ui-proof-20260826-refined/product-desktop.png`
- `tmp/phase1-ui-proof-20260826-refined/product-mobile.png`
- `tmp/phase1-ui-proof-20260826-refined/start-here-desktop.png`
- `tmp/phase1-ui-proof-20260826-resources/home-desktop.png`
- `tmp/phase1-ui-proof-20260826-resources/home-directory-selected.png`
- `tmp/phase1-ui-proof-20260826-resources/home-jobs-selected.png`
- `tmp/phase1-ui-proof-20260826-resources/home-marketplace-selected.png`
- `tmp/phase1-ui-proof-20260826-resources/home-mobile.png`
- `tmp/phase1-ui-proof-20260826-resources/home-students-selected.png`
- `tmp/phase1-ui-proof-20260826-resources/proof-summary.json`
- `tmp/phase1-ui-proof-20260826-resources/resources-articles-desktop.png`
- `tmp/phase1-ui-proof-20260826-resources/resources-articles-mobile.png`
- `tmp/phase1-ui-proof-20260826-resources/resources-desktop.png`
- `tmp/phase1-ui-proof-20260826-resources/resources-mobile.png`
- `tmp/phase1-ui-proof-20260826-resume/business-directory-desktop.png`
- `tmp/phase1-ui-proof-20260826-resume/business-directory-mobile.png`
- `tmp/phase1-ui-proof-20260826-resume/home-desktop.png`
- `tmp/phase1-ui-proof-20260826-resume/home-jobs-selected.png`
- `tmp/phase1-ui-proof-20260826-resume/home-marketplace-selected.png`
- `tmp/phase1-ui-proof-20260826-resume/home-mobile.png`
- `tmp/phase1-ui-proof-20260826-resume/home-students-selected.png`
- `tmp/phase1-ui-proof-20260826-resume/jobs-desktop.png`
- `tmp/phase1-ui-proof-20260826-resume/jobs-mobile.png`
- `tmp/phase1-ui-proof-20260826-student-home-v2/home-desktop.png`
- `tmp/phase1-ui-proof-20260826-student-home-v2/home-mobile.png`
- `tmp/phase1-ui-proof-20260826-student-home-v2/student-desktop.png`
- `tmp/phase1-ui-proof-20260826-student-home-v2/student-mobile.png`
- `tmp/phase1-ui-proof-20260826-student-home/home-desktop.png`
- `tmp/phase1-ui-proof-20260826-student-home/home-mobile.png`
- `tmp/phase1-ui-proof-20260826-student-home/student-desktop.png`
- `tmp/phase1-ui-proof-20260826-student-home/student-mobile.png`
- `tmp/phase1-ui-proof-20260826/home-desktop.png`
- `tmp/phase1-ui-proof-20260826/home-mobile.png`
- `tmp/phase1-ui-proof-20260826/marketplace-desktop.png`
- `tmp/phase1-ui-proof-20260826/product-desktop.png`
- `tmp/phase1-ui-proof-20260826/product-mobile.png`
- `tmp/phase1-ui-proof-20260826/start-here-desktop.png`
- `tmp/phase2-authorized-edit-business-full-proof-output.json`
- `tmp/phase2-authorized-edit-business-full-proof.mjs`
- `tmp/phase2-authorized-edit-business-proof.mjs`
- `tmp/phase2-browser-diagnose-edit-business-output.json`
- `tmp/phase2-browser-diagnose-edit-business.mjs`
- `tmp/phase2-claim-queue-media-proof-output.json`
- `tmp/phase2-claim-queue-media-proof.mjs`
- `tmp/phase2-dashboard-unauth-browser-output.json`
- `tmp/phase2-dashboard-unauth-browser.mjs`
- `tmp/phase2-denial-probe-output.json`
- `tmp/phase2-denial-probe.mjs`
- `tmp/phase2-disputed-revoked-browser-proof-output.json`
- `tmp/phase2-disputed-revoked-browser-proof.mjs`
- `tmp/phase2-find-authorized-business-owner.mjs`
- `tmp/proof-resolver-checks-output.json`
- `tmp/proof-resolver-checks.js`
- `tmp/proof-resolver-denials-output.json`
- `tmp/proof-resolver-denials.js`
- `tmp/proof-resolver-users.js`
- `tmp/run-phase1-apply-product-description-fix.sh`
