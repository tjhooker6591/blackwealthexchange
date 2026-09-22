# BWE Event Instrumentation Map (Phase 1)

**Companion schema:** `docs/BWE_EVENT_SCHEMA_PHASE1.md`  
**Goal:** Exact route/component/action -> event mapping for implementation.  
**Scope:** Mapping only (no SDK code in this doc).

---

## 1) Homepage / landing

| Route/Page | Component/Section                 | User Action                | Event Name                             | Required Properties                                                          | Optional Properties                 | Why It Matters                                    | Funnel Owner      |
| ---------- | --------------------------------- | -------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------- | ----------------- |
| `/`        | Hero primary CTA buttons          | Click primary CTA          | `homepage_cta_clicked`                 | `cta_id`, `source_slot`, `page_route`                                        | `cta_target_route`, `campaign_code` | Measures top-intent selection quality             | Growth/Product    |
| `/`        | Hero secondary CTA                | Click secondary CTA        | `homepage_cta_clicked`                 | `cta_id`, `source_slot`                                                      | `cta_target_route`                  | Tracks fallback intent                            | Growth/Product    |
| `/`        | Homepage search box               | Focus                      | `homepage_search_focused`              | `source_component`, `page_route`                                             | `source_slot`                       | Indicates discovery intent initiation             | Growth/Product    |
| `/`        | Homepage search box               | Submit query               | `homepage_search_submitted`            | `query_text_normalized` or `query_hash`, `source_component`                  | `active_filters`                    | Entry point to discovery funnel                   | Growth/Product    |
| `/`        | Key promo sections                | Click section CTA          | `homepage_section_engaged`             | `section_id`, `cta_id`                                                       | `target_route`                      | Identifies high-performing homepage modules       | Growth/Product    |
| `/`        | Student portal promo lane         | Click student portal entry | `student_opportunity_category_clicked` | `opportunity_type`, `source_slot=homepage_student_lane`                      | `target_route`                      | Measures homepage student activation              | Student Growth    |
| `/`        | Education promo lane              | Click education entry      | `education_topic_entry_clicked`        | `content_type=education`, `topic_key`, `source_slot=homepage_education_lane` | `target_route`                      | Measures practical education entry from homepage  | Education         |
| `/`        | History/economic truth promo lane | Click history entry        | `history_topic_entry_clicked`          | `content_type=history`, `topic_key`, `source_slot=homepage_history_lane`     | `target_route`                      | Measures mission-context engagement from homepage | Education/Mission |

---

## 2) Search / discovery

| Route/Page                              | Component/Section | User Action      | Event Name                 | Required Properties                                          | Optional Properties                  | Why It Matters                            | Funnel Owner |
| --------------------------------------- | ----------------- | ---------------- | -------------------------- | ------------------------------------------------------------ | ------------------------------------ | ----------------------------------------- | ------------ |
| `/search-results`                       | Search form       | Submit search    | `search_query_submitted`   | `query_text_normalized/query_hash`, `page_route`             | `search_scope`                       | Core discovery start metric               | Discovery    |
| `/business-directory`                   | Search controls   | Submit search    | `search_query_submitted`   | `query_text_normalized/query_hash`, `search_scope=directory` | `category_filter`, `location_filter` | Directory demand capture                  | Discovery    |
| `/search/ai`                            | AI search prompt  | Submit query     | `search_query_submitted`   | `query_text_normalized/query_hash`, `search_scope=ai`        | `prompt_mode`                        | Compare AI search usage vs classic search | Discovery    |
| `/search-results`,`/business-directory` | Filters/tabs      | Apply filter     | `search_filter_applied`    | `filter_key`, `filter_value`, `page_route`                   | `filter_set_snapshot`                | Understand refinement behavior            | Discovery    |
| `/search-results`,`/business-directory` | Results list      | View result set  | `search_results_viewed`    | `result_count`, `page_route`                                 | `query_hash`, `active_filters`       | Core denominator for CTR                  | Discovery    |
| `/search-results`,`/business-directory` | Result card       | Click result     | `search_result_clicked`    | `entity_id`, `entity_type`, `result_rank`                    | `is_sponsored`, `trust_flags`        | Measures relevance/conversion quality     | Discovery    |
| `/search-results`,`/business-directory` | Results area      | No results shown | `search_no_results_viewed` | `query_hash/query_text_normalized`                           | `active_filters`                     | Detects demand gaps                       | Discovery    |

