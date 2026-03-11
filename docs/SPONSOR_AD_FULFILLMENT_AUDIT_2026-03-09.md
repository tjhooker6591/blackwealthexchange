# Sponsorship + Advertising Fulfillment Audit (2026-03-09)

## 1) Entry-point inventory (CTA -> route -> checkout mapping)

| Entry point           | CTA / action                | Route                           | Checkout mapping                                                             | Fulfillment target                                |
| --------------------- | --------------------------- | ------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| Advertising hub       | Proceed to Checkout (cards) | `/advertising`                  | `/advertising/checkout?option=...&duration=...`                              | `directory_listings` / `ad_purchases` via webhook |
| Featured sponsor page | Proceed to Checkout         | `/advertise/featured-sponsor`   | `/advertising/checkout?option=featured-sponsor&duration=...`                 | `ad_purchases`                                    |
| Directory ads page    | Select Plan                 | `/advertise/business-directory` | `/advertising/checkout?option=directory-standard                             | directory-featured&duration=30&businessId=...`    | `directory_listings` (+ admin approval/sloting) |
| Banner ads page       | Proceed to Checkout         | `/advertise/banner-ads`         | `/advertising/checkout?option=banner-ad&duration=...&placement=...`          | `ad_purchases`                                    |
| Custom ads page       | Reserve With $100 Deposit   | `/advertise/custom`             | direct `POST /api/stripe/checkout` `{type:'ad', itemId:'custom-ad-deposit'}` | **Not mapped to known ad SKU fulfillment**        |
| Ad details page       | Purchase                    | `/ads/[id]`                     | `POST /api/ads/create-checkout-session`                                      | `ads` collection + campaign paid flag             |
| Instant test purchase | BuyNowButton                | `/advertise-with-us`            | `POST /api/stripe/checkout` `{type:'ad', itemId:'example-sponsor-package'}`  | **Not mapped to known ad SKU fulfillment**        |

---

## 2) Route/endpoint/handler map

### Checkout creators

- `src/pages/advertising/checkout.tsx` (client handoff)
- `src/pages/api/stripe/checkout.ts` (main checkout session creation for ad/product/plan/course)
- `src/pages/api/advertising/checkout.ts` (admin advertising checkout creator)
- `src/pages/api/ads/create-checkout-session.ts` (legacy campaign checkout)

### Webhook / payment fulfillment

- `src/pages/api/stripe/webhook-handler.ts` (**primary rich fulfillment logic**)
  - writes/upserts: `payments`, `directory_listings`, `ad_purchases`
  - directory item rules: `directory-standard`, `directory-featured`
- `src/pages/api/stripe-webhook.ts` (**legacy/parallel webhook path**)
  - updates only `businesses.sponsored/tier/sponsoredUntil`

### Admin placement / queue

- `src/pages/api/admin/approve-directory-listing.ts` (approval + slot assign + queue when full)
- `src/pages/api/admin/directory-slots.ts` (slot occupancy/open slots/queue/expiring)
- `src/pages/api/admin/get-directory-listings.ts` (combined fulfillment/admin surface)

### Display surfaces

- `src/pages/business-directory.tsx` (featured sponsors, inline sponsors, sidebar ads)
- `src/pages/api/sponsored-businesses.ts` (sponsor feed API)

---

## 3) Slot model + queue rules (implemented behavior)

### Implemented in code

- Featured slot capacity: `DIRECTORY_FEATURED_MAX_SLOTS` (default 10)
- Featured listing assignment:
  - if open slot exists -> `listingStatus=active`, `featuredSlot=slot`, `featuredStartDate`, `featuredEndDate`
  - if full -> `listingStatus=approved`, `queuePosition=next`
- Standard listing approval -> active immediately (no slot)
- Expiration:
  - `expiresAt` / `featuredEndDate` used by admin slot APIs for active vs expired filtering

### Required paid-state preconditions

- listing must be paid (`paymentStatus=paid` / paid flags)
- listing must be linked to business (not `UNLINKED:*`) to approve

---

## 4) Duration + expiration behavior

- Pricing durations defined in `src/lib/advertising/pricing.ts` and API tables.
- Webhook computes `expiresAt` from paid timestamp + `durationDays`.
- Admin approval preserves/sets active windows for listing lifecycle.

---

## 5) Post-payment fulfillment path (current)

1. CTA -> `/advertising/checkout` -> `POST /api/stripe/checkout`
2. Stripe checkout success
3. Webhook (`/api/stripe/webhook-handler`) upserts paid records:
   - `payments`
   - `directory_listings` (for directory SKUs)
   - `ad_purchases`
