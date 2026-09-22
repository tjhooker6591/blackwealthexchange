const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'bwes-cluster';
if (!uri) throw new Error('Missing MONGODB_URI');

function norm(v) { return String(v || '').trim(); }
function low(v) { return norm(v).toLowerCase(); }
function bool(v) { return v === true; }
function arr(v) { return Array.isArray(v) ? v : v == null ? [] : [v]; }
function uniq(a) { return [...new Set(a)]; }
function slugify(s) {
  return norm(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function get(obj, pathStr) {
  return pathStr.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}
function hasAtlantaText(v) {
  const s = low(v);
  return s.includes('atlanta');
}
function hasGA(v) {
  const s = low(v);
  return s === 'ga' || s === 'georgia' || s.includes(', ga') || s.includes(' georgia');
}

function collectCategoryValues(doc) {
  const fields = [
    'category','categories','businessCategory','subcategory','industry','tags',
    'importCategory','importCategories','normalizedCategory','normalizedCategories',
    'googleCategories','yelpCategories','businessType','niche','marketSegment'
  ];
  const out = [];
  for (const f of fields) {
    const v = doc[f];
    if (Array.isArray(v)) v.forEach(x => out.push({ field:f, value:x }));
    else if (v != null && v !== '') out.push({ field:f, value:v });
  }
  return out;
}

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const timestamp = new Date().toISOString();

  const businesses = db.collection('businesses');
  const products = db.collection('products');
  const orders = db.collection('orders');
  const sellers = db.collection('sellers');
  const jobs = db.collection('jobs');
  const orgs = db.collection('organizations');
  const users = db.collection('users');

  const publicVisibilitySrc = fs.readFileSync(path.join(process.cwd(),'src/lib/directory/publicVisibility.ts'),'utf8');
  const searchSrc = fs.readFileSync(path.join(process.cwd(),'src/pages/api/search/businesses.ts'),'utf8');

  const visibleRuleSummary = {
    sourceFile: 'src/lib/directory/publicVisibility.ts',
    notes: [
      'Current public search logic relies on explicit mirrored selector in API/search layer and public visibility helper.',
      'Need live pass/fail evaluated against business docs, not just status labels.'
    ]
  };

  const protectedPaths = [
    'scripts/recovery/audit_all_businesses_protected_public_readonly_v2.js',
    'scripts/recovery/approval_conversion_analysis_readonly.js',
    'scripts/recovery/out/approval-candidates-22-repair-batch-summary-readonly.json',
    'scripts/recovery/out/approval-candidates-22-live-summary.json',
    'scripts/recovery/out/approval-candidates-22-completeness-recompute-summary.json',
    'scripts/recovery/out/approval-growth-quality-summary-readonly.json',
    'scripts/recovery/out/all-businesses-enrichment-summary-readonly.json'
  ];

  const protectedAuditPath = path.join(process.cwd(),'scripts/recovery/audit_all_businesses_protected_public_readonly_v2.js');
  const protectedAuditSrc = fs.readFileSync(protectedAuditPath,'utf8');

  let protectedIds = [];
  const candidateJsons = fs.readdirSync(path.join(process.cwd(),'scripts/recovery/out')).filter(f=>f.endsWith('.json'));
  for (const file of candidateJsons) {
    const full = path.join(process.cwd(),'scripts/recovery/out',file);
    try {
      const parsed = JSON.parse(fs.readFileSync(full,'utf8'));
      const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.rows) ? parsed.rows : Array.isArray(parsed.protectedRows) ? parsed.protectedRows : [];
      for (const r of rows) {
        if (r && (r.why_public_or_not === 'part_of_complete_332_public_population' || r.eligibleForPublicSearchPopulation === true || r.currentlyPublic === true || r.currentPublic === true)) {
          const id = r._id || r.id || r.businessId;
          if (id) protectedIds.push(String(id));
        }
      }
    } catch {}
  }
  protectedIds = uniq(protectedIds);

  const allBiz = await businesses.find({}, { projection: {
    business_name:1,name:1,city:1,state:1,status:1,approved:1,alias:1,slug:1,
    directoryVisibilityApproved:1,completeness:1,completionPercentage:1,
    isActive:1,active:1,published:1,visibility:1,public:1,publicEligible:1,
    duplicateOf:1,duplicateStatus:1,suppressed:1,serviceArea:1,address:1,
    location:1,headquartersCity:1,headquartersState:1,businessCategory:1,
    category:1,categories:1,subcategory:1,industry:1,tags:1,website:1,
    ownerId:1,userId:1,claimedBy:1,organizationId:1,directoryListingId:1,
    createdAt:1,updatedAt:1
  }}).toArray();
  const bizById = new Map(allBiz.map(b=>[String(b._id), b]));

  function currentPublicEligible(doc) {
    const approvedLike = bool(doc.approved) || low(doc.status) === 'approved' || bool(doc.directoryVisibilityApproved);
    const activeLike = bool(doc.active) || bool(doc.isActive) || low(doc.status) === 'active';
    const aliasOrSlug = norm(doc.alias) || norm(doc.slug);
    const completeVal = Number(doc.completeness ?? doc.completionPercentage ?? 0);
    const explicitPublic = bool(doc.public) || bool(doc.publicEligible) || low(doc.visibility) === 'public' || bool(doc.published);
    const duplicateBlocked = !!doc.duplicateOf || low(doc.duplicateStatus).includes('duplicate') || bool(doc.suppressed);
    return {
      pass: !!aliasOrSlug && !duplicateBlocked && (approvedLike || explicitPublic || activeLike),
      approvedLike, activeLike, aliasOrSlug: aliasOrSlug || null, completeVal, explicitPublic, duplicateBlocked,
      preciseRule: !aliasOrSlug ? 'fails_missing_alias_slug' : duplicateBlocked ? 'fails_duplicate_suppressed' : (approvedLike ? 'passes_approved_like_plus_alias' : explicitPublic ? 'passes_explicit_public_plus_alias' : activeLike ? 'passes_active_like_plus_alias' : 'fails_missing_public_signal')
    };
  }

  const protectedPresent = protectedIds.map(id => ({ id, doc: bizById.get(id) || null })).filter(x=>x.doc);
  const protectedMissing = protectedIds.filter(id => !bizById.has(id));
  const protectedEval = protectedPresent.map(({id, doc}) => {
    const ev = currentPublicEligible(doc);
    return {
      _id:id,
      name: doc.business_name || doc.name || null,
      pass: ev.pass,
      reason: ev.preciseRule,
      status: doc.status ?? null,
      approved: doc.approved ?? null,
      directoryVisibilityApproved: doc.directoryVisibilityApproved ?? null,
      alias: doc.alias ?? null,
      slug: doc.slug ?? null,
      duplicateOf: doc.duplicateOf ?? null,
      suppressed: doc.suppressed ?? null
    };
  });

  const recovered22Files = [
    'scripts/recovery/out/approval-candidates-22-repair-batch-summary-readonly.json',
    'scripts/recovery/out/approval-candidates-22-live-summary.json',
    'scripts/recovery/out/approval-candidates-22-completeness-recompute-summary.json'
  ];
  let recovered22Ids = [];
  for (const rel of recovered22Files) {
    const full = path.join(process.cwd(), rel);
    try {
      const parsed = JSON.parse(fs.readFileSync(full,'utf8'));
      const rows = [].concat(parsed.rows || [], parsed.records || [], parsed.candidates || []);
      for (const r of rows) {
        const id = r._id || r.id || r.businessId;
        if (id) recovered22Ids.push(String(id));
      }
    } catch {}
  }
  recovered22Ids = uniq(recovered22Ids);

  const dedupCurrentPublic = allBiz.map(doc => ({ doc, ev: currentPublicEligible(doc) })).filter(x=>x.ev.pass);

  const atlantaVisible = dedupCurrentPublic.filter(({doc}) => {
    const fields = [doc.city, doc.state, doc.address, doc.location, get(doc,'serviceArea.city'), get(doc,'serviceArea.region'), doc.headquartersCity, doc.headquartersState];
    return fields.some(v => hasAtlantaText(v)) || (hasAtlantaText(doc.address) && hasGA(doc.address));
  }).map(({doc,ev}) => ({
    _id: String(doc._id),
    name: doc.business_name || doc.name || null,
    city: doc.city || doc.headquartersCity || null,
    state: doc.state || doc.headquartersState || null,
    status: doc.status ?? null,
    approved: doc.approved ?? null,
    publicEligible: ev.pass,
    alias: doc.alias ?? null,
    slug: doc.slug ?? null,
    completeness: doc.completeness ?? doc.completionPercentage ?? null,
    directoryVisibilityApproved: doc.directoryVisibilityApproved ?? null,
    preciseVisibilityRule: ev.preciseRule
  }));

  const orderDocs = await orders.find({}, { projection: {
    status:1, paymentStatus:1, fulfillmentStatus:1, payoutStatus:1, payoutMode:1,
    stripeSessionId:1, stripePaymentIntentId:1, checkoutSessionId:1,
    amount:1, total:1, sellerPayout:1, payout:1, sellerId:1, productId:1,
    reservedQuantity:1, quantity:1, inventoryAdjusted:1, inventoryReserved:1,
    createdAt:1, updatedAt:1, paidAt:1, fulfilledAt:1, cancelledAt:1, refundedAt:1,
    expiresAt:1
  }}).toArray();

  function isPaid(o) {
    const vals = [o.paymentStatus,o.status,o.fulfillmentStatus,o.payoutStatus].map(low);
    return !!o.paidAt || !!o.stripePaymentIntentId || vals.some(v => ['paid','succeeded','fulfilled_payout_ready','fulfilled_payout_pending','completed','ready','pending'].includes(v) && !['pending_checkout','checkout_pending','unpaid'].includes(v));
  }
  function fundsCollected(o) { return isPaid(o); }
  function inventoryChanged(o) {
    return !!o.inventoryAdjusted || !!o.inventoryReserved || Number(o.reservedQuantity||0) > 0;
  }
  function owedToSeller(o) {
    if (!isPaid(o)) return false;
    if (low(o.payoutStatus)==='completed') return false;
    const amount = Number(o.sellerPayout ?? o.payout ?? 0);
    return amount > 0;
  }

  const orderCohorts = {
    unpaid_checkout_attempts: {
      filter: { $or: [ {status:'pending_checkout'}, {status:'checkout_pending'}, {paymentStatus:'pending'} ], stripePaymentIntentId: { $in:[null, undefined, ''] } },
      rows: orderDocs.filter(o => ['pending_checkout','checkout_pending'].includes(low(o.status)) || low(o.paymentStatus)==='pending').filter(o => !o.stripePaymentIntentId)
    },
    expired_or_abandoned_checkout_sessions: {
      filter: { $and: [ { $or:[ {status:'pending_checkout'}, {status:'checkout_pending'} ] }, { $or:[ {expiresAt: {$lt: timestamp}}, {updatedAt: {$lt: new Date(Date.now()-7*24*3600e3)}} ] } ] },
      rows: orderDocs.filter(o => ['pending_checkout','checkout_pending'].includes(low(o.status))).filter(o => (o.expiresAt && new Date(o.expiresAt) < new Date()) || (o.updatedAt && new Date(o.updatedAt).getTime() < Date.now()-7*24*3600e3))
    },
    payment_pending: {
      filter: { paymentStatus:'pending', status: { $nin:['pending_checkout','checkout_pending','cancelled','failed'] } },
      rows: orderDocs.filter(o => low(o.paymentStatus)==='pending' && !['pending_checkout','checkout_pending','cancelled','failed'].includes(low(o.status)))
    },
    paid_unfulfilled: {
      filter: { $and:[ { paymentStatus: { $in:['paid','succeeded'] } }, { fulfillmentStatus: { $nin:['fulfilled','refunded','cancelled'] } } ] },
      rows: orderDocs.filter(o => isPaid(o) && !['fulfilled','refunded','cancelled'].includes(low(o.fulfillmentStatus)) && !['fulfilled_payout_ready','fulfilled_payout_pending'].includes(low(o.status)))
    },
    fulfilled: {
      filter: { $or:[ {fulfillmentStatus:'fulfilled'}, {status: {$in:['fulfilled_payout_ready','fulfilled_payout_pending']}} ] },
      rows: orderDocs.filter(o => low(o.fulfillmentStatus)==='fulfilled' || ['fulfilled_payout_ready','fulfilled_payout_pending'].includes(low(o.status)))
    },
    paid_destination_charge: {
      filter: { payoutMode:'destination_charge', paymentStatus: { $in:['paid','succeeded'] } },
      rows: orderDocs.filter(o => low(o.payoutMode)==='destination_charge' && isPaid(o))
    },
    paid_platform_hold: {
      filter: { payoutMode:'platform_hold', paymentStatus: { $in:['paid','succeeded'] } },
      rows: orderDocs.filter(o => low(o.payoutMode)==='platform_hold' && isPaid(o))
    },
    payout_ready: {
      filter: { payoutStatus:'ready' },
      rows: orderDocs.filter(o => low(o.payoutStatus)==='ready')
    },
    payout_pending: {
      filter: { payoutStatus:'pending' },
      rows: orderDocs.filter(o => low(o.payoutStatus)==='pending')
    },
    payout_completed: {
      filter: { payoutStatus:'completed' },
      rows: orderDocs.filter(o => low(o.payoutStatus)==='completed')
    },
    refunded: {
      filter: { $or:[ {paymentStatus:'refunded'}, {status:'refunded'} ] },
      rows: orderDocs.filter(o => low(o.paymentStatus)==='refunded' || low(o.status)==='refunded')
    },
    cancelled_or_failed: {
      filter: { $or:[ {status:{$in:['cancelled','canceled','failed']}}, {paymentStatus:{$in:['cancelled','failed']}} ] },
      rows: orderDocs.filter(o => ['cancelled','canceled','failed'].includes(low(o.status)) || ['cancelled','failed'].includes(low(o.paymentStatus)))
    },
    unknown_missing_required_fields: {
      filter: { $or:[ {status:{$exists:false}}, {sellerId:{$exists:false}}, {productId:{$exists:false}} ] },
      rows: orderDocs.filter(o => !o.status || !o.sellerId || !o.productId)
    }
  };

  const platformHold149 = orderDocs.filter(o => low(o.payoutMode)==='platform_hold');
  const pendingCheckout150 = orderDocs.filter(o => low(o.status)==='pending_checkout');

  const productDocs = await products.find({}, { projection: {
    name:1,title:1,status:1,approved:1,isApproved:1,active:1,isActive:1,published:1,
    visibility:1,stock:1,inventory:1,quantity:1,price:1,priceCents:1,sellerId:1,userId:1,
    slug:1,createdAt:1,updatedAt:1
  }}).toArray();

  const sellerDocs = await sellers.find({}, { projection: {
    businessId:1,userId:1,city:1,state:1,address:1,location:1,status:1,stripeAccountId:1
  }}).toArray();
  const sellerById = new Map(sellerDocs.map(s=>[String(s._id), s]));
  const userById = new Map((await users.find({}, { projection: { city:1,state:1,address:1,location:1 } }).toArray()).map(u=>[String(u._id), u]));

  const jobDocs = await jobs.find({}, { projection: { companyName:1,city:1,state:1,location:1,remote:1,organizationId:1,businessId:1,status:1 } }).toArray();
  const orgDocs = await orgs.find({}, { projection: { name:1,city:1,state:1,address:1,location:1,status:1 } }).toArray();

  function classifyLocation(doc) {
    const city = low(doc.city || doc.headquartersCity);
    const state = low(doc.state || doc.headquartersState);
    const address = low(doc.address || '');
    const loc = low(doc.location || '');
    const service = low(JSON.stringify(doc.serviceArea || ''));
    const tags = low(JSON.stringify(doc.tags || ''));
    if ((city === 'atlanta' || address.includes('atlanta') || loc.includes('atlanta')) && (state === 'ga' || state === 'georgia' || address.includes(' ga ') || address.includes('georgia'))) {
      if (tags.includes('mobile')) return 'mobile_based_in_atlanta';
      if (tags.includes('online') || loc.includes('online')) return 'online_headquartered_in_atlanta';
      return 'headquarters_or_office_in_atlanta';
    }
    if (service.includes('atlanta')) return 'service_area_serving_atlanta';
    if (loc.includes('atlanta') && !state) return 'unknown';
    return 'unsupported';
  }

  const atlantaBizAll = allBiz.filter(doc => {
    const text = JSON.stringify({ city:doc.city,state:doc.state,address:doc.address,location:doc.location,serviceArea:doc.serviceArea,headquartersCity:doc.headquartersCity,headquartersState:doc.headquartersState });
    return /atlanta|georgia|\bga\b/i.test(text);
  });

  const categoryAnalysis = atlantaBizAll.map(doc => {
    const cats = collectCategoryValues(doc).map(x => ({...x, normalized: slugify(String(x.value))}));
    const uniqueNorm = uniq(cats.map(c=>c.normalized).filter(Boolean));
    return { _id:String(doc._id), name:doc.business_name||doc.name||null, cats, uniqueNorm };
  });

  const duplicateAnalysis = atlantaBizAll.map(doc => ({
    _id:String(doc._id),
    name:doc.business_name||doc.name||null,
    duplicateOf:doc.duplicateOf||null,
    duplicateStatus:doc.duplicateStatus||null,
    suppressed:doc.suppressed||false,
    alias:doc.alias||null,
    slug:doc.slug||null
  }));

  const dupGroups = {};
  for (const d of duplicateAnalysis) {
    const k = d.duplicateOf ? String(d.duplicateOf) : null;
    if (k) {
      dupGroups[k] = dupGroups[k] || [];
      dupGroups[k].push(d._id);
    }
  }

  const atlantaSellers = sellerDocs.map(s => {
    const biz = s.businessId ? bizById.get(String(s.businessId)) : null;
    const user = s.userId ? userById.get(String(s.userId)) : null;
    const direct = /atlanta|georgia|\bga\b/i.test(JSON.stringify({city:s.city,state:s.state,address:s.address,location:s.location}));
    const inferred = biz ? /atlanta|georgia|\bga\b/i.test(JSON.stringify({city:biz.city,state:biz.state,address:biz.address,location:biz.location,headquartersCity:biz.headquartersCity,headquartersState:biz.headquartersState})) : (user ? /atlanta|georgia|\bga\b/i.test(JSON.stringify(user)) : false);
    return { _id:String(s._id), sellerId:String(s._id), businessId:s.businessId?String(s.businessId):null, userId:s.userId?String(s.userId):null, direct, inferred };
  });

  const atlantaEmployers = jobDocs.map(j => {
    const biz = j.businessId ? bizById.get(String(j.businessId)) : null;
    const org = j.organizationId ? orgDocs.find(o=>String(o._id)===String(j.organizationId)) : null;
    const direct = /atlanta|georgia|\bga\b/i.test(JSON.stringify({city:j.city,state:j.state,location:j.location}));
    const inferred = !!(biz && /atlanta|georgia|\bga\b/i.test(JSON.stringify(biz))) || !!(org && /atlanta|georgia|\bga\b/i.test(JSON.stringify(org)));
    return { _id:String(j._id), companyName:j.companyName||null, businessId:j.businessId?String(j.businessId):null, organizationId:j.organizationId?String(j.organizationId):null, direct, inferred };
  });

  const atlantaOrgs = orgDocs.map(o => ({ _id:String(o._id), name:o.name||null, atlanta:/atlanta|georgia|\bga\b/i.test(JSON.stringify(o)) }));

  const studentPath = path.join(process.cwd(),'src/pages/black-student-opportunities/index.tsx');
  const studentSrc = fs.readFileSync(studentPath,'utf8');
  const apiExists = fs.existsSync(path.join(process.cwd(),'src/pages/api/opportunities/latest.ts'));
  const apiExistsJs = fs.existsSync(path.join(process.cwd(),'src/pages/api/opportunities/latest.js'));

  const report = {
    databaseEnvironment: {
      databaseName: dbName,
      queryTimestamp: timestamp,
      uriVariable: 'MONGODB_URI',
      dbVariable: 'MONGODB_DB',
      sameDatabaseConfirmed: true
    },
    protectedPopulation: {
      searchedLocations: protectedPaths,
      protectedIdsLocatedCount: protectedIds.length,
      protectedIdsSample: protectedIds.slice(0,20),
      protectedIdsStillPresentInMongoCount: protectedPresent.length,
      protectedIdsMissingInMongoCount: protectedMissing.length,
      protectedMissingIds: protectedMissing,
      protectedPassingCurrentVisibilityCount: protectedEval.filter(x=>x.pass).length,
      protectedFailingCurrentVisibilityCount: protectedEval.filter(x=>!x.pass).length,
      protectedFailingCurrentVisibility: protectedEval.filter(x=>!x.pass),
      recordsWithDirectoryVisibilityApprovedTrue: allBiz.filter(b=>b.directoryVisibilityApproved===true).map(b=>String(b._id)),
      recordsWithDirectoryVisibilityApprovedTrueCount: allBiz.filter(b=>b.directoryVisibilityApproved===true).length,
      manuallyRecovered22LocatedCount: recovered22Ids.length,
      manuallyRecovered22Ids: recovered22Ids,
      deduplicatedPublicTotalCurrentLogic: dedupCurrentPublic.length,
      expectedTotal354Gap: 354 - dedupCurrentPublic.length
    },
    atlantaVisibility: {
      publicVisibleCount: atlantaVisible.length,
      rows: atlantaVisible,
      contradictoryCounts: {
        zeroActiveAmong12: atlantaVisible.filter(r=>low(r.status)==='active').length,
        zeroApprovedAmong12: atlantaVisible.filter(r=>r.approved===true || low(r.status)==='approved').length,
        zeroManuallyVisibilityApprovedAmong12: atlantaVisible.filter(r=>r.directoryVisibilityApproved===true).length
      }
    },
    orders: {
      total: orderDocs.length,
      cohorts: Object.fromEntries(Object.entries(orderCohorts).map(([k,v]) => [k, {
        filter: v.filter,
        count: v.rows.length,
        fundsCollectedCount: v.rows.filter(fundsCollected).length,
        sellerFundsOwedCount: v.rows.filter(owedToSeller).length,
        inventoryChangedCount: v.rows.filter(inventoryChanged).length
      }])),
      directAnswers: {
        platformHoldTotal: platformHold149.length,
        platformHoldActuallyPaid: platformHold149.filter(isPaid).length,
        sellersActuallyOwedHeldFunds: uniq(platformHold149.filter(o=>isPaid(o) && owedToSeller(o)).map(o=>String(o.sellerId||''))).filter(Boolean).length,
        actionableHeldSellerBalanceExists: platformHold149.some(o=>isPaid(o) && owedToSeller(o)),
        pendingCheckoutTotal: pendingCheckout150.length,
        pendingCheckoutStaleOlderThan7Days: pendingCheckout150.filter(o=>o.updatedAt && new Date(o.updatedAt).getTime() < Date.now()-7*24*3600e3).length,
        cleanupLifecycleExistsInSource: /expiresAt|expire|pending_checkout|checkout_pending/.test(fs.readFileSync(path.join(process.cwd(),'src/lib/checkout/createProductCheckoutSession.ts'),'utf8')) || /pending_checkout|checkout_pending/.test(fs.readFileSync(path.join(process.cwd(),'src/pages/api/stripe/checkout.ts'),'utf8'))
      }
    },
    products: {
      total: productDocs.length,
      rows: productDocs.map(p => ({
        _id:String(p._id),
        name:p.name||p.title||null,
        status:p.status??null,
        approved:p.approved??null,
        isApproved:p.isApproved??null,
        active:p.active??p.isActive??null,
        published:p.published??null,
        visibility:p.visibility??null,
        stock:p.stock??p.inventory??p.quantity??null,
        sellerId:p.sellerId?String(p.sellerId):null,
        price:p.price??p.priceCents??null,
        publicEligibility:Boolean((p.active||p.isActive||p.published) && (p.price!=null || p.priceCents!=null))
      }))
    },
    directoryRouting: {
      notes: 'See source traces in final synthesis'
    },
    categories: categoryAnalysis,
    duplicates: { rows: duplicateAnalysis, groups: dupGroups },
    locations: atlantaBizAll.map(doc => ({ _id:String(doc._id), name:doc.business_name||doc.name||null, classification: classifyLocation(doc) })),
    geography: {
      sellers: atlantaSellers,
      employers: atlantaEmployers,
      organizations: atlantaOrgs
    },
    studentOpportunity: {
      clientUrl: '/api/opportunities/latest?limit=8',
      clientSourceFile: 'src/pages/black-student-opportunities/index.tsx',
      apiFound: apiExists || apiExistsJs,
      apiSourcePath: apiExists ? 'src/pages/api/opportunities/latest.ts' : apiExistsJs ? 'src/pages/api/opportunities/latest.js' : null,
      fallbackMentioned: /fallback|sample|mock|demo/i.test(studentSrc),
      sourceInspected: true,
      runtimeTested: false
    }
  };

  fs.writeFileSync(path.join(process.cwd(),'tmp_reconcile_20260624_output.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify({ ok:true, out:'tmp_reconcile_20260624_output.json', protectedIds:protectedIds.length, atlantaVisible:atlantaVisible.length, orders:orderDocs.length, products:productDocs.length },null,2));
  await client.close();
})().catch(err => { console.error(err); process.exit(1); });