---

## 3) Business directory

| Route/Page                                                      | Component/Section      | User Action                      | Event Name                         | Required Properties                     | Optional Properties                        | Why It Matters                           | Funnel Owner |
| --------------------------------------------------------------- | ---------------------- | -------------------------------- | ---------------------------------- | --------------------------------------- | ------------------------------------------ | ---------------------------------------- | ------------ |
| `/business-directory`                                           | Directory listing page | Page view                        | `directory_page_viewed`            | `page_route`                            | `location_context`                         | Top-level directory traffic              | Directory    |
| `/business-directory`                                           | Listing/result card    | Click card/profile               | `directory_result_clicked`         | `business_id/listing_id`, `result_rank` | `is_sponsored`, `trust_flags`              | Discovery -> profile progression         | Directory    |
| `/business-directory/[alias]`                                   | Profile page           | View profile                     | `directory_profile_viewed`         | `business_id/listing_id`                | `verification_state`, `completeness_score` | Profile conversion base metric           | Directory    |
| `/business-directory/[alias]`                                   | Contact/action buttons | Click action (call/site/message) | `directory_contact_action_clicked` | `business_id`, `action_type`            | `source_slot`                              | Measures profile utility and lead intent | Directory    |
| `/business-directory`, `/business-directory/sponsored-business` | Sponsored slot card    | Click sponsored listing          | `directory_sponsored_slot_clicked` | `business_id/listing_id`, `slot_id`     | `campaign_code`                            | Sponsored inventory performance          | Revenue/Ads  |

---

## 4) Marketplace / commerce

| Route/Page                                                  | Component/Section    | User Action      | Event Name                       | Required Properties                            | Optional Properties                    | Why It Matters                       | Funnel Owner |
| ----------------------------------------------------------- | -------------------- | ---------------- | -------------------------------- | ---------------------------------------------- | -------------------------------------- | ------------------------------------ | ------------ |
| `/marketplace`, `/shop`                                     | Product grid/list    | Browse page view | `marketplace_browse_viewed`      | `page_route`                                   | `active_filters`, `sort_mode`          | Top of commerce funnel               | Commerce     |
| `/marketplace/product/[id]`                                 | Product detail       | View product     | `marketplace_product_viewed`     | `product_id`, `seller_id` (if avail)           | `price`, `currency`, `inventory_state` | Product-level conversion denominator | Commerce     |
| `/marketplace/product/[id]`                                 | Buy Now button       | Click buy        | `marketplace_buy_now_clicked`    | `product_id`, `price`, `currency`              | `inventory_state`                      | Checkout intent trigger              | Commerce     |
| `/advertising/checkout` or commerce checkout entry          | Checkout start point | Start checkout   | `marketplace_checkout_started`   | `checkout_session_id` (if avail), `product_id` | `seller_id`, `source_surface`          | Measures transition to payment       | Commerce     |
| API `/api/checkout/create-session` / `/api/stripe/checkout` | Checkout API success | Session created  | `marketplace_checkout_succeeded` | `checkout_session_id`, `product_id`            | `amount`, `currency`                   | Tracks conversion progression        | Commerce     |
| Same APIs                                                   | Checkout failure     | Session failure  | `marketplace_checkout_failed`    | `failure_reason_category`                      | `error_code`, `product_id`             | Diagnoses revenue loss points        | Commerce     |

---

## 5) Seller onboarding

| Route/Page                                                        | Component/Section | User Action         | Event Name                         | Required Properties            | Optional Properties          | Why It Matters                   | Funnel Owner        |
| ----------------------------------------------------------------- | ----------------- | ------------------- | ---------------------------------- | ------------------------------ | ---------------------------- | -------------------------------- | ------------------- |
| `/marketplace/become-a-seller`                                    | Onboarding entry  | Start onboarding    | `seller_onboarding_started`        | `page_route`, `source_surface` | `entry_variant`              | Top-of-funnel seller acquisition | Seller Growth       |
| Seller onboarding flow (UI/API)                                   | Form step         | Complete step       | `seller_onboarding_step_completed` | `step_id`                      | `completion_percent`         | Finds friction by step           | Seller Growth       |
| API `/api/marketplace/create-seller` / `/api/marketplace/onboard` | Submit onboarding | Submission complete | `seller_onboarding_submitted`      | `seller_id` (if created)       | `source_surface`             | Core seller activation event     | Seller Growth       |
| Admin approval flow (if applicable)                               | Seller approved   | Approval event      | `seller_onboarding_approved`       | `seller_id`                    | `review_status_before/after` | Time-to-approval metric          | Seller Growth/Admin |
| `/marketplace/add-products` + API add-product                     | Publish product   | Product published   | `seller_product_published`         | `seller_id`, `product_id`      | `category`, `price`          | Seller activation quality        | Seller Growth       |

