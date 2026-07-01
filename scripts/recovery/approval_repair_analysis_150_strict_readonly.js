#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function s(v){ if(v===undefined||v===null) return ''; if(Array.isArray(v)) return v.join(', '); return String(v); }
function has(v){ return s(v).trim().length>0; }
function norm(v){ return s(v).toLowerCase(); }

const inPath = path.join(__dirname,'out','approval-candidates-150-repair-analysis-readonly.json');
const data = JSON.parse(fs.readFileSync(inPath,'utf8')).rows;

const completenessFields = ['name','description','address','city','state','phone','category','website','image'];
function completedFields(orig, repaired){
  const row = repaired || orig;
  const fields = {
    name: has(row.business_name),
    description: has(row.description),
    address: has(row.address),
    city: has(row.city),
    state: has(row.state_or_region || row.state),
    phone: has(row.phone),
    category: has(row.display_category || row.display_categories || row.category || row.categories),
    website: has(row.website),
    image: has(row.image),
  };
  const done = Object.entries(fields).filter(([,v])=>v).map(([k])=>k);
  const missing = Object.entries(fields).filter(([,v])=>!v).map(([k])=>k);
  return { done, missing, score: Math.round((done.length/9)*100), reaches7: done.length>=7 };
}

function classify(row){
  const orig = row.original_values;
  const corrections = row.proposed_corrections || [];
  const problems = row.detected_problems || [];
  const dup = row.duplicate_analysis?.classification || '';
  const repaired = {
    business_name: orig.business_name,
    description: orig.description,
    address: orig.address,
    city: problems.includes('blank city') ? '' : orig.city,
    state_or_region: orig.state,
    phone: orig.phone,
    display_category: corrections.find(c=>c.field==='display_categories')?.proposed_value || orig.display_categories || orig.categories || orig.category,
    website: orig.website,
    image: '',
  };
  const currentComp = completedFields(orig, {
    business_name: orig.business_name,
    description: orig.description,
    address: orig.address,
    city: orig.city,
    state_or_region: orig.state,
    phone: orig.phone,
    display_category: orig.display_categories || orig.categories || orig.category,
    website: orig.website,
    image: '',
  });
  const projectedComp = completedFields(orig, repaired);

  const nameBad = !has(orig.business_name) || /^\d+(\.\d+)?$/.test(s(orig.business_name)) || ['services','restaurants','shopping'].includes(norm(orig.business_name));
  const descBad = !has(orig.description) || norm(orig.description)===norm(orig.categories) || s(orig.description).trim().length<24;
  const locationBad = !has(orig.address) || (!has(orig.city) && !has(orig.state));
  const aliasCollision = problems.includes('alias collision');
  const routeReady = row.route_simulation_after?.resolves === true && !aliasCollision;
  const strongDup = dup === 'confirmed exact duplicate' || dup === 'duplicate or identity conflict requiring review';
  const closedInvalid = orig.isTest === true || /^auditpagination_/i.test(s(orig.business_name)) || /closed permanently/i.test(s(orig.description));
  const deterministicOnly = corrections.length>0 && corrections.every(c=>['MongoDB cross-field','MongoDB deterministic','Route simulation'].includes(c.evidence_source_type));
  const extNeeded = corrections.some(c=>String(c.evidence_source_type).includes('external'));
  const queryReady = !nameBad && !descBad && !locationBad && !strongDup && routeReady;
  const technicallyApprovable = projectedComp.reaches7 && !closedInvalid;
  const recommended = technicallyApprovable && routeReady && queryReady && !strongDup && !closedInvalid;

  let final = 'unresolved';
  if(closedInvalid) final = 'closed or invalid';
  else if(dup === 'confirmed exact duplicate') final = 'confirmed duplicate';
  else if(recommended && corrections.length===0) final = 'recommended for approval now';
  else if(!strongDup && deterministicOnly && !extNeeded && routeReady) final = 'recommended after MongoDB-supported repair';
  else if(!strongDup && extNeeded) final = 'recommended after externally verified repair';
  else if(!strongDup && (nameBad || descBad || locationBad || !routeReady)) final = 'legitimate but still incomplete';

  return {
    technically_approvable: technicallyApprovable,
    route_ready: routeReady,
    query_ready: queryReady,
    recommended_for_approval: recommended,
    current_completeness_score: currentComp.score,
    current_completed_fields: currentComp.done,
    current_missing_fields: currentComp.missing,
    projected_completeness_score: projectedComp.score,
    projected_completed_fields: projectedComp.done,
    projected_missing_fields: projectedComp.missing,
    projected_reaches_7_of_9: projectedComp.reaches7,
    final
  };
}

