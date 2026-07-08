// src/lib/db/orders.ts
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { ObjectId } from "mongodb";
import {
  buildMarketplaceInventoryDecrementUpdate,
  resolveMarketplaceInventory,
} from "@/lib/marketplace/inventory";
import {
  MARKETPLACE_ORDER_STATES,
  MARKETPLACE_PAYOUT_STATUSES,
} from "@/lib/marketplace/orderLifecycle";

export type FulfillOrderResult = {
  ok: boolean;
  code:
    | "ORDER_NOT_FOUND"
    | "MISSING_PRODUCT"
    | "OUT_OF_STOCK"
    | "NON_CANONICAL_ORDER_STATE"
    | "UPDATED";
  orderId: string;
  productId?: string;
  orderState?: string;
  stockDecremented?: boolean;
  payoutReady?: boolean;
  reconciliationException?: string | null;
};

function toObjectId(value: string) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function idToString(v: unknown) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v instanceof ObjectId) return v.toString();
  return "";
}

/**
 * Canonical Marketplace order fulfillment transition:
 * checkout_pending -> paid_unfulfilled -> fulfilled_payout_(ready|pending)
 */
export async function fulfillOrder(
  orderId: string,
  paymentIntentId: string,
): Promise<FulfillOrderResult> {
  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();

  const orderOid = toObjectId(orderId);
  if (!orderOid) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      orderId,
    };
  }

  const orders = db.collection<any>("orders");
  const products = db.collection<any>("products");

  const order = await orders.findOne({ _id: orderOid });
  if (!order) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      orderId,
    };
  }

  const orderState = String(order.orderState || order.status || "");

  // Idempotent successful replay
  if (
    orderState === MARKETPLACE_ORDER_STATES.FULFILLED_PAYOUT_READY ||
    orderState === MARKETPLACE_ORDER_STATES.FULFILLED_PAYOUT_PENDING
  ) {
    return {
      ok: true,
      code: "UPDATED",
      orderId,
      productId: idToString(order.productId),
      orderState,
      stockDecremented: false,
      payoutReady:
        orderState === MARKETPLACE_ORDER_STATES.FULFILLED_PAYOUT_READY,
    };
  }

  const allowedStates = new Set([
    MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING,
    "pending_checkout",
    MARKETPLACE_ORDER_STATES.PAID_UNFULFILLED,
  ]);

  if (!allowedStates.has(orderState)) {
    return {
      ok: false,
      code: "NON_CANONICAL_ORDER_STATE",
      orderId,
      productId: idToString(order.productId),
      orderState,
    };
  }

  const productId = idToString(order.productId);
  if (!productId) {
    return {
      ok: false,
      code: "MISSING_PRODUCT",
      orderId,
      orderState,
    };
  }

  const productOid = toObjectId(productId);
  const productFilter = productOid ? { _id: productOid } : { _id: productId };

  // If this order was already marked paid_unfulfilled, do not decrement inventory again.
  const needsStockDecrement =
    orderState !== MARKETPLACE_ORDER_STATES.PAID_UNFULFILLED;
  let reconciliationException: FulfillOrderResult["reconciliationException"] =
    null;

  if (needsStockDecrement) {
    const product = await products.findOne(productFilter);
    const inventory = resolveMarketplaceInventory(product);
    const decrementUpdate = buildMarketplaceInventoryDecrementUpdate(inventory);

    if (!inventory.purchasable || !decrementUpdate) {
      return {
        ok: false,
        code: "OUT_OF_STOCK",
        orderId,
        productId,
        orderState,
        reconciliationException: null,
      };
    }

    const quantityField = inventory.authoritativeField;
    const quantity = inventory.quantity;

    const stockUpdate = await products.updateOne(
      {
        ...productFilter,
        [quantityField]: quantity,
      },
      {
        ...decrementUpdate,
        $set: { updatedAt: now },
      },
    );

    if (stockUpdate.matchedCount === 0 || stockUpdate.modifiedCount === 0) {
      return {
        ok: false,
        code: "OUT_OF_STOCK",
        orderId,
        productId,
        orderState,
        reconciliationException: null,
      };
    }

    if (inventory.hasConflictingDualFields) {
      reconciliationException =
        "marketplace_inventory_dual_field_conflict_detected";
      await db.collection("flow_events").insertOne({
        eventType: "marketplace_inventory_dual_field_conflict_detected",
        pageRoute: "/api/stripe/webhook-handler",
        section: "marketplace_order_fulfillment",
        source: "stripe_webhook",
        source_variant: "inventory_conflict",
        orderId,
        productId,
        inventoryFieldUsed: inventory.authoritativeField,
        stockValue: inventory.stockValue,
        inventoryValue: inventory.inventoryValue,
        createdAt: now,
      });
    }
  }

  const payoutReady = String(order.payoutMode || "") === "destination_charge";
  const nextState = payoutReady
    ? MARKETPLACE_ORDER_STATES.FULFILLED_PAYOUT_READY
    : MARKETPLACE_ORDER_STATES.FULFILLED_PAYOUT_PENDING;

  await orders.updateOne(
    { _id: orderOid },
    {
      $set: {
        canonicalSchemaVersion: 1,
        orderState: nextState,

        status: "fulfilled",
        paymentStatus: "paid",
        fulfillmentStatus: "fulfilled",
        payoutStatus: payoutReady
          ? MARKETPLACE_PAYOUT_STATUSES.READY
          : MARKETPLACE_PAYOUT_STATUSES.PENDING,

        paymentIntentId: paymentIntentId || null,
        paymentIntent: paymentIntentId || null,

        paid: true,
        paidAt: now,
        fulfilledAt: now,
        updatedAt: now,
      },
    },
  );

  return {
    ok: true,
    code: "UPDATED",
    orderId,
    productId,
    orderState: nextState,
    stockDecremented: needsStockDecrement,
    payoutReady,
    reconciliationException,
  };
}
