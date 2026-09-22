# Phase 2 Workstream 1 — Unified Entity Inventory

Date: `2026-09-01`

Purpose: establish the current BWE person, business, role, relationship, transaction, and event architecture before designing `Person 360` or `Business 360`.

Scope rules for this artifact:

- read-only source inspection only
- no runtime code changes
- no schema changes
- no data migration
- no new collections
- no DB writes

## 1. Current-state summary

Current source inspection shows that BWE already has meaningful identity and relationship data, but it is distributed across multiple role-specific collections and feature-specific records.

The dominant current pattern is:

- session identity is carried in JWT as `userId`, `email`, and `accountType`
- runtime role resolution often depends on `accountType`
- profile storage depends on which collection the current session resolves to
- person-to-business relationships are explicit in some flows and only implicit in others
- `businesses` is the closest thing to a canonical business entity for directory-facing and claim-verified behavior
- `users` is the closest thing to a canonical person identity for premium, Black Card, and general-user state, but seller/employer/business identities can also exist in separate top-level collections

This means BWE already behaves like a multi-entity platform, but it does not yet have one stable resolver layer that can answer:

`Who is this person across all roles?`

and

`Are these records definitely the same business?`

## 2. Person entity

### 2.1 Current person sources

| Current representation    | Source file(s)                                                                                                                     | Collection                    | Key / ID used                                                          | Authoritative or derived                                             | Optional / required                                                              | Duplication / drift risk                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| General account identity  | `src/pages/api/auth/signup.ts`, `src/pages/api/auth/login.ts`, `src/pages/api/auth/me.ts`, `src/models/user.ts`                    | `users`                       | `_id`, `email`                                                         | Closest current authoritative person record                          | Required for general-user lane; optional for some seller/business/employer flows | High, because email may also exist in `sellers`, `businesses`, `employers`                  |
| Seller identity           | `src/pages/api/marketplace/create-seller.ts`, `src/pages/api/marketplace/get-my-seller.ts`, `src/lib/marketplace/sellerSession.ts` | `sellers`                     | `_id`, `userId`, `email`                                               | Authoritative for seller workflow, derived from user in upgrade flow | Required for seller workflow                                                     | High, because seller can be upgraded from `users` or created standalone with `userId: null` |
| Employer identity         | `src/pages/api/auth/signup.ts`, `src/pages/api/jobs/create.ts`, `src/pages/api/jobs/employer.ts`                                   | `employers`                   | `_id`, `email`                                                         | Authoritative for employer login context                             | Required for employer workflow                                                   | High, because jobs also attach to JWT `userId` and email rather than employer entity ID     |
| Business account identity | `src/pages/api/auth/signup.ts`, `src/pages/api/auth/login.ts`, `src/pages/api/profile.ts`                                          | `businesses`                  | `_id`, `email`                                                         | Authoritative only for business-account login context                | Optional platform-wide; required only for business-login lane                    | High, because the same collection is also the directory business entity                     |
| Session identity          | `src/pages/api/auth/login.ts`, `src/pages/api/auth/me.ts`, `src/lib/auth.ts`, `src/lib/directoryOwnership.ts`                      | JWT cookie, not DB collection | `userId`, `email`, `accountType`, `isAdmin`, optional `role` / `roles` | Derived runtime identity envelope                                    | Required for protected flows                                                     | Medium, because token shape varies between helpers (`id` vs `userId`)                       |

### 2.2 Current person fields and relationships

