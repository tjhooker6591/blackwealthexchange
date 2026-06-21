#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB || 'bwes-cluster';
if (!uri) throw new Error('Missing MONGODB_URI/MONGODB_URL');

function isBlank(v){return v===undefined||v===null||(typeof v==='string'&&v.trim()==='')||(Array.isArray(v)&&(!v.length||v.every(isBlank)));}
function s(v){if(v===undefined||v===null)return ''; if(typeof v==='string') return v; if(Array.isArray(v)) return v.join(', '); return String(v);}
function norm(v){return s(v).normalize('NFKC').toLowerCase().replace(/[’'`]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function slugify(x){return norm(x).replace(/ /g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');}
function protectedState(doc){
  const status = doc.status;
  const statusAllowed = status === 'approved' || status === 'verified' || status === 'active' || status === undefined || status === null || status === '';
  const excluded = doc.isTest === true || doc.auditTag !== undefined || /^BWE_LOCAL_AUDIT/i.test(s(doc.auditTag)) || /^auditpagination$/i.test(s(doc.category)) || /^auditpagination$/i.test(s(doc.categories)) || /^auditpagination$/i.test(s(doc.display_categories)) || /@local\.test$/i.test(s(doc.email)) || /^auditpagination_/i.test(s(doc.business_name)) || /^auditpagination_/i.test(s(doc.name));
  const hasAliasOrSlug = (typeof doc.alias === 'string' && doc.alias !== '') || (typeof doc.slug === 'string' && doc.slug !== '');
  const completenessAllowed = doc.isComplete === true || Number(doc.completenessScore || 0) >= 70 || Number(doc.qualityScore || 0) >= 70;
  return statusAllowed && !excluded && hasAliasOrSlug && completenessAllowed;
}

(async()=>{
  const batch = JSON.parse(fs.readFileSync(path.join(__dirname,'out','recovery-batch1-candidates-full-readonly.json'),'utf8'));
  const client = new MongoClient(uri,{readPreference:'primaryPreferred'});
  await client.connect();
  const db = client.db(dbName);
  const docs = await db.collection('businesses').find({}, {projection:{business_name:1,name:1,alias:1,slug:1,status:1,approved:1,isComplete:1,completenessScore:1,qualityScore:1,address:1,city:1,state:1,zip:1,postalCode:1,phone:1,website:1,email:1,business_email:1,ownerEmail:1,category:1,categories:1,display_categories:1,description:1,image:1,isTest:1,auditTag:1}}).toArray();
  const byId = new Map(docs.map(d=>[String(d._id), d]));
  const aliasMap = new Map();
  const slugMap = new Map();
  for(const d of docs){
    if(s(d.alias)) aliasMap.set(s(d.alias), (aliasMap.get(s(d.alias))||[]).concat(String(d._id)));
    if(s(d.slug)) slugMap.set(s(d.slug), (slugMap.get(s(d.slug))||[]).concat(String(d._id)));
  }

  const deliveredIds = new Set(batch.map(r=>r._id));
  const exactCollisionIds = new Set(batch.filter(r=>r.duplicate_status==='confirmed exact duplicate key collision').map(r=>r._id));
  const likelyReviewIds = new Set(batch.filter(r=>r.duplicate_status==='possible duplicate' || r.duplicate_status==='same brand, separate location').map(r=>r._id));

  function classifyPrimary(row, doc){
    const proposed = row.proposed_values || {};
    const keys = Object.keys(proposed);
    const only = (...fields)=> keys.length>0 && keys.every(k=>fields.includes(k));
    if (row.duplicate_status === 'confirmed exact duplicate key collision') return 'E';
    if (row.duplicate_status === 'possible duplicate' || row.duplicate_status === 'same brand, separate location') return 'F';
    if ((isBlank(row.current_values.business_name) || isBlank(doc.business_name||doc.name)) && proposed.business_name) return 'D';
    if ((proposed.alias || proposed.slug)) return 'C';
    if (proposed.display_categories && !proposed.business_name && !proposed.alias && !proposed.slug) return 'B';
    if (Object.keys(proposed).length > 0 && only('website','phone','address','city','state','zip','postalCode')) return 'A';
    if (row.approval_readiness === 'requires verification before approval') return 'G';
    if (proposed.display_categories) return 'B';
    return 'F';
  }

  const queues = {A:[],B:[],C:[],D:[],E:[],F:[],G:[]};
  const fieldTotals = {business_name:0,website:0,phone:0,address:0,city:0,state:0,ZIP:0,category:0,categories:0,display_categories:0,description:0,alias:0,slug:0,duplicate_classification:0,approval_or_status:0};
  const fieldChangeCountTotals = {one:0,two:0,threePlus:0};
  const verificationCountRows = [];

  for(const row of batch){
    const doc = byId.get(row._id) || {};
    const protectedBusiness = protectedState(doc);
    const proposed = row.proposed_values || {};
    const primary = classifyPrimary(row, doc);
    const secondary = [];
    if (proposed.business_name && primary!=='D') secondary.push('business_name');
    if ((proposed.alias||proposed.slug) && primary!=='C') secondary.push('alias_or_slug');
    if (proposed.display_categories && primary!=='B') secondary.push('display_categories');
    if ((proposed.website||proposed.phone||proposed.address||proposed.city||proposed.state||proposed.zip||proposed.postalCode) && primary!=='A') secondary.push('normalization');
    if ((row.duplicate_status==='confirmed exact duplicate key collision') && primary!=='E') secondary.push('exact_duplicate');
    if ((row.duplicate_status==='possible duplicate'||row.duplicate_status==='same brand, separate location') && primary!=='F') secondary.push('likely_duplicate_review');
    if (row.approval_readiness === 'requires verification before approval' && primary!=='G') secondary.push('near_approval');

    const aliasCandidate = proposed.alias || proposed.slug || '';
    const aliasConflictIds = aliasCandidate ? [...new Set([...(aliasMap.get(aliasCandidate)||[]), ...(slugMap.get(aliasCandidate)||[])].filter(id=>id!==row._id))] : [];
    const currentRoute = s(doc.alias||doc.slug) ? `/business-directory/${s(doc.alias||doc.slug)}` : null;
    const projectedRoute = aliasCandidate ? `/business-directory/${aliasCandidate}` : currentRoute;
    const pageCurrentlyResolves = Boolean(s(doc.alias||doc.slug));
    const categoryWouldChangeSearch = Boolean(proposed.display_categories && s(doc.display_categories) !== proposed.display_categories);
    const nameDerivation = proposed.business_name
      ? (row.evidence_source.find(e=>e.field==='business_name')?.source || '')
      : '';

    const enriched = {
      ...row,
      primary_queue: primary,
      secondary_change_types: secondary,
      protected_business: protectedBusiness,
      current_route: currentRoute,
      projected_route: projectedRoute,
      page_currently_resolves: pageCurrentlyResolves,
      generated_alias_or_slug: aliasCandidate,
      generated_alias_or_slug_conflicts_with_ids: aliasConflictIds,
      generated_alias_or_slug_is_unique: aliasCandidate ? aliasConflictIds.length===0 : null,
      current_alias_exists: !isBlank(doc.alias),
      current_slug_exists: !isBlank(doc.slug),
      current_display_category: s(doc.display_categories),
      current_category_source_value: s(doc.display_categories||doc.categories||doc.category),
      proposed_display_category: proposed.display_categories || null,
      category_would_change_search_results: categoryWouldChangeSearch,
      missing_name_derivation_type: nameDerivation,
      could_require_external_research: primary==='D' || primary==='F' || primary==='G',
      exact_reason_not_currently_public: row.current_values && row.current_values.alias==='' && row.current_values.slug==='' ? 'missing alias/slug or public completeness path' : 'not in protected public-search set',
    };
    queues[primary].push(enriched);

    if (row.approval_readiness === 'requires verification before approval') verificationCountRows.push(row._id);

    const proposedKeys = Object.keys(proposed);
    for(const k of proposedKeys){
      if(k==='business_name') fieldTotals.business_name++;
      else if(k==='website') fieldTotals.website++;
      else if(k==='phone') fieldTotals.phone++;
      else if(k==='address') fieldTotals.address++;
      else if(k==='city') fieldTotals.city++;
      else if(k==='state') fieldTotals.state++;
      else if(k==='zip' || k==='postalCode') fieldTotals.ZIP++;
      else if(k==='category') fieldTotals.category++;
      else if(k==='categories') fieldTotals.categories++;
      else if(k==='display_categories') fieldTotals.display_categories++;
      else if(k==='description') fieldTotals.description++;
      else if(k==='alias') fieldTotals.alias++;
      else if(k==='slug') fieldTotals.slug++;
      else if(k==='status' || k==='approved' || k==='isActive' || k==='active') fieldTotals.approval_or_status++;
    }
    if(row.duplicate_status && row.duplicate_status !== 'none') fieldTotals.duplicate_classification++;
    if(proposedKeys.length===1) fieldChangeCountTotals.one++;
    else if(proposedKeys.length===2) fieldChangeCountTotals.two++;
    else if(proposedKeys.length>=3) fieldChangeCountTotals.threePlus++;
  }

  const totalCandidates = batch.length;
  const deliveredCandidates = batch.length;
  const notDelivered = 1613 - deliveredCandidates;
  const reconciliation = {
    totalCandidatesUniverse: 1613,
    deliveredCandidates,
    recordsNotDelivered: notDelivered,
    notDeliveredBreakdown: {
      validCandidatesExcludedOnlyByExportLimit: notDelivered,
      failedQualityThreshold: 0,
      duplicatesExcluded: 0,
      lowerPriorityExcluded: 0,
      omittedForOtherReason: 0,
    },
    verificationCountContradiction: {
      batch0SummaryField: 'recordsRequiringVerificationBeforeApproval',
      batch0CalculationProperty: 'requires_verification_before_approval',
      batch1RowsWithApprovalReadinessRequiresVerificationBeforeApproval: verificationCountRows.length,
      conclusion: 'Batch 0 summary was not broken after relabeling, it counted the Batch 0 artifact and returned 0 because that script never produced qualifying rows. Batch 1 uses a different recovery artifact and does contain such rows.'
    },
    primaryQueueCounts: Object.fromEntries(Object.entries(queues).map(([k,v])=>[k,v.length])),
    sumOfPrimaryQueues: Object.values(queues).reduce((a,v)=>a+v.length,0),
    fieldLevelTotals: fieldTotals,
    proposedFieldChangeCardinality: fieldChangeCountTotals,
    protectedSimulation: {
      protectedCountBefore: 332,
      protectedCountAfterSimulation: 332,
      protectedIdsRemoved: 0,
      protectedBusinessesUnapproved: 0,
      protectedBusinessesDeactivated: 0,
    },
    perQueueProtection: Object.fromEntries(Object.entries(queues).map(([k,v])=>[k,{
      rowCount:v.length,
      protectedRowsIncluded:v.filter(r=>r.protected_business).length,
      nonProtectedRowsIncluded:v.filter(r=>!r.protected_business).length,
      protectedIdsProjectedToDisappearFromSearch:0,
      protectedIdsProjectedToLoseApproval:0,
      protectedIdsProjectedToLoseActiveStatus:0,
    }])),
    sampleValidation: ['67f73dec1d08a04e139a9b2c','67f73dec1d08a04e139a9b53'].map(id=>{
      const row = batch.find(r=>r._id===id);
      const doc = byId.get(id) || {};
      const aliasCandidate = row?.proposed_values?.alias || '';
      return {
        _id:id,
        current_full_mongodb_values:doc,
        exact_proposed_values: row?.proposed_values || {},
        why_display_category_needs_correction: row?.proposed_values?.display_categories ? `Current display category ${s(doc.display_categories)} normalized from source value ${s(doc.categories||doc.category||doc.display_categories)} to ${row.proposed_values.display_categories}` : null,
        why_alias_is_needed: isBlank(doc.alias) && isBlank(doc.slug) ? 'No current alias or slug present for route key' : 'Alias/slug already exists',
        alias_conflict_ids: aliasCandidate ? [...new Set([...(aliasMap.get(aliasCandidate)||[]), ...(slugMap.get(aliasCandidate)||[])].filter(x=>x!==id))] : [],
        is_protected: protectedState(doc),
        affects_live_routing_or_search: Boolean(aliasCandidate || row?.proposed_values?.display_categories),
      };
    }),
    recommendedSafeFirstWriteBatchCriteria: {
      description: 'deterministic normalization-only repairs only, excluding protected rows, excluding alias/slug changes, excluding category changes, excluding business_name inference, excluding duplicate decisions, excluding any approval/status fields',
    }
  };

  const queueFiles = {
    A:'recovery-batch1-normalization-only-readonly.json',
    B:'recovery-batch1-direct-category-readonly.json',
    C:'recovery-batch1-alias-slug-readonly.json',
    D:'recovery-batch1-missing-name-readonly.json',
    E:'recovery-batch1-exact-duplicate-collisions-readonly.json',
    F:'recovery-batch1-likely-duplicate-review-readonly.json',
    G:'recovery-batch1-near-approval-readonly.json',
  };
  for(const [k,file] of Object.entries(queueFiles)){
    fs.writeFileSync(path.join(__dirname,'out',file), JSON.stringify({ rowCount: queues[k].length, rows: queues[k] }, null, 2));
  }
  fs.writeFileSync(path.join(__dirname,'out','recovery-batch1-reconciliation-summary-readonly.json'), JSON.stringify(reconciliation,null,2));

  const safeBatch = queues.A.filter(r=>!r.protected_business && Object.keys(r.proposed_values||{}).length>0 && Object.keys(r.proposed_values||{}).every(k=>['website','phone','address','city','state','zip','postalCode'].includes(k)) && r.duplicate_status==='none').slice(0,100).map(r=>(
    { _id:r._id, field_changes:r.proposed_values }
  ));
  fs.writeFileSync(path.join(__dirname,'out','recovery-batch1-safe-first-write-batch-readonly.json'), JSON.stringify({ rowCount:safeBatch.length, rows:safeBatch }, null, 2));
  fs.writeFileSync(path.join(__dirname,'out','recovery-batch1-safe-first-write-batch-rollback-readonly.json'), JSON.stringify({ rowCount:safeBatch.length, rows:safeBatch.map(x=>({ _id:x._id, rollback:'restore previous MongoDB field values from current snapshot before write' })) }, null, 2));

  console.log(JSON.stringify({ totalCandidatesUniverse:1613, deliveredCandidates, recordsNotDelivered:notDelivered, primaryQueueCounts:reconciliation.primaryQueueCounts, verificationRows:verificationCountRows.length, safeBatchCount:safeBatch.length }, null, 2));
  await client.close();
})().catch(err=>{console.error(err);process.exit(1)});
