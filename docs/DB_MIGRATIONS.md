# DB Migrations / Index Changes

Track all applied and required DB migrations/index changes.

## Applied / Required (backfilled)

### 2026-03 Reset lifecycle hardening

Collections:

- `password_resets`
- `password_reset_rate_limits`

Changes:

- Store hashed token only (`tokenHash`), no raw token.
- Add lifecycle fields (`expiresAt`, `usedAt`, `consumedAt`).
- Reject expired and reused tokens in reset flow.
- TTL index on `password_resets.expiresAt`.
- TTL index on `password_reset_rate_limits.expiresAt`.
- Query indexes: `password_resets.tokenHash`, `password_resets.email+createdAt`, `password_reset_rate_limits.key+createdAt`.

### 2026-03 Referral engine v1
Collections:
- `referral_codes`
- `referral_events`

Changes:
- Added canonical referral code ownership records.
- Added referral event tracking for invite and conversion lifecycle events.
- Added indexes for code uniqueness and attribution query paths.

### 2026-03 Recruiting consulting v1

Collection:

- `consulting_intake`

Changes:

- Introduced structured intake writes for employer/candidate workflows.
- Suggested next indexes (pending formal migration):
  - `{ status: 1, createdAt: -1 }`
  - `{ email: 1, createdAt: -1 }`

### 2026-03 Directory trust / alias integrity

Collection:

- `businesses`

Changes:

- Verify partial unique approved alias index: `alias_approved_unique`.

### 2026-03 Directory completeness model

Collections:

- `businesses`
- `organizations`

Changes:

- Completeness fields introduced and stamped:
  - `missingFields[]`
  - `completenessScore`
  - `isComplete`
  - `lastAuditAt`

### 2026-03 DB name/env routing centralization

Changes:

- Critical routes moved from hardcoded `bwes-cluster` to env helper (`getMongoDbName`) for safe environment routing.
- `MONGODB_DB` is the explicit environment override for database selection across environments.

## VERIFY NEXT (migration backlog)

- Formal migrations/index plans for: users, sellers, employers, jobs, applicants, products, orders, advertising purchase collections, directory purchase collections.
