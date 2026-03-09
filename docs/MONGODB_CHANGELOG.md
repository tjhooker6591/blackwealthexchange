# MongoDB Changes / Required Updates

This document lists MongoDB schema/index updates required by the current BWE codebase hardening + feature work.

## Environment target

- Database name default: `bwes-cluster`
- Can be overridden via: `MONGODB_DB`

---

## 1) Password reset lifecycle (P0 hardening)

### Collection: `password_resets`

Used by:

- `src/pages/api/auth/request-reset.ts`
- `src/pages/api/auth/reset-password.ts`

### Required fields (document shape)

- `email: string`
- `accountType: string`
- `collection: string` (target account collection, e.g. `users`)
- `tokenHash: string` (**hashed token only, no raw token storage**)
- `createdAt: Date`
- `expiresAt: Date`
- `usedAt: Date | null`
- `consumedAt: Date | null` (set on use)
- `ip: string | null`
- `userAgent: string | null`

### Required indexes

- TTL cleanup:
  - `{ expiresAt: 1 }` with `expireAfterSeconds: 0`
- Token lookup/uniqueness:
  - `{ tokenHash: 1 }` unique
- Request lookup:
  - `{ email: 1, createdAt: -1 }`

### Security rule

- Raw reset token must **never** be stored.
- Only `tokenHash` is persisted.

---

## 2) Password reset abuse protection

### Collection: `password_reset_rate_limits`

Used by:

- `src/pages/api/auth/request-reset.ts`
- `src/pages/api/auth/reset-password.ts`

### Required fields

- `key: string` (IP/email/token-hash scoped key)
- `createdAt: Date`
- `expiresAt: Date`

### Required indexes

- TTL cleanup:
  - `{ expiresAt: 1 }` with `expireAfterSeconds: 0`
- Query support:
  - `{ key: 1, createdAt: -1 }`

---

## 3) Recruiting & Consulting v1 intake

### Collection: `consulting_intake`

Used by:

- `src/pages/api/consulting-intake.ts`

### Current fields

- `type: "employer" | "candidate"`
- `name: string`
- `email: string`
- `company: string | null`
- `phone: string | null`
- `details: string`
- `status: "new" | ...`
- `createdAt: Date`
- `source: "homepage_recruiting_section"`

### Recommended indexes (next pass)

- `{ status: 1, createdAt: -1 }`
- `{ email: 1, createdAt: -1 }`

---

## 4) Legacy consulting interest capture

### Collection: `consulting_interest`

Used by:

- `src/pages/api/consulting-interest.ts`

### Current fields

- `name: string`
- `email: string`
- `createdAt: Date`
- `status: "new"`
- `source: "website"`

### Recommended indexes (next pass)

- `{ email: 1 }` unique (or app-level duplicate handling)
- `{ createdAt: -1 }`

---

## 5) Directory trust foundation (already in use)

### Collection: `businesses`

### Required index (approved alias uniqueness)

- `alias_approved_unique` (partial unique)
  - `unique: true`
  - partial filter (approved + non-empty alias)

This index is launch-critical for trust flow and collision prevention.

---

## 6) Completeness / quality fields (WS1)

Applied by completeness audit tooling and search behavior.

### Collections

- `businesses`
- `organizations`

### Fields

- `missingFields: string[]`
- `completenessScore: number`
- `isComplete: boolean`
- `lastAuditAt: Date` (when stamped)

### Audit script

- `npm run audit:directory-completeness`

---

## Operational checklist before promotion

1. Confirm required indexes exist:

- `npm run check:critical-indexes`

2. Confirm reset lifecycle endpoints in built runtime:

- `POST /api/auth/request-reset`
- `POST /api/auth/reset-password`

3. Confirm TTL cleanup behavior enabled:

- `password_resets.expiresAt_1`
- `password_reset_rate_limits.expiresAt_1`

4. Confirm no raw reset token in stored docs (`token` field absent).

---

## Notes

- Do not run direct production experiments.
- Apply index changes in preview/QA first, then promote with rollback target.