4. Admin approval endpoint applies slot assignment / queueing for directory featured listings
5. Display APIs/UI read fulfilled state

---

## 6) Confirmed gaps / failure causes (runtime/business-flow)

| Area                                   | Status  | Exact gap                                                                                                                                                           |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Webhook routing consistency            | FAIL    | Two webhook handlers exist (`/api/stripe/webhook-handler` vs `/api/stripe-webhook`) with different side effects; risk of split fulfillment state.                   |
| Custom ad deposit fulfillment          | FAIL    | `custom-ad-deposit`/`example-sponsor-package` are not canonical ad SKUs in known fulfillment mapping; payment may succeed without deterministic placement model.    |
| Directory front-end sponsor rendering  | PARTIAL | Business directory previously hardcoded sponsors; now API-backed path added, but paid sponsor visibility still depends on webhook + approval states existing in DB. |
| Placement queue transparency in UI     | PARTIAL | Queue/slot logic exists in admin APIs, but user-facing sponsorship surfaces do not show queue/slot state directly.                                                  |
| Payment success page fulfillment proof | PARTIAL | `/payment-success` is informational; does not verify fulfillment completion state.                                                                                  |

---

## 7) Fixes implemented in this block

1. `src/pages/api/sponsored-businesses.ts`
   - switched to directory-fulfillment-aware source:
     - reads active paid featured rows from `directory_listings`
     - joins business data for display cards
     - legacy fallback to `businesses.sponsored` retained

2. `src/pages/business-directory.tsx`
   - sponsor surfaces now fetch `/api/sponsored-businesses` dynamically
   - retains fallback defaults if API has no sponsor inventory

---

## 8) PASS/FAIL by sponsorship/ad flow (current)

| Flow                                                     | PASS/FAIL         | Reason                                                                                         |
| -------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| Featured Sponsor purchase -> Stripe                      | PASS              | CTA mapping to checkout confirmed in route wiring.                                             |
| Directory Standard/Featured purchase -> Stripe           | PASS              | CTA mapping includes option/duration and optional business linkage.                            |
| Banner Ad purchase -> Stripe                             | PASS              | CTA mapping includes option/duration/placement context.                                        |
| Stripe payment -> canonical fulfillment persistence      | PARTIAL           | Rich webhook handler exists, but parallel legacy webhook path creates parity risk.             |
| Directory slot assignment / queue when full              | PASS (admin path) | Implemented in `approve-directory-listing` + slot APIs.                                        |
| Paid sponsor/ad reflected in front-end placement         | PARTIAL           | API-backed sponsor feed now wired; full proof depends on paid+approved listing data lifecycle. |
| Custom ad deposit -> deterministic placement fulfillment | FAIL              | SKU mapping/fulfillment model incomplete for custom deposit flow.                              |

---

## 9) Deterministic chain proof (current run)

### Flow: Directory Standard sponsorship purchase

- Entry URL: `/advertising/checkout?option=directory-standard&duration=30&placement=directory-sidebar`
- CTA clicked: Proceed to Checkout (advertising checkout handoff)
- Stripe session result:
  - `sessionId=cs_live_a1wNxnkA3Iu3gjwFjT6j1pT9TxrdvzOxKOuE3bstkF9Vm3UP4UZzU2aQim`
  - checkout URL returned (`checkout.stripe.com/...`)
- Webhook path invoked: **not yet invoked** (payment not completed in this run)
- DB before/after:
  - before: latest ad payment count baseline captured
  - after checkout init:
    - `payments` upserted with `status=pending`, `itemId=directory-standard`, `durationDays=30`, `placement=directory-sidebar`
    - `directory_listings`: no row yet (expected pre-webhook)
    - `ad_purchases`: no row yet (expected pre-webhook)
- Placement/queue outcome: not yet determinable before webhook + approval step
- Final visible front-end result: checkout handoff succeeded; fulfillment display pending paid webhook + approval
- Duration/expiration values applied: duration persisted as `30` in pending payment metadata; expiration set only after paid fulfillment stage.

## 10) Next mandatory closure steps (execution order)

1. Consolidate to a single canonical Stripe webhook fulfillment path.
2. Normalize all paid ad/sponsor SKUs to canonical IDs (remove orphan test/deposit SKUs from production paths).
3. Add explicit post-payment fulfillment status endpoint for campaign/listing (`paid -> linked -> approved -> active/queued -> expired`).
4. Add browser-level proof run for one **paid** directory SKU showing:
   - payment record
   - listing record
   - approval/slot or queue assignment
   - front-end sponsor display from fulfilled record.
