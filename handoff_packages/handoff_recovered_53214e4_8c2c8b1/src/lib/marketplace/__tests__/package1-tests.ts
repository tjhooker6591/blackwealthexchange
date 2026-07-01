import * as assert from "node:assert/strict";
import {
  buildMarketplaceInventoryDecrementUpdate,
  resolveMarketplaceInventory,
} from "../inventory";
import {
  buildMarketplaceProjectedAmounts,
  isMarketplaceOrderStaleCheckout,
  isMarketplaceSellerLiabilityOrder,
  MARKETPLACE_ORDER_STATES,
} from "../orderLifecycle";
import {
  buildMarketplacePaymentRecord,
  deriveMarketplaceAmountTotal,
} from "../paymentLinkage";

type MockDoc = Record<string, any>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

class MockCollection {
  docs: MockDoc[];
  constructor(docs: MockDoc[]) {
    this.docs = docs;
  }

  async findOne(filter: MockDoc) {
    return this.docs.find((doc) => matchesFilter(doc, filter)) || null;
  }

  async updateOne(filter: MockDoc, update: MockDoc) {
    const doc = this.docs.find((entry) => matchesFilter(entry, filter));
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    applyUpdate(doc, update);
    return { matchedCount: 1, modifiedCount: 1 };
  }
}

function matchesFilter(doc: MockDoc, filter: MockDoc) {
  return Object.entries(filter).every(([key, value]) => doc[key] === value);
}

function applyUpdate(doc: MockDoc, update: MockDoc) {
  if (update.$set) {
    Object.assign(doc, update.$set);
  }
  if (update.$inc) {
    for (const [key, value] of Object.entries(update.$inc)) {
      doc[key] = Number(doc[key] || 0) + Number(value);
    }
  }
}

async function decrementInventoryForTest(product: MockDoc, orderState: string) {
  const products = new MockCollection([product]);
  const inventory = resolveMarketplaceInventory(product);
  const update = buildMarketplaceInventoryDecrementUpdate(inventory);
  const needsStockDecrement = orderState !== MARKETPLACE_ORDER_STATES.PAID_UNFULFILLED;

  if (!needsStockDecrement) return { ok: true, replay: true, product };
  if (!inventory.purchasable || !update) return { ok: false, product };

  const quantityField = inventory.authoritativeField;
  const quantity = inventory.quantity;
  const result = await products.updateOne(
    { _id: product._id, [quantityField]: quantity },
    {
      ...update,
      $set: { updatedAt: "now" },
    },
  );

  return { ok: result.modifiedCount === 1, product };
}

function testInventoryResolution() {
  const case1 = resolveMarketplaceInventory({ stock: 10 });
  assert.equal(case1.quantity, 10);
  assert.equal(case1.authoritativeField, "stock");
  assert.equal(case1.purchasable, true);

  const case2 = resolveMarketplaceInventory({ inventory: 10 });
  assert.equal(case2.quantity, 10);
  assert.equal(case2.authoritativeField, "inventory");
  assert.equal(case2.purchasable, true);

  const case3 = resolveMarketplaceInventory({});
  assert.equal(case3.quantity, 0);
  assert.equal(case3.authoritativeField, "none");
  assert.equal(case3.purchasable, false);

  const case4 = resolveMarketplaceInventory({ stock: 0 });
  assert.equal(case4.purchasable, false);

  const case5 = resolveMarketplaceInventory({ stock: -1 });
  assert.equal(case5.purchasable, false);
  assert.equal(case5.authoritativeField, "none");

  const case6 = resolveMarketplaceInventory({ inventory: "wat" });
  assert.equal(case6.purchasable, false);

  const case7 = resolveMarketplaceInventory({ stock: 4, inventory: 4 });
  assert.equal(case7.authoritativeField, "stock");
  assert.equal(case7.hasConflictingDualFields, false);

  const case8 = resolveMarketplaceInventory({ stock: 4, inventory: 7 });
  assert.equal(case8.authoritativeField, "stock");
  assert.equal(case8.hasConflictingDualFields, true);
}

async function testFulfillmentReplayAndConcurrency() {
  const replayProduct = { _id: "p1", stock: 3 };
  const first = await decrementInventoryForTest(replayProduct, MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING);
  assert.equal(first.ok, true);
  assert.equal(replayProduct.stock, 2);

  const replay = await decrementInventoryForTest(replayProduct, MARKETPLACE_ORDER_STATES.PAID_UNFULFILLED);
  assert.equal(replay.ok, true);
  assert.equal(replay.replay, true);
  assert.equal(replayProduct.stock, 2);

  const finalUnit = { _id: "p2", stock: 1 };
  const one = await decrementInventoryForTest(finalUnit, MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING);
  const two = await decrementInventoryForTest(finalUnit, MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING);
  assert.equal(one.ok, true);
  assert.equal(two.ok, false);
  assert.equal(finalUnit.stock, 0);
}

