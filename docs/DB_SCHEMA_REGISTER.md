# DB Schema Register

Authoritative register of active MongoDB collections, ownership, and expected core fields.

## Environment routing

- Default DB: `bwes-cluster`
- Runtime override: `MONGODB_DB`
- URI envs: `MONGODB_URI` (primary), `MONGO_URI` (fallback in some scripts)

## Registered Collections

### password_resets

- Owner: Auth
- Purpose: Password reset token lifecycle
- Core fields: `email`, `accountType`, `collection`, `tokenHash`, `createdAt`, `expiresAt`, `usedAt`, `consumedAt`, `ip`, `userAgent`
- Security: raw token must not be stored

### password_reset_rate_limits

- Owner: Auth
- Purpose: Request/reset abuse throttling
- Core fields: `key`, `createdAt`, `expiresAt`

### referral_codes
- Owner: Growth
- Purpose: Canonical referral code ownership
- Core fields: `ownerId`, `ownerEmail`, `accountType`, `code`, `createdAt`, `updatedAt`

### referral_events
- Owner: Growth
- Purpose: Referral attribution events
- Core fields: `code`, `ownerId`, `ownerEmail`, `ownerAccountType`, `event`, `context`, `ip`, `userAgent`, `createdAt`

### consulting_intake

- Owner: Recruiting/Consulting
- Purpose: Employer/candidate intake workflow
- Core fields: `type`, `name`, `email`, `company`, `phone`, `details`, `status`, `createdAt`, `source`

### consulting_interest

- Owner: Recruiting/Consulting (legacy path)
- Purpose: Lightweight interest capture
- Core fields: `name`, `email`, `createdAt`, `status`, `source`

### businesses

- Owner: Directory
- Purpose: Business listings + trust/search quality
- Core fields in active flows: `alias`, `status`, `business_name`, `description`, `address`, `city`, `state`, `phone`, `website`, `image`, `missingFields`, `completenessScore`, `isComplete`, `lastAuditAt`

### organizations

- Owner: Directory
- Purpose: Organization listings + trust/search quality
- Core fields in active flows: `slug`, `name`, `status`, `description`, `address`, `city`, `state`, `phone`, `website`, `missingFields`, `completenessScore`, `isComplete`, `lastAuditAt`

## VERIFY NEXT (schema verification backlog)

- users
- sellers
- employers
- jobs
- applicants
- products
- orders
- advertising + directory purchase related collections
- consulting_interest (legacy status/retention decision)
