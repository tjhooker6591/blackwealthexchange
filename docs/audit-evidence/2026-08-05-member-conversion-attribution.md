# DA-01 Recent Member Conversion Attribution Audit

Date: 2026-08-05
Repository: `/Users/blackforge/workspace/bwe/repos/repo_clean`
Branch: `friday-release-candidate`
Analysis mode: read-only

## Scope definition

- Scope used for DA-01: the six most recent real role-account joins across `users`, `businesses`, `sellers`, and `employers`.
- Exclusions:
  - test/admin/internal proof accounts
  - imported/public directory business rows that are not actual business-owner signups
- Resulting six-member scope:
  - `M1` business-owner signup
  - `M2` through `M6` general-user signups

## Member matrix

| Member | Account type | Source / entry path | Business owner | Business found | Claim started | Claim completed | Membership conversion | Current blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `M1` | Business Owner | `accountType=business` signup is provable; route/source attribution not available | yes | yes, self-created business record | no claim record | no | none | business account exists, but no linked membership, claim-review, or payment follow-on records |
| `M2` | General User | `accountType=user` signup is provable; source attribution not available | no | not established | no | no | none | no linked search, claim, ownership, or payment records after signup |
| `M3` | General User | `accountType=user` signup is provable; source attribution not available | no | not established | no | no | none | no linked search, claim, ownership, or payment records after signup |
| `M4` | General User | `accountType=user` signup is provable; source attribution not available | no | not established | no | no | none | no linked search, claim, ownership, or payment records after signup |
| `M5` | General User | `accountType=user` signup is provable; source attribution not available | no | not established | no | no | none | no linked search, claim, ownership, or payment records after signup |
| `M6` | General User | `accountType=user` signup is provable; source attribution not available | no | not established | no | no | none | no linked search, claim, ownership, or payment records after signup |

## Conversion funnel

- Joined: `6`
- Search established from current linked data: `0 proven`
- Business found established from current linked data: `1` (`M1` only, self-created business-owner record)
- Claim started: `0`
- Ownership verification completed: `0`
- Founding / paid membership conversion: `0`

## Account-type breakdown

- Business Owner: `1`
- Seller: `0`
- Employer: `0`
- General User: `5`

## Claim / ownership breakdown

- Searched for a business: `SOURCE ATTRIBUTION NOT AVAILABLE`
- Found their business: `1 self-created business-owner record`, `0 additional proven finds`
- Entered claim mode: `0 proven`
- Started claim verification: `0`
- Completed ownership verification: `0`

## Membership conversion

- Founding / paid member conversions in this six-member scope: `0`

## Root finding

The largest measurable drop-off is from `JOIN (6)` to any provable downstream claim or paid-membership action (`0`). That should not be treated as a confirmed search or claim defect from this dataset alone:

- five of the six recent real joins are general-user signups, for whom claim flow may never have been the intended next step
- the current data does not provide identity-linked source/search telemetry for these members
- no linked `business_claims`, `ownership_reviews`, `business_memberships`, `membership_onboarding`, `membership_fulfillment`, `payments`, `subscription_events`, `entity_ownerships`, `referral_events`, or user-linked `flow_events` were found for these six members

## Classification

- overall attribution status: `SOURCE ATTRIBUTION NOT AVAILABLE`
- biggest measured drop-off classification: `DATA_GAP` with a secondary component of `EXPECTED_USER_BEHAVIOR` for the five general-user signups
- no current evidence established a live `AUTH/SESSION_DEFECT`, `SEARCH/DIRECTORY_DEFECT`, `CLAIM/OWNERSHIP_DEFECT`, or `PAYMENT/MEMBERSHIP_DEFECT` for this six-member scope

## Validation basis

- read-only Mongo inspection across:
  - `users`
  - `businesses`
  - `sellers`
  - `employers`
  - `business_claims`
  - `ownership_reviews`
  - `business_memberships`
  - `membership_onboarding`
  - `membership_fulfillment`
  - `payments`
  - `subscription_events`
  - `entity_ownerships`
  - `referral_events`
  - `flow_events`
- no production data writes
- no production code changes
