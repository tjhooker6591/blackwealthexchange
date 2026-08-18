# 81426-1453 DB TRACKING

Created: 2026-08-18 America/Los_Angeles
Environment: local
Database: `bwes-cluster`

Required footer for future workstreams:

- `DB CHANGE REQUIRED: YES/NO`
- `DB CHANGE COMPLETED: YES/NO/N/A`
- `DB PARITY: PASS/FAIL`

## 2026-08-18 release-stabilization/db-parity

DB CHANGE REQUIRED: YES
DB CHANGE COMPLETED: YES
DB PARITY: PARTIAL PASS

Notes:

- Safe automatic DB construction executed only after proving the canonical target database was `bwes-cluster`.
- No destructive operations were executed.
- Student Hub was seeded from the live verified fallback API payload, not invented records.
- Duplicate-backed integrity gaps remain open for `savedJobs` and `applicants`; those were not auto-mutated.
- Data-routing contradictions remain open for some legacy/new collection splits such as `consulting_interest` vs `consulting_interests` and `campaigns` vs `advertising_campaigns`.

## Operation log

### 2026-08-18T05:26:31.822Z | financial_ledger | CREATE_COLLECTION

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `financial_ledger`
- OPERATION: `CREATE_COLLECTION`
- INDEX NAME: `N/A`
- FIELDS: `N/A`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `Drop empty collection if explicitly approved later`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `N/A`
- VALIDATION: `created`

### 2026-08-18T05:26:31.822Z | referral_codes | CREATE_COLLECTION

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `referral_codes`
- OPERATION: `CREATE_COLLECTION`
- INDEX NAME: `N/A`
- FIELDS: `N/A`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `Drop empty collection if explicitly approved later`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `N/A`
- VALIDATION: `created`

### 2026-08-18T05:26:31.822Z | referral_events | CREATE_COLLECTION

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `referral_events`
- OPERATION: `CREATE_COLLECTION`
- INDEX NAME: `N/A`
- FIELDS: `N/A`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `Drop empty collection if explicitly approved later`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `N/A`
- VALIDATION: `created`

### 2026-08-18T05:26:31.822Z | black_card_physical_requests | CREATE_COLLECTION

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `black_card_physical_requests`
- OPERATION: `CREATE_COLLECTION`
- INDEX NAME: `N/A`
- FIELDS: `N/A`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `Drop empty collection if explicitly approved later`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `N/A`
- VALIDATION: `created`

### 2026-08-18T05:26:31.822Z | studentHubOpportunities | CREATE_COLLECTION

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `studentHubOpportunities`
- OPERATION: `CREATE_COLLECTION`
- INDEX NAME: `N/A`
- FIELDS: `N/A`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `Drop empty collection if explicitly approved later`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `N/A`
- VALIDATION: `created`

