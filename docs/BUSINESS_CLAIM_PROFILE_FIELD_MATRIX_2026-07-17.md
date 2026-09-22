# Business Claim/Profile Field Matrix

_Last updated: 2026-07-18 America/Los_Angeles_

> Terminology note: this document previously used "owner" and "user" too loosely. Going forward, distinguish authenticated representative account, claimant entity, target profile, and verified management relationship. Current business code still uses representative-account-centric identifiers in places; that is an implementation constraint, not the desired long-term claim architecture.

## Phase 1 reconciliation, live code audit

This audit was reconciled against the live owner-edit path and public listing code, not earlier assumptions.

## Actual current field matrix

| Field                           | Business public listing uses                      | Business representative edit before patch | Business representative edit after patch              | Organization public listing uses            | Organization representative claim/edit path exists? |
| ------------------------------- | ------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Name                            | Yes (`business_name` / `businessName`)            | Yes                                       | Yes                                                   | Yes (`name`)                                | No                                                  |
| Description                     | Yes                                               | Yes                                       | Yes                                                   | Yes                                         | No                                                  |
| Address                         | Yes (`address`)                                   | Yes (`businessAddress` -> `address`)      | Yes                                                   | Yes                                         | No                                                  |
| City                            | Yes                                               | Yes                                       | Yes                                                   | Yes                                         | No                                                  |
| State                           | Yes                                               | Yes                                       | Yes                                                   | Yes                                         | No                                                  |
| Phone                           | Yes (`phone`)                                     | Yes (`businessPhone` -> `phone`)          | Yes                                                   | Yes                                         | No                                                  |
| Public contact email            | Stored, owner-facing only                         | Yes                                       | Yes                                                   | Not surfaced publicly                       | No                                                  |
| Website                         | Yes                                               | Yes                                       | Yes                                                   | Yes                                         | No                                                  |
| Primary category                | Yes (`category` / `display_categories`)           | Yes                                       | Yes                                                   | Indirect (`orgType`)                        | No                                                  |
| Secondary categories            | Yes (`categories`)                                | Yes                                       | Yes                                                   | No comparable owner path                    | No                                                  |
| Facebook                        | Stored/publicly retrievable in profile API        | Yes                                       | Yes                                                   | Yes                                         | No                                                  |
| Twitter / X                     | Stored/publicly retrievable in profile API        | Yes                                       | Yes                                                   | Yes                                         | No                                                  |
| Logo / primary image            | Yes (`image` / `logo`, completeness uses `image`) | No                                        | Yes                                                   | Not currently projected on org detail route | No                                                  |
| Gallery images                  | Yes (`images`)                                    | No direct control                         | Preserved, primary image write also syncs `images[0]` | No                                          | No                                                  |
| Claim / ownership status fields | Yes                                               | No                                        | No                                                    | Status only                                 | No                                                  |

## Key findings

1. The live business representative edit path already had Phase 1 support for website, categories, city/state, and social links.
2. The meaningful remaining ordinary business-profile authoring gap in that path was the primary logo/image field, which public completeness already expects.
3. The previous claim/profile matrix overstated missing business fields.
4. Organizations, churches, and nonprofits still lacked a proven authenticated representative claim/edit path at the time of the original audit. The local organization API proof now exists, but the broader claimant-entity architecture still needs to distinguish representative account from claimant entity.

## Ordinary representative-authoring fields still missing after this Phase 1 patch

Business path still does **not** provide authenticated representative editing for:

- gallery management beyond the single primary image
- hours
- service area
- specialties/tags
- products/services summary
- CTA links
- richer social set beyond facebook/twitter
- zip/postal code as a distinct field

These are ordinary content fields, but they go beyond the minimal Phase 1 closure requested here.

## Trust-sensitive fields intentionally not opened

Still system/admin controlled:

- claim stage
- ownership review status
- public listing status
- verification flags
- claim lock state
- visibility approval flags
- founding membership linkage
- canonical alias/slug changes

## Phase 1 business edit-path change made

Minimal live-code closure:

- added owner editing for `image` / `logo` on the business PATCH path
- mirrored primary image writes into `image`, `logo`, and `images`
- changed social updates to dot-path partial updates so editing one social field no longer replaces the whole `social` object

## Structural blocker for organizations

At the time of the original matrix, there was no representative-authenticated organization claim/edit route comparable to:

- `src/pages/api/business/profile.ts`
- `src/pages/api/business/update.ts`
- `src/pages/edit-business.tsx`
- `src/pages/dashboard/edit-business.tsx`

The API foundation now exists for organizations, but organizations, churches, and nonprofits still cannot be considered fully closed until the implementation is generalized beyond representative-account-centric ownership fields and the applicable profile editors are completed by entity type.
