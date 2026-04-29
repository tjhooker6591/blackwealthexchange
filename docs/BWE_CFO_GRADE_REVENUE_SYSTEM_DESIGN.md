# BWE CFO-Grade Revenue System Design

## Objective
Create a unified financial control system where every monetized stream can be traced:
UI -> Checkout -> Stripe -> Webhook -> Ledger -> Fulfillment -> Admin Review -> Payout/Reconciliation.

## 1) Unified Revenue Ledger

### Canonical collection
`financial_ledger`

### Canonical record
```json
{
  "transactionId": "string",
  "stripeSessionId": "string|null",
  "stripePaymentIntentId": "string|null",
  "userId": "string|null",
  "sellerId": "string|null",
  "employerId": "string|null",
  "businessId": "string|null",
  "creatorId": "string|null",
  "revenueStream": "marketplace|ads|featured_sponsor|banner_ads|directory|jobs|featured_jobs|membership_black_card|courses|music_creator_plan|consulting|affiliate|manual",
  "grossAmount": 0,
  "bweFeeAmount": 0,
  "bweFeePercent": 0,
  "sellerPayoutAmount": 0,
  "partnerPayoutAmount": 0,
  "netBweRevenue": 0,
  "paymentStatus": "pending|paid|failed|refunded|disputed|canceled",
  "fulfillmentStatus": "pending|fulfilled|not_applicable|failed",
  "payoutStatus": "not_applicable|platform_held|ready|paid|failed",
  "refundStatus": "none|requested|partial|full",
  "disputeStatus": "none|warning|needs_response|won|lost",
  "sourceRoute": "string",
  "webhookEventId": "string|null",
  "metadata": {},
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

## 2) Supported streams
- Marketplace sales
- Marketplace commission
- Advertising/sponsorship
- Featured sponsor
- Banner ads
- Directory paid listings
- Job postings
- Featured job upgrades
- Membership/Black Card
- Courses/Financial Literacy
- Music creator plans
- Consulting/Opportunity Network
- Affiliate revenue/liability
- Manual/offline revenue

## 3) Standard BWE fee model
- Marketplace: 10-15% platform fee (current code path is 12% in centralized split module)
- Ads/Sponsor/Directory/Jobs/Membership/Black Card/Courses/Creator plans: 100% retained
- Music royalties: not BWE revenue by default
- Consulting: contract-defined split (not connected yet)
- Affiliate: track confirmed commission received and payout liabilities separately

## 4) Required payment flow contract
Every paid stream must produce all of:
1. Checkout creation with canonical metadata
2. Stripe session created
3. Webhook paid event processed
4. `payments` row updated
5. `financial_ledger` row written/updated
6. Fulfillment state set
7. Admin visible in `/admin/financial-review`
8. Payout status visible where applicable

## 5) Admin financial review requirements
Route: `/admin/financial-review`
Sections:
- Revenue Overview
- Revenue by Stream
- Latest Transactions
- Pending/Failed
- Refunds/Disputes
- Payout Review
- Marketplace Commission Review
- Sponsor Revenue Review
- Subscription Revenue Review
- Manual Revenue Entry
- Export/Report Preparation

## 6) Stream status labels
- Complete
- Partially Connected
- Checkout Only
- Webhook Missing
- DB Write Missing
- Admin Visibility Missing
- Payout Missing
- Not Connected Yet

## 7) Payout logic rules
- Marketplace: auto compute seller payout + platform fee; if connect unavailable -> `platform_held`
- Ads/Directory/Jobs/Creator plan/Membership/Courses: no seller payout
- Consulting: manual/contract workflow required
- Affiliate: liability and payout workflow distinct from customer checkout

## 8) Current audit report (implementation-state)

| Revenue Stream | Payment Type | BWE Fee % | Customer Pays | Who Gets Paid | Checkout Route | Webhook Fulfilled | DB Updated | Admin Visible | Payout Logic | Status | Required Fix |
|---|---:|---:|---|---|---|---|---|---|---|---|---|
| Advertising / Sponsorship | One-time | 100 | Advertiser | BWE | `/api/stripe/checkout` (+ legacy wrappers) | Yes | `payments`,`ad_purchases` | Yes | N/A payout | Partially Connected | Fully retire duplicate creators |
| Featured Sponsor placements | One-time | 100 | Advertiser | BWE | `/api/stripe/checkout` | Yes | `payments`,`ad_purchases` | Yes | N/A | Partially Connected | Same as above |
| Banner Ads | One-time | 100 | Advertiser | BWE | `/api/stripe/checkout` | Yes | `payments`,`ad_purchases` | Yes | N/A | Partially Connected | Same as above |
| Business Directory paid listings | One-time | 100 | Business | BWE | `/api/stripe/checkout` | Yes | `payments`,`ad_purchases` | Yes | N/A | Complete (code-ready) | Stripe transaction proof run |
| Marketplace product sales | Per txn | 10-15 target (12 current) | Buyer | Seller + BWE fee | `/api/stripe/checkout` (`type=product`) | Yes | `orders`,`payments` | Yes | destination/held payout | Complete (code-ready) | Stripe transaction proof run |
| Marketplace commission | Per txn | 12 current | Buyer | BWE + seller | same | Yes | split on `orders`,`payments` | Yes | payout status tracked | Complete | Historical backfill |
| Job posting payments | One-time | 100 | Employer | BWE | `/api/stripe/checkout` | Yes | `payments`,`jobs` | Yes | N/A | Partially Connected | unify SKU map |
| Employer featured upgrades | One-time | 100 | Employer | BWE | `/api/stripe/checkout` | Yes | `payments`,`jobs` | Yes | N/A | Partially Connected | unify SKU map |
| Membership / Premium | Annual sub | 100 | User | BWE | `/api/stripe/checkout` | Yes | `payments`,`users`,`subscription_events` | Yes | N/A | Complete | Stripe proof run |
| Black Card membership | Plan fee | 100 | User | BWE | `/api/stripe/checkout` | Yes | `payments`, card/member records | Yes | N/A | Complete | Stripe proof run |
| Courses / Financial Literacy | One-time | 100 | Learner | BWE | `/api/stripe/checkout` (+ legacy course endpoint) | Yes | `payments`, course access records | Yes | N/A | Partially Connected | route legacy endpoint to canonical |
| Music creator plans | Plan fee | 100 | Creator | BWE | `/api/stripe/checkout` | Yes | `payments` | Yes | N/A | Complete | keep royalty policy explicit |
| Consulting / Opportunity Network | N/A | contract | N/A | N/A | none | No | `consulting_*` leads only | partial ops visibility | not wired | Not Connected Yet | build paid contract + ledger path |
| Affiliate revenue | Liability flow | n/a | N/A | Affiliate payouts | no direct checkout | Partial | `affiliate*` collections | Yes | manual/ops payout | Partially Connected | add explicit ledger entries for liability+settlement |
| Manual / offline revenue | Manual | varies | varies | varies | none | No | no unified ledger | No | manual only | Not Connected Yet | add manual ledger entry workflow |

## 9) Safety rules enforced
- Do not count unpaid sessions as revenue.
- Do not treat pending as completed revenue.
- Do not count seller payout as BWE revenue.
- Do not count shipping as BWE revenue.
- Do not treat music royalties as BWE revenue by default.

## 10) Launch blockers
1. `financial_ledger` not yet physically implemented/wired in webhook.
2. Legacy checkout routes still exist (some now wrappers, but retirement incomplete).
3. Consulting/manual streams not connected to payments.
4. Affiliate not represented in unified ledger lifecycle as first-class entries.
5. Full Stripe paid-event proof per stream pending environment credentials.
