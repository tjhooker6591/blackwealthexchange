# Pamfa Seller -> Business Owner Decision Packet

Date: `2026-08-26`

Purpose: assemble the current read-only evidence needed for the owner to choose the canonical Pamfa business relationship for marketplace seller `67fd9ed3acdef9011c60ff99` and product `680d23a3dc57cdf2efedf784` without guessing and without mutating MongoDB.

## Guardrails

- No DB mutation performed.
- No `seller.businessId` write performed.
- No `product.businessId` write performed.
- No Stripe transaction executed.
- No Stripe configuration changed.

## Current blocker

The current marketplace proof candidate is `Pamfa hoodies` (`680d23a3dc57cdf2efedf784`).

The seller exists and has a Stripe account reference, but the canonical seller -> business relationship is not deterministic from the marketplace records alone because:

- product `680d23a3dc57cdf2efedf784` has no `businessId`
- seller `67fd9ed3acdef9011c60ff99` has no `businessId`
- seller `userId` is `67fd9ed3acdef9011c60ff99`, which does not match the verified Pamfa owner user currently attached to the strongest business candidate
- multiple Pamfa-related business records exist

## Marketplace records

### Seller

- seller `_id`: `67fd9ed3acdef9011c60ff99`
- status: `active`
- email: `tjameshooker@gmail.com`
- stripeAccountId: `acct_1T2PsEE6EN5PQSO4`
- userId: `67fd9ed3acdef9011c60ff99`
- businessId: missing

### Products currently linked to that seller

- `680d23a3dc57cdf2efedf784` — `Pamfa hoodies` — slug `pamfa-hoodies` — status `active` — price `$49.99`
- `680d2a27dc57cdf2efedf785` — `Pamfa sneakers` — slug `pamfa-sneakers` — status `active` — price `$150.00`
- `69644a50d65b1e1ace411a0d` — `Thomas Hooker author` — status `active` — price `$18.99`

For all three current products above:

- sellerId is `67fd9ed3acdef9011c60ff99`
- no canonical `businessId` is stored on the product record

### Marketplace activity evidence

Relevant flow events exist for the Pamfa products:

- `product_detail_viewed`
- `marketplace_buy_started`
- `marketplace_checkout_started`

Observed on `2026-08-09` for:

- `Pamfa hoodies` (`680d23a3dc57cdf2efedf784`)
- `Pamfa sneakers` (`680d2a27dc57cdf2efedf785`)

Current paid-proof state remains unfulfilled:

- orders linked to these Pamfa products: none found
- payments linked to these Pamfa products: none found

## User records tied to the Pamfa evidence

### User with seller email

- user `_id`: `680c1e52770af2064fe4c7ad`
- email: `tjameshooker@gmail.com`
- accountType: `user`
- this is the strongest non-marketplace user anchor because it matches the seller email exactly

### Secondary Pamfa-related user

- user `_id`: `6816f4a93830fc8d2a1238f9`
- email: `tjhooker007@hotmail.com`
- accountType: `user`

### Important mismatch

- seller `userId` is `67fd9ed3acdef9011c60ff99`
- no matching user record was found for that ID in `users`
- the verified Pamfa ownership/business records instead point to user `680c1e52770af2064fe4c7ad`

This mismatch is a key reason the seller -> business relationship is not yet deterministic.

## Pamfa business candidates

### Candidate A

- business `_id`: `6a45de2d3278d888ed5d0730`
- names: `Pamfa United Citizens`
- alias / slug: `pamfa-united-citizens`
- status: `active`
- email: `evil@example.com`
- website: `https://www.facebook.com/Pamfaunitedcitizens`
- address fields present: `3301 Main St`, `3301 college park georgia 30349`, `GEORGIA`, `30349`
- claimStage: `ownership_verified`
- ownershipReviewStatus: `ownership_verified`
- claimedByUserId: `680c1e52770af2064fe4c7ad`
- managedByUserId: `680c1e52770af2064fe4c7ad`
- ownerUserIds: `["680c1e52770af2064fe4c7ad"]`

Related evidence tied to Candidate A:

- business claim `pamfa-claim:6a45de2d3278d888ed5d0730:680c1e52770af2064fe4c7ad`
- business membership `founding_verified_business_growth_membership:6a45de2d3278d888ed5d0730`
- membership onboarding `pamfa-onboarding:6a45de2d3278d888ed5d0730`
- membership fulfillment `pamfa-fulfillment:6a45de2d3278d888ed5d0730`
- ownership review `pamfa-review:6a45de2d3278d888ed5d0730:680c1e52770af2064fe4c7ad`

Assessment of the evidence:

- this is the strongest business candidate in the canonical data
- it has the richest verified ownership trail
- it is directly tied to user `680c1e52770af2064fe4c7ad`, whose email matches the seller email
- it is not yet deterministically linked from the seller/product records themselves

### Candidate B

- business `_id`: `67f4a2f25826b5d0fcf2ecdd`
- businessName: `Pamfa`
- alias / slug: `pamfa`
- status: `pending`
- email: `tjameshooker@gmail.com`
- no verified ownership trail found
- no marketplace `businessId` linkage found

Assessment of the evidence:

- strong email overlap with the seller
- weaker business-truth evidence than Candidate A
- pending record rather than active verified record

### Candidate C

- business `_id`: `67ea165aca2270d775407020`
- businessName: `pamfa united citizens`
- status: `pending`
- email: `tjhooker007@hotmail.com`
- no verified ownership trail found

Assessment of the evidence:

- plausible historical/duplicate Pamfa record
- weaker than Candidate A

### Candidate D

- business `_id`: `67f19866e8787c4174d84544`
- businessName: `Pamfa united Citizens`
- status: `pending`
- email: `tjameshooker@gamil.cin`
- no verified ownership trail found

Assessment of the evidence:

- likely typo-email historical/duplicate record
- weaker than Candidate A

## Why the relationship is still ambiguous

There is meaningful evidence pointing toward Candidate A as the strongest business record, but the marketplace linkage is still not canonical because:

- the product has no `businessId`
- the seller has no `businessId`
- the seller `userId` does not resolve to the verified owner user currently attached to Candidate A
- other Pamfa business records still exist in canonical data

That means the current evidence supports an owner decision, but it does not authorize Black to guess or write the relationship unilaterally.

## Owner decision requested

Please choose the canonical business relationship for marketplace seller `67fd9ed3acdef9011c60ff99` and the Pamfa product family.

Decision options:

- confirm Candidate A (`6a45de2d3278d888ed5d0730`) as the canonical business for the Pamfa seller/product path
- confirm a different existing Pamfa business record as canonical
- direct a merge/archive/cleanup plan for the non-canonical Pamfa duplicates before marketplace attribution is finalized
- direct that the seller/product path remain unlinked until additional evidence is gathered

## Not yet authorized

Until the owner explicitly chooses the canonical relationship:

- do not write `seller.businessId`
- do not write `product.businessId`
- do not execute a real Stripe transaction
- do not mark BWE-10 ready for owner transaction proof
