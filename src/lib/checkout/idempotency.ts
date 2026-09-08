import { createHash } from "crypto";

// Commercial & Revenue Integrity Audit (2026-09-07). Shared checkout
// idempotency helpers -- single source of truth so every checkout path
// (the general src/pages/api/stripe/checkout.ts handler and the
// marketplace-specific src/lib/checkout/createProductCheckoutSession.ts
// path) derives its Stripe idempotency key the same way, rather than
// each independently inventing its own duplicate-prevention mechanism.

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * A minute-bucketed idempotency key: the same fingerprint within the
 * same 60-second window collapses to the same Stripe idempotency key,
 * so a double-click or a network retry within that window returns the
 * SAME Checkout Session instead of creating a second one (and, for
 * marketplace purchases, a second `orders` record and a second
 * marketplace fee). A genuinely new purchase attempt a minute or more
 * later gets a fresh key, so this never blocks legitimate repeat
 * purchases.
 */
export function buildCheckoutIdempotencyKey(
  fingerprint: string,
  prefix = "checkout",
): string {
  const minuteBucket = Math.floor(Date.now() / 60_000);
  return `${prefix}:${sha256Hex(`${fingerprint}|${minuteBucket}`)}`;
}
