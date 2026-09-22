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
function toIdString(v){ if (!v) return ''; if (typeof v === 'string') return v; if (v instanceof ObjectId) return String(v); if (typeof v === 'object' && typeof v.toString === 'function') return String(v.toString()); return ''; }
(async () => {
  await client.connect();
  const db = client.db(dbName);
  const orders = await db.collection('orders').find({}, { projection: {
    _id:1, createdAt:1, updatedAt:1, orderState:1, status:1, paymentStatus:1, fulfillmentStatus:1, payoutStatus:1,
    paid:1, paidAt:1, fulfilledAt:1, payoutMode:1, needsManualSellerPayout:1, sessionId:1, stripeSessionId:1, paymentSessionId:1,
    paymentIntentId:1, paymentIntent:1, sellerPayout:1, grossAmount:1, bweFee:1, totalCents:1, totalPrice:1, productId:1, sellerId:1
  }}).toArray();
  const products = await db.collection('products').find({}, { projection: { _id:1, title:1, name:1, stock:1, inventory:1, sellerId:1, price:1 } }).toArray();
  const productMap = new Map(products.map(p => [toIdString(p._id), p]));
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 24*60*60*1000);

  const canonicalOpen = o => ['checkout_pending','pending_checkout'].includes(String(o.orderState || ''));
  const legacyOpen = o => String(o.orderState || '') === '' && String(o.status || '') === 'pending_checkout';
  const pendingCheckoutAny = o => canonicalOpen(o) || legacyOpen(o);
  const paidFlag = o => String(o.paymentStatus || '').toLowerCase() === 'paid' || bool(o.paid) || !!o.paidAt;
  const fulfilledFlag = o => ['fulfilled_payout_ready','fulfilled_payout_pending'].includes(String(o.orderState || '')) || String(o.fulfillmentStatus || '').toLowerCase() === 'fulfilled' || String(o.status || '').toLowerCase() === 'fulfilled';
  const refundedFlag = o => [o.orderState,o.status,o.paymentStatus,o.fulfillmentStatus].some(v => String(v||'').toLowerCase() === 'refunded');
  const cancelledFailedFlag = o => [o.orderState,o.status,o.paymentStatus,o.fulfillmentStatus].some(v => ['cancelled','canceled','failed'].includes(String(v||'').toLowerCase()));

  const cohorts = {
    checkout_pending_unpaid: [],
    stale_or_abandoned_checkout: [],
    payment_pending: [],
    paid_unfulfilled: [],
    fulfilled: [],
    paid_destination_charge: [],
    paid_platform_hold: [],
    payout_ready: [],
    payout_pending: [],
    payout_completed: [],
    refunded: [],
    cancelled_or_failed: [],
    unknown_or_legacy_state: []
  };

  for (const o of orders) {
    const created = date(o.createdAt) || date(o.updatedAt);
    if (pendingCheckoutAny(o) && !paidFlag(o)) cohorts.checkout_pending_unpaid.push(o);
    if (pendingCheckoutAny(o) && !paidFlag(o) && created && created < staleCutoff) cohorts.stale_or_abandoned_checkout.push(o);
    if (['processing','requires_action','requires_payment_method','requires_confirmation'].includes(String(o.paymentStatus || ''))) cohorts.payment_pending.push(o);
    if (paidFlag(o) && !fulfilledFlag(o) && !refundedFlag(o) && !cancelledFailedFlag(o)) cohorts.paid_unfulfilled.push(o);
    if (fulfilledFlag(o)) cohorts.fulfilled.push(o);
    if (String(o.payoutMode || '') === 'destination_charge' && paidFlag(o)) cohorts.paid_destination_charge.push(o);
    if (String(o.payoutMode || '') === 'platform_hold' && paidFlag(o)) cohorts.paid_platform_hold.push(o);
    if (String(o.payoutStatus || '').toLowerCase() === 'ready' || String(o.orderState || '') === 'fulfilled_payout_ready') cohorts.payout_ready.push(o);
    if (String(o.payoutStatus || '').toLowerCase() === 'pending' || String(o.orderState || '') === 'fulfilled_payout_pending') cohorts.payout_pending.push(o);
    if (String(o.payoutStatus || '').toLowerCase() === 'completed') cohorts.payout_completed.push(o);
    if (refundedFlag(o)) cohorts.refunded.push(o);
    if (cancelledFailedFlag(o)) cohorts.cancelled_or_failed.push(o);

    const knownPrimary = (
      (pendingCheckoutAny(o) && !paidFlag(o)) ||
      (['processing','requires_action','requires_payment_method','requires_confirmation'].includes(String(o.paymentStatus || ''))) ||
      (paidFlag(o) && !fulfilledFlag(o) && !refundedFlag(o) && !cancelledFailedFlag(o)) ||
      fulfilledFlag(o) || refundedFlag(o) || cancelledFailedFlag(o)
    );
    if (!knownPrimary) cohorts.unknown_or_legacy_state.push(o);
  }

  const shape = { onlyStock:0, onlyInventory:0, both:0, neither:0, affectedNeitherAvailableAtCheckout:[] };
  for (const p of products) {
    const hasStock = Object.prototype.hasOwnProperty.call(p, 'stock') && p.stock !== null && p.stock !== undefined;
    const hasInventory = Object.prototype.hasOwnProperty.call(p, 'inventory') && p.inventory !== null && p.inventory !== undefined;
    if (hasStock && hasInventory) shape.both++;
    else if (hasStock) shape.onlyStock++;
    else if (hasInventory) shape.onlyInventory++;
    else { shape.neither++; shape.affectedNeitherAvailableAtCheckout.push({_id:toIdString(p._id), title:p.title||p.name||null, sellerId:toIdString(p.sellerId), price:p.price??null}); }
  }

  const affectedOpenOrders = [];
  for (const o of orders) {
    if (!(pendingCheckoutAny(o) || String(o.orderState || '') === 'paid_unfulfilled')) continue;
    const p = productMap.get(toIdString(o.productId));
    if (!p) continue;
    const hasStock = Object.prototype.hasOwnProperty.call(p, 'stock') && p.stock !== null && p.stock !== undefined;
    const hasInventory = Object.prototype.hasOwnProperty.call(p, 'inventory') && p.inventory !== null && p.inventory !== undefined;
    if (!hasStock && !hasInventory) affectedOpenOrders.push({ orderId: toIdString(o._id), productId: toIdString(p._id), title: p.title || p.name || null, orderState: o.orderState || null, status: o.status || null, paymentStatus: o.paymentStatus || null });
  }

  const samplePaid = cohorts.paid_unfulfilled.slice(0,10).map(o => ({ _id:toIdString(o._id), orderState:o.orderState||null, status:o.status||null, paymentStatus:o.paymentStatus||null, fulfillmentStatus:o.fulfillmentStatus||null, payoutStatus:o.payoutStatus||null, payoutMode:o.payoutMode||null, sellerPayout:o.sellerPayout??null }));
  const sampleFulfilled = cohorts.fulfilled.slice(0,10).map(o => ({ _id:toIdString(o._id), orderState:o.orderState||null, status:o.status||null, paymentStatus:o.paymentStatus||null, fulfillmentStatus:o.fulfillmentStatus||null, payoutStatus:o.payoutStatus||null, payoutMode:o.payoutMode||null, sellerPayout:o.sellerPayout??null }));
  console.log(JSON.stringify({
    meta:{ ordersCount:orders.length, productsCount:products.length, staleCutoff:staleCutoff.toISOString() },
    counts:Object.fromEntries(Object.entries(cohorts).map(([k,v])=>[k,v.length])),
    platformHoldPaid:{ count:cohorts.paid_platform_hold.length, totalSellerPayout:cohorts.paid_platform_hold.reduce((s,o)=>s+num(o.sellerPayout),0) },
    productFieldDistribution:shape,
    affectedOpenOrders,
    samplePaid,
    sampleFulfilled,
    sampleUnknown:cohorts.unknown_or_legacy_state.slice(0,20).map(o=>({_id:toIdString(o._id), orderState:o.orderState||null, status:o.status||null, paymentStatus:o.paymentStatus||null, fulfillmentStatus:o.fulfillmentStatus||null, payoutStatus:o.payoutStatus||null, payoutMode:o.payoutMode||null}))
  }, null, 2));
  await client.close();
})().catch(async err => { console.error(err); try { await client.close(); } catch {} process.exit(1); });