| Person field / relationship   | Source file(s)                                                                                                                                    | Collection                                                                         | Key / ID used                                                                  | Authoritative or derived                                                                       | Optional / required                                 | Duplication / drift risk                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `_id`                         | signup/login/session helpers                                                                                                                      | `users`, `sellers`, `employers`, `businesses`                                      | Mongo `_id`                                                                    | Authoritative within each collection only                                                      | Required inside each collection                     | High cross-collection ambiguity                                   |
| `email`                       | auth, profile, membership, seller, employer, support                                                                                              | multiple                                                                           | `email`                                                                        | Cross-feature lookup key more often than strict entity key                                     | Required in nearly every flow                       | Very high; same person can have multiple records keyed by email   |
| `accountType`                 | auth/login/signup/profile/jobs/checkout                                                                                                           | multiple + JWT                                                                     | `accountType`                                                                  | Runtime role hint, not full person model                                                       | Usually required                                    | High; mixes role, capability, and collection choice               |
| `isAdmin`                     | `src/pages/api/auth/login.ts`, `src/pages/api/auth/me.ts`, `src/lib/adminPageGuard.ts`                                                            | mainly `users`, plus JWT                                                           | `isAdmin`, `role`, `roles`, `accountType=admin`                                | Canonical source is intended to be `users.isAdmin`                                             | Optional except admin flows                         | Medium; admin can also be inferred from token or role fields      |
| Profile data                  | `src/pages/api/profile.ts`, `src/pages/api/profile/avatar.ts`, `src/pages/api/profile/resume.ts`                                                  | collection chosen by `accountType`                                                 | `_id`, `email`                                                                 | Authoritative per active role collection                                                       | Optional fields on top of required account identity | High; same human can have profile data in multiple collections    |
| Premium / plan state          | `src/pages/api/billing/subscription-status.ts`, `src/pages/api/auth/me.ts`                                                                        | `users`                                                                            | `_id`, `email`                                                                 | `users` is authoritative                                                                       | Optional except premium flows                       | Medium; fallback logic derives plan from multiple fields          |
| Black Card state              | `src/lib/black-card-membership.ts`, `src/pages/api/black-card/member-summary.ts`                                                                  | `users`, `black_card_memberships`, `black_card_cards`                              | `userId`, `email`, `membershipId`                                              | `black_card_memberships` + `black_card_cards` are authoritative; `users` mirrors summary state | Optional                                            | Medium; mirrored into `users` for runtime convenience             |
| Seller relationship           | seller APIs                                                                                                                                       | `sellers` plus `users`                                                             | `seller._id`, `seller.userId`, `seller.email`                                  | `sellers` authoritative for seller ops                                                         | Optional                                            | High; can exist without linked `users` row                        |
| Business-owner relationship   | `src/lib/directoryOwnership.ts`, `src/pages/api/admin/founding-memberships.ts`, `src/pages/api/user/managed-businesses.ts`                        | `businesses`, `business_claims`, `ownership_reviews`                               | `userId`, `businessId`, `claimedByUserId`, `managedByUserId`, `ownerUserIds[]` | Verified claim/review pair plus business flags together are closest to authoritative           | Optional                                            | High; represented in three places                                 |
| Employer relationship         | jobs APIs                                                                                                                                         | `jobs`, `employers`                                                                | JWT `userId`, `email`, `employerEmail`                                         | Jobs currently use email/userId more than employer entity ID                                   | Optional                                            | High                                                              |
| Student / talent relationship | `src/pages/api/applications/apply.ts`, `src/pages/api/user/save-job.ts`, `src/pages/api/dashboard/user.ts`, `src/pages/api/user/applications*.ts` | `applicants`, `savedJobs`, `users`                                                 | email, `userId`, `jobId`                                                       | Mixed                                                                                          | Optional                                            | High; applicant flow can be guest/email-based                     |
| Orders                        | `src/lib/checkout/createProductCheckoutSession.ts`, `src/lib/db/orders.ts`, `src/pages/api/marketplace/get-buyer-orders.ts`                       | `orders`                                                                           | `buyerUserId`, `buyerEmail`, `orderId`                                         | Order doc authoritative for marketplace purchase state                                         | Optional                                            | Medium; buyer can be linked by userId and/or email                |
| Applications                  | jobs/applicants APIs                                                                                                                              | `applicants`, `intern_applications`                                                | email, `jobId`, sometimes `userId` absent                                      | Application doc authoritative for that workflow                                                | Optional                                            | High; not normalized to person ID                                 |
| Claims                        | directory and founding membership flows                                                                                                           | `business_claims`, `entity_claims`, `ownership_reviews`                            | `userId`, `claimantUserId`, `claimantEmail`, `membershipId`                    | Claim/review docs authoritative for their flow                                                 | Optional                                            | High; business claims and organization claims use separate models |
| Support relationships         | `src/pages/api/support/create-ticket.ts`                                                                                                          | `support_tickets`                                                                  | `ticketId`, `userId`, `email`, related IDs                                     | Ticket doc authoritative                                                                       | Optional                                            | Medium; user can be guest or authenticated                        |
| Saved activity                | `src/pages/api/user/save-job.ts`, travel-map saved APIs, Black Card activity, `flow_events`                                                       | `savedJobs`, `travel_map_saved_places`, `black_card_rewards_ledger`, `flow_events` | `userId`, email, businessId, jobId                                             | Authoritative per feature                                                                      | Optional                                            | High; no platform-wide saved-item model                           |

### 2.3 Current person truth

The current closest authoritative person source is:

- `users` for general identity, premium state, Black Card mirror state, and admin authority
- plus role-specific overlays in `sellers`, `employers`, and `businesses`

BWE does not currently have one durable person resolver that merges those overlays into one canonical human identity.

## 3. Business entity

### 3.1 Current business sources

| Current representation               | Source file(s)                                                                                                                                | Collection                                                                | Business identifier used                                         | Authoritative or derived                                    | Optional / required                                  | Duplication / drift risk                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| Directory / core business record     | `src/pages/api/businesses.ts`, `src/pages/api/business/create.ts`, `src/pages/api/business/profile.ts`, `src/lib/directoryProfileContract.ts` | `businesses`                                                              | `_id`, `alias`, `slug`, `businessName`, `business_name`, `email` | Closest current authoritative business entity               | Required for directory-facing business functionality | Medium; multiple name/address/category fields are mirrored        |
| Paid directory listing record        | `src/pages/api/admin/approve-directory-listing.ts`                                                                                            | `directory_listings`                                                      | `_id`, `businessId`, `businessIdReal`, `stripeSessionId`         | Derived commercial overlay on top of business identity      | Optional                                             | High; can exist as placeholder `UNLINKED:<session>` before linked |
| Business claim record                | `src/lib/directoryOwnership.ts`, founding-membership admin/evidence APIs                                                                      | `business_claims`                                                         | `businessId`, `userId`, `membershipId`                           | Authoritative for claim workflow                            | Optional                                             | High; parallels business flags and ownership review               |
| Ownership review record              | same                                                                                                                                          | `ownership_reviews`                                                       | `businessId`, `userId`, `sourceMembershipId`                     | Authoritative for review workflow                           | Optional                                             | High                                                              |
| Seller business overlay              | `src/pages/api/marketplace/create-seller.ts`, `src/pages/api/marketplace/readiness.ts`, `src/lib/marketplace/businessAttribution.ts`          | `sellers`                                                                 | `_id` as seller ID, optional `businessId`, email                 | Authoritative for seller account, not for business identity | Optional                                             | Very high; seller may or may not reference business               |
| Marketplace products                 | marketplace product APIs and checkout libs                                                                                                    | `products`                                                                | `_id`, `sellerId`, optional `businessId`                         | Product authoritative for catalog item only                 | Optional                                             | High; business link may be missing or conflict with seller        |
| Organization record                  | `src/pages/api/organizations/claim.ts`, `src/pages/api/admin/organizations/claims.ts`                                                         | `organizations`                                                           | `_id`, `slug`                                                    | Separate non-business entity type                           | Optional                                             | Medium; can represent an organization parallel to a business      |
| Advertising / sponsorship overlays   | advertising APIs and sponsor listings                                                                                                         | `advertising_requests`, `ad_purchases`, `featured_sponsor_schedule`       | `businessId`, campaign/session IDs                               | Derived feature overlays                                    | Optional                                             | High; business linkage depends on submitted metadata              |
| Founding Membership business overlay | `src/lib/founding-membership.ts`, `src/pages/api/admin/founding-memberships.ts`                                                               | `business_memberships`, `membership_onboarding`, `membership_fulfillment` | `membershipId`, `businessId`, `userId`, email                    | Authoritative for membership workflow                       | Optional                                             | High; overlays business and user state at the same time           |

### 3.2 Current business fields and relationship keys

| Business key / field      | Current location(s)                                                                                          | Notes                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Business entity ID        | `businesses._id`                                                                                             | Closest current canonical business ID                     |
| Directory listing ID      | `directory_listings._id`                                                                                     | Separate paid listing workflow ID                         |
| Seller ID                 | `sellers._id`                                                                                                | Seller account/store ID, not reliably business ID         |
| Owner / representative ID | `claimedByUserId`, `managedByUserId`, `ownerUserIds[]`, `business_claims.userId`, `ownership_reviews.userId` | Fragmented across business and claim collections          |
| Slug / alias              | `businesses.slug`, `businesses.alias`                                                                        | Public routing keys; both are accepted in multiple places |
| Email                     | `businesses.email`, `businesses.businessEmail`, `publicEmail`, seller email                                  | Mixed public/contact/account meanings                     |
| Stripe Connect ID         | `sellers.stripeAccountId` and compatibility variants                                                         | Attached to seller more than business                     |
| Membership ID             | `business_memberships.membershipId`                                                                          | Founding Membership feature ID, not business ID           |
| Job / employer linkage    | `jobs.email`, `jobs.employerEmail`, `jobs.company`, `jobs.userId`                                            | Often business-like but not tied to `businesses._id`      |