---

## 6) Advertising / sponsorship funnel

| Route/Page                                                                  | Component/Section  | User Action           | Event Name                       | Required Properties                            | Optional Properties            | Why It Matters                    | Funnel Owner |
| --------------------------------------------------------------------------- | ------------------ | --------------------- | -------------------------------- | ---------------------------------------------- | ------------------------------ | --------------------------------- | ------------ |
| `/advertise-with-us`, `/advertise/*`, `/advertising`                        | Landing pages      | View page             | `advertising_page_viewed`        | `page_route`                                   | `source_surface`               | Top ad funnel traffic             | Revenue/Ads  |
| `/advertise/banner-ads`, `/advertise/featured-sponsor`, `/advertise/custom` | Option cards/forms | Select package/option | `advertising_option_selected`    | `ad_option`, `placement_type`                  | `duration_days`, `budget_band` | Measures package demand           | Revenue/Ads  |
| API `/api/advertising/submit`, `/api/advertising/custom-request`            | Submit request     | Request submitted     | `advertising_request_submitted`  | `request_type`, `placement_type`               | `budget_band`, `timeline`      | Lead generation and qualification | Revenue/Ads  |
| `/advertising/checkout` + API `/api/advertising/checkout`                   | Start payment      | Checkout started      | `advertising_checkout_started`   | `checkout_session_id` (if avail), `request_id` | `amount`, `currency`           | Monetization intent checkpoint    | Revenue/Ads  |
| API checkout success path                                                   | Payment success    | Checkout succeeded    | `advertising_checkout_succeeded` | `checkout_session_id`, `request_id`            | `amount`, `currency`           | Revenue completion metric         | Revenue/Ads  |
| API checkout error path                                                     | Payment fail       | Checkout failed       | `advertising_checkout_failed`    | `failure_reason_category`                      | `error_code`                   | Debug funnel leakage              | Revenue/Ads  |

---

## 7) Employer / jobs funnel

| Route/Page                            | Component/Section     | User Action        | Event Name                    | Required Properties                | Optional Properties | Why It Matters               | Funnel Owner |
| ------------------------------------- | --------------------- | ------------------ | ----------------------------- | ---------------------------------- | ------------------- | ---------------------------- | ------------ |
| `/jobs`, `/job-listings`              | Jobs list             | View jobs browse   | `jobs_browse_viewed`          | `page_route`                       | `active_filters`    | Top jobs funnel traffic      | Jobs         |
| `/job/[id]`                           | Job detail            | View job detail    | `job_detail_viewed`           | `job_id`                           | `job_category`      | Conversion denominator       | Jobs         |
| `/job/[id]/apply`                     | Apply form            | Start apply        | `job_apply_started`           | `job_id`                           | `source_surface`    | Intent to apply              | Jobs         |
| API `/api/jobs/apply`                 | Apply submit          | Submit application | `job_apply_submitted`         | `job_id`                           | `application_type`  | Candidate funnel conversion  | Jobs         |
| `/post-job` or employer job-create UI | Employer posting form | Start post         | `employer_post_job_started`   | `source_surface`                   | `employer_id`       | Employer monetization funnel | Jobs/Revenue |
| API `/api/jobs/create`                | Employer submit       | Submit post        | `employer_post_job_submitted` | `job_id`, `employer_id` (if avail) | `plan_type`         | Employer funnel completion   | Jobs/Revenue |

---

## 8) Consulting / lead funnel

| Route/Page                                                     | Component/Section        | User Action   | Event Name                      | Required Properties       | Optional Properties                  | Why It Matters                        | Funnel Owner |
| -------------------------------------------------------------- | ------------------------ | ------------- | ------------------------------- | ------------------------- | ------------------------------------ | ------------------------------------- | ------------ |
| `/recruiting-consulting`                                       | Consulting landing       | View page     | `consulting_page_viewed`        | `page_route`              | `source_surface`                     | Top consulting funnel traffic         | Consulting   |
| `/recruiting-consulting` form + API `/api/consulting-interest` | Waitlist/interest submit | Submit        | `consulting_waitlist_submitted` | `submission_type`         | `service_interest`                   | Tracks lead intent quality            | Consulting   |
| API `/api/consulting-intake`                                   | Intake submit            | Submit intake | `consulting_intake_submitted`   | `submission_type=intake`  | `service_interest`, `source_surface` | Captures structured consulting demand | Consulting   |
| Same APIs fail path                                            | Submission failure       | Fail submit   | `consulting_submission_failed`  | `failure_reason_category` | `error_code`                         | Diagnose drop-off                     | Consulting   |

