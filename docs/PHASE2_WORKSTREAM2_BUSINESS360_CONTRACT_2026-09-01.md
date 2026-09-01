# Phase 2 Workstream 2 — Business360 Read-Only Resolver Contract

Date: `2026-09-01`

Purpose: define one shared read-only adapter that answers:

`What do we currently know about this business across the platform?`

Scope rules for this contract:

- read-only only
- anchor on existing `businesses._id`
- no schema changes
- no migrations
- no backfills
- no DB writes
- no customer-facing dependency by default

## 1. Anchor

- Canonical Business360 anchor: `businesses._id`
- Current shared resolver: `src/lib/business360.ts`
- Initial internal-safe consumer: `src/pages/api/admin/business360.ts`

Business360 preserves existing linked identifiers as provenance, not replacements:

- `alias`
- `slug`
- `directory_listings._id`
- `seller._id`
- `stripeAccountId`
- `membershipId`
- campaign, order, payment, and ticket identifiers

Business360 does not create a new business identity model. It reports current truth around the existing `businesses` anchor.

## 2. Contract shape

`resolveBusiness360(db, { businessId, sections? })`

Returns:

- `ok: true` with normalized lane data when the anchor business exists
- `ok: false` with `MISSING_BUSINESS_ID` or `BUSINESS_NOT_FOUND` when it does not

Always-resolved foundation:

- `identity`

Optional lane sections:

- `directory`
- `ownership`
- `membership`
- `seller`
- `commerce`
- `advertising`
- `jobs`
- `support`
- `activity`
- `organization`

Metrics returned with every result:

- `queryCount`
- `latencyMs`
- `sectionsRequested`
- `sectionsResolved`
- `sectionQueryCount`

## 3. Relationship states

Per-lane relationship state is explicit:

- `LINKED`
- `PARTIALLY_LINKED`
- `NOT_LINKED`
- `NOT_APPLICABLE`
- `UNKNOWN`

Business360 does not inflate weak or missing linkage into `LINKED`.

## 4. Provenance and trust rules

Current normalized provenance kinds:

- `VERIFIED`
- `MEMBERSHIP_LINKED`
- `SELLER_LINKED`
- `PAYMENT_LINKED`
- `DIRECT_BUSINESS_ID`
- `EMAIL_ONLY`
- `TEXT_MATCH_ONLY`
- `UNKNOWN`

Rules:

- `VERIFIED` means the relationship is supported by existing verified ownership records.
- `MEMBERSHIP_LINKED` means the relationship is supported by `business_memberships.businessId`.
- `SELLER_LINKED` means the relationship is supported by seller records carrying direct `businessId`.
- `PAYMENT_LINKED` means the relationship is supported by direct payment/order business identifiers.
- `DIRECT_BUSINESS_ID` means an existing record explicitly stores the business identifier.
- `EMAIL_ONLY` and `TEXT_MATCH_ONLY` are never promoted to authoritative business linkage.
- `UNKNOWN` is used when Business360 can only report absence or uncertainty.

## 5. Lane truth

### Identity

- Source: `businesses`
- Anchor fields: `_id`, `businessName`/`business_name`/`name`, `alias`, `slug`, `status`, `publicListingStatus`
- Current rule: authoritative

### Directory

- Sources: `directory_listings`, `businesses`
- Direct linkage required: `directory_listings.businessId` or `directory_listings.businessIdReal`
- No listing means `NOT_LINKED`

### Ownership / trust

- Sources: `business_claims`, `ownership_reviews`, `businesses`
- Existing ownership truth is reported, not re-decided
- Business360 does not replace `resolveVerifiedOwnership` or related ownership logic

### Membership

- Sources: `business_memberships`, `membership_fulfillment`, `membership_onboarding`
- Direct linkage required: `business_memberships.businessId`

### Seller / storefront

- Sources: `sellers`, `products`
- Direct linkage preferred: `seller.businessId`
- Existing marketplace attribution helper is reused: `resolveCanonicalMarketplaceBusinessId`
- Missing `seller.businessId` is reported as partial or missing, never backfilled

### Commerce

- Sources: `products`, `orders`, `payments`
- Direct `businessId` relationships are preferred
- Product-linked order/payment overlays are allowed only through product records already carrying the anchored business identifier

### Advertising / sponsorship

- Sources: `advertising_requests`, `ad_purchases`, `featured_sponsor_schedule`, `directory_listings`
- Direct linkage required: existing business identifier fields

### Jobs / employer

- Sources: `jobs`, `employers`
- Only direct `businessId` linkage is reported as authoritative
- Company name, email, and display text do not become business identity

### Support

- Source: `support_tickets`
- Direct linkage required: `relatedBusinessId`

### Activity

- Sources: `flow_events`, `search_quality_events`
- Current activity truth is partial and non-standardized

### Organization

- Source: `organizations` only when the business already carries `organizationId` or `organizationSlug`
- `organizations` are not merged into `businesses`

## 6. Null and unknown behavior

- Missing business ID returns `MISSING_BUSINESS_ID`
- Missing business anchor returns `BUSINESS_NOT_FOUND`
- Unrequested sections remain present with `UNKNOWN` state so the contract stays stable
- Missing optional overlays resolve to `NOT_LINKED` or `NOT_APPLICABLE`, not errors
- Weak jobs and organization links remain unresolved when direct evidence is absent

## 7. What Business360 does not do

Business360 does not:

- create a new collection
- merge `organizations` into `businesses`
- rewrite auth
- replace Directory
- replace Seller
- replace Claim Verification
- replace Founding Membership
- replace Stripe
- infer authoritative links from name, email, or free text
- backfill `businessId`
- write to the database
- change customer-facing route behavior

## 8. Smallest safe next-use rule

Before any public adoption:

- preserve the current admin-safe internal route and tests
- prefer targeted internal consumers
- keep all existing platform systems authoritative within their own lanes
- add shared resolver consumers incrementally, not by rewrite
