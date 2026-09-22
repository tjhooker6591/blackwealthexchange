import assert from "node:assert/strict";
import fs from "node:fs";

const pricingSource = fs.readFileSync("src/pages/pricing.tsx", "utf8");
const checkoutPageSource = fs.readFileSync("src/pages/checkout/index.tsx", "utf8");
const stripeCheckoutSource = fs.readFileSync(
  "src/pages/api/stripe/checkout.ts",
  "utf8",
);

assert.match(pricingSource, /billingNote="Billed monthly [^"]*"/);
assert.match(pricingSource, /Founding Member is billed monthly/);

assert.match(
  checkoutPageSource,
  /plan === "founder" \? "Billed monthly with auto-renew\." : "Billed annually with auto-renew\."/,
);

assert.match(
  stripeCheckoutSource,
  /founder:\s*\{[\s\S]*?billingInterval:\s*"monthly"/,
);

assert.match(
  stripeCheckoutSource,
  /metadata\.billingInterval\s*=\s*[\s\S]*?finalItemId === "founder" \? "monthly" : "annual"/,
);

assert.match(
  stripeCheckoutSource,
  /interval:\s*finalItemId === "founder"\s*\?\s*\("month" as const\)\s*:\s*\("year" as const\)/,
);

console.log("pricing-billing-alignment-tests: ok");
