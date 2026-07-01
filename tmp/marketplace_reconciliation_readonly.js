const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');

dotenv.config({ path: '.env.local' });
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'bwes-cluster';
if (!uri) throw new Error('Missing MONGODB_URI');

const client = new MongoClient(uri, { readPreference: 'primaryPreferred' });
const now = new Date();
const staleCutoff = new Date(now.getTime() - 24*60*60*1000);

function toId(v){ if (!v) return ''; if (typeof v === 'string') return v; if (v instanceof ObjectId) return String(v); if (typeof v === 'object' && typeof v.toString === 'function') return String(v.toString()); return ''; }
function num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
function d(v){ const x = v ? new Date(v) : null; return x && !Number.isNaN(+x) ? x : null; }
function lower(v){ return String(v || '').toLowerCase(); }
function hasVal(v){ return !(v === undefined || v === null || v === ''); }
function amountGross(o){ return num(o.grossAmount || o.totalCents || o.totalPrice || o.total || o.amountCents || o.subtotalCents || o.subtotal); }
function amountFee(o){ return num(o.bweFee); }
function amountSeller(o){ const state = lower(o.paymentStatus) === 'paid' || o.paid === true || !!o.paidAt || ['fulfilled_payout_ready','fulfilled_payout_pending'].includes(String(o.orderState||'')); if (!state) return 0; return num(o.sellerPayout); }
function paymentConfirmed(o){ return lower(o.paymentStatus) === 'paid' || o.paid === true || !!o.paidAt || ['fulfilled_payout_ready','fulfilled_payout_pending','paid_unfulfilled'].includes(String(o.orderState||'')); }
function inventoryChanged(o){ return ['fulfilled_payout_ready','fulfilled_payout_pending'].includes(String(o.orderState||'')) || lower(o.fulfillmentStatus) === 'fulfilled' || lower(o.status) === 'fulfilled'; }
function sellerFundsOwed(o){ if (!paymentConfirmed(o)) return false; return num(o.sellerPayout) > 0 && (String(o.payoutMode||'') === 'platform_hold' || ['ready','pending'].includes(lower(o.payoutStatus))); }
function hasSession(o){ return hasVal(o.sessionId) || hasVal(o.stripeSessionId) || hasVal(o.paymentSessionId); }
function sessionValue(o){ return o.sessionId || o.stripeSessionId || o.paymentSessionId || null; }
function paymentIntentValue(o){ return o.paymentIntentId || o.paymentIntent || null; }