### 3.3 Current business truth

The current record closest to authoritative business identity is `businesses`.

Why:

- directory-facing public retrieval centers on `businesses`
- verified ownership flows ultimately update `businesses`
- managed business APIs read from `businesses`
- founding-membership verification eventually writes back to `businesses`
- marketplace paid proof now optionally carries `businessId`, which refers to the `businesses` entity when present

Why it is not fully authoritative yet:

- seller/storefront can exist without a business link
- jobs/employer records are not consistently tied to `businesses._id`
- directory paid listing state lives in `directory_listings`
- organizations use a separate entity model
- some public business fields are mirrored across multiple names

## 4. Account types vs real roles

### 4.1 Current mapping

| Current label      | What it behaves like today                                            | Evidence                                                                             |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `user`             | Base account type and closest thing to a default person identity      | auth/signup, auth/login, billing, Black Card, dashboard user APIs                    |
| `business`         | Both an account type and direct login into a `businesses` document    | auth/signup, auth/login, profile APIs                                                |
| `seller`           | Account type plus seller capability plus separate seller/store record | seller creation, seller session, seller readiness                                    |
| `employer`         | Account type plus job-posting capability                              | jobs create/employer APIs                                                            |
| `admin`            | Capability / privilege, not a clean standalone entity model           | auth/me, admin page guard, admin auth                                                |
| `student` / talent | Feature persona, not a dedicated account type                         | saved jobs, applicants, dashboard user, student hub content                          |
| consultant         | Capability/profile overlay attached to authenticated person           | consultants profile API, employer consultants list                                   |
| creator            | Seller-adjacent capability layered onto seller readiness fields       | seller readiness uses `creatorOnboardingStatus`, `creatorPlanStatus`, `creatorReady` |

### 4.2 Current truth

Current `accountType` is mixing four different concepts:

- login collection selection
- dashboard routing
- capability gating
- relationship to another entity

Examples:

- a seller may be a separate seller record or an upgraded user-linked seller
- a business owner is not its own stable account type; verified ownership is mostly a relationship to a business
- admin is a privilege resolved from `users.isAdmin` plus token/role fallbacks
- consultant and creator are capability overlays, not core identity types

## 5. Person to business relationships

| Relationship                    | Source collection / file                                                              | Source field(s)                                                                                                  | Target collection / field               | Trust state                                                                  | Representation                             |
| ------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| Person owns business            | `business_claims`, `ownership_reviews`, `businesses`, `src/lib/directoryOwnership.ts` | `userId`, `businessId`, `claimedByUserId`, `ownerUserIds[]`                                                      | `businesses._id`                        | `ownership_verified` / `verified` when claim + review + business flags align | Direct but fragmented                      |
| Person manages business         | `businesses`, `business_memberships`                                                  | `managedByUserId`, `managementAccessStatus`                                                                      | `businesses._id`                        | verified in founding flow; otherwise mixed                                   | Direct but fragmented                      |
| Person claimed business         | `business_claims`, `entity_claims`                                                    | `userId` or `claimantUserId`, `businessId` / `entityId`                                                          | `businesses._id` or `organizations._id` | pending / additional evidence / verified / failed / disputed / revoked       | Direct                                     |
| Person verified for business    | `ownership_reviews`, `business_claims`, `businesses`                                  | `userId`, `ownershipReviewStatus`, `claimStage`                                                                  | `businesses._id`                        | verified when review + claim agree                                           | Derived from multiple records              |
| Person sells for business       | `sellers`, `products`, `payments`, `orders`                                           | `seller.userId`, `seller.email`, optional `seller.businessId`, `product.sellerId`, optional `product.businessId` | `businesses._id` optional               | no universal trust state                                                     | Mostly implicit unless `businessId` exists |
| Person employs through business | `jobs`, `employers`                                                                   | `jobs.userId`, `jobs.email`, `jobs.employerEmail`, `jobs.company`                                                | no stable business foreign key          | none                                                                         | Implicit                                   |
| Person created business listing | `businesses`, `business_claims`, business submission flow                             | `claimantVerification.claimantEmail`, submitted fields                                                           | `businesses._id`                        | submission-time only                                                         | Implicit / derived                         |
| Person purchased from business  | `orders`, `payments`, optional `bmev_records`                                         | `buyerUserId`, `buyerEmail`, `businessId` optional                                                               | `businesses._id` optional               | paid truth when webhook processes                                            | Direct for buyer, partial for business     |

