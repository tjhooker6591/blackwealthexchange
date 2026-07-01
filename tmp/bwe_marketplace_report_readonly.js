require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

function idStr(v){ if (!v) return null; if (typeof v === 'string') return v; if (v instanceof ObjectId) return String(v); if (v && typeof v.toString === 'function') return String(v); return null; }
function num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
function centsFromOrder(o){ const totalCents = num(o.totalCents); if (totalCents) return totalCents; const totalPrice = num(o.totalPrice); if (totalPrice) return totalPrice; const total = num(o.total); if (total) return total; const gross = num(o.grossAmount); if (gross) return gross; return 0; }
function bweFee(o){ return num(o.bweFee) || num(o.applicationFee) || 0; }
function sellerShare(o){ if (num(o.sellerPayout)) return num(o.sellerPayout); const total = centsFromOrder(o); const fee = bweFee(o); return total || fee ? Math.max(0, total - fee) : 0; }
function isPaid(o){ const ps = String(o.paymentStatus || '').toLowerCase(); const os = String(o.orderState || '').toLowerCase(); const st = String(o.status || '').toLowerCase(); return o.paid === true || !!o.paidAt || ps === 'paid' || os.includes('paid') || os.startsWith('fulfilled_') || st === 'paid' || st === 'fulfilled'; }
function isFulfilled(o){ const fs = String(o.fulfillmentStatus || '').toLowerCase(); const os = String(o.orderState || '').toLowerCase(); const st = String(o.status || '').toLowerCase(); return !!o.fulfilledAt || fs === 'fulfilled' || os.startsWith('fulfilled_') || st === 'fulfilled'; }
function isRefunded(o){ const ps = String(o.paymentStatus || '').toLowerCase(); const st = String(o.status || '').toLowerCase(); const rs = String(o.refundStatus || '').toLowerCase(); return ps === 'refunded' || st === 'refunded' || rs === 'refunded'; }
function isCancelledFailed(o){ const st = String(o.status || '').toLowerCase(); const os = String(o.orderState || '').toLowerCase(); const ps = String(o.paymentStatus || '').toLowerCase(); return ['cancelled','canceled','failed'].includes(st) || ['cancelled','canceled','failed'].includes(os) || ['cancelled','canceled','failed'].includes(ps); }
function isPendingCheckout(o){ const st = String(o.status || '').toLowerCase(); const os = String(o.orderState || '').toLowerCase(); const ps = String(o.paymentStatus || '').toLowerCase(); return st === 'pending_checkout' || os === 'checkout_pending' || os === 'pending_checkout' || (ps === 'pending' && !!o.stripeSessionId && !isPaid(o) && !isCancelledFailed(o)); }
function ageBucket(ms){ const d = ms / 86400000; if (d < 1) return '<1d'; if (d < 7) return '1-6d'; if (d < 30) return '7-29d'; if (d < 90) return '30-89d'; return '90+d'; }
function payoutMode(o){ return String(o.payoutMode || '').toLowerCase(); }
function isMarketplacePayment(p){ const type = String(p.type || '').toLowerCase(); const metaType = String((p.metadata||{}).type || '').toLowerCase(); return type === 'product' || metaType === 'product'; }

