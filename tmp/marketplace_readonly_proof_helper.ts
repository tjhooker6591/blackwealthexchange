import clientPromise from "../src/lib/mongodb";
import { getMongoDbName } from "../src/lib/env";
import { ObjectId } from "mongodb";

type OrderDoc = {
  _id: ObjectId | string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  orderState?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
  payoutStatus?: string | null;
  paid?: boolean | null;
  paidAt?: Date | string | null;
  fulfilledAt?: Date | string | null;
  payoutMode?: string | null;
  sellerPayout?: number | null;
  productId?: ObjectId | string | null;
  sellerId?: ObjectId | string | null;
};

type ProductDoc = {
  _id: ObjectId | string;
  title?: string | null;
  name?: string | null;
  sellerId?: ObjectId | string | null;
  price?: number | null;
  stock?: number | null;
  inventory?: number | null;
};

function toIdString(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v instanceof ObjectId) return v.toString();
  if (typeof v === "object" && v && "toString" in (v as any)) return String((v as any).toString());
  return "";
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function bool(v: unknown): boolean {
  return v === true;
}

function dt(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pendingCheckoutAny(o: OrderDoc): boolean {
  return ["checkout_pending", "pending_checkout"].includes(String(o.orderState || "")) ||
    (!o.orderState && String(o.status || "") === "pending_checkout");
}

function paidFlag(o: OrderDoc): boolean {
  return String(o.paymentStatus || "").toLowerCase() === "paid" || bool(o.paid) || !!o.paidAt;
}

function fulfilledFlag(o: OrderDoc): boolean {
  return ["fulfilled_payout_ready", "fulfilled_payout_pending"].includes(String(o.orderState || "")) ||
    String(o.fulfillmentStatus || "").toLowerCase() === "fulfilled" ||
    String(o.status || "").toLowerCase() === "fulfilled";
}

function refundedFlag(o: OrderDoc): boolean {
  return [o.orderState, o.status, o.paymentStatus, o.fulfillmentStatus].some(v => String(v || "").toLowerCase() === "refunded");
}

function cancelledFailedFlag(o: OrderDoc): boolean {
  return [o.orderState, o.status, o.paymentStatus, o.fulfillmentStatus].some(v => ["cancelled", "canceled", "failed"].includes(String(v || "").toLowerCase()));
}

async function main() {
  const client = await clientPromise;
  const dbName = getMongoDbName();
  const db = client.db(dbName);

  const ordersCollection = db.collection<OrderDoc>("orders");
  const productsCollection = db.collection<ProductDoc>("products");

  const connectivity = {
    dbName,
    ordersCount: await ordersCollection.countDocuments({}, { maxTimeMS: 5000 }),
    productsCount: await productsCollection.countDocuments({}, { maxTimeMS: 5000 }),
  };

  console.log(JSON.stringify({ connectivity }, null, 2));

  const [orders, products] = await Promise.all([
    ordersCollection.find(
      {},
      {
        projection: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          orderState: 1,
          status: 1,
          paymentStatus: 1,
          fulfillmentStatus: 1,
          payoutStatus: 1,
          paid: 1,
          paidAt: 1,
          fulfilledAt: 1,
          payoutMode: 1,
          sellerPayout: 1,
          productId: 1,
          sellerId: 1,
        },
        maxTimeMS: 10000,
      },
    ).toArray(),
    productsCollection.find(
      {},
      {
        projection: {
          _id: 1,
          title: 1,
          name: 1,
          sellerId: 1,
          price: 1,
          stock: 1,
          inventory: 1,
        },
        maxTimeMS: 10000,
      },
    ).toArray(),
  ]);

  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const productMap = new Map(products.map((p) => [toIdString(p._id), p]));

  const cohorts = {
    checkout_pending_unpaid: orders.filter((o) => pendingCheckoutAny(o) && !paidFlag(o)),
    stale_or_abandoned_checkout: orders.filter((o) => {
      const created = dt(o.createdAt) || dt(o.updatedAt);
      return pendingCheckoutAny(o) && !paidFlag(o) && !!created && created < staleCutoff;
    }),
    payment_pending: orders.filter((o) =>
      ["processing", "requires_action", "requires_payment_method", "requires_confirmation"].includes(
        String(o.paymentStatus || ""),
      ),
    ),
    paid_unfulfilled: orders.filter((o) => paidFlag(o) && !fulfilledFlag(o) && !refundedFlag(o) && !cancelledFailedFlag(o)),
    fulfilled: orders.filter((o) => fulfilledFlag(o)),
    paid_destination_charge: orders.filter((o) => String(o.payoutMode || "") === "destination_charge" && paidFlag(o)),
    paid_platform_hold: orders.filter((o) => String(o.payoutMode || "") === "platform_hold" && paidFlag(o)),
    payout_ready: orders.filter((o) => String(o.payoutStatus || "").toLowerCase() === "ready" || String(o.orderState || "") === "fulfilled_payout_ready"),
    payout_pending: orders.filter((o) => String(o.payoutStatus || "").toLowerCase() === "pending" || String(o.orderState || "") === "fulfilled_payout_pending"),
    payout_completed: orders.filter((o) => String(o.payoutStatus || "").toLowerCase() === "completed"),
    refunded: orders.filter((o) => refundedFlag(o)),
    cancelled_or_failed: orders.filter((o) => cancelledFailedFlag(o)),
    unknown_or_legacy_state: orders.filter((o) => !(
      (pendingCheckoutAny(o) && !paidFlag(o)) ||
      ["processing", "requires_action", "requires_payment_method", "requires_confirmation"].includes(String(o.paymentStatus || "")) ||
      (paidFlag(o) && !fulfilledFlag(o) && !refundedFlag(o) && !cancelledFailedFlag(o)) ||
      fulfilledFlag(o) || refundedFlag(o) || cancelledFailedFlag(o)
    )),
  };

  const productFieldDistribution = {
    onlyStock: 0,
    onlyInventory: 0,
    both: 0,
    neither: 0,
    affectedNeitherAvailableAtCheckout: [] as Array<Record<string, unknown>>,
  };

  for (const p of products) {
    const hasStock = Object.prototype.hasOwnProperty.call(p, "stock") && p.stock !== null && p.stock !== undefined;
    const hasInventory = Object.prototype.hasOwnProperty.call(p, "inventory") && p.inventory !== null && p.inventory !== undefined;
    if (hasStock && hasInventory) productFieldDistribution.both++;
    else if (hasStock) productFieldDistribution.onlyStock++;
    else if (hasInventory) productFieldDistribution.onlyInventory++;
    else {
      productFieldDistribution.neither++;
      productFieldDistribution.affectedNeitherAvailableAtCheckout.push({
        _id: toIdString(p._id),
        title: p.title || p.name || null,
        sellerId: toIdString(p.sellerId),
        price: p.price ?? null,
      });
    }
  }

  const affectedOpenOrders = orders
    .filter((o) => pendingCheckoutAny(o) || String(o.orderState || "") === "paid_unfulfilled")
    .map((o) => {
      const p = productMap.get(toIdString(o.productId));
      if (!p) return null;
      const hasStock = Object.prototype.hasOwnProperty.call(p, "stock") && p.stock !== null && p.stock !== undefined;
      const hasInventory = Object.prototype.hasOwnProperty.call(p, "inventory") && p.inventory !== null && p.inventory !== undefined;
      if (hasStock || hasInventory) return null;
      return {
        orderId: toIdString(o._id),
        productId: toIdString(p._id),
        title: p.title || p.name || null,
        orderState: o.orderState || null,
        status: o.status || null,
        paymentStatus: o.paymentStatus || null,
      };
    })
    .filter(Boolean);

  console.log(
    JSON.stringify(
      {
        cohorts: Object.fromEntries(Object.entries(cohorts).map(([k, v]) => [k, v.length])),
        platformHoldPaid: {
          count: cohorts.paid_platform_hold.length,
          totalSellerPayout: cohorts.paid_platform_hold.reduce((s, o) => s + num(o.sellerPayout), 0),
        },
        productFieldDistribution,
        affectedOpenOrders,
      },
      null,
      2,
    ),
  );

  await client.close();
}

main().catch((err) => {
  const sanitized = err instanceof Error ? { name: err.name, message: err.message } : { message: String(err) };
  console.error(JSON.stringify({ error: sanitized }, null, 2));
  process.exit(1);
});