## 6. Business to platform relationships

| Platform function    | Current connection to business                                                                 | Reliability                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Directory            | `businesses` public listing data, `alias`, `slug`, quality/status fields                       | `YES`                                                        |
| Claim verification   | `business_claims`, `ownership_reviews`, `claimedByUserId`, `managedByUserId`, `ownerUserIds[]` | `PARTIALLY` because relationship is split across collections |
| Seller               | optional `seller.businessId`, else seller/email-only                                           | `PARTIALLY`                                                  |
| Marketplace products | optional `product.businessId`; otherwise only `sellerId`                                       | `PARTIALLY`                                                  |
| Orders               | newer marketplace paths can store `businessId`; older/other orders may not                     | `PARTIALLY`                                                  |
| Stripe               | Connect account is attached to `seller`, not business                                          | `PARTIALLY`                                                  |
| Advertising          | `advertising_requests.businessId`, `ad_purchases.businessId`, `directory_listings.businessId`  | `PARTIALLY`                                                  |
| Sponsorship          | sponsor schedule and paid sponsor flows use `businessId` when available                        | `PARTIALLY`                                                  |
| Founding Membership  | `business_memberships.businessId` plus updates back to `businesses`                            | `YES` for that lane                                          |
| Jobs / employer      | `jobs.company`, `jobs.email`, `jobs.userId`, `jobs.employerEmail`                              | `NO` for reliable business identity                          |
| Black Card           | consumer-focused; no meaningful business relationship implemented                              | `NO`                                                         |
| Support              | ticket can reference `relatedBusinessId`                                                       | `PARTIALLY`                                                  |
| Analytics / activity | `flow_events.businessId` exists for some events, missing for many                              | `PARTIALLY`                                                  |
| Organizations        | separate entity type, not automatically merged with businesses                                 | `NO` for shared business identity                            |

Answer to the core question:

`Can BWE reliably know that all of these records represent the same business?`

- `YES` for core directory + verified ownership + founding-membership flows when they all reference `businesses._id`
- `PARTIALLY` for marketplace, advertising, support, and sponsorship because those lanes sometimes carry business IDs and sometimes rely on seller/email/session metadata
- `NO` for jobs/employer and organizations because those models do not consistently resolve through a shared business entity

## 7. Transaction and economic relationships

| Record type                    | Collection(s)                                                                          | Current links to person              | Current links to business                         | Current links to seller / product / service      | BWE revenue link                          | Timestamp                                         |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------- | ------------------------------------------------ | ----------------------------------------- | ------------------------------------------------- |
| Marketplace order              | `orders`                                                                               | `buyerUserId`, `buyerEmail`          | optional `businessId`                             | `sellerId`, `productId`, `orderId`               | split later into payment / revenue fields | `createdAt`, `paidAt`, `fulfilledAt`, `updatedAt` |
| Marketplace payment            | `payments`                                                                             | `userId`, `email`                    | optional `businessId`, plus `metadata.businessId` | `orderId`, `productId`, `sellerId`, `payoutMode` | `bweFee`, `bweFeePercent`, `payout`       | `createdAt`, `paidAt`, `updatedAt`                |
| Marketplace economic record    | `bmev_records`                                                                         | `buyerUserId`, `buyerEmail`          | optional `businessId`                             | `productId`, `sellerId`, `paymentRecordId`       | `bweFeeCents`, `sellerProceedsCents`      | `occurredAt`, `createdAt`, `updatedAt`            |
| Stripe session / webhook debug | `payments`, `webhook_events_debug`, `subscription_events`                              | `userId`, `email` when available     | optional `businessId` in metadata                 | item-specific metadata                           | yes, depending on flow                    | yes                                               |
| Seller payout readiness        | `orders`, `sellers`                                                                    | seller user/email                    | indirect via optional businessId                  | `sellerId`, `stripeAccountId`                    | indirect                                  | yes                                               |
| Founding Membership billing    | `payments`, `business_memberships`, `membership_fulfillment`, `membership_onboarding`  | `userId`, `email`                    | `businessId`                                      | `membershipId`, product key                      | yes                                       | yes                                               |
| Premium / plan subscription    | `users`, `payments`, `subscription_events`                                             | `users._id`, email                   | none                                              | plan item/product key                            | yes                                       | yes                                               |
| Black Card order / fulfillment | `black_card_orders`, `black_card_memberships`, `black_card_cards`, `payments`          | `userId`, `email`                    | none                                              | `membershipId`, card IDs                         | yes                                       | yes                                               |
| Advertising purchase           | `advertising_requests`, `ad_purchases`, `payments`, `directory_listings`               | `userId`, `email` when authenticated | optional `businessId`                             | campaign/placement metadata                      | yes                                       | yes                                               |
| Job / recruiting revenue       | checkout metadata supports job-related purchases; jobs collection stores post/job data | user/session identity                | weak                                              | `jobId`                                          | partial                                   | yes                                               |

