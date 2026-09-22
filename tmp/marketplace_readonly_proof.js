const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');
dotenv.config({ path: '/Users/blackforge/workspace/bwe/repos/repo_clean/.env.local' });
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) throw new Error('Missing MONGODB_URI or MONGODB_DB');

const client = new MongoClient(uri, { readPreference: 'primaryPreferred' });

function num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
function bool(v){ return v === true; }
function date(v){ const d = v ? new Date(v) : null; return d && !isNaN(+d) ? d : null; }
function toIdString(v){
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v instanceof ObjectId) return String(v);
  if (typeof v === 'object' && typeof v.toString === 'function') return String(v.toString());
  return '';
}

(async () => {
  await client.connect();
  const db = client.db(dbName);
  const orders = await db.collection('orders').find({}, {
    projection: {
      _id:1, createdAt:1, updatedAt:1,
      orderState:1, status:1, paymentStatus:1, fulfillmentStatus:1, payoutStatus:1,
      paid:1, paidAt:1, fulfilledAt:1, payoutMode:1, needsManualSellerPayout:1,
      sessionId:1, stripeSessionId:1, paymentSessionId:1, paymentIntentId:1, paymentIntent:1,
      sellerPayout:1, grossAmount:1, bweFee:1, totalCents:1, totalPrice:1,
      productId:1, sellerId:1
    }
  }).toArray();

  const products = await db.collection('products').find({}, {
    projection: { _id:1, title:1, name:1, stock:1, inventory:1, sellerId:1, price:1, updatedAt:1 }
  }).toArray();

  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 24*60*60*1000);

  const productMap = new Map(products.map(p => [toIdString(p._id), p]));
  const shape = { onlyStock:0, onlyInventory:0, both:0, neither:0, affectedNeitherAvailableAtCheckout:[] };
  for (const p of products) {
    const hasStock = Object.prototype.hasOwnProperty.call(p, 'stock') && p.stock !== null && p.stock !== undefined;
    const hasInventory = Object.prototype.hasOwnProperty.call(p, 'inventory') && p.inventory !== null && p.inventory !== undefined;
    if (hasStock && hasInventory) shape.both++;
    else if (hasStock) shape.onlyStock++;
    else if (hasInventory) shape.onlyInventory++;
    else {
      shape.neither++;
      shape.affectedNeitherAvailableAtCheckout.push({
        _id: toIdString(p._id),
        title: p.title || p.name || null,
        sellerId: toIdString(p.sellerId),
        price: p.price ?? null
      });
    }
  }

  const filters = {
    checkout_pending_unpaid: o => {
      const state = String(o.orderState || o.status || '');
      const p = String(o.paymentStatus || '');
      return (state === 'checkout_pending' || state === 'pending_checkout') && p === 'pending' && !bool(o.paid);
    },
    stale_or_abandoned_checkout: o => {
      const state = String(o.orderState || o.status || '');
      const p = String(o.paymentStatus || '');
      const created = date(o.createdAt) || date(o.updatedAt);
      return (state === 'checkout_pending' || state === 'pending_checkout') && p === 'pending' && !bool(o.paid) && created && created < staleCutoff;
    },
    payment_pending: o => {
      const p = String(o.paymentStatus || '');
      return p === 'processing' || p === 'requires_action' || p === 'requires_payment_method' || p === 'requires_confirmation' || (p === 'pending' && bool(o.paid));
    },
    paid_unfulfilled: o => {
      const state = String(o.orderState || o.status || '');
      const p = String(o.paymentStatus || '');
      const f = String(o.fulfillmentStatus || '');
      return state === 'paid_unfulfilled' || (p === 'paid' && f !== 'fulfilled' && state !== 'fulfilled_payout_ready' && state !== 'fulfilled_payout_pending');
    },
    fulfilled: o => {
      const state = String(o.orderState || o.status || '');
      const f = String(o.fulfillmentStatus || '');
      return state === 'fulfilled_payout_ready' || state === 'fulfilled_payout_pending' || f === 'fulfilled' || String(o.status || '') === 'fulfilled';
    },
    paid_destination_charge: o => {
      return String(o.payoutMode || '') === 'destination_charge' && (String(o.paymentStatus || '') === 'paid' || bool(o.paid));
    },
    paid_platform_hold: o => {
      return String(o.payoutMode || '') === 'platform_hold' && (String(o.paymentStatus || '') === 'paid' || bool(o.paid));
    },
    payout_ready: o => {
      return String(o.payoutStatus || '') === 'ready' || String(o.orderState || '') === 'fulfilled_payout_ready';
    },
    payout_pending: o => {
      return String(o.payoutStatus || '') === 'pending' || String(o.orderState || '') === 'fulfilled_payout_pending';
    },
    payout_completed: o => {
      return String(o.payoutStatus || '') === 'completed';
    },
    refunded: o => {
      const vals = [o.orderState, o.status, o.paymentStatus, o.fulfillmentStatus].map(v => String(v || '').toLowerCase());
      return vals.includes('refunded');
    },
    cancelled_or_failed: o => {
      const vals = [o.orderState, o.status, o.paymentStatus, o.fulfillmentStatus].map(v => String(v || '').toLowerCase());
      return vals.includes('cancelled') || vals.includes('canceled') || vals.includes('failed');
    },
  };

  const matches = {};
  for (const k of Object.keys(filters)) matches[k] = [];
  const unknown = [];

  for (const o of orders) {
    if (filters.checkout_pending_unpaid(o)) {}
    else if (filters.payment_pending(o)) {}
    else if (filters.paid_unfulfilled(o)) {}
    else if (filters.fulfilled(o)) {}
    else if (filters.refunded(o)) {}
    else if (filters.cancelled_or_failed(o)) {}
    else unknown.push(o);

    for (const k of Object.keys(filters)) {
      if (filters[k](o)) matches[k].push(o);
    }
  }

  const platformHoldPaid = matches.paid_platform_hold;
  const totalPaidPlatformHoldSellerPayout = platformHoldPaid.reduce((s,o)=>s+num(o.sellerPayout),0);

  const affectedOpenOrders = [];
  for (const o of orders) {
    const state = String(o.orderState || o.status || '');
    if (!['checkout_pending','pending_checkout','paid_unfulfilled'].includes(state)) continue;
    const p = productMap.get(toIdString(o.productId));
    if (!p) continue;
    const hasStock = Object.prototype.hasOwnProperty.call(p, 'stock') && p.stock !== null && p.stock !== undefined;
    const hasInventory = Object.prototype.hasOwnProperty.call(p, 'inventory') && p.inventory !== null && p.inventory !== undefined;
    if (!hasStock && !hasInventory) {
      affectedOpenOrders.push({ orderId: toIdString(o._id), productId: toIdString(p._id), title: p.title || p.name || null, orderState: state, paymentStatus: o.paymentStatus || null });
    }
  }

  const result = {
    meta: {
      ordersCount: orders.length,
      productsCount: products.length,
      staleCutoff: staleCutoff.toISOString()
    },
    counts: Object.fromEntries(Object.entries(matches).map(([k,v]) => [k, v.length])),
    unknown_or_legacy_state_count: unknown.length,
    platformHoldPaid: {
      count: platformHoldPaid.length,
      totalSellerPayout: totalPaidPlatformHoldSellerPayout
    },
    productFieldDistribution: shape,
    affectedOpenOrders,
    sampleUnknown: unknown.slice(0,20).map(o => ({
      _id: toIdString(o._id), orderState: o.orderState || null, status: o.status || null, paymentStatus: o.paymentStatus || null,
      fulfillmentStatus: o.fulfillmentStatus || null, payoutStatus: o.payoutStatus || null, payoutMode: o.payoutMode || null
    }))
  };

  console.log(JSON.stringify(result, null, 2));
  await client.close();
})().catch(async err => { console.error(err); try { await client.close(); } catch {} process.exit(1); });
