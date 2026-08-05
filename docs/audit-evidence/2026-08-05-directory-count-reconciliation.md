# DA-02 Directory Count Reconciliation Audit

Date: 2026-08-05
Repository: `/Users/blackforge/workspace/bwe/repos/repo_clean`
Branch: `friday-release-candidate`
Code commit: `b4f3e6ffdb0d061ddb218f0137ebdd1db4fbf584`

## Canonical count matrix

| Population | Current count | Source | Filter / definition | Result |
| --- | ---: | --- | --- | --- |
| Raw directory/business records | 2272 | read-only Mongo audit + `/api/admin/dashboard-stats` | every business document in the canonical businesses collection | correct |
| Public / approved directory businesses | 365 | `src/lib/directory/publicBusinessQuery.ts` + `/api/search/businesses` + `/api/stats/inventory` | `publicBusinessBaseQuery()` population used by public directory/search surfaces | correct |
| Public search API total | 365 | `/api/search/businesses?page=1&limit=20` and page 2 | public search response `total` for the ordinary directory query | correct |
| Business directory UI total | 365 | `/business-directory` calling `/api/search/businesses` | UI consumes the same public search total | correct |
| Claim-mode search total | 365 | `/api/search/businesses?mode=claim&page=1&limit=20` | current claim mode changes UI copy only; it does not change the backend population | correct, but distinct from “pending/claimable universe” concepts |
| Pending business / verification queue | 1633 | `src/pages/api/admin/get-pending-businesses.ts` | main admin business-approval queue only | correct |
| Duplicate review business queue | 24 | read-only Mongo audit + `src/lib/adminBusinessStatus.ts` | `status: "duplicate_pending_review"` businesses routed to separate admin review work | defect before fix, correct after `b4f3e6f` |
| Admin business-approval queue total | 1633 | `/api/admin/get-pending-businesses` | same main approval queue as above; does not include duplicate-review rows | correct |
| Admin dashboard business counts | 2272 total / 1633 pending / 583 approved / 32 rejected / 24 duplicate review | `/api/admin/dashboard-stats` | full reconciled admin business bucket breakdown | defect before fix, correct after `b4f3e6f` |
| Paginated public results total | 365 | `/api/search/businesses?page=1&limit=20` and page 2 | total matching public population, not page length | correct |
| Admin directory listings total | 3 | `/api/admin/get-directory-listings` | separate listing-health population: `2 linked listings + 1 paid fallback row` | correct distinct population |

## Query/source mapping

- `src/lib/directory/publicBusinessQuery.ts`
  - `publicBusinessBaseQuery()` defines the public directory/search population now measured at `365`.
- `src/pages/api/search/businesses.ts`
  - returns the ordinary directory and claim-mode totals from the same public business query.
- `src/pages/business-directory.tsx`
  - displays the API `total` from `/api/search/businesses`; no separate count logic was found.
- `src/pages/api/admin/get-pending-businesses.ts`
  - drives the business-approval queue total `1633`.
- `src/lib/adminBusinessStatus.ts`
  - now classifies `duplicate_pending_review` as its own `duplicate_review` bucket.
- `src/pages/api/admin/dashboard-stats.ts`
  - now returns the reconciled business bucket totals and includes duplicate review in pending-work rollups.
- `src/pages/api/admin/metrics/command-center.ts`
  - now includes duplicate review in the admin pending-work total.

## Pagination proof

- Public directory page 1 and page 2 returned different records.
- Public directory total remained `365` across both pages.
- Public pagination uses a stable total for the full matching population rather than page length.
- Admin business-approval page 1 and page 2 returned different records.
- Admin approval queue total remained `1633` across both pages.
- Public pagination and pending-queue pagination are distinct and were validated separately.

## Claim-mode result

- Current claim mode does not widen or narrow the backend business population.
- `mode=claim` changes directory UI copy/intent only.
- Current claim-mode total therefore remains `365`, the same as the ordinary public directory/search population.
- That is a definition result, not a defect.

## Root cause

The established DA-02 runtime defect was not in the public directory/search query. The defect was that admin business totals were missing a fourth bucket for `duplicate_pending_review` records. That omission left `24` real business records outside the dashboard reconciliation and made the admin business totals appear inconsistent against the raw `2272` record population. The focused fix separated duplicate-review records from the main `1633` approval queue while surfacing them explicitly in admin totals and admin UI summaries.

## Validation

- `node src/lib/__tests__/admin-business-status-tests.mjs` pass
- `node src/lib/directory/__tests__/sponsor-listings-tests.mjs` pass
- `npm run typecheck` pass
- `node scripts/runtime-check.mjs` pass
- `/` returns `200` on localhost:3000
- `/business-directory` returns `200` on localhost:3000
- browser/runtime proof on `/business-directory`, `/admin/business-approvals`, and `/admin/dashboard?hideTests=1` completed with no console errors and no failed network requests