---

## 9) Account creation / login / auth

| Route/Page                                           | Component/Section  | User Action      | Event Name                       | Required Properties           | Optional Properties   | Why It Matters                 | Funnel Owner  |
| ---------------------------------------------------- | ------------------ | ---------------- | -------------------------------- | ----------------------------- | --------------------- | ------------------------------ | ------------- |
| `/signup`                                            | Signup form        | Start signup     | `auth_signup_started`            | `auth_method`                 | `account_type_intent` | Auth funnel start              | Core Platform |
| API `/api/auth/signup`                               | Signup API success | Signup success   | `auth_signup_succeeded`          | `account_type`, `auth_method` | `email_domain_type`   | New account conversion         | Core Platform |
| API `/api/auth/signup`                               | Signup API failure | Signup fail      | `auth_signup_failed`             | `failure_reason_category`     | `error_code`          | Reduce auth friction           | Core Platform |
| `/login`                                             | Login form         | Start login      | `auth_login_started`             | `auth_method`                 | `source_surface`      | Login funnel start             | Core Platform |
| API `/api/auth/login`                                | Login success      | Login success    | `auth_login_succeeded`           | `account_type`, `auth_method` | `is_admin`            | Session conversion metric      | Core Platform |
| API `/api/auth/login`                                | Login fail         | Login fail       | `auth_login_failed`              | `failure_reason_category`     | `error_code`          | Auth reliability metric        | Core Platform |
| `/forgot-password` + API `/api/auth/forgot-password` | Request reset      | Forgot requested | `auth_forgot_password_requested` | `source_surface`              | `email_domain_type`   | Account recovery entry         | Core Platform |
| `/reset-password` + API `/api/auth/reset-password`   | Reset complete     | Reset success    | `auth_reset_password_succeeded`  | `source_surface`              | `token_age_bucket`    | Recovery completion metric     | Core Platform |
| `/reset-password` + API reset fail                   | Reset fail         | Reset failure    | `auth_reset_password_failed`     | `failure_reason_category`     | `error_code`          | Security/reliability signal    | Core Platform |
| Auth logout action + API `/api/auth/logout`          | Logout             | Logout success   | `auth_logout_succeeded`          | `account_type`                | `source_surface`      | Session lifecycle completeness | Core Platform |

---

## 10) Music / creator platform

| Route/Page                          | Component/Section     | User Action       | Event Name                           | Required Properties        | Optional Properties | Why It Matters                  | Funnel Owner  |
| ----------------------------------- | --------------------- | ----------------- | ------------------------------------ | -------------------------- | ------------------- | ------------------------------- | ------------- |
| `/music`                            | Music landing         | View page         | `music_landing_viewed`               | `page_route`               | `source_surface`    | Music funnel entry              | Creator/Music |
| `/music`                            | Join CTA              | Click join        | `music_join_cta_clicked`             | `cta_id`, `source_slot`    | `target_route`      | Creator acquisition intent      | Creator/Music |
| `/music/pricing`                    | Pricing cards         | View pricing      | `music_pricing_viewed`               | `page_route`               | `plan_context`      | Monetization funnel denominator | Creator/Music |
| `/music/pricing`                    | Plan selection        | Select plan       | `music_creator_plan_selected`        | `plan_tier`                | `billing_cycle`     | Revenue intent signal           | Creator/Music |
| `/music/join`                       | Onboarding form start | Start onboarding  | `music_creator_onboarding_started`   | `creator_stage=onboarding` | `source_surface`    | Funnel start quality            | Creator/Music |
| API `/api/music/creator-onboarding` | Submit onboarding     | Submit onboarding | `music_creator_onboarding_submitted` | `creator_stage=submitted`  | `plan_tier`         | Creator conversion metric       | Creator/Music |

---

## 11) Student portal / opportunities

