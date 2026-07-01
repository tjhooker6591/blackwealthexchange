#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) throw new Error('Missing MONGODB_URI or MONGODB_DB');

const COLLECTION_CANDIDATES = ['businesses', 'businesses_black', 'blackbusinesses', 'black_owned_businesses'];
const APPROVED_CANONICAL = [
  'Restaurants',
  'Food and Beverage',
  'Beauty, Grooming and Personal Care',
  'Health and Wellness',
  'Shopping and Retail',
  'Professional Services',
  'Home Services',
  'Automotive',
  'Education and Training',
  'Technology',
  'Arts, Media and Entertainment',
  'Travel and Hospitality',
  'Real Estate and Housing',
  'Financial Services',
  'Legal and Government Services',
  'Nonprofit and Community Organizations',
  'Faith and Spiritual Services',
  'Childcare and Family Services',
  'Pets and Animal Services',
  'Sports and Recreation',
  'Agriculture and Farming',
  'Construction and Trades',
  'Manufacturing and Industrial',
  'Transportation and Logistics',
  'Events and Weddings',
  'Nightlife',
  'Cannabis',
  'Adult',
  'Other Services',
];

function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0 || value.every((v) => isBlank(v));
  return false;
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
    return value
      .split(/[|,;/]+/)
      .map((s) => normalizeAtom(s))
      .filter(Boolean);
  }
  return [];
}

const directMap = new Map([
  ['restaurant', 'Restaurants'],
  ['restaurants', 'Restaurants'],
  ['food', 'Food and Beverage'],
  ['food truck', 'Food and Beverage'],
  ['catering', 'Food and Beverage'],
  ['bakery', 'Food and Beverage'],
  ['coffee', 'Food and Beverage'],
  ['cafe', 'Food and Beverage'],
  ['barbershop', 'Beauty, Grooming and Personal Care'],
  ['barber shop', 'Beauty, Grooming and Personal Care'],
  ['barber', 'Beauty, Grooming and Personal Care'],
  ['hair salon', 'Beauty, Grooming and Personal Care'],
  ['hair salons', 'Beauty, Grooming and Personal Care'],
  ['hair stylist', 'Beauty, Grooming and Personal Care'],
  ['hair stylists', 'Beauty, Grooming and Personal Care'],
  ['hair extensions', 'Beauty, Grooming and Personal Care'],
  ['wigs', 'Beauty, Grooming and Personal Care'],
  ['nail salon', 'Beauty, Grooming and Personal Care'],
  ['nail salons', 'Beauty, Grooming and Personal Care'],
  ['nail technicians', 'Beauty, Grooming and Personal Care'],
  ['beauty supply', 'Beauty, Grooming and Personal Care'],
  ['beauty supply store', 'Beauty, Grooming and Personal Care'],
  ['cosmetics beauty supply', 'Beauty, Grooming and Personal Care'],
  ['makeup artists', 'Beauty, Grooming and Personal Care'],
  ['waxing', 'Beauty, Grooming and Personal Care'],
  ['day spas', 'Beauty, Grooming and Personal Care'],
  ['spa', 'Beauty, Grooming and Personal Care'],
  ['massage', 'Health and Wellness'],
  ['wellness', 'Health and Wellness'],
  ['health', 'Health and Wellness'],
  ['fitness', 'Health and Wellness'],
  ['photography', 'Professional Services'],
  ['event photography', 'Professional Services'],
  ['session photography', 'Professional Services'],
  ['tax services', 'Financial Services'],
  ['accounting', 'Financial Services'],
  ['bookkeeping', 'Financial Services'],
  ['insurance', 'Financial Services'],
  ['real estate agents', 'Real Estate and Housing'],
  ['realtor', 'Real Estate and Housing'],
  ['home inspectors', 'Home Services'],
  ['carpet cleaning', 'Home Services'],
  ['handyman', 'Home Services'],
  ['web design', 'Technology'],
  ['church faith organization', 'Faith and Spiritual Services'],
  ['community service non profit', 'Nonprofit and Community Organizations'],
  ['bartenders', 'Nightlife'],
  ['party event planning', 'Events and Weddings'],
  ['auto detailing', 'Automotive'],
  ['process servers', 'Legal and Government Services'],
  ['home rental insurance', 'Financial Services'],
  ['body contouring', 'Health and Wellness'],
]);