(async () => {
  await client.connect();
  const db = client.db(dbName);
  const orders = await db.collection('orders').find({}, { projection: {
    _id:1, createdAt:1, updatedAt:1, orderState:1, status:1, paymentStatus:1, fulfillmentStatus:1, payoutStatus:1,
    paid:1, paidAt:1, fulfilledAt:1, payoutMode:1, needsManualSellerPayout:1, sessionId:1, stripeSessionId:1, paymentSessionId:1,
    paymentIntentId:1, paymentIntent:1, sellerPayout:1, grossAmount:1, bweFee:1, totalCents:1, totalPrice:1, subtotal:1, subtotalCents:1,
    productId:1, sellerId:1, buyerId:1, userId:1, cancellationReason:1, canceledAt:1, cancelledAt:1, expiresAt:1, expiredAt:1, transferId:1, stripeTransferId:1, payoutTransferId:1, transfer:1
  }}).toArray();
  const products = await db.collection('products').find({}, { projection: {
    _id:1, status:1, published:1, isPublished:1, approved:1, approvalStatus:1, sellerId:1, userId:1,
    price:1, stock:1, inventory:1, title:1, name:1, active:1
  }}).toArray();
  const payments = await db.collection('payments').find({}, { projection: {
    _id:1, stripeSessionId:1, paymentIntentId:1, userId:1, email:1, type:1, itemId:1, amountCents:1, bweFee:1, payout:1, status:1,
    createdAt:1, updatedAt:1, paidAt:1, metadata:1
  }}).toArray();

  const filters = {
    checkout_created_but_unpaid: '{ $or: [{ orderState: "checkout_pending" }, { orderState: "pending_checkout" }, { status: "pending_checkout", orderState: { $exists: false } }], unpaid }',
    stale_or_abandoned_checkout: '{ checkout pending unpaid, createdAt/updatedAt < now-24h }',
    payment_pending: '{ paymentStatus: { $in: ["processing","requires_action","requires_payment_method","requires_confirmation"] } }',
    paid_and_unfulfilled: '{ payment confirmed, not refunded/cancelled/failed, not fulfilled }',
    fulfilled: '{ orderState in ["fulfilled_payout_ready","fulfilled_payout_pending"] OR fulfillmentStatus/status = "fulfilled" }',
    paid_destination_charge: '{ payoutMode: "destination_charge", payment confirmed }',
    paid_platform_hold: '{ payoutMode: "platform_hold", payment confirmed }',
    payout_ready: '{ payoutStatus: "ready" OR orderState: "fulfilled_payout_ready" }',
    payout_pending: '{ payoutStatus: "pending" OR orderState: "fulfilled_payout_pending" }',
    payout_completed: '{ payoutStatus: "completed" }',
    refunded: '{ any of orderState/status/paymentStatus/fulfillmentStatus = "refunded" }',
    cancelled_or_failed: '{ any of orderState/status/paymentStatus/fulfillmentStatus in ["cancelled","canceled","failed"] }',
    legacy_or_unknown_state: '{ not captured by primary lifecycle cohorts }'
  };

  const cohorts = {
    checkout_created_but_unpaid: [], stale_or_abandoned_checkout: [], payment_pending: [], paid_and_unfulfilled: [], fulfilled: [],
    paid_destination_charge: [], paid_platform_hold: [], payout_ready: [], payout_pending: [], payout_completed: [], refunded: [], cancelled_or_failed: [], legacy_or_unknown_state: []
  };

  const isCheckoutPending = o => ['checkout_pending','pending_checkout'].includes(String(o.orderState||'')) || (!o.orderState && String(o.status||'') === 'pending_checkout');
  const isPaymentPending = o => ['processing','requires_action','requires_payment_method','requires_confirmation'].includes(String(o.paymentStatus||''));
  const isFulfilled = o => ['fulfilled_payout_ready','fulfilled_payout_pending'].includes(String(o.orderState||'')) || lower(o.fulfillmentStatus) === 'fulfilled' || lower(o.status) === 'fulfilled';
  const isRefunded = o => [o.orderState,o.status,o.paymentStatus,o.fulfillmentStatus].some(v => lower(v) === 'refunded');
  const isCancelledFailed = o => [o.orderState,o.status,o.paymentStatus,o.fulfillmentStatus].some(v => ['cancelled','canceled','failed'].includes(lower(v)));

  for (const o of orders) {
    const created = d(o.createdAt) || d(o.updatedAt);
    if (isCheckoutPending(o) && !paymentConfirmed(o)) cohorts.checkout_created_but_unpaid.push(o);
    if (isCheckoutPending(o) && !paymentConfirmed(o) && created && created < staleCutoff) cohorts.stale_or_abandoned_checkout.push(o);
    if (isPaymentPending(o)) cohorts.payment_pending.push(o);
    if (paymentConfirmed(o) && !isFulfilled(o) && !isRefunded(o) && !isCancelledFailed(o)) cohorts.paid_and_unfulfilled.push(o);
    if (isFulfilled(o)) cohorts.fulfilled.push(o);
    if (String(o.payoutMode||'') === 'destination_charge' && paymentConfirmed(o)) cohorts.paid_destination_charge.push(o);
    if (String(o.payoutMode||'') === 'platform_hold' && paymentConfirmed(o)) cohorts.paid_platform_hold.push(o);
    if (lower(o.payoutStatus) === 'ready' || String(o.orderState||'') === 'fulfilled_payout_ready') cohorts.payout_ready.push(o);
    if (lower(o.payoutStatus) === 'pending' || String(o.orderState||'') === 'fulfilled_payout_pending') cohorts.payout_pending.push(o);
    if (lower(o.payoutStatus) === 'completed') cohorts.payout_completed.push(o);
    if (isRefunded(o)) cohorts.refunded.push(o);
    if (isCancelledFailed(o)) cohorts.cancelled_or_failed.push(o);
    const primary = (isCheckoutPending(o) && !paymentConfirmed(o)) || isPaymentPending(o) || (paymentConfirmed(o) && !isFulfilled(o) && !isRefunded(o) && !isCancelledFailed(o)) || isFulfilled(o) || isRefunded(o) || isCancelledFailed(o);
    if (!primary) cohorts.legacy_or_unknown_state.push(o);
  }

  const cohortSummary = Object.fromEntries(Object.entries(cohorts).map(([k, arr]) => [k, {
    filter: filters[k],
    count: arr.length,
    paymentConfirmed: arr.length ? (arr.every(paymentConfirmed) ? 'yes' : arr.some(paymentConfirmed) ? 'mixed' : 'no') : 'no',
    inventoryChanged: arr.length ? (arr.every(inventoryChanged) ? 'yes' : arr.some(inventoryChanged) ? 'mixed' : 'no') : 'no',
    sellerFundsActuallyOwed: arr.length ? (arr.every(sellerFundsOwed) ? 'yes' : arr.some(sellerFundsOwed) ? 'mixed' : 'no') : 'no',
    totalGrossAmount: arr.reduce((s,o)=>s+amountGross(o),0),
    totalBweFee: arr.reduce((s,o)=>s+amountFee(o),0),
    totalSellerShare: arr.reduce((s,o)=>s+amountSeller(o),0),
  }]));

  const platformHoldAll = orders.filter(o => String(o.payoutMode||'') === 'platform_hold');
  const platformHoldPaid = platformHoldAll.filter(paymentConfirmed);
  const platformHoldUnpaid = platformHoldAll.filter(o => !paymentConfirmed(o));
  const platformHoldSellers = [...new Set(platformHoldPaid.map(o => toId(o.sellerId)).filter(Boolean))];
  const transferIds = [...new Set(orders.flatMap(o => [o.transferId, o.stripeTransferId, o.payoutTransferId, o.transfer]).filter(Boolean).map(String))];

  const pending = cohorts.checkout_created_but_unpaid;
  const pendingAgesHours = pending.map(o => { const created = d(o.createdAt) || d(o.updatedAt) || now; return (now - created) / 36e5; });
  const pendingDates = pending.map(o => d(o.createdAt) || d(o.updatedAt)).filter(Boolean).sort((a,b)=>a-b);
  const ageBuckets = { under_1h:0, h1_to_24:0, d1_to_7:0, over_7d:0 };
  for (const h of pendingAgesHours) { if (h < 1) ageBuckets.under_1h++; else if (h < 24) ageBuckets.h1_to_24++; else if (h < 24*7) ageBuckets.d1_to_7++; else ageBuckets.over_7d++; }
  const pendingNoSession = pending.filter(o => !hasSession(o)).length;
  const pendingWithSessionNoPayment = pending.filter(o => hasSession(o) && !paymentConfirmed(o)).length;
  const cleanupFields = { expiresAtPresent: pending.some(o => hasVal(o.expiresAt) || hasVal(o.expiredAt)), cancellationFieldsPresent: pending.some(o => hasVal(o.cancellationReason) || hasVal(o.canceledAt) || hasVal(o.cancelledAt)) };

  const productShapes = products.map(p => {
    const stockPresent = Object.prototype.hasOwnProperty.call(p, 'stock') && p.stock !== null && p.stock !== undefined;
    const inventoryPresent = Object.prototype.hasOwnProperty.call(p, 'inventory') && p.inventory !== null && p.inventory !== undefined;
    const priceValid = num(p.price) > 0;
    const sellerRelPresent = hasVal(p.sellerId) || hasVal(p.userId);
    const published = p.published === true || p.isPublished === true || lower(p.status) === 'published' || p.active === true;
    const approved = p.approved === true || ['approved','active','published'].includes(lower(p.approvalStatus));
    const publicEligibility = published && approved && priceValid && sellerRelPresent;
    const stripeReadySeller = sellerRelPresent ? 'not provable without an authorized Stripe test' : 'no';
    return { productId: toId(p._id), status: p.status ?? null, publicationAndApproval: { published: !!published, approved: !!approved, approvalStatus: p.approvalStatus ?? null }, sellerRelationship: sellerRelPresent ? 'present' : 'missing', validPrice: priceValid ? 'yes' : 'no', stock: { present: stockPresent ? 'yes' : 'no', value: stockPresent ? p.stock : null }, inventory: { present: inventoryPresent ? 'yes' : 'no', value: inventoryPresent ? p.inventory : null }, publicEligibility: publicEligibility ? 'yes' : 'no', stripeReadySeller };
  });
  const productFieldShapeCounts = { onlyStock:0, onlyInventory:0, both:0, neither:0 };
  for (const p of products) { const hasStock = Object.prototype.hasOwnProperty.call(p, 'stock') && p.stock !== null && p.stock !== undefined; const hasInventory = Object.prototype.hasOwnProperty.call(p, 'inventory') && p.inventory !== null && p.inventory !== undefined; if (hasStock && hasInventory) productFieldShapeCounts.both++; else if (hasStock) productFieldShapeCounts.onlyStock++; else if (hasInventory) productFieldShapeCounts.onlyInventory++; else productFieldShapeCounts.neither++; }

  const totalPaymentRecords = payments.length;
  const marketplacePayments = payments.filter(p => String(p.type||'') === 'product');
  const paidMarketplacePayments = marketplacePayments.filter(p => lower(p.status) === 'paid');
  const pendingMarketplacePayments = marketplacePayments.filter(p => !['paid','refunded'].includes(lower(p.status)));
  const refundedMarketplacePayments = marketplacePayments.filter(p => lower(p.status) === 'refunded');

  const ordersBySession = new Map(); const ordersByIntent = new Map();
  for (const o of orders) { const s = sessionValue(o); if (s) ordersBySession.set(String(s), o); const pi = paymentIntentValue(o); if (pi) ordersByIntent.set(String(pi), o); }
  let linkedToOrder = 0, lackingOrderLink = 0;
  for (const p of marketplacePayments) { const linked = (p.stripeSessionId && ordersBySession.has(String(p.stripeSessionId))) || (p.paymentIntentId && ordersByIntent.has(String(p.paymentIntentId))); if (linked) linkedToOrder++; else lackingOrderLink++; }
  const paidOrdersLackingMatchingPayment = orders.filter(o => paymentConfirmed(o) && !((sessionValue(o) && marketplacePayments.some(p => String(p.stripeSessionId||'') === String(sessionValue(o)))) || (paymentIntentValue(o) && marketplacePayments.some(p => String(p.paymentIntentId||'') === String(paymentIntentValue(o)))))).length;
  function dupes(rows, field){ const m = new Map(); for (const r of rows) { const v = r[field]; if (!v) continue; const key = String(v); m.set(key, (m.get(key)||0)+1); } return [...m.entries()].filter(([,c])=>c>1).map(([id,count])=>({id,count})); }

  console.log(JSON.stringify({ databaseName: dbName, orderCount: orders.length, cohortSummary, platformHold: { totalPlatformHoldRecords: platformHoldAll.length, paidPlatformHoldRecords: platformHoldPaid.length, unpaidPlatformHoldRecords: platformHoldUnpaid.length, sellersAssociatedWithPaidHeldTransactions: platformHoldSellers, totalPaidSellerAmountAwaitingRelease: platformHoldPaid.reduce((s,o)=>s+amountSeller(o),0), anySellerPresentlyOwedHeldFunds: platformHoldPaid.some(o => amountSeller(o) > 0), transferOrReleaseIdentifiersExist: transferIds.length > 0, transferIdentifierSamples: transferIds.slice(0,10) }, checkoutAbandonment: { pendingCheckoutCount: pending.length, noStripeSessionId: pendingNoSession, sessionIdButNoConfirmedPayment: pendingWithSessionNoPayment, ageDistribution: ageBuckets, oldestPendingTimestamp: pendingDates.length ? pendingDates[0].toISOString() : null, newestPendingTimestamp: pendingDates.length ? pendingDates[pendingDates.length-1].toISOString() : null, expirationCancellationOrCleanupFieldsExist: cleanupFields }, productShapes: { products: productShapes, fieldShapeCounts: productFieldShapeCounts }, inventoryRisk: { checkoutDefaultWhenBothAbsent: 'source falls back to $ifNull([stock, $ifNull([inventory,0])]); both absent behaves as 0 at checkout gate', fulfillmentDefaultWhenBothAbsent: 'same source expression treats both absent as 0 and rejects decrement as out_of_stock', checkoutAcceptFulfillmentRejectMismatchPossible: false, decrementBothCanCreateMissingFieldNegativeOne: true, currentProductsExposedToMissingFieldRisk: products.filter(p => { const hasStock = Object.prototype.hasOwnProperty.call(p, 'stock') && p.stock !== null && p.stock !== undefined; const hasInventory = Object.prototype.hasOwnProperty.call(p, 'inventory') && p.inventory !== null && p.inventory !== undefined; return hasStock !== hasInventory; }).map(p => toId(p._id)), currentProductsExposedToBothAbsentRisk: products.filter(p => { const hasStock = Object.prototype.hasOwnProperty.call(p, 'stock') && p.stock !== null && p.stock !== undefined; const hasInventory = Object.prototype.hasOwnProperty.call(p, 'inventory') && p.inventory !== null && p.inventory !== undefined; return !hasStock && !hasInventory; }).map(p => toId(p._id)) }, paymentOrderReconciliation: { totalPaymentRecords, paidMarketplacePaymentRecords: paidMarketplacePayments.length, pendingMarketplacePaymentRecords: pendingMarketplacePayments.length, refundedMarketplacePaymentRecords: refundedMarketplacePayments.length, paymentsLinkedToOrder: linkedToOrder, paymentsLackingOrderLink: lackingOrderLink, paidOrdersLackingMatchingPayment, duplicateSessionIds: dupes(payments, 'stripeSessionId'), duplicatePaymentIntentIds: dupes(payments, 'paymentIntentId') } }, null, 2));
  await client.close();
})().catch(async (err) => { console.error(err && err.message ? err.message : String(err)); try { await client.close(); } catch {} process.exit(1); });
