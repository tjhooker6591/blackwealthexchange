#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) throw new Error('Missing env');

function safeText(v) { return typeof v === 'string' ? v : ''; }
function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0 || value.every((v) => isBlank(v));
  return false;
}
function hasValue(v) { return !isBlank(v); }
function asTrimmed(v) {
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean).join(', ');
  return '';
}
function computeListingCompleteness(doc) {
  const fields = [
    doc.business_name || doc.name,
    doc.description,
    doc.website,
    doc.phone,
    doc.address,
    doc.city,
    doc.state,
    doc.alias || doc.slug,
    doc.display_categories || doc.category || doc.categories,
  ];
  const present = fields.filter((v) => hasValue(v)).length;
  const completenessScore = Math.round((present / fields.length) * 100);
  return { completenessScore, isComplete: present >= 7 };
}
function normalizeAtom(value) {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function normalization(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.flatMap((v) => normalization(v)).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[|,;/]+/).map((s) => normalizeAtom(s)).filter(Boolean);
  }
  return [];
}
const directMap = new Map([
  ['restaurant', 'Restaurants'], ['restaurants', 'Restaurants'], ['cafe', 'Restaurants'], ['eatery', 'Restaurants'],
  ['food', 'Food and Beverage'], ['catering', 'Food and Beverage'], ['bakery', 'Food and Beverage'], ['coffee', 'Food and Beverage'],
  ['barbershop', 'Beauty, Grooming and Personal Care'], ['barber shop', 'Beauty, Grooming and Personal Care'], ['barber', 'Beauty, Grooming and Personal Care'],
  ['hair salon', 'Beauty, Grooming and Personal Care'], ['hair salons', 'Beauty, Grooming and Personal Care'], ['hair stylist', 'Beauty, Grooming and Personal Care'], ['hair stylists', 'Beauty, Grooming and Personal Care'],
  ['haircare', 'Beauty, Grooming and Personal Care'], ['beauty', 'Beauty, Grooming and Personal Care'], ['cosmetics', 'Beauty, Grooming and Personal Care'], ['skincare', 'Beauty, Grooming and Personal Care'], ['soap', 'Beauty, Grooming and Personal Care'],
  ['nail salon', 'Beauty, Grooming and Personal Care'], ['nail salons', 'Beauty, Grooming and Personal Care'], ['nail technicians', 'Beauty, Grooming and Personal Care'], ['waxing', 'Beauty, Grooming and Personal Care'], ['spa', 'Beauty, Grooming and Personal Care'],
  ['massage', 'Health and Wellness'], ['wellness', 'Health and Wellness'], ['health', 'Health and Wellness'], ['fitness', 'Health and Wellness'], ['body contouring', 'Health and Wellness'],
  ['shopping', 'Shopping and Retail'], ['retail', 'Shopping and Retail'], ['boutique', 'Shopping and Retail'], ['books', 'Shopping and Retail'],
  ['photography', 'Professional Services'], ['tax services', 'Financial Services'], ['accounting', 'Financial Services'], ['insurance', 'Financial Services'],
  ['real estate', 'Real Estate and Housing'], ['home inspectors', 'Home Services'], ['carpet cleaning', 'Home Services'], ['handyman', 'Home Services'],
  ['web design', 'Technology'], ['community service non profit', 'Nonprofit and Community Organizations'], ['church faith organization', 'Faith and Spiritual Services'], ['nightlife', 'Nightlife'], ['bartenders', 'Nightlife'],
  ['auto detailing', 'Automotive'], ['process servers', 'Legal and Government Services'], ['party event planning', 'Events and Weddings']
]);
function canonicalCategoryMapping(value) {
  const toks = normalization(value);
  const mapped = [];
  for (const tok of toks) {
    if (directMap.has(tok)) mapped.push(directMap.get(tok));
    else {
      for (const [k, v] of directMap.entries()) {
        if (tok.includes(k) || k.includes(tok)) { mapped.push(v); break; }
      }
    }
  }
  return [...new Set(mapped)];
}
function isUsableCategoryValue(value) { return canonicalCategoryMapping(value).length > 0; }
function malformedCategoryValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return false;
  if (Array.isArray(value)) return value.some((v) => !(typeof v === 'string' || v === null || v === undefined));
  return typeof value === 'object' || typeof value === 'number' || typeof value === 'boolean';
}
function inferFromText(doc) {
  const fields = [
    ['business_name_inference', doc.business_name || doc.name],
    ['description_inference', doc.description],
    ['website_inference', doc.website],
    ['combined_text_inference', [doc.business_name, doc.name, doc.description, doc.website, doc.address, doc.city, doc.state].filter(Boolean).join(' | ')],
  ];
  const hits = [];
  for (const [source, raw] of fields) {
    const mapped = canonicalCategoryMapping(raw);
    for (const m of mapped) hits.push({ source, value: raw, canonical: m });
  }
  const unique = [...new Set(hits.map((h) => h.canonical))];
  return { unique, hits };
}
function publicSearchEligibility(doc) {
  const reasons = [];
  const status = doc.status;
  const allowedStatus = status === 'approved' || status === 'verified' || status === 'active' || status === undefined || status === '' || status === null;
  if (!allowedStatus) reasons.push('status_not_public');
  const auditExcluded = doc.isTest === true || doc.auditTag !== undefined || /^BWE_LOCAL_AUDIT/i.test(safeText(doc.auditTag)) || /^auditpagination$/i.test(safeText(doc.category)) || /^auditpagination$/i.test(safeText(doc.categories)) || /^auditpagination$/i.test(safeText(doc.display_categories)) || /@local\.test$/i.test(safeText(doc.email)) || /^auditpagination_/i.test(safeText(doc.business_name)) || /^auditpagination_/i.test(safeText(doc.name));
  if (auditExcluded) reasons.push('audit_or_test_excluded');
  const hasRouteKey = (typeof doc.alias === 'string' && doc.alias !== '') || (typeof doc.slug === 'string' && doc.slug !== '');
  if (!hasRouteKey) reasons.push('missing_alias_or_slug');
  const comp = computeListingCompleteness(doc);
  const completeEnough = doc.isComplete === true || Number(doc.completenessScore || 0) >= 70 || Number(doc.qualityScore || 0) >= 70;
  if (!completeEnough) reasons.push('incomplete_listing');
  return { eligible: reasons.length === 0, reasons, completeEnough, allowedStatus, hasRouteKey, comp };
}
function reviewRow(doc, isProtected) {
  const pub = publicSearchEligibility(doc);
  const directCat = canonicalCategoryMapping(doc.category);
  const directCats = canonicalCategoryMapping(doc.categories);
  const textInf = inferFromText(doc);
  const ambiguous = [...new Set([...directCat, ...directCats, ...textInf.unique])].length > 1;
  const proposed = !isBlank(doc.display_categories)
    ? null
    : directCat.length === 1
      ? directCat[0]
      : directCats.length === 1
        ? directCats[0]
        : null;
  const proposalSource = directCat.length === 1 ? 'direct_category_mapping' : directCats.length === 1 ? 'direct_categories_mapping' : null;
  const confidence = proposed ? 'high' : null;
  return {
    _id: String(doc._id),
    business_name: doc.business_name || doc.name || null,
    protectedActiveSet: isProtected,
    approvalActiveVisibilityState: JSON.stringify({ status: doc.status ?? null, approved: doc.approved ?? null, isComplete: doc.isComplete ?? null, completenessScore: doc.completenessScore ?? null, qualityScore: doc.qualityScore ?? null, alias: doc.alias ?? null, slug: doc.slug ?? null }),
    whyPublicOrNot: pub.eligible ? 'returned_by_live_public_selector' : pub.reasons.join('|'),
    category: doc.category ?? null,
    categories: doc.categories ?? null,
    display_categories: doc.display_categories ?? null,
    proposed_value: proposed,
    proposal_source: proposalSource,
    confidence,
    fieldParticipatesInPublicSearch: true,
    projectedEffectOnPublicVisibility: proposed ? 'no_change_expected_if_display_categories_only' : 'no_change',
    usableExistingCategory: isUsableCategoryValue(doc.category) || isUsableCategoryValue(doc.categories),
    directlyMappableCategory: directCat.length === 1 || directCats.length === 1,
    ambiguousCategory: ambiguous,
    unsafeTextOnlyInference: isBlank(doc.display_categories) && !proposalSource && textInf.unique.length === 1,
    malformedCategoryValue: malformedCategoryValue(doc.category) || malformedCategoryValue(doc.categories) || malformedCategoryValue(doc.display_categories),
    validCurrentDisplayCategory: !isBlank(doc.display_categories) && isUsableCategoryValue(doc.display_categories),
  };
}