Current truth:

- `payments` is the main cross-business economic ledger currently used by multiple paid flows
- `orders` is authoritative for marketplace operational order state
- business linkage inside transactions is improving but still optional in several lanes
- `bmev_records` exists for marketplace economic groundwork, but this artifact does not change BMEV status

## 8. Activity and event relationships

| Event / activity concept                | Storage location                                                                                | Person ID available                                            | Business ID available              | Session ID available | Timestamp             | Standardized              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------- | -------------------- | --------------------- | ------------------------- |
| Generic flow / click / route events     | `flow_events`                                                                                   | `PARTIAL`                                                      | `PARTIAL`                          | `NO`                 | `YES` via `createdAt` | `PARTIAL`                 |
| Search quality events                   | `search_quality_events`                                                                         | `NO`                                                           | `PARTIAL` via `selectedBusinessId` | `NO`                 | `YES`                 | `NO`                      |
| Marketplace reconciliation exceptions   | `flow_events`                                                                                   | `NO` or partial                                                | partial                            | `NO`                 | `YES`                 | `PARTIAL`                 |
| Seller onboarding submitted             | `flow_events`                                                                                   | `YES`                                                          | `NO` unless added elsewhere        | `NO`                 | `YES`                 | `PARTIAL`                 |
| Job post submitted                      | `flow_events`                                                                                   | `PARTIAL` via JWT context                                      | `NO`                               | `NO`                 | `YES`                 | `PARTIAL`                 |
| Consulting interest submitted           | `flow_events` + `consulting_interest`                                                           | `NO` authenticated person ID; lead email only in source record | `NO`                               | `NO`                 | `YES`                 | `NO`                      |
| Support ticket lifecycle                | `support_tickets`                                                                               | `YES` when authenticated, else email                           | `PARTIAL` via `relatedBusinessId`  | `NO`                 | `YES`                 | `PARTIAL`                 |
| Black Card rewards / redemption / audit | `black_card_rewards_ledger`, `black_card_redemptions`, `black_card_audit_events`, `flow_events` | `YES`                                                          | `NO`                               | `NO`                 | `YES`                 | `PARTIAL`                 |
| Saved jobs                              | `savedJobs`                                                                                     | `YES`                                                          | `NO`                               | `NO`                 | `YES`                 | `YES` within that feature |
| Travel map saved places                 | `travel_map_saved_places`                                                                       | `YES`                                                          | `YES` via `businessId`             | `NO`                 | `YES`                 | `PARTIAL`                 |
| Course enrollments / access             | `enrollments`, `user_entitlements`                                                              | `YES`                                                          | `NO`                               | `NO`                 | `YES`                 | `PARTIAL`                 |

Current truth:

- `flow_events` is the broadest current event sink
- it is not a fully normalized event system
- user/session/business context is optional rather than guaranteed
- different features still emit their own feature-specific records instead of one uniform event envelope

## 9. Identifier fragmentation

### 9.1 Duplicate identity risks

- One human can exist in `users`, `sellers`, `employers`, and `businesses` with the same email.
- `sellers.userId` may point to `users._id`, but standalone seller signup can create a seller with `userId: null`.
- `businesses` is both a public business entity and a login account collection for `accountType=business`.
- admin privilege is intended to be anchored to `users.isAdmin`, but runtime also accepts `role`, `roles`, or `accountType=admin`.

### 9.2 Fragmented identifiers

- person: `userId` vs `id` in JWT helpers
- person: Mongo `_id` vs email-based lookup
- business: `businesses._id` vs `directory_listings._id`
- business: `alias` vs `slug`
- marketplace: `seller._id` vs optional `seller.businessId`
- marketplace: `product.sellerId` vs optional `product.businessId`
- Stripe: seller `stripeAccountId` vs business identity
- founding membership: `membershipId` vs `businessId` vs payment `stripeSessionId`
- organization ownership: `entity_claims.entityId` / `entity_ownerships.entityId` vs `organizations._id`
- jobs: `jobs.userId`, `jobs.email`, `jobs.employerEmail`, `jobs.company` with no stable `businessId`