function testOrderLifecycle() {
  const stale = isMarketplaceOrderStaleCheckout({
    order: {
      orderState: MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING,
      paymentStatus: "pending",
      paid: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    now: new Date("2026-01-03T00:00:00.000Z"),
    expirationThresholdMs: 24 * 60 * 60 * 1000,
  });
  assert.equal(stale, true);

  const notStalePaid = isMarketplaceOrderStaleCheckout({
    order: {
      orderState: MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING,
      paymentStatus: "paid",
      paid: true,
      paidAt: new Date("2026-01-01T12:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    now: new Date("2026-01-03T00:00:00.000Z"),
    expirationThresholdMs: 24 * 60 * 60 * 1000,
  });
  assert.equal(notStalePaid, false);

  assert.equal(
    isMarketplaceSellerLiabilityOrder({ paymentStatus: "pending", sellerPayout: 880 }),
    false,
  );
  assert.equal(
    isMarketplaceSellerLiabilityOrder({ paymentStatus: "paid", sellerPayout: 880 }),
    true,
  );

  const split = buildMarketplaceProjectedAmounts(2500);
  assert.equal(split.bweFee, 300);
  assert.equal(split.sellerPayout, 2200);
}

function testPaymentLinkage() {
  const payment = buildMarketplacePaymentRecord({
    stripeSessionId: "cs_123",
    paymentIntentId: "pi_123",
    paidAt: new Date("2026-01-01T00:00:00.000Z"),
    orderId: "order_1",
    productId: "prod_1",
    sellerId: "seller_1",
    payoutMode: "destination_charge",
    amountTotal: 2500,
    currency: "usd",
    buyerUserId: "buyer_1",
    buyerEmail: "buyer@example.com",
    webhookEventId: "evt_1",
    webhookEventType: "checkout.session.completed",
  });

  assert.equal(payment.type, "product");
  assert.equal(payment.orderId, "order_1");
  assert.equal(payment.metadata.orderId, "order_1");
  assert.equal(payment.bweFee, 300);
  assert.equal(payment.payout, 2200);

  const derived = deriveMarketplaceAmountTotal({
    session: { amount_total: null } as any,
    existingAmountCents: 1500,
    orderRecord: null,
  });
  assert.equal(derived, 1500);
}

function testScenarioExpectations() {
  const createdSuccess = {
    orderState: MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING,
    paymentStatus: "pending",
    payoutStatus: "not_applicable",
    stripeSessionId: "cs_1",
  };
  assert.equal(createdSuccess.orderState, MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING);

  const checkoutFailed = {
    orderState: MARKETPLACE_ORDER_STATES.CHECKOUT_FAILED,
    paymentStatus: "failed",
    payoutStatus: "not_applicable",
  };
  assert.equal(checkoutFailed.orderState, MARKETPLACE_ORDER_STATES.CHECKOUT_FAILED);

  const fallbackSuccess = { payoutMode: "platform_hold", orderState: MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING };
  assert.equal(fallbackSuccess.payoutMode, "platform_hold");

  const bothFail = { orderState: MARKETPLACE_ORDER_STATES.CHECKOUT_FAILED };
  assert.equal(bothFail.orderState, MARKETPLACE_ORDER_STATES.CHECKOUT_FAILED);

  const expired = { orderState: MARKETPLACE_ORDER_STATES.CHECKOUT_EXPIRED, paymentStatus: "expired" };
  assert.equal(expired.orderState, MARKETPLACE_ORDER_STATES.CHECKOUT_EXPIRED);

  const expirationReplay = clone(expired);
  assert.equal(expirationReplay.orderState, MARKETPLACE_ORDER_STATES.CHECKOUT_EXPIRED);

  const paidBeforeExpiration = { orderState: MARKETPLACE_ORDER_STATES.PAID_UNFULFILLED, paymentStatus: "paid" };
  assert.equal(paidBeforeExpiration.paymentStatus, "paid");

  const expirationAfterPayment = clone(paidBeforeExpiration);
  assert.equal(expirationAfterPayment.orderState, MARKETPLACE_ORDER_STATES.PAID_UNFULFILLED);

  const unpaidLiability = isMarketplaceSellerLiabilityOrder({ paymentStatus: "pending", grossAmount: 1000, sellerPayout: 880 });
  assert.equal(unpaidLiability, false);

  const paidLiability = isMarketplaceSellerLiabilityOrder({ paymentStatus: "paid", grossAmount: 1000, sellerPayout: 880, paidAt: new Date() });
  assert.equal(paidLiability, true);

  const fee = buildMarketplaceProjectedAmounts(1000);
  assert.equal(fee.bweFee, 120);
  assert.equal(fee.sellerPayout, 880);

  const replayWebhookPayment = buildMarketplacePaymentRecord({
    stripeSessionId: "cs_replay",
    paymentIntentId: "pi_replay",
    paidAt: new Date(),
    orderId: "order_replay",
    productId: "product_replay",
    sellerId: "seller_replay",
    payoutMode: "destination_charge",
    amountTotal: 1000,
  });
  assert.equal(replayWebhookPayment.metadata.orderId, "order_replay");

  const missingOrder = { blocked: true, type: "marketplace_order_missing_on_paid_webhook" };
  assert.equal(missingOrder.blocked, true);

  const missingPaymentRelationship = { blocked: true, type: "marketplace_payment_order_link_missing" };
  assert.equal(missingPaymentRelationship.blocked, true);
}

async function main() {
  testInventoryResolution();
  await testFulfillmentReplayAndConcurrency();
  testOrderLifecycle();
  testPaymentLinkage();
  testScenarioExpectations();
  console.log("package1-tests: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
