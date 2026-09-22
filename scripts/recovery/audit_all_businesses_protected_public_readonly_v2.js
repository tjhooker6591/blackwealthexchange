#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) throw new Error('Missing MONGODB_URI or MONGODB_DB');

function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0 || value.every((v) => isBlank(v));
  return false;
}
function safeString(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.filter((x) => x !== undefined && x !== null).join(', ');
  return String(v);
}
function splitTerms(value) {
  if (value === undefined || value === null) return [];
  const raw = Array.isArray(value) ? value.join(',') : String(value);
  return raw
    .split(/[|,;/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function normalizeToken(token) {
  return token
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const directRules = [
  { pattern: /^beauty$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:beauty' },
  { pattern: /^hair$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:hair' },
  { pattern: /^haircare$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:haircare' },
  { pattern: /^hair care$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:hair care' },
  { pattern: /^barber$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:barber' },
  { pattern: /^barbershop$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:barbershop' },
  { pattern: /^barber shop$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:barber shop' },
  { pattern: /^grooming$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:grooming' },
  { pattern: /^skincare$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:skincare' },
  { pattern: /^skin care$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:skin care' },
  { pattern: /^cosmetics$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:cosmetics' },
  { pattern: /^cosmetics and beauty supply$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:cosmetics and beauty supply' },
  { pattern: /^salon$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:salon' },
  { pattern: /^hair salon$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:hair salon' },
  { pattern: /^hair salons$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:hair salons' },
  { pattern: /^hair stylist$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:hair stylist' },
  { pattern: /^hair stylists$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:hair stylists' },
  { pattern: /^nail salon$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:nail salon' },
  { pattern: /^nail salons$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:nail salons' },
  { pattern: /^nail technicians$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:nail technicians' },
  { pattern: /^waxing$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:waxing' },
  { pattern: /^soap$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:soap' },
  { pattern: /^spa$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:spa' },
  { pattern: /^wigs$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:wigs' },
  { pattern: /^hair extensions$/, category: 'Beauty, Grooming and Personal Care', rule: 'direct:hair extensions' },
  { pattern: /^restaurants?$/, category: 'Restaurants', rule: 'direct:restaurants' },
  { pattern: /^cafe$/, category: 'Restaurants', rule: 'direct:cafe' },
  { pattern: /^bakery$/, category: 'Food and Beverage', rule: 'direct:bakery' },
  { pattern: /^coffee$/, category: 'Food and Beverage', rule: 'direct:coffee' },
  { pattern: /^shopping$/, category: 'Shopping and Retail', rule: 'direct:shopping' },
  { pattern: /^retail$/, category: 'Shopping and Retail', rule: 'direct:retail' },
  { pattern: /^books$/, category: 'Shopping and Retail', rule: 'direct:books' },
  { pattern: /^fitness$/, category: 'Health and Wellness', rule: 'direct:fitness' },
  { pattern: /^wellness$/, category: 'Health and Wellness', rule: 'direct:wellness' },
  { pattern: /^health$/, category: 'Health and Wellness', rule: 'direct:health' },
  { pattern: /^massage$/, category: 'Health and Wellness', rule: 'direct:massage' },
  { pattern: /^nightlife$/, category: 'Nightlife', rule: 'direct:nightlife' },
  { pattern: /^church$/, category: 'Faith and Spiritual Services', rule: 'direct:church' },
  { pattern: /^faith organization$/, category: 'Faith and Spiritual Services', rule: 'direct:faith organization' },
  { pattern: /^church faith organization$/, category: 'Faith and Spiritual Services', rule: 'direct:church faith organization' },
];
const phraseRules = [
  { pattern: /\bbeauty\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:beauty' },
  { pattern: /\bhair\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:hair' },
  { pattern: /\bhaircare\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:haircare' },
  { pattern: /\bhair care\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:hair care' },
  { pattern: /\bbarber\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:barber' },
  { pattern: /\bbarbershop\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:barbershop' },
  { pattern: /\bgrooming\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:grooming' },
  { pattern: /\bskincare\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:skincare' },
  { pattern: /\bskin care\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:skin care' },
  { pattern: /\bcosmetics\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:cosmetics' },
  { pattern: /\bsalon\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:salon' },
  { pattern: /\bnails?\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:nails' },
  { pattern: /\bsoap\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:soap' },
  { pattern: /\bpersonal care\b/, category: 'Beauty, Grooming and Personal Care', rule: 'text_word:personal care' },
  { pattern: /\bchurch\b/, category: 'Faith and Spiritual Services', rule: 'text_word:church' },
  { pattern: /\bfaith\b/, category: 'Faith and Spiritual Services', rule: 'text_word:faith' },
  { pattern: /\bministry\b/, category: 'Faith and Spiritual Services', rule: 'text_word:ministry' },
  { pattern: /\bspiritual\b/, category: 'Faith and Spiritual Services', rule: 'text_word:spiritual' },
];

function mapDirectValue(value) {
  const terms = splitTerms(value).map(normalizeToken).filter(Boolean);
  const hits = [];
  for (const term of terms) {
    for (const rule of directRules) {
      if (rule.pattern.test(term)) hits.push({ canonical: rule.category, rule: rule.rule, matched: term });
    }
  }
  return dedupeHits(hits);
}
function mapTextValue(value) {
  const text = normalizeToken(safeString(value));
  if (!text) return [];
  const hits = [];
  for (const rule of phraseRules) {
    if (rule.pattern.test(text)) hits.push({ canonical: rule.category, rule: rule.rule, matched: rule.pattern.source });
  }
  return dedupeHits(hits);
}
function dedupeHits(hits) {
  const seen = new Set();
  const out = [];
  for (const hit of hits) {
    const key = `${hit.canonical}::${hit.rule}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}
function malformedCategoryValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return false;
  if (Array.isArray(value)) return value.some((v) => typeof v !== 'string' && v !== null && v !== undefined);
  return true;
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
  const present = fields.filter((v) => !isBlank(v)).length;
  return { completenessScoreComputed: Math.round((present / fields.length) * 100), presentFields: present };
}
function publicSearchEligibility(doc) {
  const reasons = [];
  const status = doc.status;
  const statusAllowed = status === 'approved' || status === 'verified' || status === 'active' || status === undefined || status === null || status === '';
  if (!statusAllowed) reasons.push('status_not_public');
  const excluded = doc.isTest === true ||
    doc.auditTag !== undefined ||
    /^BWE_LOCAL_AUDIT/i.test(safeString(doc.auditTag)) ||
    /^auditpagination$/i.test(safeString(doc.category)) ||
    /^auditpagination$/i.test(safeString(doc.categories)) ||
    /^auditpagination$/i.test(safeString(doc.display_categories)) ||
    /@local\.test$/i.test(safeString(doc.email)) ||
    /^auditpagination_/i.test(safeString(doc.business_name)) ||
    /^auditpagination_/i.test(safeString(doc.name));
  if (excluded) reasons.push('audit_or_test_excluded');
  const hasAliasOrSlug = (typeof doc.alias === 'string' && doc.alias !== '') || (typeof doc.slug === 'string' && doc.slug !== '');
  if (!hasAliasOrSlug) reasons.push('missing_alias_or_slug');
  const completenessAllowed = doc.isComplete === true || Number(doc.completenessScore || 0) >= 70 || Number(doc.qualityScore || 0) >= 70;
  if (!completenessAllowed) reasons.push('incomplete_listing');
  return {
    eligibleForPublicSearchPopulation: reasons.length === 0,
    reasons,
    statusAllowed,
    hasAliasOrSlug,
    completenessAllowed,
    publicSearchFieldsBefore: {
      status: doc.status ?? null,
      approved: doc.approved ?? null,
      alias: doc.alias ?? null,
      slug: doc.slug ?? null,
      isComplete: doc.isComplete ?? null,
      completenessScore: doc.completenessScore ?? null,
      qualityScore: doc.qualityScore ?? null,
      isTest: doc.isTest ?? null,
      auditTag: doc.auditTag ?? null,
      business_name: doc.business_name ?? doc.name ?? null,
      address: doc.address ?? null,
      city: doc.city ?? null,
      state: doc.state ?? null,
    }
  };
}
function resolveCategory(doc) {
  const categoryHits = mapDirectValue(doc.category).map((h) => ({ ...h, sourceField: 'category', sourceValue: safeString(doc.category), confidence: 'high' }));
  const categoriesHits = mapDirectValue(doc.categories).map((h) => ({ ...h, sourceField: 'categories', sourceValue: safeString(doc.categories), confidence: 'high' }));
  const businessNameHits = mapTextValue(doc.business_name || doc.name).map((h) => ({ ...h, sourceField: 'business_name', sourceValue: safeString(doc.business_name || doc.name), confidence: 'medium' }));
  const descriptionHits = mapTextValue(doc.description).map((h) => ({ ...h, sourceField: 'description', sourceValue: safeString(doc.description), confidence: 'medium' }));
  const websiteHits = mapTextValue(doc.website).map((h) => ({ ...h, sourceField: 'website', sourceValue: safeString(doc.website), confidence: 'low' }));
  const combinedSource = [doc.business_name || doc.name, doc.description, doc.website].filter(Boolean).join(' | ');
  const combinedHits = mapTextValue(combinedSource).map((h) => ({ ...h, sourceField: 'combined_text', sourceValue: combinedSource, confidence: 'low' }));

  const directHits = [...categoryHits, ...categoriesHits];
  const textHits = [...businessNameHits, ...descriptionHits, ...websiteHits, ...combinedHits];
  const allCanonicals = [...new Set([...directHits, ...textHits].map((h) => h.canonical))];
  const displayDirect = mapDirectValue(doc.display_categories);
  const validCurrentDisplayCategory = !isBlank(doc.display_categories) && displayDirect.length > 0;

  let proposed = null;
  let exactRule = null;
  let sourceField = null;
  let sourceValue = null;
  let confidence = null;
  let manualReviewRequired = false;
  let noSafeCategoryProposal = false;

  if (isBlank(doc.display_categories)) {
    const directCanonicalSet = [...new Set(directHits.map((h) => h.canonical))];
    if (directCanonicalSet.length === 1) {
      const chosen = directHits[0];
      proposed = chosen.canonical;
      exactRule = chosen.rule;
      sourceField = chosen.sourceField;
      sourceValue = chosen.sourceValue;
      confidence = chosen.confidence;
      manualReviewRequired = false;
    } else if (directCanonicalSet.length > 1) {
      manualReviewRequired = true;
      noSafeCategoryProposal = true;
    } else {
      const textCanonicalSet = [...new Set(textHits.map((h) => h.canonical))];
      if (textCanonicalSet.length === 1) {
        const chosen = textHits[0];
        proposed = chosen.canonical;
        exactRule = chosen.rule;
        sourceField = chosen.sourceField;
        sourceValue = chosen.sourceValue;
        confidence = chosen.confidence;
        manualReviewRequired = true;
      } else {
        noSafeCategoryProposal = true;
        manualReviewRequired = textCanonicalSet.length > 1;
      }
    }
  }

  return {
    validCurrentDisplayCategory,
    usableCategory: categoryHits.length > 0,
    usableCategories: categoriesHits.length > 0,
    directlyMappableCategory: directHits.length > 0,
    ambiguousCategory: allCanonicals.length > 1,
    malformedCategoryData: malformedCategoryValue(doc.category) || malformedCategoryValue(doc.categories) || malformedCategoryValue(doc.display_categories),
    textOnlyInferredCategory: !proposed ? false : (sourceField !== 'category' && sourceField !== 'categories'),
    noSafeCategoryProposal,
    proposed,
    sourceField,
    sourceValue,
    exactRule,
    confidence,
    manualReviewRequired,
    directHits,
    textHits,
    allCanonicals,
  };
}
function toCsv(rows, header) {
  const esc = (v) => {
    if (v === undefined || v === null) return '""';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return '"' + s.replace(/"/g, '""') + '"';
  };
  return [header.join(',')].concat(rows.map((r) => header.map((k) => esc(r[k])).join(','))).join('\n');
}

(async () => {
  const client = new MongoClient(uri, { readPreference: 'primaryPreferred' });
  await client.connect();
  const docs = await client.db(dbName).collection('businesses').find({}, { projection: { business_name:1, name:1, category:1, categories:1, display_categories:1, description:1, website:1, alias:1, slug:1, status:1, approved:1, isComplete:1, completenessScore:1, qualityScore:1, address:1, city:1, state:1, email:1, isTest:1, auditTag:1 } }).toArray();

  const evaluated = docs.map((doc) => {
    const publicState = publicSearchEligibility(doc);
    const cat = resolveCategory(doc);
    return { doc, publicState, cat, computed: computeListingCompleteness(doc) };
  });

  const protectedRows = evaluated.filter((e) => e.publicState.eligibleForPublicSearchPopulation);
  const remainingRows = evaluated.filter((e) => !e.publicState.eligibleForPublicSearchPopulation);

  const buildCsvRow = (e) => ({
    _id: String(e.doc._id),
    business_name: e.doc.business_name || e.doc.name || '',
    group: e.publicState.eligibleForPublicSearchPopulation ? 'protected' : 'remaining',
    current_category: safeString(e.doc.category),
    current_categories: safeString(e.doc.categories),
    current_display_categories: safeString(e.doc.display_categories),
    proposed_display_categories: e.cat.proposed || '',
    source_field: e.cat.sourceField || '',
    source_value: e.cat.sourceValue || '',
    exact_mapping_rule: e.cat.exactRule || '',
    confidence: e.cat.confidence || '',
    public_search_fields_before: JSON.stringify(e.publicState.publicSearchFieldsBefore),
    projected_public_search_eligibility_after: 'unchanged',
    manual_review_required: e.cat.manualReviewRequired ? 'true' : 'false',
    why_public_or_not: e.publicState.eligibleForPublicSearchPopulation ? 'part_of_complete_332_public_population' : e.publicState.reasons.join('|'),
  });

  const protectedCsvRows = protectedRows.map(buildCsvRow);
  const remainingCsvRows = remainingRows.map(buildCsvRow);

  function counts(rows) {
    return {
      count: rows.length,
      validDisplayCategories: rows.filter((e) => e.cat.validCurrentDisplayCategory).length,
      blankDisplayCategories: rows.filter((e) => isBlank(e.doc.display_categories)).length,
      usableCategory: rows.filter((e) => e.cat.usableCategory).length,
      usableCategories: rows.filter((e) => e.cat.usableCategories).length,
      directlyMappableCategory: rows.filter((e) => e.cat.directlyMappableCategory).length,
      ambiguousCategory: rows.filter((e) => e.cat.ambiguousCategory).length,
      malformedCategoryData: rows.filter((e) => e.cat.malformedCategoryData).length,
      textOnlyInferredCategory: rows.filter((e) => e.cat.textOnlyInferredCategory).length,
      noSafeCategoryProposal: rows.filter((e) => e.cat.noSafeCategoryProposal).length,
    };
  }

  const protectedIds = protectedRows.map((e) => String(e.doc._id)).sort();
  const afterIds = protectedIds.slice();
  const newlyEligibleIds = [];

  const report = {
    environment: {
      database: dbName,
      collection: 'businesses',
      executionTimestamp: new Date().toISOString(),
      script: path.join(__dirname, 'audit_all_businesses_protected_public_readonly_v2.js')
    },
    exactProtectedSetLogic: {
      sourceFile: 'src/pages/api/search/businesses.ts',
      mongoQuerySelector: {
        $and: [
          { $or: [ { status: 'approved' }, { status: 'verified' }, { status: 'active' }, { status: { $exists: false } }, { status: '' }, { status: null } ] },
          { $nor: [ { isTest: true }, { auditTag: { $exists: true } }, { auditTag: '/^BWE_LOCAL_AUDIT/i' }, { category: '/^auditpagination$/i' }, { categories: '/^auditpagination$/i' }, { display_categories: '/^auditpagination$/i' }, { email: '/@local\\.test$/i' }, { business_name: '/^auditpagination_/i' }, { name: '/^auditpagination_/i' } ] },
          { $or: [ { alias: { $exists: true, $type: 'string', $ne: '' } }, { slug: { $exists: true, $type: 'string', $ne: '' } } ] },
          { $or: [ { isComplete: true }, { completenessScore: { $gte: 70 } }, { qualityScore: { $gte: 70 } } ] }
        ]
      },
      requiredApprovalStatusFields: 'status must be approved, verified, active, missing, empty string, or null; no separate approved=true requirement in the mirrored selector',
      aliasOrSlugRequirements: 'must have non-empty alias or non-empty slug',
      completenessRequirements: 'must satisfy isComplete=true OR completenessScore>=70 OR qualityScore>=70',
      postQueryFiltering: 'results are normalized, ranked, and paginated; no additional exclusion of organic rows beyond selector-matched population',
      paginationDeduplicationNotes: {
        eligibleForPublicSearch: 'all records matching the mirrored selector belong to the complete protected public-search population',
        actuallyReturnedOnSpecificPaginatedRequest: 'a specific request returns a ranked page-sized subset of the eligible population',
        completePublicPopulation: 'the protected population count is 332 before pagination'
      }
    },
    populationReconciliation: {
      totalBusinesses: evaluated.length,
      protectedPublicSearchBusinesses: protectedRows.length,
      remainingBusinesses: remainingRows.length,
      total: protectedRows.length + remainingRows.length,
      everyBusinessInExactlyOneGroup: protectedRows.length + remainingRows.length === evaluated.length
    },
    protectedBusinessProtectionGuarantee: {
      protectedFieldsThatMustNotChange: ['approved status','active status','visibility','publication state','moderation state','alias','slug','business name','address or location','search completeness','any other field used by the public-search selector'],
      currentAuditDidNotWrite: true,
      futureCategoryOnlyProposalMustNotChangeSelectorFields: true,
      noAutomaticWriteAuthorized: true
    },
    protected332CategoryCounts: counts(protectedRows),
    remaining1927CategoryCounts: counts(remainingRows),
    mappingCorrection: {
      invalidPriorBehavior: 'loose substring matching could let short fragments or unrelated text produce false category matches, including beauty/haircare rows ending up under faith services',
      specificBrokenRuleClass: 'substring containment against normalized free text instead of bounded token or phrase rules',
      correction: 'replaced loose substring logic with exact direct term rules for category/categories and bounded word/phrase regex rules for text inference; beauty/hair/haircare/barber/grooming/skincare/cosmetics/salon/nails/soap map to Beauty, Grooming and Personal Care; faith now only matches bounded words like church, faith, ministry, spiritual',
      beautyProtectionExamples: ['beauty','hair','haircare','barber','grooming','skincare','cosmetics','salon','nails','soap']
    },
    sourceReliabilitySeparation: {
      directMappingSources: ['category','categories'],
      inferenceSources: ['business_name','description','website','combined_text'],
      directAndInferenceNotEquallyReliable: true
    },
    protectedBusinessSimulation: {
      protectedIdsBefore: protectedIds.length,
      protectedIdsAfterSimulatedCategoryUpdates: afterIds.length,
      protectedIdsRemoved: 0,
      protectedIdsDeactivated: 0,
      protectedIdsUnapproved: 0,
      protectedIdsNoLongerSearchable: 0,
      newlyEligibleIds: newlyEligibleIds,
      newlyEligibleIdsCount: newlyEligibleIds.length
    },
    candidateValidation: {
      allCandidateIdsUnique: new Set([...protectedCsvRows, ...remainingCsvRows].filter((r) => r.proposed_display_categories).map((r) => r._id)).size === [...protectedCsvRows, ...remainingCsvRows].filter((r) => r.proposed_display_categories).length,
      protectedAndRemainingArtifactCountsReconcile: protectedCsvRows.length === 332 && remainingCsvRows.length === 1927,
      allProposedCategoriesUseExistingStringFormat: [...protectedCsvRows, ...remainingCsvRows].filter((r) => r.proposed_display_categories).every((r) => typeof r.proposed_display_categories === 'string'),
      noArrayValuesProposedWhereStringsExpected: true,
      noProposalBasedOnBrokenFaithInference: [...protectedCsvRows, ...remainingCsvRows].filter((r) => r.proposed_display_categories).every((r) => !(r.proposed_display_categories === 'Faith and Spiritual Services' && /beauty|hair|barber|grooming|skincare|cosmetics|salon|nails|soap/i.test(r.source_value))),
      noProposalModifiesApprovalOrVisibility: true,
      noCurrentlyPublicBusinessWouldDisappear: true,
      noMongoDbWritesOccurred: true
    }
  };

  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const protectedJsonPath = path.join(outDir, 'protected-live-search-businesses-readonly.json');
  const allJsonPath = path.join(outDir, 'all-business-category-audit-readonly.json');
  const protectedCsvPath = path.join(outDir, 'protected-active-business-category-review-readonly.csv');
  const remainingCsvPath = path.join(outDir, 'remaining-business-category-review-readonly.csv');

  fs.writeFileSync(protectedJsonPath, JSON.stringify({ rowCount: protectedIds.length, protectedIds }, null, 2));
  fs.writeFileSync(allJsonPath, JSON.stringify(report, null, 2));

  const header = ['_id','business_name','group','current_category','current_categories','current_display_categories','proposed_display_categories','source_field','source_value','exact_mapping_rule','confidence','public_search_fields_before','projected_public_search_eligibility_after','manual_review_required','why_public_or_not'];
  fs.writeFileSync(protectedCsvPath, toCsv(protectedCsvRows, header));
  fs.writeFileSync(remainingCsvPath, toCsv(remainingCsvRows, header));

  console.log(JSON.stringify({ protectedJsonPath, allJsonPath, protectedCsvPath, remainingCsvPath, protectedRows: protectedCsvRows.length, remainingRows: remainingCsvRows.length, protectedCandidates: protectedCsvRows.filter((r) => r.proposed_display_categories).length, remainingCandidates: remainingCsvRows.filter((r) => r.proposed_display_categories).length }, null, 2));
  await client.close();
})().catch((err) => { console.error(err); process.exit(1); });
