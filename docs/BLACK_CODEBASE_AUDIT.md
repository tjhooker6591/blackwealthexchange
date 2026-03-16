# BLACK CODEBASE AUDIT

_Last updated: 2026-03-16 America/Los_Angeles_

## A) Project structure

## Verified from code
- Framework: **Next.js Pages Router** (large `src/pages` surface).
- Approximate page/API footprint discovered:
  - Public pages: ~199
  - API routes: ~141
- Major roots:
  - `src/pages/` UI + page routes
  - `src/pages/api/` API surface
  - `src/lib/` platform services (auth, env, db, analytics, stripe)
  - `src/models/` model definitions
  - `docs/` operational/release documentation

### Config files
- `package.json`: scripts and runtime dependencies for Next.js + Stripe + Mongo + auth ecosystem.
- `tsconfig.json`: TS project config.
- `next.config.ts`: Next behavior and build-time config.
- `middleware.ts`: request-level route controls.

### Env/dependency points
- Environment access patterns are mixed:
  - `getMongoDbName()` helper (preferred in many routes)
  - direct hardcoded db string (`bwes-cluster`) in some endpoints
  - direct env fallback logic in some handlers
- Stripe dependency points:
  - checkout session creation in multiple endpoints
  - canonical fulfillment in `src/pages/api/stripe/webhook-handler.ts`

## B) Runtime and architecture by system

### Auth/session architecture
- Primary session cookie: `session_token` JWT used across many APIs (`/api/auth/me`, marketplace readiness, stripe connect status routes, admin helpers).
- NextAuth exists (`/api/auth/[...nextauth].ts`) with Credentials provider and own session cookie.
- **Risk:** dual session systems may diverge unless carefully constrained.

### Role/account flow
- Account discovery spans collections: `users`, `sellers`, `businesses`, `employers`.
- Signup/login logic checks multiple collections.
- Seller upgrades can clone password hash from users collection into sellers record.

### MongoDB usage and collections
- Heavy direct collection access in route handlers.
- Key collections repeatedly observed:
  - identity/auth: `users`, `sellers`, `businesses`, `employers`, `password_resets`
  - commerce: `products`, `orders`, `payments`, `ad_purchases`, `directory_listings`
  - advertising: `advertising_requests`, `advertising_campaigns`, `featured_sponsor_schedule`, `ads`
  - jobs: `jobs`, `applicants`
  - consulting: `consulting_interest`, `consulting_intake`
  - affiliate: `affiliates`, `affiliateClicks`, `affiliateConversions`, `affiliatePayouts`
  - analytics: `flow_events`

### Stripe checkout/webhook/payment fulfillment
- Checkout creation endpoints include:
  - `/api/checkout/create-session` (canonical product checkout with orders upsert + flow event)
  - `/api/stripe/checkout` (legacy/general checkout path)
  - `/api/advertising/checkout` and admin ad checkout variants
- Canonical webhook fulfillment:
  - `/api/stripe/webhook-handler.ts`
  - shimmed by `/api/stripe-webhook.ts`
- Webhook handles:
  - payment reconciliation upsert (`payments`)
  - order fulfillment
  - directory/ad fulfillment (`directory_listings`, `ad_purchases`, `advertising_requests`)
  - music creator plan entitlement update on `sellers` + `users`
  - affiliate conversion logging hooks

### Marketplace / seller flow
- Seller onboarding: `/marketplace/become-a-seller` + APIs:
  - `/api/marketplace/create-seller`
  - `/api/marketplace/readiness`
  - `/api/marketplace/get-my-seller`
- Stripe Connect onboarding:
  - `/api/stripe/create-account-link`
  - `/api/stripe/account-status`
- Product checkout:
  - `/api/checkout/create-session`

### Advertising / sponsorship flow
- User/admin entry routes for ad purchase.
- Request moderation + trust metadata under `/api/admin/advertising-requests`.
- Featured sponsor scheduling persisted in `featured_sponsor_schedule`.

