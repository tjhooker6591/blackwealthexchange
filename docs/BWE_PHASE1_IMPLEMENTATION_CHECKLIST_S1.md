# BWE Phase 1 Implementation Checklist — S1-T02

**Scope:** Ticket-ready implementation checklist from Phase 1 event schema/map.  
**Inputs:**

- `docs/BWE_EVENT_SCHEMA_PHASE1.md`
- `docs/BWE_EVENT_INSTRUMENTATION_MAP_PHASE1.md`

**Constraints:**

- No code changes in this doc.
- No SDK/vendor integration details in this doc.
- Student portal + education/history are P0 mission-critical, not optional.

**Status model:** `NOT STARTED` | `IN PROGRESS` | `BLOCKED` | `READY FOR REVIEW` | `DONE`

---

## Execution order (P0 first)

## S1-T02-01 (P0)

- **Route/Page:** `/`
- **Component/Section:** Hero primary + secondary CTAs
- **Event(s) to instrument:** `homepage_cta_clicked`
- **Payload fields required:** `event_name,event_version,occurred_at,environment,platform,page_route,page_url,session_id,funnel_category,cta_id,source_slot`
- **Acceptance criteria:** each CTA click emits one event with correct `cta_id` and `source_slot`
- **Dependency:** schema constants locked
- **Status:** NOT STARTED
- **Implementation notes:** normalize all CTA targets via `cta_target_route` optional field

## S1-T02-02 (P0)

- **Route/Page:** `/`
- **Component/Section:** Homepage search input + submit
- **Event(s) to instrument:** `homepage_search_focused`, `homepage_search_submitted`
- **Payload fields required:** base fields + `source_component`; submit requires `query_text_normalized` or `query_hash`
- **Acceptance criteria:** focus emits once/session burst; submit emits once/action with query payload
- **Dependency:** S1-T02-01
- **Status:** NOT STARTED
- **Implementation notes:** chain to canonical search event in S1-T02-06

## S1-T02-03 (P0)

- **Route/Page:** `/`
- **Component/Section:** Student portal promo lane
- **Event(s) to instrument:** `student_opportunity_category_clicked`
- **Payload fields required:** base fields + `opportunity_type`, `source_slot=homepage_student_lane`
- **Acceptance criteria:** each student lane click records opportunity type + destination
- **Dependency:** S1-T02-01
- **Status:** NOT STARTED
- **Implementation notes:** must remain visible in primary homepage path

## S1-T02-04 (P0)

- **Route/Page:** `/`
- **Component/Section:** Education promo lane
- **Event(s) to instrument:** `education_topic_entry_clicked`
- **Payload fields required:** base fields + `content_type=education`, `topic_key`, `source_slot`
- **Acceptance criteria:** each education entry click emits with topic key
- **Dependency:** S1-T02-01
- **Status:** NOT STARTED
- **Implementation notes:** tie to downstream `education_to_action_cta_clicked`

## S1-T02-05 (P0)

- **Route/Page:** `/`
- **Component/Section:** History/economic truth promo lane
- **Event(s) to instrument:** `history_topic_entry_clicked`
- **Payload fields required:** base fields + `content_type=history`, `topic_key`, `source_slot`
- **Acceptance criteria:** each history lane click emits with topic metadata
- **Dependency:** S1-T02-01
- **Status:** NOT STARTED
- **Implementation notes:** use mission owner category `education_history_action`

## S1-T02-06 (P0)

- **Route/Page:** `/search-results` (canonical), supporting `/business-directory`, `/search/ai`
- **Component/Section:** Search submit flow
- **Event(s) to instrument:** `search_query_submitted`
- **Payload fields required:** base fields + `query_text_normalized/query_hash`, `search_scope`
- **Acceptance criteria:** canonical submissions land in `/search-results`; events include scope for supporting routes
- **Dependency:** canonical route decisions locked
- **Status:** NOT STARTED
- **Implementation notes:** set `search_scope=directory|ai|global`

## S1-T02-07 (P0)

- **Route/Page:** `/search-results`, `/business-directory`
- **Component/Section:** Results list/cards
- **Event(s) to instrument:** `search_results_viewed`, `search_result_clicked`, `search_filter_applied`, `search_no_results_viewed`
- **Payload fields required:** `result_count` for viewed, `entity_id/entity_type/result_rank` for clicked
- **Acceptance criteria:** viewed emitted once/result-load; click emitted once/user click with rank
- **Dependency:** S1-T02-06
- **Status:** NOT STARTED
- **Implementation notes:** include `is_sponsored` optional where available

## S1-T02-08 (P0)

- **Route/Page:** `/black-student-opportunities` (canonical), `/black-student-opportunities/scholarships`, `/black-student-opportunities/internships`, `/black-student-opportunities/mentorship`
- **Component/Section:** Student portal categories + opportunity cards
- **Event(s) to instrument:** `student_portal_landing_viewed`, `student_opportunity_category_clicked`, `student_scholarship_entry_clicked`, `student_internship_entry_clicked`, `student_mentorship_entry_clicked`
- **Payload fields required:** base fields + `opportunity_type`; entry clicks include `entity_id`
- **Acceptance criteria:** category and entry clicks traceable by opportunity type
- **Dependency:** canonical student route decision locked
- **Status:** NOT STARTED
- **Implementation notes:** treat `/BlackStudentOpportunities` as alias and normalize route in payload