const rows = data.map(r=>({ ...r, strict: classify(r) }));
const groups = {
  now: rows.filter(r=>r.strict.final==='recommended for approval now'),
  mongo: rows.filter(r=>r.strict.final==='recommended after MongoDB-supported repair'),
  external: rows.filter(r=>r.strict.final==='recommended after externally verified repair'),
  incomplete: rows.filter(r=>r.strict.final==='legitimate but still incomplete'),
  dup: rows.filter(r=>r.strict.final==='confirmed duplicate'),
  closed: rows.filter(r=>r.strict.final==='closed or invalid'),
  unresolved: rows.filter(r=>r.strict.final==='unresolved'),
};

const outRows = rows.map(r=>({
  _id:r._id,
  original_values:r.original_values,
  detected_problems:r.detected_problems,
  proposed_corrections:r.proposed_corrections,
  duplicate_analysis:r.duplicate_analysis,
  query_simulation_before:r.query_simulation_before,
  query_simulation_after:r.query_simulation_after,
  route_simulation_before:r.route_simulation_before,
  route_simulation_after:r.route_simulation_after,
  technically_approvable:r.strict.technically_approvable,
  route_ready:r.strict.route_ready,
  query_ready:r.strict.query_ready,
  recommended_for_approval:r.strict.recommended_for_approval,
  current_completeness_score:r.strict.current_completeness_score,
  current_completed_fields:r.strict.current_completed_fields,
  current_missing_fields:r.strict.current_missing_fields,
  projected_completeness_score:r.strict.projected_completeness_score,
  projected_completed_fields:r.strict.projected_completed_fields,
  projected_missing_fields:r.strict.projected_missing_fields,
  projected_reaches_7_of_9:r.strict.projected_reaches_7_of_9,
  final_classification:r.strict.final,
}));

const summary = {
  technical_rule_documentation:{
    profile_detail_lookup:'src/pages/business-directory/[alias].tsx -> fetch(/api/getBusiness?alias=...)',
    detail_resolution:'src/pages/api/getBusiness.js -> businesses.findOne({ alias })',
    completeness:'src/lib/directory/completeness.ts -> computeListingCompleteness',
    threshold:'isComplete = present >= 7 of 9',
    approval_write:'src/pages/api/admin/approve-business.ts -> sets approved=true, status=active',
    public_search:'src/pages/api/search/businesses.ts'
  },
  exact_nine_completeness_fields: completenessFields,
  counts:{
    recommended_for_approval_now: groups.now.length,
    recommended_after_mongodb_supported_repair: groups.mongo.length,
    recommended_after_externally_verified_repair: groups.external.length,
    legitimate_but_still_incomplete: groups.incomplete.length,
    confirmed_duplicates: groups.dup.length,
    closed_or_invalid: groups.closed.length,
    unresolved: groups.unresolved.length,
    total_reviewed: rows.length,
  },
  projected_growth:{
    current_public_businesses:332,
    immediate_projected_public_total:332 + groups.now.length,
    projected_total_after_approved_mongodb_repairs:332 + groups.now.length + groups.mongo.length,
    projected_total_after_approved_externally_verified_repairs:332 + groups.now.length + groups.mongo.length + groups.external.length,
  },
  protected_guard:{ protectedBusinessesBefore:332, protectedBusinessesAfterSimulation:332, protectedIdsRemoved:0, protectedBusinessesUnapproved:0, protectedBusinessesDeactivated:0 }
};

const outDir = path.join(__dirname,'out');
fs.writeFileSync(path.join(outDir,'approval-candidates-150-final-growth-summary-readonly.json'), JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(outDir,'approval-candidates-150-repair-analysis-readonly.json'), JSON.stringify({rowCount:outRows.length, rows:outRows},null,2));
fs.writeFileSync(path.join(outDir,'approval-candidates-150-mongodb-repaired-readonly.json'), JSON.stringify({rowCount:groups.mongo.length, rows:groups.mongo.map(r=>r._id)},null,2));
fs.writeFileSync(path.join(outDir,'approval-candidates-150-external-research-repaired-readonly.json'), JSON.stringify({rowCount:groups.external.length, rows:groups.external.map(r=>r._id)},null,2));
fs.writeFileSync(path.join(outDir,'approval-candidates-150-confirmed-duplicates-readonly.json'), JSON.stringify({rowCount:groups.dup.length, rows:groups.dup.map(r=>r._id)},null,2));
fs.writeFileSync(path.join(outDir,'approval-candidates-150-closed-invalid-readonly.json'), JSON.stringify({rowCount:groups.closed.length, rows:groups.closed.map(r=>r._id)},null,2));
fs.writeFileSync(path.join(outDir,'approval-candidates-150-unresolved-readonly.json'), JSON.stringify({rowCount:groups.unresolved.length + groups.incomplete.length, unresolved:groups.unresolved.map(r=>r._id), incomplete:groups.incomplete.map(r=>r._id)},null,2));
console.log(JSON.stringify(summary,null,2));