function canonicalCategoryMapping(value) {
  const toks = normalization(value);
  const mapped = [];
  for (const tok of toks) {
    if (directMap.has(tok)) mapped.push(directMap.get(tok));
    else {
      for (const [k, v] of directMap.entries()) {
        if (tok.includes(k) || k.includes(tok)) {
          mapped.push(v);
          break;
        }
      }
    }
  }
  return [...new Set(mapped)];
}

function isUsableCategoryValue(value) {
  return canonicalCategoryMapping(value).length > 0;
}

function inferFromText(doc) {
  const fields = [
    ['business_name_inference', doc.business_name],
    ['description_inference', doc.description],
    ['website_inference', doc.website],
    ['combined_text_inference', [doc.business_name, doc.description, doc.website, doc.address, doc.city, doc.state].filter(Boolean).join(' | ')],
  ];
  const hits = [];
  for (const [source, raw] of fields) {
    const mapped = canonicalCategoryMapping(raw);
    for (const m of mapped) hits.push({ source, value: raw, canonical: m });
  }
  const unique = [...new Set(hits.map((h) => h.canonical))];
  if (unique.length === 1) {
    const first = hits.find((h) => h.canonical === unique[0]);
    return {
      accepted: true,
      proposed: unique[0],
      inferenceSource: first.source,
      sourceValue: first.value,
      matchedRule: `text:${normalizeAtom(String(first.value || '')).slice(0, 120)}`,
      confidence: 'high',
      conflictingSignals: false,
    };
  }
  return {
    accepted: false,
    conflictingSignals: unique.length > 1,
    candidates: unique,
  };
}

function highConfidenceInference(doc) {
  if (isUsableCategoryValue(doc.category)) {
    const mapped = canonicalCategoryMapping(doc.category);
    if (mapped.length === 1) {
      return {
        accepted: true,
        proposed: mapped[0],
        sourceField: 'category',
        sourceValue: doc.category,
        matchedRule: `direct:category:${normalizeAtom(String(doc.category))}`,
        confidence: 'high',
        inferenceSource: 'direct_category_mapping',
        conflictingSignals: false,
      };
    }
    return { accepted: false, conflictingSignals: true, candidates: mapped };
  }
  if (isUsableCategoryValue(doc.categories)) {
    const mapped = canonicalCategoryMapping(doc.categories);
    if (mapped.length === 1) {
      return {
        accepted: true,
        proposed: mapped[0],
        sourceField: 'categories',
        sourceValue: doc.categories,
        matchedRule: `direct:categories:${normalizeAtom(String(doc.categories))}`,
        confidence: 'high',
        inferenceSource: 'direct_categories_mapping',
        conflictingSignals: false,
      };
    }
    return { accepted: false, conflictingSignals: true, candidates: mapped };
  }
  const inferred = inferFromText(doc);
  if (inferred.accepted) {
    return {
      accepted: true,
      proposed: inferred.proposed,
      sourceField: inferred.inferenceSource.replace('_inference', ''),
      sourceValue: inferred.sourceValue,
      matchedRule: inferred.matchedRule,
      confidence: inferred.confidence,
      inferenceSource: inferred.inferenceSource,
      conflictingSignals: false,
    };
  }
  return { accepted: false, conflictingSignals: !!inferred.conflictingSignals, candidates: inferred.candidates || [] };
}

function ambiguousMultipleRuleRejection(doc) {
  const directCategory = canonicalCategoryMapping(doc.category);
  const directCategories = canonicalCategoryMapping(doc.categories);
  const textCandidates = inferFromText(doc).candidates || [];
  const combined = [...new Set([...directCategory, ...directCategories, ...textCandidates])];
  return combined.length > 1;
}