| Route/Page                                                     | Component/Section      | User Action                     | Event Name                             | Required Properties                         | Optional Properties                     | Why It Matters                            | Funnel Owner   |
| -------------------------------------------------------------- | ---------------------- | ------------------------------- | -------------------------------------- | ------------------------------------------- | --------------------------------------- | ----------------------------------------- | -------------- |
| `/BlackStudentOpportunities` or `/black-student-opportunities` | Student portal landing | View landing                    | `student_portal_landing_viewed`        | `page_route`                                | `source_surface`                        | Measures top-of-funnel student reach      | Student Growth |
| `/black-student-opportunities`                                 | Category cards         | Click category card             | `student_opportunity_category_clicked` | `opportunity_type`, `source_slot`           | `target_route`                          | Tracks student intent by opportunity type | Student Growth |
| `/black-student-opportunities/scholarships`                    | Opportunity list/cards | Click scholarship entry         | `student_scholarship_entry_clicked`    | `opportunity_type=scholarship`, `entity_id` | `opportunity_source`, `deadline_bucket` | Scholarship demand + quality signal       | Student Growth |
| `/black-student-opportunities/internships`                     | Opportunity list/cards | Click internship entry          | `student_internship_entry_clicked`     | `opportunity_type=internship`, `entity_id`  | `opportunity_source`                    | Internship pipeline engagement            | Student Growth |
| `/black-student-opportunities/mentorship`                      | Opportunity list/cards | Click mentorship entry          | `student_mentorship_entry_clicked`     | `opportunity_type=mentorship`, `entity_id`  | `opportunity_source`                    | Mentorship activation                     | Student Growth |
| student opportunity pages                                      | Action CTA block       | Start action (apply/save/visit) | `student_opportunity_action_started`   | `opportunity_type`, `action_type`           | `destination_route`, `entity_id`        | Converts browsing into concrete action    | Student Growth |

---

## 12) Education / history / truth-to-action

| Route/Page                                                       | Component/Section                                              | User Action               | Event Name                            | Required Properties                                           | Optional Properties                | Why It Matters                                         | Funnel Owner      |
| ---------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------- | ------------------------------------- | ------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------ | ----------------- |
| `/financial-literacy`, `/investment`, `/economic-freedom`        | Education landing/topic                                        | View content page         | `education_landing_viewed`            | `content_type=education`, `topic_key`, `page_route`           | `source_surface`                   | Top education engagement metric                        | Education         |
| same education routes + `/courses/*`                             | Topic/module entry card                                        | Click topic/module entry  | `education_topic_entry_clicked`       | `content_type=education`, `topic_key`                         | `module_id`, `lesson_id`           | Tracks practical learning intent                       | Education         |
| `/library-of-black-history`, `/african-american-economic-impact` | History/economic truth landing                                 | View history page         | `history_landing_viewed`              | `content_type=history`, `topic_key`, `page_route`             | `source_surface`                   | Mission truth engagement baseline                      | Education/Mission |
| same history routes                                              | Section/topic card/link                                        | Click history topic       | `history_topic_entry_clicked`         | `content_type=history`, `topic_key`                           | `entity_id`                        | Measures what historical context resonates             | Education/Mission |
| education/history pages                                          | “Take action” CTA (to directory/marketplace/jobs/seller/music) | Click action transition   | `education_to_action_cta_clicked`     | `content_type`, `topic_key`, `cta_target_flow`                | `destination_route`, `source_slot` | Core learn->action conversion metric                   | Education/Growth  |
| history/economic truth pages                                     | “Why this matters now” CTA                                     | Click truth-to-action CTA | `history_truth_to_action_cta_clicked` | `content_type=economic_truth`, `topic_key`, `cta_target_flow` | `destination_route`, `source_slot` | Connects context to present-day economic participation | Education/Mission |

---

## 13) Trust / moderation + admin operational events