(async()=>{
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'bwes-cluster';
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(dbName);
  const [orders, payments, products, sellers] = await Promise.all([
    db.collection('orders').find({}).toArray(),
    db.collection('payments').find({}).toArray(),
    db.collection('products').find({}).toArray(),
    db.collection('sellers').find({}).toArray(),
  ]);

  const marketplacePayments = payments.filter(isMarketplacePayment);
  const paymentsByOrderId = new Map();
  const paymentsBySession = new Map();
  const paymentsByIntent = new Map();
  for (const p of marketplacePayments) {
    const orderId = idStr((p.metadata||{}).orderId || p.orderId);
    if (orderId) { if (!paymentsByOrderId.has(orderId)) paymentsByOrderId.set(orderId, []); paymentsByOrderId.get(orderId).push(p); }
    if (p.stripeSessionId) { if (!paymentsBySession.has(p.stripeSessionId)) paymentsBySession.set(p.stripeSessionId, []); paymentsBySession.get(p.stripeSessionId).push(p); }
    if (p.paymentIntentId) { if (!paymentsByIntent.has(p.paymentIntentId)) paymentsByIntent.set(p.paymentIntentId, []); paymentsByIntent.get(p.paymentIntentId).push(p); }
  }

  const sellerReady = new Map();
  for (const s of sellers) {
    const acct = s?.stripeAccountId || s?.stripe_account_id || s?.stripeConnectAccountId || s?.stripeConnectId || s?.stripe?.accountId || s?.stripe?.connectedAccountId || s?.connect?.accountId;
    sellerReady.set(idStr(s._id), typeof acct === 'string' && acct.trim().startsWith('acct_'));
  }

  const cohorts = { checkout_created_but_unpaid: [], stale_or_abandoned_checkout: [], payment_pending: [], paid_and_unfulfilled: [], fulfilled: [], paid_destination_charge: [], paid_platform_hold: [], payout_ready: [], payout_pending: [], payout_completed: [], refunded: [], cancelled_or_failed: [], legacy_or_unknown: [] };
  const now = Date.now();
  for (const o of orders) {
    const paid = isPaid(o); const fulfilled = isFulfilled(o); const refunded = isRefunded(o); const cancelledFailed = isCancelledFailed(o); const pendingCheckout = isPendingCheckout(o); const ps = String(o.paymentStatus || '').toLowerCase(); const po = payoutMode(o); const pst = String(o.payoutStatus || '').toLowerCase(); const created = new Date(o.createdAt || o.updatedAt || 0).getTime(); const stalePending = pendingCheckout && created && (now - created > 24*3600*1000);
    if (pendingCheckout) cohorts.checkout_created_but_unpaid.push(o);
    if (stalePending) cohorts.stale_or_abandoned_checkout.push(o);
    if (!paid && ps === 'pending' && !pendingCheckout && !cancelledFailed) cohorts.payment_pending.push(o);
    if (paid && !fulfilled && !refunded) cohorts.paid_and_unfulfilled.push(o);
    if (fulfilled && !refunded) cohorts.fulfilled.push(o);
    if (paid && po === 'destination_charge' && !refunded) cohorts.paid_destination_charge.push(o);
    if (paid && po === 'platform_hold' && !refunded) cohorts.paid_platform_hold.push(o);
    if (pst === 'ready' && paid && !refunded) cohorts.payout_ready.push(o);
    if (pst === 'pending' && paid && !refunded) cohorts.payout_pending.push(o);
    if (pst === 'completed' && paid && !refunded) cohorts.payout_completed.push(o);
    if (refunded) cohorts.refunded.push(o);
    if (cancelledFailed) cohorts.cancelled_or_failed.push(o);
    const recognized = pendingCheckout || stalePending || (!paid && ps === 'pending' && !pendingCheckout && !cancelledFailed) || (paid && !fulfilled && !refunded) || (fulfilled && !refunded) || (paid && (po === 'destination_charge' || po === 'platform_hold') && !refunded) || (pst === 'ready' || pst === 'pending' || pst === 'completed') || refunded || cancelledFailed;
    if (!recognized) cohorts.legacy_or_unknown.push(o);
  }

  function summarize(list, filterText, paymentConfirmed, inventoryChanged, sellerFundsOwed, action){ return { exactFilter: filterText, count: list.length, paymentConfirmed, inventoryChanged, sellerFundsActuallyOwed: sellerFundsOwed, aggregateGrossAmount: list.reduce((a,o)=>a+centsFromOrder(o),0), aggregateBweFee: list.reduce((a,o)=>a+bweFee(o),0), aggregateSellerShare: list.reduce((a,o)=>a+sellerShare(o),0), operationalActionRequired: action, sampleOrderIds: list.slice(0,5).map(o=>idStr(o._id)).filter(Boolean) }; }

  const platformHolds = orders.filter(o => payoutMode(o) === 'platform_hold');
  const paidPlatformHolds = platformHolds.filter(o => isPaid(o) && !isRefunded(o));
  const unpaidPlatformHolds = platformHolds.filter(o => !isPaid(o) && !isRefunded(o));
  const releaseIds = paidPlatformHolds.map(o => ({ orderId: idStr(o._id), identifiers: [o.transferId, o.stripeTransferId, o.payoutId, o.stripePayoutId, o.releaseId, o.transferGroup, o.sourceTransaction].filter(Boolean) })).filter(x => x.identifiers.length);
  const owedSellerIds = [...new Set(paidPlatformHolds.filter(o => sellerShare(o) > 0).map(o => idStr(o.sellerId)).filter(Boolean))];

  const pendingShells = cohorts.checkout_created_but_unpaid;
  const noSessionId = pendingShells.filter(o => !(o.sessionId || o.stripeSessionId || o.paymentSessionId));
  const withSessionNoPaid = pendingShells.filter(o => (o.sessionId || o.stripeSessionId || o.paymentSessionId) && !isPaid(o));
  const pendingDates = pendingShells.map(o => new Date(o.createdAt || o.updatedAt || 0).getTime()).filter(Boolean).sort((a,b)=>a-b);
  const ageBuckets = {}; for (const o of pendingShells) { const t = new Date(o.createdAt || o.updatedAt || 0).getTime(); const b = t ? ageBucket(now - t) : 'unknown'; ageBuckets[b] = (ageBuckets[b] || 0) + 1; }
  const expirationFieldRecords = pendingShells.filter(o => o.expiresAt || o.expiredAt || o.cancelledAt || o.canceledAt || o.checkoutExpiresAt);

  const productShapes = products.map(p => { const sid = idStr(p.sellerId || p.seller_id || (p.seller && p.seller._id) || p.seller); const stripeReady = sid ? !!sellerReady.get(sid) : false; const stockPresent = Object.prototype.hasOwnProperty.call(p, 'stock'); const inventoryPresent = Object.prototype.hasOwnProperty.call(p, 'inventory'); const priceValid = num(p.price) > 0; return { productId: idStr(p._id), status: p.status ?? null, approvalState: p.approvalState ?? p.approved ?? p.isApproved ?? null, publicationState: p.publicationState ?? p.isPublished ?? p.published ?? null, sellerRelationshipPresent: !!sid, sellerStripeReady: stripeReady ? 'yes' : 'no', validPrice: priceValid ? 'yes' : 'no', stockPresent, stockValue: stockPresent ? p.stock : null, inventoryPresent, inventoryValue: inventoryPresent ? p.inventory : null, publicEligibility: (String(p.status||'').toLowerCase()==='active' && priceValid && stripeReady) ? 'yes' : 'no', checkoutAllowsMissingDefaultToOne: !stockPresent && !inventoryPresent, fulfillmentRejectsSameAsOutOfStock: !stockPresent && !inventoryPresent, missingInventoryFieldWouldBeCreatedNegativeOne: stockPresent && !inventoryPresent, doubleDecrementRisk: stockPresent && inventoryPresent }; });

  const paidOrdersWithoutMatchingPaymentRecords = orders.filter(o => isPaid(o) && !paymentsByOrderId.has(idStr(o._id)) && !(o.stripeSessionId && paymentsBySession.has(o.stripeSessionId)) && !(o.paymentIntentId && paymentsByIntent.has(o.paymentIntentId))).map(o => ({ orderId:idStr(o._id), stripeSessionId:o.stripeSessionId||null, paymentIntentId:o.paymentIntentId||null, payoutMode:o.payoutMode||null, status:o.status||null, paymentStatus:o.paymentStatus||null }));
  const duplicateStripeSessionIds = [...paymentsBySession.entries()].filter(([,arr]) => arr.length > 1).map(([k,arr])=>({ stripeSessionId:k, count:arr.length }));
  const duplicatePaymentIntentIds = [...paymentsByIntent.entries()].filter(([,arr]) => arr.length > 1).map(([k,arr])=>({ paymentIntentId:k, count:arr.length }));

  const result = {
    dbName,
    totals: { totalOrders: orders.length, totalPayments: payments.length, marketplacePaymentRecords: marketplacePayments.length, totalProducts: products.length },
    orderCohorts: {
      checkout_created_but_unpaid: summarize(cohorts.checkout_created_but_unpaid, 'status = "pending_checkout" OR orderState IN ["checkout_pending","pending_checkout"] OR (paymentStatus = "pending" AND stripeSessionId exists AND not paid)', 'no', 'no', 'no', 'Expire/cancel abandoned shells and reconcile to Stripe session status.'),
      stale_or_abandoned_checkout: summarize(cohorts.stale_or_abandoned_checkout, 'same as checkout_created_but_unpaid plus createdAt older than 24h', 'no', 'no', 'no', 'Needs cleanup path or explicit cancellation/expiration reconciliation.'),
      payment_pending: summarize(cohorts.payment_pending, 'paymentStatus = "pending" AND not in checkout shell cohort AND not cancelled/failed', 'no', 'unknown', 'no', 'Investigate unresolved payment states.'),
      paid_and_unfulfilled: summarize(cohorts.paid_and_unfulfilled, 'paid = true OR paymentStatus = "paid" OR paidAt exists, AND not fulfilled, AND not refunded', 'yes', 'unknown', 'yes', 'Manually reconcile fulfillment and seller obligation.'),
      fulfilled: summarize(cohorts.fulfilled, 'fulfilledAt exists OR fulfillmentStatus = "fulfilled" OR orderState starts with "fulfilled_"', 'yes', 'unknown', 'yes', 'Verify payout completion tracking and audit inventory decrements.'),
      paid_destination_charge: summarize(cohorts.paid_destination_charge, 'paid order with payoutMode = "destination_charge"', 'yes', 'unknown', 'no', 'Destination-charge funds routed during payment processing; not proof of standalone transfer creation.'),
      paid_platform_hold: summarize(cohorts.paid_platform_hold, 'paid order with payoutMode = "platform_hold"', 'yes', 'unknown', 'yes', 'Held seller funds require release path and persisted transfer/payout identifiers.'),
      payout_ready: summarize(cohorts.payout_ready, 'paid order with payoutStatus = "ready"', 'yes', 'unknown', 'no', 'Ready state exists, but actual payout completion persistence must be verified.'),
      payout_pending: summarize(cohorts.payout_pending, 'paid order with payoutStatus = "pending"', 'yes', 'unknown', 'yes', 'Investigate unpaid seller obligations.'),
      payout_completed: summarize(cohorts.payout_completed, 'paid order with payoutStatus = "completed"', 'yes', 'unknown', 'no', 'Verify whether external payout identifiers are stored.'),
      refunded: summarize(cohorts.refunded, 'paymentStatus = "refunded" OR status = "refunded" OR refundStatus = "refunded"', 'yes', 'unknown', 'no', 'Audit refund/restock/reversal paths.'),
      cancelled_or_failed: summarize(cohorts.cancelled_or_failed, 'status/orderState/paymentStatus in ["cancelled","canceled","failed"]', 'no', 'no', 'no', 'Normalize terminal failure states and cleanup.'),
      legacy_or_unknown: summarize(cohorts.legacy_or_unknown, 'orders not matching the above cohorts', 'unknown', 'unknown', 'unknown', 'Needs schema normalization and lineage review.'),
    },
    platformHoldLiability: {
      totalPlatformHoldRecords: platformHolds.length,
      paidPlatformHoldRecords: paidPlatformHolds.length,
      unpaidPlatformHoldRecords: unpaidPlatformHolds.length,
      paidHeldGrossAmount: paidPlatformHolds.reduce((a,o)=>a+centsFromOrder(o),0),
      paidHeldBweFees: paidPlatformHolds.reduce((a,o)=>a+bweFee(o),0),
      paidHeldSellerAmount: paidPlatformHolds.reduce((a,o)=>a+sellerShare(o),0),
      sellersActuallyOwedHeldFunds: owedSellerIds.length,
      releaseOrTransferIdentifiersPresent: releaseIds,
    },
    abandonedCheckout: {
      pendingCheckoutCount: pendingShells.length,
      countWithoutStripeSessionId: noSessionId.length,
      countWithSessionIdButNoConfirmedPayment: withSessionNoPaid.length,
      oldestPendingTimestamp: pendingDates.length ? new Date(pendingDates[0]).toISOString() : null,
      newestPendingTimestamp: pendingDates.length ? new Date(pendingDates[pendingDates.length-1]).toISOString() : null,
      ageBuckets,
      recordsWithExpirationOrCancellationFields: expirationFieldRecords.length,
      cleanupPathFound: true,
      cleanupPathEvidence: 'src/pages/api/marketplace/check-expired.ts',
      orderShellAssessment: pendingShells.length ? 'Yes, the large order count is driven materially by pre-payment order shells.' : 'No pending shells found.',
    },
    productInventoryShapes: { products: productShapes, summary: { onlyStock: productShapes.filter(p=>p.stockPresent && !p.inventoryPresent).length, onlyInventory: productShapes.filter(p=>!p.stockPresent && p.inventoryPresent).length, both: productShapes.filter(p=>p.stockPresent && p.inventoryPresent).length, neither: productShapes.filter(p=>!p.stockPresent && !p.inventoryPresent).length } },
    paymentsToOrdersReconciliation: {
      totalPaymentRecords: payments.length,
      marketplacePaymentRecords: marketplacePayments.length,
      paidMarketplacePayments: marketplacePayments.filter(p => String(p.status||'').toLowerCase() === 'paid').length,
      pendingMarketplacePayments: marketplacePayments.filter(p => String(p.status||'').toLowerCase() === 'pending').length,
      refundedMarketplacePayments: marketplacePayments.filter(p => String(p.status||'').toLowerCase() === 'refunded').length,
      paymentsLinkedToOrders: marketplacePayments.filter(p => idStr((p.metadata||{}).orderId || p.orderId)).length,
      paymentsWithoutOrderLinks: marketplacePayments.filter(p => !idStr((p.metadata||{}).orderId || p.orderId)).length,
      paidOrdersWithoutMatchingPaymentRecords,
      duplicateStripeSessionIds,
      duplicatePaymentIntentIds,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  await client.close();
})().catch(err => { console.error(err); process.exit(1); });
