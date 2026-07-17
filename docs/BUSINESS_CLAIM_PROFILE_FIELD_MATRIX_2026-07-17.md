# Business Claim/Profile Field Matrix

_Last updated: 2026-07-17 America/Los_Angeles_

## Purpose

This note answers a concrete product and implementation question:

> After a business, organization, or comparable listing is claimed, does the current business profile surface let the owner populate the qualifying/public content fields that the platform expects?

## Short answer

**No.**

The current claimed-business profile surfaces are materially narrower than:

1. the fields already supported by business intake and public business records,
2. the fields used by directory completeness/strength logic, and
3. the level of owner-controlled content needed for a credible post-claim profile authoring experience.

---

## Evidence from current code

### 1) Current owner-editable claimed-business fields are limited

Current post-login business profile/edit flows only expose a small set of fields:

- `businessName`
- `businessAddress`
- `businessPhone`
- `description`
- sometimes `email`

Evidence:
- `src/pages/dashboard/edit-business.tsx`
- `src/pages/edit-business.tsx`
- `src/pages/api/business/update.ts`
- `src/pages/business/profile.tsx`
- `src/pages/api/business/profile.ts`

### 2) Business intake already supports a broader authoring model

Business submission already collects more fields than the claimed-business edit flow allows.

Current intake fields include:
- `businessName`
- `category`
- `location` -> normalized into `city` + `state`
- `phone`
- `email`
- `website`
- `description`
- `facebook`
- `twitter`
- `logo` upload

Evidence:
- `src/lib/businessSubmission.ts`
- `src/pages/business-directory/add-business.tsx`
- `src/pages/api/business/create.ts`

### 3) Public business records and directory logic expect richer data

Directory/public listing logic uses or rewards fields including:
- `description`
- `address`
- `city`
- `state`
- `phone`
- `category` / `categories` / `display_categories`
- `website`
- `image`

Evidence:
- `src/lib/directory/completeness.ts`
- `src/pages/api/search/businesses.ts`
- `src/pages/api/getBusiness.js`
- `src/pages/business-directory/[alias].tsx`

### 4) Claim/membership state is separate from content authoring richness

The founding claim flow establishes membership, claim status, and review state, but it does **not** currently deliver a rich owner authoring surface after claim.

Evidence:
- `src/lib/founding-membership.ts`
- `src/pages/api/founding-membership/status.ts`

---

## Current gap

### Product gap

A claimed listing can move into ownership review and membership status, while the owner still lacks enough fields to fully populate the public listing with the qualifying data the platform says matters.

### Implementation gap

There is a mismatch between:

- the business document shape the platform already stores or can store,
- the completeness/public ranking expectations,
- and the fields exposed in owner-editable post-claim profile forms.

This means the platform currently risks:

- weak claimed listings,
- low completeness scores,
- poor public-facing profiles,
- admin/manual cleanup dependency,
- owner frustration after claim/payment.

---

## Field matrix

### A) Fields currently owner-editable after claim/login

| Field | Current owner editable? | Notes |
|---|---:|---|
| Business name | Yes | Present in edit pages/API |
| Email | Partial | Supported in one update path; not consistently exposed |
| Address | Yes | `businessAddress` path exists, but public model also uses `address` |
| Phone | Yes | Present |
| Description | Yes | Present |
| Website | No | Missing from claimed-business edit flow |
| Category / categories | No | Missing from claimed-business edit flow |
| City / state | No direct structured control | Derived on intake but not well-managed post-claim |
| Social links | No | Missing |
| Logo / primary image | No in claim/business flow | Intake supports logo; post-claim business flow does not |
| Gallery/images | No | Missing |
| Hours | No | Missing |
| Service area | No | Missing |
| Tags / specialties | No | Missing |
| Products/services summary | No | Missing |
| CTA links / booking/order links | No | Missing |

### B) Fields that should be owner-editable immediately

These should be editable without requiring admin review, assuming normal validation and abuse controls.

- business display name / DBA
- short description
- full description / about
- website
- primary phone
- public contact email
- address
- city
- state
- zip/postal code
- service area
- primary category
- secondary categories
- social links
- logo
- gallery/images
- hours
- products/services summary
- specialties/tags
- CTA links (book, order, learn more)

### C) Fields that should be editable but review-gated

These should be owner-submittable, but changes should trigger review before becoming authoritative or before changing trust states.

- legal business name when it conflicts with the verified/public identity
- ownership/claim identity fields
- verified badge / verification evidence inputs
- tax/legal documentation fields
- sensitive category changes, if they affect placement/compliance/trust
- canonical slug/alias changes
- any field used as a trust or compliance primitive rather than normal profile content

### D) Fields that should remain system/admin-controlled

- claim status
- ownership review status
- claim lock state
- founding membership status
- directory approval / public visibility approval flags
- moderation status
- payment / fulfillment / sponsor timing state
- internal trust/risk notes

---

## Recommended canonical owner authoring model

### Minimum viable claimed-business authoring set

For a credible post-claim experience, the owner profile should support at least:

1. Identity
   - business name
   - public contact email
   - phone
   - website

2. Location
   - address
   - city
   - state
   - zip/postal code
   - service area toggle/text where applicable

3. Public profile
   - short description
   - long description
   - category
   - secondary categories
   - tags/specialties
   - products/services

4. Media
   - logo
   - cover image
   - gallery images

5. Trust/supporting profile data
   - hours
   - social links
   - booking/order/contact CTA links

### Recommendation on status handling

Use a split model:

- **owner-editable content state** for normal profile richness
- **review-gated trust state** for claim/legal/verification-sensitive changes

That preserves trust while still giving the owner enough power to actually build a strong listing.

---

## Recommendation for implementation order

### Phase 1, field-model and API normalization

Normalize the claimed-business authoring contract so the profile API can consistently read/write the canonical public listing fields, especially:

- `businessName` / `business_name`
- `businessAddress` / `address`
- `businessPhone` / `phone`
- `category` / `categories` / `display_categories`
- `image` / `logo` / `images`

### Phase 2, expanded claimed-business authoring form

Add owner-editable support for:

- website
- categories
- city/state/address normalization
- social links
- logo/primary image
- longer profile content
- service summary/tags

### Phase 3, review-gated trust edits

Add a moderation/review path for:

- legal identity changes
- sensitive category changes
- verification evidence
- public trust badge-impacting edits

---

## Conclusion

The current answer to the product question is:

**No, the business profile does not currently provide appropriate field coverage for owners to populate all meaningful qualifying/public content after claim.**

The current post-claim profile surface is too limited relative to:
- the data model already in use,
- the directory completeness logic,
- and the expected owner experience.

This should be treated as an active product and implementation gap in the claimed-business lane.