### 2026-08-18T05:26:31.822Z | financial_ledger | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `financial_ledger`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_financial_ledger_webhookEventId`
- FIELDS: `{"webhookEventId":1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/finance/ledger.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | financial_ledger | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `financial_ledger`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_financial_ledger_stripeSessionId`
- FIELDS: `{"stripeSessionId":1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/finance/ledger.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | financial_ledger | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `financial_ledger`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_financial_ledger_revenueStream`
- FIELDS: `{"revenueStream":1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/finance/ledger.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | financial_ledger | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `financial_ledger`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_financial_ledger_createdAt_desc`
- FIELDS: `{"createdAt":-1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/finance/ledger.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | financial_ledger | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `financial_ledger`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_financial_ledger_paymentStatus`
- FIELDS: `{"paymentStatus":1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/finance/ledger.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | referral_codes | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `referral_codes`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_referral_codes_code`
- FIELDS: `{"code":1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/pages/api/referrals/code.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | referral_codes | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `referral_codes`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_referral_codes_ownerId`
- FIELDS: `{"ownerId":1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/pages/api/referrals/code.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | referral_events | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `referral_events`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_referral_events_code_event_createdAt`
- FIELDS: `{"code":1,"event":1,"createdAt":-1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/pages/api/referrals/track.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | referral_events | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `referral_events`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_referral_events_ip_createdAt`
- FIELDS: `{"ip":1,"createdAt":-1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/pages/api/referrals/track.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | payments | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `payments`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_payments_fulfillment_entitlement_updatedAt`
- FIELDS: `{"fulfillmentStatus":1,"entitlementStatus":1,"updatedAt":-1}`
- COUNT BEFORE: `25`
- COUNT AFTER: `25`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/unifiedVerifierIndexes.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | financial_transactions | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `financial_transactions`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_financial_transactions_user_merchantNormalized_amount_date_desc`
- FIELDS: `{"userId":1,"merchantNormalized":1,"amount":1,"date":-1}`
- COUNT BEFORE: `2`
- COUNT AFTER: `2`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/wealth-builder/recurring-indexes.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | financial_transactions | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `financial_transactions`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_financial_transactions_user_subscription_expected`
- FIELDS: `{"userId":1,"isSubscription":1,"nextExpectedAt":1}`
- COUNT BEFORE: `2`
- COUNT AFTER: `2`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/wealth-builder/recurring-indexes.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | support_tickets | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `support_tickets`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `idx_support_tickets_createdAt_desc`
- FIELDS: `{"createdAt":-1}`
- COUNT BEFORE: `2`
- COUNT AFTER: `2`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/pages/api/support/status.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | orders | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `orders`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_orders_orderId`
- FIELDS: `{"orderId":1}`
- COUNT BEFORE: `152`
- COUNT AFTER: `152`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/checkout/createProductCheckoutSession.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | certificates | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `certificates`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_certificates_user_course`
- FIELDS: `{"userId":1,"courseId":1}`
- COUNT BEFORE: `1`
- COUNT AFTER: `1`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/pages/api/certificates/generate.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | business_claims | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `business_claims`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_business_claims_business_user`
- FIELDS: `{"businessId":1,"userId":1}`
- COUNT BEFORE: `4`
- COUNT AFTER: `4`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/directoryOwnership.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | ownership_reviews | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `ownership_reviews`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_ownership_reviews_business_user`
- FIELDS: `{"businessId":1,"userId":1}`
- COUNT BEFORE: `4`
- COUNT AFTER: `4`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/directoryOwnership.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | entity_claims | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `entity_claims`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_entity_claims_entity_user`
- FIELDS: `{"entityId":1,"userId":1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/directoryOwnership.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | entity_ownerships | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `entity_ownerships`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_entity_ownerships_entity_user`
- FIELDS: `{"entityId":1,"userId":1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/entityClaims.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | studentHubOpportunities | CREATE_INDEX

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `studentHubOpportunities`
- OPERATION: `CREATE_INDEX`
- INDEX NAME: `uniq_studentHubOpportunities_id`
- FIELDS: `{"id":1}`
- COUNT BEFORE: `0`
- COUNT AFTER: `0`
- SEED/BACKFILL COUNT: `0`
- FILTER/SCOPE: `N/A`
- DESTRUCTIVE: `NO`
- ROLLBACK: `drop index only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/studentHub/repository.ts`
- VALIDATION: `index present after createIndex`

### 2026-08-18T05:26:31.822Z | studentHubOpportunities | SEED_VERIFIED_BASELINE

- WORKSTREAM: `release-stabilization/db-parity`
- ENVIRONMENT: `local`
- DATABASE: `bwes-cluster`
- COLLECTION: `studentHubOpportunities`
- OPERATION: `SEED_VERIFIED_BASELINE`
- INDEX NAME: `N/A`
- FIELDS: `canonical Student Hub baseline records`
- COUNT BEFORE: `0`
- COUNT AFTER: `23`
- SEED/BACKFILL COUNT: `23`
- FILTER/SCOPE: `verified canonical fallback API payload`
- DESTRUCTIVE: `NO`
- ROLLBACK: `delete seeded records only if explicitly approved`
- APPLICATION FILE / COMMIT REQUIRING CHANGE: `src/lib/studentHub/catalog.ts -> src/lib/studentHub/repository.ts`
- VALIDATION: `seeded from live fallback API, now 23 records`