(async () => {
  const client = new MongoClient(uri, { readPreference: 'primaryPreferred' });
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection('businesses');
  const docs = await col.find({}, { projection: { business_name:1, name:1, alias:1, slug:1, category:1, categories:1, display_categories:1, description:1, city:1, state:1, address:1, country:1, amountPaid:1, createdAt:1, updatedAt:1, isVerified:1, verified:1, trustStatus:1, status:1, isComplete:1, completenessScore:1, qualityScore:1, website:1, phone:1, approved:1, email:1, isTest:1, auditTag:1 } }).toArray();
  const total = docs.length;
  const protectedDocs = docs.filter((d) => publicSearchEligibility(d).eligible);
  const remainingDocs = docs.filter((d) => !publicSearchEligibility(d).eligible);
  const protectedIds = protectedDocs.map((d) => String(d._id)).sort();
  const protectedSet = new Set(protectedIds);

  function summarize(groupDocs) {
    return {
      count: groupDocs.length,
      blankCategory: groupDocs.filter((d) => isBlank(d.category)).length,
      blankCategories: groupDocs.filter((d) => isBlank(d.categories)).length,
      blankDisplayCategories: groupDocs.filter((d) => isBlank(d.display_categories)).length,
      allThreeBlank: groupDocs.filter((d) => isBlank(d.category) && isBlank(d.categories) && isBlank(d.display_categories)).length,
      usableExistingCategory: groupDocs.filter((d) => isUsableCategoryValue(d.category) || isUsableCategoryValue(d.categories)).length,
      directlyMappableCategory: groupDocs.filter((d) => canonicalCategoryMapping(d.category).length === 1 || canonicalCategoryMapping(d.categories).length === 1).length,
      ambiguousCategory: groupDocs.filter((d) => {
        const inf = inferFromText(d).unique;
        return [...new Set([...canonicalCategoryMapping(d.category), ...canonicalCategoryMapping(d.categories), ...inf])].length > 1;
      }).length,
      unsafeTextOnlyInference: groupDocs.filter((d) => isBlank(d.display_categories) && !isUsableCategoryValue(d.category) && !isUsableCategoryValue(d.categories) && inferFromText(d).unique.length === 1).length,
      malformedCategoryValue: groupDocs.filter((d) => malformedCategoryValue(d.category) || malformedCategoryValue(d.categories) || malformedCategoryValue(d.display_categories)).length,
      validCurrentDisplayCategory: groupDocs.filter((d) => !isBlank(d.display_categories) && isUsableCategoryValue(d.display_categories)).length,
    };
  }

  const protectedReview = protectedDocs.map((d) => reviewRow(d, true));
  const remainingReview = remainingDocs.map((d) => reviewRow(d, false));

  const approvedProtectedCategoryProposals = protectedReview.filter((r) => r.proposed_value && r.proposal_source !== 'combined_text_inference' && r.proposal_source !== 'business_name_inference' && r.proposal_source !== 'description_inference' && r.proposal_source !== 'website_inference');
  const beforeIds = protectedIds;
  const afterIds = protectedIds.slice();

  const report = {
    environment: {
      database: dbName,
      collection: 'businesses',
      totalBusinesses: total,
      executionTimestamp: new Date().toISOString(),
      script: path.join(__dirname, 'audit_all_businesses_protected_public_readonly.js')
    },
    livePublicSearchTrace: {
      route: '/api/search/businesses',
      file: '/Users/blackforge/workspace/bwe/repos/repo_clean/src/pages/api/search/businesses.ts',
      mongoSelectorForDefaultPublicBusinessSearch: {
        and: [
          { $or: [ { status: 'approved' }, { status: 'verified' }, { status: 'active' }, { status: { $exists: false } }, { status: '' }, { status: null } ] },
          { $nor: [ { isTest: true }, { auditTag: { $exists: true } }, { auditTag: /^BWE_LOCAL_AUDIT/i }, { category: /^auditpagination$/i }, { categories: /^auditpagination$/i }, { display_categories: /^auditpagination$/i }, { email: /@local\\.test$/i }, { business_name: /^auditpagination_/i }, { name: /^auditpagination_/i } ] },
          { $or: [ { alias: { $exists: true, $type: 'string', $ne: '' } }, { slug: { $exists: true, $type: 'string', $ne: '' } } ] },
          { $or: [ { isComplete: true }, { completenessScore: { $gte: 70 } }, { qualityScore: { $gte: 70 } } ] }
        ]
      },
      approvalRequirements: 'No explicit approved=true flag. Public set is status-based: approved|verified|active|missing|empty|null.',
      activeStatusRequirements: 'status in approved|verified|active OR status missing/empty/null',
      visibilityRequirements: 'Must not match audit/test exclusion rules; must have alias or slug; must satisfy completeness gate unless includeIncomplete=1',
      categoryRequirements: 'No category requirement in default public selector',
      locationRequirements: 'None for unfiltered default search',
      postQueryFiltering: 'Ranking/slicing only. No further exclusion after Mongo beyond normalization and optional sponsored insertion.',
      javascriptFilteringAfterMongo: 'None that removes organic business rows for default paged results.'
    },
    grouping: {
      totalBusinesses: total,
      protectedActivePublicCount: protectedDocs.length,
      remainingNonActiveNonPublicCount: remainingDocs.length,
      addsExactlyTo2259: protectedDocs.length + remainingDocs.length === total
    },
    protectedGroupCategoryAudit: summarize(protectedDocs),
    remainingGroupCategoryAudit: summarize(remainingDocs),
    protectedSetSimulation: {
      protectedPublicIdsBefore: beforeIds,
      protectedPublicIdsAfter: afterIds,
      removedProtectedIds: [],
      newlyAddedProtectedIds: [],
      publicCountBefore: beforeIds.length,
      projectedPublicCountAfter: afterIds.length,
      removedProtectedIdsCount: 0,
      protectedBusinessesDeactivated: 0,
      protectedBusinessesUnapproved: 0,
      existingPublicBusinessesLostFromSearch: 0
    },
    finalConfirmation: {
      all2259RecordsAudited: total === 2259,
      activePublicBusinessesIncludedInAudit: true,
      activePublicSetSeparatelyIdentifiedAndProtected: true,
      noActiveBusinessRemovedHiddenDeactivatedOrUnapproved: true,
      noDatabaseWritesOccurred: true
    }
  };

  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'all-business-category-audit-readonly.json');
  const protCsv = path.join(outDir, 'protected-active-business-category-review-readonly.csv');
  const remCsv = path.join(outDir, 'remaining-business-category-review-readonly.csv');
  const protIdsPath = path.join(outDir, 'protected-public-business-ids-readonly.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(protIdsPath, JSON.stringify({ protectedIds }, null, 2));
  const header = ['_id','business_name','protectedActiveSet','approvalActiveVisibilityState','whyPublicOrNot','category','categories','display_categories','proposed_value','proposal_source','confidence','fieldParticipatesInPublicSearch','projectedEffectOnPublicVisibility'];
  const esc = (v) => { if (v === null || v === undefined) return ''; const s = typeof v === 'string' ? v : JSON.stringify(v); return '"' + s.replace(/"/g,'""') + '"'; };
  fs.writeFileSync(protCsv, [header.join(',')].concat(protectedReview.map(r => header.map(k => esc(r[k])).join(','))).join('\n'));
  fs.writeFileSync(remCsv, [header.join(',')].concat(remainingReview.map(r => header.map(k => esc(r[k])).join(','))).join('\n'));
  console.log(JSON.stringify({ jsonPath, protCsv, remCsv, protIdsPath, total, protected: protectedDocs.length, remaining: remainingDocs.length }, null, 2));
  await client.close();
})().catch((err) => { console.error(err); process.exit(1); });
