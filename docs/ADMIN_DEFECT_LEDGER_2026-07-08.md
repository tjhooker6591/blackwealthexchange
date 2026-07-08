# Admin Defect Ledger - 2026-07-08

## Batch 1 completed

### 1) Business approval count mismatch
- Status: FIXED IN BATCH 1
- Problem:
  - Admin dashboard, command center, and business queue APIs used inconsistent rules for pending/approved/rejected businesses.
- Root cause:
  - Mixed use of `approved: false`, `approved: true`, and raw `status` values such as `pending`, `pending_review`, `approved`, `rejected`, `denied`.
- Fix approach:
  - Introduced one shared canonical business status/count helper.
- Files created:
  - `src/lib/adminBusinessStatus.ts`
- Files updated:
  - `src/pages/api/admin/dashboard-stats.ts`
  - `src/pages/api/admin/get-pending-businesses.ts`
  - `src/pages/api/admin/get-unapproved-businesses.ts`
  - `src/pages/api/admin/metrics/command-center.ts`
- Validation:
  - `npm run typecheck` passed.

### 2) Directory approval/count mismatch
- Status: FIXED IN BATCH 1
- Problem:
  - Directory admin API and dashboard derived listing states differently.
- Root cause:
  - Raw query counting in dashboard did not use the same listing/payment normalization rules as the admin listing feed.
- Fix approach:
  - Introduced one shared directory listing/payment status helper and rewired key consumers.
- Files created:
  - `src/lib/adminDirectoryStatus.ts`
- Files updated:
  - `src/pages/api/admin/get-directory-listings.ts`
  - `src/pages/api/admin/dashboard-stats.ts`
- Validation:
  - `npm run typecheck` passed.

### 3) Financial admin auth outlier
- Status: FIXED IN BATCH 1
- Problem:
  - One admin-only finance page still used custom JWT page auth instead of shared admin page guard.
- Fix approach:
  - Replaced custom page auth with `requireAdminPageProps`.
- Files updated:
  - `src/pages/admin/financial-class-reconciliation.tsx`
- Validation:
  - `npm run typecheck` passed.

## Batch 2 open defects

### 4) Financial source-of-truth mismatch
- Status: OPEN
- Severity: HIGH
- Problem:
  - Admin financial UI suggests ledger-backed truth, but `/api/admin/financial-review` is still computed directly from `payments` plus one affiliate payout aggregate.
- Why this matters:
  - `financial-review`, `revenue`, and `ledger` can drift semantically because the summary is not derived from the same canonical source as the drill-down tables.
- Primary files:
  - `src/pages/api/admin/financial-review.ts`
  - `src/pages/api/admin/financial-ledger.ts`
  - `src/pages/admin/financial-review.tsx`
  - `src/pages/admin/revenue.tsx`
  - `src/pages/api/admin/webhook-events.ts`
- Likely fix direction:
  - Define canonical finance summary contract and align summary/drill-down around ledger-first or clearly declared fallback semantics.

### 5) Financial stream mapping ambiguity
- Status: OPEN
- Severity: HIGH
- Problem:
  - `financial-review` derives revenue stream from raw `payments.type` + `itemId`, while UI merges display streams through `DISPLAY_TO_BACKING` and ledger rows use `revenueStream`.
- Risk:
  - Different admin pages can show similar totals for different reasons, especially for manual/offline, affiliate, and directory/advertising distinctions.
- Primary files:
  - `src/pages/api/admin/financial-review.ts`
  - `src/pages/admin/financial-review.tsx`
  - `src/pages/admin/revenue.tsx`
  - `src/lib/finance/stream-map`

### 6) Revenue page field-name drift
- Status: OPEN
- Severity: MEDIUM
- Problem:
  - Revenue page renders ledger rows using fallback fields (`type`, `status`, `amountCents`, `grossCents`) while ledger API returns a finance-ledger shape (`revenueStream`, `paymentStatus`, `grossAmount`, etc.).
- Risk:
  - Table can look partially correct by accident while silently mislabeling or blanking canonical ledger fields.
- Primary files:
  - `src/pages/admin/revenue.tsx`
  - `src/pages/api/admin/financial-ledger.ts`

### 7) Financial review duplicated top-total semantics
- Status: OPEN
- Severity: MEDIUM
- Problem:
  - `Total Revenue` and `BWE Net Revenue` both render `data?.totalRevenue`.
- Risk:
  - Admin UI implies two separate metrics while showing the same number.
- Primary files:
  - `src/pages/admin/financial-review.tsx`
  - `src/pages/api/admin/financial-review.ts`

## Safe to leave alone for now
- `src/pages/api/admin/dashboard-stats.ts` business/directory normalization already updated in batch 1.
- `src/pages/api/admin/get-pending-businesses.ts` aligned in batch 1.
- `src/pages/api/admin/get-unapproved-businesses.ts` aligned in batch 1.
- `src/pages/api/admin/metrics/command-center.ts` aligned for business backlog in batch 1.

## Validation state
- Batch 1 validation completed with `npm run typecheck`.
- UI proof pass for these admin surfaces is still pending.