### Jobs / employer flow
- Job CRUD/list/apply endpoints (`/api/jobs/*`, `/api/employer/*`, `/api/applications/*`).
- Applicants linked to jobs and employer dashboards.

### Admin/moderation flow
- Admin auth via `requireAdminFromRequest` in sensitive routes.
- Key admin domains:
  - dashboard and stats
  - business/product/job/org approvals
  - directory approvals + slots
  - consulting moderation
  - advertising moderation
  - affiliate payout controls

### Consulting / Opportunity Network
- Public intake routes:
  - `/api/consulting-intake`
  - `/api/consulting-interest`
- Unified admin review API:
  - `/api/admin/consulting-interests` (GET/PATCH/DELETE)

### Search / directory flow
- Newer endpoint: `/api/search/businesses`
- Legacy endpoint still present: `/api/searchBusinesses.js`
- Directory ranking includes sponsor/completeness/trust shaping.

### Music flow
- Music onboarding route + API:
  - `/music/join`, `/api/music/creator-onboarding`
- Pricing + checkout integration and entitlement activation via webhook metadata for `music-creator-*` plan IDs.

### Analytics/instrumentation flow
- Generic event ingestion endpoint:
  - `/api/flow-events`
- Many feature routes emit `flow_events` for funnel observability.

### Route protection / middleware
- Route-level API auth mostly manual in handlers.
- Admin routes use helper-based checks.
- `middleware.ts` exists; primary enforcement still appears endpoint-level.

## C) Route/API inventory summary

## Public pages (high-impact examples)
- `/` homepage with multi-funnel entry
- `/login`, `/signup`, `/forgot-password`
- `/marketplace`, `/marketplace/become-a-seller`
- `/business-directory`, `/search-results`
- `/recruiting-consulting`
- `/advertise-with-us`, `/advertising/*`, `/advertise/*`
- `/music`, `/music/join`, `/music/pricing`
- `/job-listings`, `/employer/*`
- `/affiliate/*`

## Gated/admin pages
- `/admin/dashboard` and multiple admin modules (`/admin/*`).
- Seller and role-specific dashboards (`/marketplace/dashboard`, `/dashboard/*`, `/employer/*`).

## Critical API routes
- Auth: `/api/auth/login`, `/api/auth/me`, `/api/auth/signup`, reset flows
- Commerce: `/api/checkout/create-session`, `/api/stripe/checkout`, `/api/stripe/webhook-handler`
- Seller readiness/connect: `/api/marketplace/readiness`, `/api/stripe/create-account-link`, `/api/stripe/account-status`
- Admin moderation: `/api/admin/consulting-interests`, `/api/admin/advertising-requests`, `/api/admin/*-approvals`
- Search: `/api/search/businesses`, `/api/searchBusinesses.js`
- Analytics: `/api/flow-events`

## D) Data flow notes (key writes)

- `payments`: canonical payment reconciliation and webhook idempotency anchor.
- `orders`: checkout pre-creation and post-payment fulfillment progression.
- `directory_listings`: paid listing activation/pending/unlinked handling.
- `ad_purchases`: normalized ad purchase tracking and fulfillment status.
- `advertising_requests`: moderation + scheduling metadata + paid linkage.
- `flow_events`: funnel telemetry; broad event taxonomies from many pages/APIs.

## E) Release and risk understanding

## Appears strong / near-complete
- Webhook handler breadth and reconciliation intent.
- Admin moderation capabilities for consulting and advertising.
- Event instrumentation coverage across major funnels.

## Partial / proof-limited
- End-to-end paid run evidence for every major revenue funnel.
- Cross-machine parity evidence.
- Fully unified auth model (JWT cookie vs NextAuth split).

## Fragile points
- Multiple overlapping legacy/canonical routes.
- Mixed DB-name resolution and hardcoded db usage.
- Dirty working tree at audit start.

## Unknowns requiring proof
- Which checkout endpoints are truly canonical in production traffic mix.
- Whether all metadata contracts are consistently present in live checkouts.
- Whether moderation states are consistently reflected across admin pages and user-facing outcomes.
