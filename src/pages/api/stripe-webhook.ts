// Canonical webhook entrypoint shim.
// Keep this route for backward compatibility with existing Stripe endpoint config,
// but delegate all fulfillment logic to the canonical handler.

export { config } from "./stripe/webhook-handler";
export { default } from "./stripe/webhook-handler";
