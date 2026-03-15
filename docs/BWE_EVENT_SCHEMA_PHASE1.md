# BWE Event Schema (Phase 1)

**Scope:** Canonical analytics schema for Phase 1 instrumentation only (no SDK/vendor lock-in in this doc).  
**Companion:** `docs/BWE_EVENT_INSTRUMENTATION_MAP_PHASE1.md`  
**Status:** LOCKED FOR PHASE 1 IMPLEMENTATION

---

## 1) Canonical naming convention

## Format
`<domain>_<object>_<action>` in `snake_case`

Examples:
- `homepage_cta_click`
- `search_query_submitted`
- `directory_result_clicked`
- `marketplace_checkout_started`
- `consulting_intake_submitted`
- `auth_login_succeeded`
- `music_creator_onboarding_started`
- `admin_moderation_action_taken`

## Naming rules
1. Use one verb/action only (`viewed`, `clicked`, `started`, `submitted`, `succeeded`, `failed`, `updated`, `deleted`).
2. Never encode environment in event name (use metadata fields).
3. Reuse event names across pages when semantics are identical.
4. Use explicit failure events for high-risk flows (auth, checkout, submission).

---

## 2) Required base fields (all events)

All events MUST include:

- `event_name` (string)
- `event_version` (string, start at `"1.0"`)
- `occurred_at` (ISO-8601 UTC timestamp)
- `environment` (`development|preview|production`)
- `platform` (`web`)
- `page_route` (e.g. `/admin/dashboard`, `/business-directory`)
- `page_url` (full path + query)
- `referrer` (nullable string)
- `session_id` (stable anonymous/session scope)
- `request_id` (if available; nullable)
- `funnel_category` (enum below)

## `funnel_category` enum
- `homepage`
- `search_discovery`
- `directory`
- `marketplace`
- `seller_onboarding`
- `advertising`
- `employer_jobs`
- `consulting`
- `auth_account`
- `music_creator`
- `trust_moderation`
- `admin_ops`

---

## 3) User/account context fields

## Required when available
- `user_id` (nullable)
- `account_type` (`user|business|seller|employer|admin|affiliate|organization|unknown`)
- `is_authenticated` (boolean)
- `is_admin` (boolean)

## Optional account context
- `email_hash` (sha256 lowercase email; avoid raw email in analytics stream)
- `signup_cohort` (YYYY-MM)
- `user_country` / `user_region` (if lawful and available)

---

## 4) Source/page/component attribution fields

- `source_surface` (e.g. `homepage_hero`, `global_nav`, `search_bar`, `admin_waitlist_table`)
- `source_component` (component/module id)
- `source_slot` (position: `hero_primary_cta`, `nav_link_3`, `result_card_7`)
- `campaign_code` (nullable)
- `utm_source|utm_medium|utm_campaign|utm_content|utm_term` (nullable)

---

## 5) Trust/moderation context fields (when relevant)

- `entity_type` (`business|listing|product|job|consulting_lead|ad_request|intern_application|account|other`)
- `entity_id` (string)
- `entity_collection` (e.g. `consulting_intake`, `consulting_interest`)
- `review_status_before` (nullable)
- `review_status_after` (nullable)
- `moderation_action` (`approve|reject|spam|flag|delete|restore|note_update`)
- `admin_note_present` (boolean)
- `trust_flags` (array: `duplicate_email`, `duplicate_ip`, `test_marker`, `low_detail`, etc.)

---

## 6) Session/environment metadata

- `app_version` (git sha or release tag)
- `schema_version` (`phase1`)
- `client_ts` (ms epoch; optional)
- `server_ts` (ms epoch; optional)
- `device_type` (`mobile|tablet|desktop|unknown`)
- `viewport` (e.g. `390x844`; optional)
- `latency_ms` (optional)

---

## 7) Event families + canonical event names

## 7.1 Homepage / landing events
- `homepage_viewed`
- `homepage_cta_clicked`
- `homepage_search_focused`
- `homepage_search_submitted`
- `homepage_section_engaged`

## 7.2 Search / discovery events
- `search_query_submitted`
- `search_filter_applied`
- `search_results_viewed`
- `search_result_clicked`
- `search_no_results_viewed`

## 7.3 Business directory events
- `directory_page_viewed`
- `directory_result_clicked`
- `directory_profile_viewed`
- `directory_contact_action_clicked`
- `directory_sponsored_slot_clicked`

## 7.4 Marketplace / commerce events
- `marketplace_browse_viewed`
- `marketplace_product_viewed`
- `marketplace_add_to_cart_clicked` *(if/when cart exists; otherwise omit)*
- `marketplace_buy_now_clicked`
- `marketplace_checkout_started`
- `marketplace_checkout_succeeded`
- `marketplace_checkout_failed`

