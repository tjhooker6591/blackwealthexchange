# BLACK RUNTIME AND DATA FLOW

_Last updated: 2026-03-16 America/Los_Angeles_

## 1) Text request-flow diagrams

## 1.1 Auth/session request flow

1. User submits `/login` form.
2. `/api/auth/login` validates account credentials across role collections.
3. Server sets `session_token` cookie (JWT).
4. Protected APIs decode `session_token` for user context.
5. Some routes/pages also support NextAuth session strategy.

**Failure points**

- Cookie missing/expired -> 401 loops.
- JWT secret mismatch across routes.
- Divergence between NextAuth and custom JWT flows.

## 1.2 Marketplace checkout flow

1. User clicks Buy CTA.
2. `/api/checkout/create-session` validates product/seller/stock and payout mode.
3. Creates Stripe Checkout Session.
4. Upserts pending order record (`orders`).
5. Stripe sends webhook on payment success.
6. `/api/stripe/webhook-handler` reconciles payment + fulfills order.

**Collections touched**

- `products`, `sellers` (read)
- `orders` (create/update)
- `payments` (upsert paid)
- `flow_events` (instrumentation)

## 1.3 Advertising/directory checkout flow

1. Ad or directory purchase starts from user/admin checkout entry.
2. Checkout session carries metadata (`type`, `itemId`, `option`, `durationDays`, `businessId`, etc.).
3. Webhook normalizes metadata and reconciles payment.
4. Writes/updates:
   - `ad_purchases`
   - `directory_listings`
   - `advertising_requests` (if campaign-linked)
   - `featured_sponsor_schedule` (for featured sponsor assignment)

**Failure points**

- Missing `businessId` creates unlinked paid records needing admin intervention.
- Metadata inconsistency across legacy/canonical checkout routes.

## 1.4 Consulting intake flow

1. User submits recruiting/consulting form.
2. API validates + rate-limits.
3. Writes `consulting_intake` or `consulting_interest`.
4. Admin unified endpoint reads both collections and allows moderation updates.

## 2) Key create/update/delete paths

## Create paths

- Accounts: `users/sellers/businesses/employers` via signup/create-seller.
- Commerce intents: `orders`, `advertising_campaigns`, `advertising_requests`.
- Operational telemetry: `flow_events`.

## Update paths

- Webhook lifecycle transitions for payment/fulfillment.
- Admin PATCH updates for consulting and ad moderation.
- Stripe connect status reflected via readiness/status checks.

## Delete/soft-delete patterns

- Admin moderation often soft-deletes (`status=deleted`, timestamp/log entries).
- Hard delete less common in audited critical flows.

## 3) Webhook/data propagation paths

- Canonical entrypoint: `/api/stripe/webhook-handler`.
- Backcompat shim: `/api/stripe-webhook` exports same handler.
- Idempotency anchor: `payments` upsert by `stripeSessionId`.
- Post-reconciliation fanout:
  - marketplace order completion events
  - directory/ad records
  - campaign status/schedule updates
  - music plan entitlement writebacks

## 4) Cookie/session/JWT flow

- Primary cookie in audited APIs: `session_token`.
- Decoded in many route handlers directly or via helper.
- Admin checks build on decoded claims (`isAdmin`/`accountType`).
- NextAuth also uses own session token naming and callback shaping.

## 5) Mongo collection usage by feature

- Auth: `users`, `sellers`, `businesses`, `employers`, `password_resets`.
- Marketplace: `products`, `orders`, `payments`, `sellers`.
- Directory/ads: `directory_listings`, `ad_purchases`, `advertising_requests`, `featured_sponsor_schedule`, `ads`.
- Consulting: `consulting_interest`, `consulting_intake`.
- Jobs/employer: `jobs`, `applicants`.
- Affiliate: `affiliates`, `affiliateClicks`, `affiliateConversions`, `affiliatePayouts`.
- Analytics: `flow_events`.

## 6) Metadata relied on by Stripe/admin

## Stripe webhook metadata keys (observed)

- `type`, `itemId`, `option`, `durationDays`
- `businessId`, `placement`, `campaignId`
- `orderId`, `courseId`, `affiliateCode`, `userId`

## Admin moderation metadata

- `status`, `reviewStatus`, `lifecycleStage`, `adminNote`, `reviewedBy`, moderation logs.

## 7) Failure points and safeguards

## Safeguards observed

- Rate limiting in many public/admin APIs.
- Stripe signature verification and paid-event gating.
- Upsert/reconciliation semantics in webhook.
- Admin auth helper for sensitive routes.

## Remaining failure points

- Partial metadata from non-canonical checkout call sites.
- DB-name/env drift due to mixed resolution patterns.
- dual-session architecture drift under edge conditions.
- Existing dirty tree can mask regression source attribution.
