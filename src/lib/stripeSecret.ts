export function getStripeSecretKey(): string {
  return (
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET ||
    process.env.STRIPE_API_SECRET_KEY ||
    ""
  ).trim();
}

export function requireStripeSecretKey(): string {
  const key = getStripeSecretKey();
  if (!key) {
    throw new Error(
      "Missing Stripe secret (STRIPE_SECRET_KEY or STRIPE_SECRET)",
    );
  }
  return key;
}