## 7.5 Seller onboarding events
- `seller_onboarding_started`
- `seller_onboarding_step_completed`
- `seller_onboarding_submitted`
- `seller_onboarding_approved`
- `seller_product_published`

## 7.6 Advertising / sponsorship events
- `advertising_page_viewed`
- `advertising_option_selected`
- `advertising_request_submitted`
- `advertising_checkout_started`
- `advertising_checkout_succeeded`
- `advertising_checkout_failed`

## 7.7 Employer / jobs funnel events
- `jobs_browse_viewed`
- `job_detail_viewed`
- `job_apply_started`
- `job_apply_submitted`
- `employer_post_job_started`
- `employer_post_job_submitted`

## 7.8 Consulting / lead funnel events
- `consulting_page_viewed`
- `consulting_waitlist_submitted`
- `consulting_intake_submitted`
- `consulting_submission_failed`

## 7.9 Account creation / login / auth events
- `auth_signup_started`
- `auth_signup_succeeded`
- `auth_signup_failed`
- `auth_login_started`
- `auth_login_succeeded`
- `auth_login_failed`
- `auth_forgot_password_requested`
- `auth_reset_password_succeeded`
- `auth_reset_password_failed`
- `auth_logout_succeeded`

## 7.10 Music / creator platform events
- `music_landing_viewed`
- `music_join_cta_clicked`
- `music_pricing_viewed`
- `music_creator_onboarding_started`
- `music_creator_onboarding_submitted`
- `music_creator_plan_selected`

## 7.11 Trust / moderation events
- `trust_signal_viewed`
- `moderation_queue_viewed`
- `admin_moderation_action_taken`
- `admin_moderation_note_updated`

## 7.12 Admin operational events
- `admin_dashboard_viewed`
- `admin_filter_applied`
- `admin_queue_row_expanded`
- `admin_export_requested` *(if/when export exists)*

---

## 8) Required/optional properties by funnel

## Homepage
- Required: `cta_id` (for CTA events), `source_slot`
- Optional: `cta_target_route`, `campaign_code`

## Search/Discovery
- Required: `query_text_normalized` (or `query_hash` if privacy-sensitive), `result_count`
- Optional: `active_filters`, `sort_mode`, `result_rank`

## Directory
- Required: `listing_id`/`business_id`, `result_rank` (for click)
- Optional: `is_sponsored`, `trust_flags`

## Marketplace
- Required: `product_id`, `seller_id` (if available), `price`, `currency`
- Optional: `inventory_state`, `shipping_state`, `checkout_session_id`

## Seller onboarding
- Required: `step_id` (for step events)
- Optional: `completion_percent`, `validation_error_code`

## Advertising
- Required: `ad_option`, `placement_type`
- Optional: `budget_band`, `duration_days`, `checkout_session_id`

## Employer/jobs
- Required: `job_id` (where applicable)
- Optional: `job_category`, `job_location_type`

## Consulting
- Required: `submission_type` (`waitlist|intake|interest`)
- Optional: `service_interest`, `lead_score` (if later introduced)

## Auth/account
- Required: `auth_method` (`password|oauth|unknown`)
- Optional: `error_code`, `failure_reason_category`

## Music/creator
- Required: `creator_stage` (`landing|join|pricing|onboarding`)
- Optional: `plan_tier`, `genre_tag`

## Trust/moderation/admin
- Required: `entity_type`, `entity_id`, `moderation_action` (for action events)
- Optional: `review_status_before`, `review_status_after`, `admin_note_present`, `trust_flags`

---

## 9) Event quality guardrails

1. Do not emit duplicate events on rerender; emit on explicit user action.
2. Capture failure events with normalized reason categories, not raw stack traces.
3. Avoid PII in analytics payloads; use hashes/IDs where needed.
4. Preserve stable event names; version payload schema if fields change.

---

## 10) Known route/flow ambiguities to clarify before full rollout

1. **Search surfaces:** multiple discovery routes (`/`, `/search-results`, `/business-directory`, `/search/ai`) need one canonical search event trigger contract.
2. **Marketplace checkout variants:** `buy now` and checkout APIs need one canonical conversion event path.
3. **Auth reset paths:** both `/api/auth/forgot-password` and `/api/auth/request-reset` exist; instrumentation should normalize to one funnel family.
4. **Consulting submit entry points:** both `/api/consulting-interest` and `/api/consulting-intake` should map to shared `consulting_*` event family with `submission_type`.
5. **Admin moderation surfaces:** actions exist on multiple admin pages; ensure consistent `admin_moderation_action_taken` payload contract.

---

## 11) Implementation readiness checklist (schema)

- [x] Canonical naming locked
- [x] Required base fields defined
- [x] Funnel-specific optional fields defined
- [x] Trust/moderation context defined
- [x] Event families enumerated
- [x] Ambiguities documented for product clarification
