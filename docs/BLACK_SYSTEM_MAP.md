# BLACK SYSTEM MAP

_Last updated: 2026-03-16 America/Los_Angeles_

## 1) Platform systems at a glance

Black Wealth Exchange is a multi-vertical platform where one Next.js monolith hosts:

- user identity/auth
- directory/search
- marketplace/seller commerce
- advertising/sponsorship commerce
- jobs/employer flows
- consulting/opportunity intake
- affiliate tracking/payout operations
- music creator onboarding + plan activation
- admin moderation and operational control

## 2) User roles and primary flows

### Anonymous visitor

- Discovers content via homepage and search.
- Can browse marketplace/directory/jobs/music surfaces.
- Prompted into login/signup before protected actions.

### General user

- Authenticates via login/signup.
- Can apply to jobs, engage with directory, complete purchases.

### Seller/creator

- Starts in `/marketplace/become-a-seller` or music join routes.
- Creates seller profile -> Stripe Connect onboarding -> payout readiness.
- Lists products and receives order/payment outcomes.

### Employer/business

- Posts jobs, receives applicants, uses employer dashboard endpoints.

### Admin

- Uses `/admin/*` surfaces for approvals, moderation, trust review, payouts, and analytics.

## 3) System dependencies and handoffs

## Auth -> feature systems

- Most feature APIs depend on `session_token` JWT context.
- Admin routes add role checks through admin auth helper.

## Checkout -> webhook -> fulfillment

- Checkout endpoints create Stripe session + write pre-fulfillment records.
- Stripe webhook receives payment event.
- Webhook updates payment state and triggers feature-specific fulfillment:
  - orders
  - directory listings
  - ad purchases/campaign records
  - music plan entitlement

## Intake -> admin moderation -> lifecycle

- Consulting and advertising requests write intake collections.
- Admin routes update status/stage and lifecycle logs.
- Dashboard aggregates these into actionable queues.

## Search/directory -> sponsor weighting

- Search endpoints read business/directory data.
- Sponsor/payment and completeness/trust fields alter ranking/display.

## 4) External integrations

- **Stripe**: checkout sessions, webhooks, connect account status/account links.
- **MongoDB**: primary persistence and operational source of truth.
- Optional auth ecosystem includes NextAuth credentials provider.

## 5) Tight coupling zones

- Stripe metadata contracts are tightly coupled to webhook fulfillment behavior.
- Collection schemas are coupled directly in API handlers (minimal abstraction layer).
- Admin dashboards depend on consistent status fields across many collections.
- Search ranking depends on optional trust/completeness/sponsor fields that may vary by source path.

## 6) Operationally critical couplings

1. `checkout metadata` <-> `webhook normalization` <-> `fulfillment selectors`
2. `seller stripe account state` <-> `checkout payout mode`
3. `admin moderation statuses` <-> `queue visibility` + `user-facing expectations`
4. `flow_events schema` <-> analytics scoreboards and launch confidence metrics
