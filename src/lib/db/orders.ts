// src/lib/db/orders.ts
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { ObjectId } from "mongodb";

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
    orderState === "fulfilled_payout_ready" ||
    orderState === "fulfilled_payout_pending"
  ) {
    return {
      ok: true,
      code: "UPDATED",
      orderId,
      productId: idToString(order.productId),
      orderState,
      stockDecremented: false,
      payoutReady: orderState === "fulfilled_payout_ready",
    };
  }

  const allowedStates = new Set([
    "checkout_pending",
    "pending_checkout",
    "paid_unfulfilled",
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
  const needsStockDecrement = orderState !== "paid_unfulfilled";

  if (needsStockDecrement) {
    const stockUpdate = await products.updateOne(
      {
        ...productFilter,
        $expr: {
          $gt: [{ $ifNull: ["$stock", { $ifNull: ["$inventory", 0] }] }, 0],
        },
      },
      {
        $inc: { stock: -1, inventory: -1 },
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
      };
    }
  }

  const payoutReady = String(order.payoutMode || "") === "destination_charge";
  const nextState = payoutReady
    ? "fulfilled_payout_ready"
    : "fulfilled_payout_pending";

  await orders.updateOne(
    { _id: orderOid },
    {
      $set: {
        canonicalSchemaVersion: 1,
        orderState: nextState,

        status: "fulfilled",
        paymentStatus: "paid",
        fulfillmentStatus: "fulfilled",
        payoutStatus: payoutReady ? "ready" : "pending",

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
  };
}