(async () => {
  const client = new MongoClient(uri, { readPreference: 'primaryPreferred' });
  await client.connect();
  const db = client.db(dbName);
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);
  let collectionName = COLLECTION_CANDIDATES.find((n) => names.includes(n));
  if (!collectionName) {
    collectionName = names.find((n) => /business/i.test(n));
  }
  if (!collectionName) throw new Error('Could not identify target collection');
  const col = db.collection(collectionName);
  const docs = await col.find({}, { projection: { business_name: 1, category: 1, categories: 1, display_categories: 1, description: 1, website: 1, address: 1, city: 1, state: 1 } }).toArray();
  const total = docs.length;
  const timestamp = new Date().toISOString();

  const partition = {};
  for (const c of ['000','001','010','011','100','101','110','111']) partition[c] = 0;
  const unusable = { category: [], categories: [], display_categories: [] };
  const candidates = [];
  const ambiguous = [];

  for (const doc of docs) {
    const c = isBlank(doc.category) ? '0' : '1';
    const cs = isBlank(doc.categories) ? '0' : '1';
    const dc = isBlank(doc.display_categories) ? '0' : '1';
    partition[c + cs + dc]++;

    if (!isBlank(doc.category) && !isUsableCategoryValue(doc.category)) unusable.category.push(doc);
    if (!isBlank(doc.categories) && !isUsableCategoryValue(doc.categories)) unusable.categories.push(doc);
    if (!isBlank(doc.display_categories) && !isUsableCategoryValue(doc.display_categories)) unusable.display_categories.push(doc);

    if (isBlank(doc.display_categories)) {
      const rec = highConfidenceInference(doc);
      const multiReject = ambiguousMultipleRuleRejection(doc);
      if (rec.accepted && !multiReject) {
        candidates.push({
          _id: String(doc._id),
          business_name: doc.business_name || null,
          current_category: doc.category ?? null,
          current_categories: doc.categories ?? null,
          current_display_categories: doc.display_categories ?? null,
          proposed_display_categories: rec.proposed,
          sourceField: rec.sourceField,
          sourceValue: rec.sourceValue ?? null,
          matchedRule: rec.matchedRule,
          confidence: rec.confidence,
          inferenceSource: rec.inferenceSource,
        });
      } else if (multiReject || rec.conflictingSignals) {
        ambiguous.push({ _id: String(doc._id), business_name: doc.business_name || null, category: doc.category ?? null, categories: doc.categories ?? null, display_categories: doc.display_categories ?? null });
      }
    }
  }

  const count332 = docs.filter((d) => isBlank(d.display_categories) && (isBlank(d.category) || !isUsableCategoryValue(d.category)) && (isBlank(d.categories) || !isUsableCategoryValue(d.categories)) && (isBlank(d.display_categories) || !isUsableCategoryValue(d.display_categories))).length;
  const count170 = docs.filter((d) => isBlank(d.display_categories) && (isUsableCategoryValue(d.category) || isUsableCategoryValue(d.categories))).length;
  const count83 = candidates.length;
  const count12 = partition['000'];
  const textOnly = candidates.filter((c) => !c.current_category && !c.current_categories && c.inferenceSource !== 'direct_category_mapping' && c.inferenceSource !== 'direct_categories_mapping');
  const count1 = textOnly.length;

  const nonblankDisplay = docs.filter((d) => !isBlank(d.display_categories));
  const typeDist = { array: 0, string: 0, other: 0, examples: [] };
  for (const d of nonblankDisplay) {
    const v = d.display_categories;
    if (Array.isArray(v)) typeDist.array++;
    else if (typeof v === 'string') typeDist.string++;
    else typeDist.other++;
    if (typeDist.examples.length < 10) typeDist.examples.push({ _id: String(d._id), display_categories: v });
  }

  const report = {
    environment: {
      database: dbName,
      collection: collectionName,
      totalRecordCount: total,
      executionTimestamp: timestamp,
      script: path.join(__dirname, 'reconcile_display_categories_readonly.js'),
    },
    selectors: {
      count332: "docs.filter((d) => isBlank(d.display_categories) && (isBlank(d.category) || !isUsableCategoryValue(d.category)) && (isBlank(d.categories) || !isUsableCategoryValue(d.categories)) && (isBlank(d.display_categories) || !isUsableCategoryValue(d.display_categories))).length",
      count170: "docs.filter((d) => isBlank(d.display_categories) && (isUsableCategoryValue(d.category) || isUsableCategoryValue(d.categories))).length",
      count83: "candidates.length",
      count12: "partition['000']",
      count1: "textOnly.length",
    },
    functions: {
      isBlank: isBlank.toString(),
      isUsableCategoryValue: isUsableCategoryValue.toString(),
      normalization: normalization.toString(),
      canonicalCategoryMapping: canonicalCategoryMapping.toString(),
      highConfidenceInference: highConfidenceInference.toString(),
      ambiguousMultipleRuleRejection: ambiguousMultipleRuleRejection.toString(),
    },
    fieldStateSemantics: {
      missingField: 'blank',
      null: 'blank',
      emptyString: 'blank',
      whitespaceOnlyString: 'blank',
      emptyArray: 'blank',
      arrayContainingBlankStrings: 'blank',
      nonemptyString: 'nonblank',
      nonemptyArray: 'nonblank',
      malformedObjectOrNumber: 'nonblank for partition, unusable for mapping',
    },
    partition: {
      category_categories_display_categories: partition,
      display_categories_blank_total: Object.entries(partition).filter(([k]) => k[2] === '0').reduce((a, [,v]) => a+v, 0),
      all_three_blank_total: partition['000'],
      any_one_blank_total: Object.entries(partition).filter(([k]) => k.includes('0')).reduce((a, [,v]) => a+v, 0),
      none_blank_total: partition['111'],
    },
    reconciliation: {
      count332,
      count170,
      count83,
      count12,
      count1,
      unusableCounts: {
        category: unusable.category.length,
        categories: unusable.categories.length,
        display_categories: unusable.display_categories.length,
      },
      unusableExamples: {
        category: unusable.category.slice(0, 10).map((d) => ({ _id: String(d._id), business_name: d.business_name || null, category: d.category })),
        categories: unusable.categories.slice(0, 10).map((d) => ({ _id: String(d._id), business_name: d.business_name || null, categories: d.categories })),
        display_categories: unusable.display_categories.slice(0, 10).map((d) => ({ _id: String(d._id), business_name: d.business_name || null, display_categories: d.display_categories })),
      },
      directCandidates: candidates.filter((c) => c.inferenceSource === 'direct_category_mapping').length,
      categoriesCandidates: candidates.filter((c) => c.inferenceSource === 'direct_categories_mapping').length,
      textOnlyCandidates: candidates.filter((c) => !['direct_category_mapping','direct_categories_mapping'].includes(c.inferenceSource)).length,
      conflictingSourceSignals: ambiguous.length,
      allCategoryLikeBlankCandidates: candidates.filter((c) => isBlank(c.current_category) && isBlank(c.current_categories) && isBlank(c.current_display_categories)).length,
    },
    displayCategoriesTypeDistribution: typeDist,
    approvedCanonicalCategoryList: APPROVED_CANONICAL,
    candidateValidation: {
      uniqueIds: new Set(candidates.map((c) => c._id)).size === candidates.length,
      candidateCountEqualsExportRows: true,
      noCandidateCurrentlyHasNonblankDisplayCategories: candidates.every((c) => isBlank(c.current_display_categories)),
      noProposedValueIsEmpty: candidates.every((c) => !isBlank(c.proposed_display_categories)),
      everyProposedValueApproved: candidates.every((c) => APPROVED_CANONICAL.includes(c.proposed_display_categories)),
      noExistingCategoryOrCategoriesWouldBeChanged: true,
      databaseWritesOccurred: false,
    },
    examples10: candidates.slice(0, 10),
    candidates,
    updatePlanTemplate: {
      precheck: 'Re-read approved _id list, fetch current display_categories, proceed only where isBlank(display_categories) is still true.',
      updateTarget: 'display_categories only',
      preserveFields: ['category', 'categories'],
      backupArtifact: 'JSON export of pre-update state for exact _id list',
      rollbackArtifact: 'bulkWrite operations restoring prior display_categories from backup artifact',
      executionReport: ['matchedCount', 'modifiedCount'],
      writeExecuted: false,
    },
  };

  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'display-categories-reconciliation-readonly.json');
  const csvPath = path.join(outDir, 'display-categories-candidates-readonly.csv');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  const header = ['_id','business_name','current_category','current_categories','current_display_categories','proposed_display_categories','sourceField','sourceValue','matchedRule','confidence','inferenceSource'];
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const lines = [header.join(',')].concat(candidates.map((r) => header.map((k) => esc(r[k])).join(',')));
  fs.writeFileSync(csvPath, lines.join('\n'));
  console.log(JSON.stringify({ jsonPath, csvPath, database: dbName, collection: collectionName, total, count332, count170, count83, count12, count1 }, null, 2));
  await client.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