| Route/Page                                     | Component/Section     | User Action                | Event Name                      | Required Properties                                                                                                 | Optional Properties                           | Why It Matters                         | Funnel Owner  |
| ---------------------------------------------- | --------------------- | -------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------- | ------------- |
| `/admin/dashboard` Consulting Service Waitlist | Row action buttons    | Approve/reject/spam/delete | `admin_moderation_action_taken` | `entity_type`, `entity_id`, `entity_collection`, `moderation_action`, `review_status_before`, `review_status_after` | `admin_note_present`, `trust_flags`           | Queue health + trust posture           | Admin Ops     |
| `/admin/advertising-requests`                  | Row action buttons    | Approve/reject/spam/delete | `admin_moderation_action_taken` | same as above + `entity_type=ad_request`                                                                            | `duplicate_email_count`, `duplicate_ip_count` | Ad queue quality and abuse resistance  | Admin Ops     |
| `/admin/consulting-leads`                      | Lead status actions   | Update lifecycle/status    | `admin_moderation_action_taken` | `entity_type=consulting_lead`, ids/status fields                                                                    | `admin_note_present`                          | Lead governance consistency            | Admin Ops     |
| `/admin/intern-applications`                   | Status/delete actions | Status change/delete       | `admin_moderation_action_taken` | `entity_type=intern_application`, ids/status                                                                        | `admin_note_present`                          | Queue moderation parity                | Admin Ops     |
| `/admin/dashboard`                             | Recent joins filters  | Apply filter/toggle        | `admin_filter_applied`          | `filter_key`, `filter_value`, `source_component`                                                                    | `result_count`                                | Admin efficiency + operational insight | Admin Ops     |
| Any user-facing page with trust chips          | Trust markers         | View trust chip details    | `trust_signal_viewed`           | `entity_type`, `entity_id`, `trust_flags`                                                                           | `verification_state`, `completeness_score`    | Validate trust-signal usage            | Trust/Product |

---

## 12) Canonical route decisions (LOCKED for S1-T02 implementation)

1. **Student portal canonical landing route**
   - **Canonical:** `/black-student-opportunities`
   - **Alternate handling:** `/BlackStudentOpportunities` treated as legacy alias; maintain compatibility but instrument as canonical funnel route via `page_route_normalized`.
   - **Recommendation:** add redirect to canonical lowercase route in later cleanup pass (not in S1-T02 docs-only scope).

2. **Canonical search entry destination**
   - **Canonical search submission destination:** `/search-results`
   - **Supporting discovery routes:** `/business-directory` (directory-scoped search), `/search/ai` (AI-assisted exploration).
   - **Instrumentation rule:** homepage search submit emits `homepage_search_submitted` then normalized search funnel tracks `search_query_submitted` with `search_scope`.

3. **Canonical marketplace checkout source of truth**
   - **Primary UI route:** product detail route initiators (`/marketplace/product/[id]`) and checkout entry points under marketplace flow.
   - **Primary API route for checkout session:** `/api/checkout/create-session`
   - **Legacy/alternate paths:** `/api/stripe/checkout` and other checkout-adjacent routes remain instrumented as `source_variant` until consolidated.

4. **Auth reset funnel normalization**
   - **Canonical reset request path:** `/api/auth/forgot-password`
   - **Alternate path:** `/api/auth/request-reset` treated as legacy alias; emit same canonical funnel event family.
   - **Recommendation:** keep alias live for compatibility, plan eventual internal redirect/merge.

5. **Education/history CTA standardization**
   - **Canonical CTA event pair:**
     - `education_to_action_cta_clicked`
     - `history_truth_to_action_cta_clicked`
   - **Canonical CTA target enum (`cta_target_flow`):**
     - `directory`
     - `marketplace`
     - `jobs`
     - `seller_signup`
     - `music_creator`
     - `wealth_tool`
   - **Standardized source routes:** `/financial-literacy`, `/investment`, `/economic-freedom`, `/library-of-black-history`, `/african-american-economic-impact`.

## Remaining clarifications (non-blocking for S1-T02 docs)

1. **Music pricing -> onboarding linkage detail**
   - Confirm final parameter pass-through contract (`plan_tier`, `billing_cycle`) from `/music/pricing` to `/music/join`.
2. **Admin queue event depth**
   - Confirm whether `queue_view` and `row_expand` events are required in Phase 1 or deferred.

---

## 13) Implementation-order checklist (for engineering)

1. Lock schema constants from `BWE_EVENT_SCHEMA_PHASE1.md`.
2. Instrument P0 surfaces first:
   - homepage
   - search/discovery
   - auth
   - consulting submit
   - top revenue starts
3. Instrument admin moderation actions.
4. Validate event payload completeness in dev/preview.
5. Publish weekly scoreboard v1 from emitted events.

---

## 14) Proof-of-readiness

- [x] Required routes mapped to event names
- [x] Required properties listed per mapped event
- [x] Funnel owner/category assigned
- [x] Ambiguities documented for product clarification before coding
