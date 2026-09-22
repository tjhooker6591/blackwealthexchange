# Claim Architecture and Profile Parity

_Last updated: 2026-07-18 America/Los_Angeles_

## Terminology correction

BWE must distinguish the following concepts:

1. **Authenticated account / representative**
   - The signed-in account that performs an action.
   - This may be a person acting directly, or an authorized representative acting on behalf of another entity.
   - Authentication answers who is signed in, what account type is signed in, and what system permissions that account has.

2. **Claimant entity**
   - The party asserting authority over a target profile.
   - This may be a person, business, organization, church, nonprofit, seller, employer, creator, or another supported BWE entity.
   - Current code often collapses this concept into a personal-account field such as `claimantUserId`. That is a temporary implementation detail, not the correct architecture.

3. **Target profile / target entity**
   - The existing profile being claimed or managed.
   - Examples: business profile, organization profile, church profile, nonprofit profile, seller profile, employer profile, creator profile, or personal profile where applicable.

4. **Verified management relationship**
   - The verified authorization that allows a claimant entity, through an authenticated representative, to manage a target profile.
   - This should answer:
     - which account performed the action
     - which claimant entity was represented
     - which target profile was claimed
     - what authority or representative role was asserted
     - whether that authority was verified
     - whether that authority remains active

## Current implementation state

### What is working now

- Business owner-management authorization is session-derived and verified-ownership-bound.
- Organization claim verification now materializes a canonical active relationship in `entity_ownerships`.
- Organization verified-owner GET/PATCH and post-revoke denial were proven in deterministic local API tests.

### What is not yet modeled correctly enough

The current organization proof path still uses personal-account-centric field names:

- `claimantUserId`
- `userId` on `entity_ownerships`
- `parseSessionIdentity()` returning only the authenticated account identity

Those fields currently represent the **authenticated representative account**, not the full claimant-entity model.

That is sufficient for the local authorization proof that just passed, but it is **not** the final BWE claim architecture.

## Required target claim model

Where existing architecture permits, claim and ownership relationships should distinguish:

- `claimantType`
- `claimantId`
- `claimantAccountId` (or representative account ID)
- `targetEntityType`
- `targetEntityId`
- representative role / authority
- verification status
- claim history / audit history

This must not force every business, church, organization, or nonprofit claimant into a personal-user ownership model.

## Canonical ownership guidance

For the current organization flow:

- **Canonical verified-management representation:** `entity_ownerships`
- **Claim / review history representation:** `entity_claims`
- **Editable public profile representation:** target entity document (`organizations`, later church/nonprofit/business/etc.)

The target profile must remain the target profile. A verified claim grants management rights over that profile. It does not convert the target profile into a personal profile or create a duplicate profile record.

## Profile parity by entity type

Each profile type must be audited independently. Fields must not be copied blindly across entity types.

### Personal profile

Examples:

- name
- public bio
- profile image
- professional details
- public contact preferences

### Business profile

Examples:

- business name
- description
- products
- services
- hours
- business categories
- address
- service area
- media
- social links
- CTAs

### Church profile

Examples:

- church name
- denomination where applicable
- service times
- ministries
- programs
- community services
- address
- media
- social links
- CTAs

### Organization / nonprofit profile

Examples:

- organization name
- mission
- programs
- services
- communities served
- volunteer or donation links
- address
- service area
- media
- social links
- CTAs

## Admin Dashboard requirements

Admin Dashboard integration must expose, per claim/relationship:

- authenticated account / representative
- claimant entity
- target profile
- entity and profile types
- representative authority
- verification state
- manageable profiles
- conflicting claims
- disputes
- revocations
- audit history

These relationships must not be shoved under generic user-management terminology just because a human representative signs in.

## Immediate implementation guardrails

Before continuing broader implementation:

1. Do not use “user” as the generic term for every claimant or owner in new docs, proof summaries, or admin copy.
2. Treat current `claimantUserId` / `userId` ownership links as **representative-account identifiers**, not the full claimant-entity model.
3. Preserve the working business security remediation while planning a broader claimant-entity refactor.
4. Update future field-parity and claim docs to distinguish:
   - authenticated account / representative
   - claimant entity
   - target profile
   - verified management relationship
5. Audit existing `users`, businesses, organizations, sellers, employers, claims, and ownership records before inventing any new account model.