## S1-T02-09 (P0)

- **Route/Page:** student opportunity pages
- **Component/Section:** Apply/save/visit action CTAs
- **Event(s) to instrument:** `student_opportunity_action_started`
- **Payload fields required:** base fields + `opportunity_type`, `action_type`
- **Acceptance criteria:** action starts attributable to scholarship/internship/mentorship sources
- **Dependency:** S1-T02-08
- **Status:** NOT STARTED
- **Implementation notes:** capture `destination_route` optional

## S1-T02-10 (P0)

- **Route/Page:** `/financial-literacy`, `/investment`, `/economic-freedom`, `/library-of-black-history`, `/african-american-economic-impact`
- **Component/Section:** Education/history action CTAs
- **Event(s) to instrument:** `education_to_action_cta_clicked`, `history_truth_to_action_cta_clicked`
- **Payload fields required:** base fields + `content_type`, `topic_key`, `cta_target_flow`
- **Acceptance criteria:** all CTA clicks include standardized `cta_target_flow` enum
- **Dependency:** canonical CTA target enum locked
- **Status:** NOT STARTED
- **Implementation notes:** enum must be one of `directory|marketplace|jobs|seller_signup|music_creator|wealth_tool`

## S1-T02-11 (P0)

- **Route/Page:** `/music`, `/music/join`, `/music/pricing`, API `/api/music/creator-onboarding`
- **Component/Section:** Music landing, join CTA, pricing plans, onboarding submit
- **Event(s) to instrument:** `music_landing_viewed`, `music_join_cta_clicked`, `music_pricing_viewed`, `music_creator_plan_selected`, `music_creator_onboarding_started`, `music_creator_onboarding_submitted`
- **Payload fields required:** base fields + `creator_stage`; plan select includes `plan_tier`
- **Acceptance criteria:** complete music entry->onboarding funnel traceable
- **Dependency:** music route parameter convention confirmation
- **Status:** NOT STARTED
- **Implementation notes:** capture plan transition from pricing to join

## S1-T02-12 (P1)

- **Route/Page:** `/advertise-with-us`, `/advertise/*`, `/advertising`, `/advertising/checkout`
- **Component/Section:** Ad option selection + checkout start
- **Event(s) to instrument:** `advertising_page_viewed`, `advertising_option_selected`, `advertising_checkout_started`
- **Payload fields required:** base fields + `ad_option`, `placement_type`; checkout includes `checkout_session_id` when available
- **Acceptance criteria:** option demand and checkout intent measurable per placement type
- **Dependency:** primary ad checkout contract
- **Status:** NOT STARTED
- **Implementation notes:** map submit APIs in later item for success/failure closure

## S1-T02-13 (P1)

- **Route/Page:** `/marketplace/become-a-seller`, API `/api/marketplace/create-seller` and `/api/marketplace/onboard`
- **Component/Section:** Seller onboarding start + submit
- **Event(s) to instrument:** `seller_onboarding_started`, `seller_onboarding_submitted`
- **Payload fields required:** base fields + `source_surface`; submit includes `seller_id` if available
- **Acceptance criteria:** seller funnel start->submit traceable with low duplication
- **Dependency:** auth context fields available
- **Status:** NOT STARTED
- **Implementation notes:** add step-level events in follow-on item if onboarding is multi-step

## S1-T02-14 (P1)

- **Route/Page:** `/marketplace/product/[id]`, API `/api/checkout/create-session` (canonical), legacy `/api/stripe/checkout`
- **Component/Section:** Buy now + checkout session creation
- **Event(s) to instrument:** `marketplace_buy_now_clicked`, `marketplace_checkout_started`, `marketplace_checkout_succeeded`, `marketplace_checkout_failed`
- **Payload fields required:** base fields + `product_id`; checkout events need `checkout_session_id` and failure category on fail
- **Acceptance criteria:** checkout funnel attributable to canonical API with `source_variant` for legacy path
- **Dependency:** canonical checkout decision locked
- **Status:** NOT STARTED
- **Implementation notes:** use `source_variant=legacy_stripe_checkout` for alternate path

---

## Remaining blockers requiring product decision

1. Confirm whether `/BlackStudentOpportunities` can hard-redirect to `/black-student-opportunities` now or later.
2. Confirm final parameter pass-through (`plan_tier`, `billing_cycle`) from `/music/pricing` -> `/music/join`.
3. Confirm timeline for deprecating `/api/auth/request-reset` alias after canonicalizing `/api/auth/forgot-password`.
4. Confirm whether admin queue depth events (`queue_view`, `row_expand`) are Phase 1 required or deferred.

---

## First coding task recommended after checklist completion

**Recommended first code task:** implement **S1-T02-01 through S1-T02-03** together on homepage (`/`) in one bounded PR:

- hero CTA click instrumentation
- homepage search focus/submit instrumentation
- homepage student portal entry instrumentation

Why first: highest traffic surface + immediately covers conversion, discovery, and mission-critical student funnel at once.