### 9.3 Implicit relationships

- seller to business when seller has no `businessId`
- product to business when only `sellerId` exists
- employer to business when jobs rely on email/company text only
- applicant to person when application is email-only
- support ticket to business when `relatedBusinessId` is absent but message context implies one

### 9.4 Missing relationships

- no guaranteed `personId` envelope across all events
- no guaranteed `businessId` on all commerce records
- no shared resolver linking employers/jobs to `businesses`
- no shared resolver linking organizations to businesses where they may represent the same real-world entity
- no single table/collection for role memberships, capabilities, or person-to-business relationships

## 10. Current authoritative sources

### 10.1 Current best person authority

- primary: `users`
- overlays: `sellers`, `employers`, `businesses`, `consultant_profiles`, `black_card_memberships`

### 10.2 Current best business authority

- primary: `businesses`
- overlays: `directory_listings`, `business_claims`, `ownership_reviews`, `business_memberships`, `sellers`, `products`, `advertising_requests`, `ad_purchases`

### 10.3 Current best relationship authority

- business ownership verification: `business_claims` + `ownership_reviews` + verified fields on `businesses`
- organization ownership verification: `entity_claims` + `entity_ownerships`
- seller relationship: `sellers` plus optional `businessId`
- Black Card membership: `black_card_memberships` + `black_card_cards`, mirrored to `users`
- marketplace paid truth: `orders` + `payments`

## 11. Unresolved questions

- How often do seller records actually carry `businessId` in the live canonical dataset?
- How often do products carry `businessId` versus only `sellerId`?
- Are there meaningful real-world overlaps between `organizations` and `businesses`, or should they remain separate entity classes under one resolver?
- Do employers represent businesses, departments, or recruiting operators in practice?
- Which existing business-account login records in `businesses` are true business entities versus account wrappers created only for auth?

Source inspection is sufficient for the current architecture map. Live DB confirmation is not required to state the code-level model, so no owner query is required for this checkpoint.

## 12. Smallest safe future direction

### 12.1 Proposed Person 360 direction

Keep `users` as the anchor identity when it exists, and layer a shared resolver on top that can return:

- base person identity
- active session role
- attached seller profile
- attached employer profile
- attached verified business relationships
- attached premium / Black Card / membership state
- attached consultant / creator overlays

This should be an adapter/resolver layer first, not a destructive merge.

### 12.2 Proposed Business 360 direction

Keep `businesses` as the anchor business entity and add a shared resolver that can assemble:

- directory identity
- public alias / slug
- verified ownership links
- founding membership links
- seller/storefront link
- product links
- order/payment links
- advertising/sponsorship links
- support links
- jobs/employer links when enough evidence exists

This should normalize relationships around existing `businesses._id` without forcing immediate rewrites of seller, advertising, or jobs flows.

### 12.3 Proposed relationship foundation

Add one explicit resolver layer that answers:

- `resolvePerson360(session or person key)`
- `resolveBusiness360(business key)`
- `listPersonBusinessRelationships(person key)`

The resolver should classify each relationship as:

- `verified`
- `declared`
- `seller-linked`
- `payment-linked`
- `membership-linked`
- `email-only`
- `unknown`

That gives BWE a stable trust-aware relationship layer before any schema migration.

### 12.4 Proposed event foundation

Do not replace `flow_events` yet.

Instead, define a future standard event envelope that existing emitters can gradually adopt:

- `eventType`
- `occurredAt`
- `personId`
- `businessId`
- `sessionId` when available
- `entityType`
- `entityId`
- `sourceSurface`
- `sourceRoute`
- `trustLevel`
- `metadata`

The first goal is normalization of emitted context, not replacing current storage immediately.

## 13. First implementable Phase 2 slice

### Recommended first slice

`Shared Business360 identity resolver`

### Why this is first

- `businesses` is already the closest current authoritative business entity
- multiple working systems already orbit it: directory, verified ownership, founding membership, newer marketplace business attribution
- the biggest current ambiguity is not whether business data exists, but whether marketplace, advertising, support, and jobs records can be resolved back to the same business consistently
- a read-only resolver layer is low-regression-risk because it can be introduced behind existing APIs and admin/debug tooling first

### What the slice should do

- accept `businessId`, `alias`, `slug`, seller-linked keys, and known payment-linked keys
- return one normalized business identity view
- include provenance for every resolved link
- expose trust level for each link
- remain read-only

### Regression risk

`LOW`

Reason:

- can be introduced as adapter logic without changing auth, collections, schemas, or existing write paths
- can power admin/debug/inventory APIs before touching customer flows
- preserves current working systems while reducing ambiguity for later Phase 2 slices

## 14. Source files inspected

Core identity and auth:

- `src/models/user.ts`
- `types/user.ts`
- `src/lib/auth.ts`
- `src/lib/mongodb.ts`
- `src/pages/api/auth/signup.ts`
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/me.ts`

Business and directory:

- `src/pages/api/businesses.ts`
- `src/pages/api/business/create.ts`
- `src/pages/api/business/profile.ts`
- `src/pages/api/business/update.ts`
- `src/lib/businessSubmission.ts`
- `src/lib/directoryProfileContract.ts`
- `src/lib/directoryOwnership.ts`
- `src/lib/directory/publicBusinessQuery.ts`
- `src/pages/api/admin/approve-directory-listing.ts`
- `src/pages/api/user/managed-businesses.ts`

Claims and ownership:

- `src/lib/entityClaims.ts`
- `src/pages/api/organizations/claim.ts`
- `src/pages/api/admin/organizations/claims.ts`
- `src/pages/api/founding-membership/evidence.ts`
- `src/pages/api/admin/founding-memberships.ts`
- `src/lib/founding-membership.ts`

Marketplace and commerce:

- `src/lib/marketplace/db.ts`
- `src/lib/marketplace/sellerSession.ts`
- `src/lib/marketplace/buyerSession.ts`
- `src/lib/marketplace/businessAttribution.ts`
- `src/pages/api/marketplace/create-seller.ts`
- `src/pages/api/marketplace/get-my-seller.ts`
- `src/pages/api/marketplace/readiness.ts`
- `src/lib/checkout/createProductCheckoutSession.ts`
- `src/lib/db/orders.ts`
- `src/lib/marketplace/paymentLinkage.ts`
- `src/lib/economics/marketplaceBmev.ts`
- `src/pages/api/checkout/create-session.ts`
- `src/pages/api/advertising/checkout.ts`
- `src/pages/api/stripe/webhook-handler.ts`
- `src/pages/api/admin/verifier/unified.ts`
- `src/pages/api/billing/subscription-status.ts`

Jobs, support, consultant, and activity:

- `src/pages/api/jobs/create.ts`
- `src/pages/api/jobs/employer.ts`
- `src/pages/api/applications/apply.ts`
- `src/pages/api/user/save-job.ts`
- `src/pages/api/support/create-ticket.ts`
- `src/lib/support.ts`
- `src/pages/api/consultants/profile.ts`
- `src/pages/api/employer/consultants/index.ts`
- `src/pages/api/consulting-interest.ts`
- `src/pages/api/flow-events.ts`
- `src/pages/api/search/quality-events/index.ts`
- `src/lib/analytics/flowEvents.ts`

Black Card:

- `src/lib/black-card-membership.ts`
- `src/pages/api/black-card/member-summary.ts`
- `src/pages/api/admin/black-card/memberships.ts`

## 15. Collections identified

- `users`
- `businesses`
- `directory_listings`
- `business_claims`
- `ownership_reviews`
- `entity_claims`
- `entity_ownerships`
- `sellers`
- `products`
- `orders`
- `payments`
- `bmev_records`
- `employers`
- `jobs`
- `applicants`
- `savedJobs`
- `support_tickets`
- `business_memberships`
- `membership_onboarding`
- `membership_fulfillment`
- `black_card_memberships`
- `black_card_cards`
- `black_card_orders`
- `black_card_redemptions`
- `black_card_rewards_ledger`
- `advertising_requests`
- `ad_purchases`
- `organizations`
- `consultant_profiles`
- `consulting_interest`
- `consulting_intake`
- `employer_consultant_contact_requests`
- `employer_consultant_pipeline`
- `flow_events`
- `search_quality_events`
- `user_entitlements`
- `enrollments`
- `subscription_events`
- `financial_ledger`

## 16. Program status anchor

- PHASE 0: `COMPLETE`
- PHASE 1: `COMPLETE`
- PHASE 2: `ACTIVE — WORKSTREAM 1`
- PHASES 3-7: `OUTSTANDING`
- WORLD-CLASS: `381 / 1000`
- RELEASE: `67%`
- BI: `BI-0`
- ECONOMIC SCALE: `PRE-ES-0`
- BWE-10: `INTERNAL GO / OWNER TRANSACTION PENDING / LIVE PROOF PENDING`
- BWE-13: `EXTERNAL PROOF PENDING`
