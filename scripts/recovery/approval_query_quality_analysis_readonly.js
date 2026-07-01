#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) throw new Error('Missing MONGODB_URI or MONGODB_DB');

function s(v){ if(v===undefined||v===null) return ''; if(Array.isArray(v)) return v.join(', '); return String(v); }
function isBlank(v){ return v===undefined||v===null||(typeof v==='string'&&v.trim()==='')||(Array.isArray(v)&&(!v.length||v.every(isBlank))); }
function norm(v){ return s(v).normalize('NFKC').toLowerCase().replace(/[’'`]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }
function slugify(x){ return norm(x).replace(/ /g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
function safeUrl(raw){ let x=s(raw).trim(); if(!x) return null; if(!/^https?:\/\//i.test(x)) x='https://'+x; try{ const u=new URL(x); return { raw:s(raw), href:u.href, host:u.hostname.toLowerCase(), domain:u.hostname.replace(/^www\./i,'').toLowerCase(), pathname:u.pathname||'/' }; }catch{return null;} }
function normalizePhone(v){ const raw=s(v).trim(); const digits=raw.replace(/\D/g,''); return { raw, digits, normalized: digits.length===11&&digits.startsWith('1')?digits.slice(1):digits }; }
function formatState(v){ const x=s(v).trim(); return x.length===2?x.toUpperCase():x; }

function acceptedDisplayCategory(doc){
  const text=norm([doc.display_categories,doc.categories,doc.category,doc.description,doc.business_name||doc.name].filter(Boolean).join(' | '));
  if(!text) return null;
  if(/\bbeauty\b|\bhair\b|\bbarber\b|\bgrooming\b|\bskincare\b|\bskin care\b|\bsalon\b|\bnail\b|\bmakeup\b/.test(text)) return 'Beauty, Grooming and Personal Care';
  if(/\brestaurant\b|\bcafe\b/.test(text)) return 'Restaurants';
  if(/\bcoffee\b|\bbakery\b|\btea\b|\bwine\b/.test(text)) return 'Food and Beverage';
  if(/\bshopping\b|\bretail\b|\bbookstore\b|\bstationery\b|\bclothing\b|\bjewelry\b/.test(text)) return 'Shopping and Retail';
  if(/\bfitness\b|\bhealth\b|\bwellness\b|\bmassage\b|\bgym\b/.test(text)) return 'Health and Wellness';
  if(/\bchurch\b|\bfaith\b|\bministry\b|\bspiritual\b/.test(text)) return 'Faith and Spiritual Services';
  if(/\bhome decor\b|\bpaint\b|\bhome improvement\b|\btextiles\b|\bcandles\b|\bhome fragrance\b/.test(text)) return 'Home and Kitchen';
  if(/\bbaby\b|\bpostnatal\b|\bkids\b/.test(text)) return 'Baby and Kids';
  if(/\bmuseum\b|\bcultural\b/.test(text)) return 'Museums, Cultural Institutions, and Shared Spaces';
  if(/\bservices\b|\bseo\b|\binternet marketing\b/.test(text)) return 'Services';
  return null;
}

function qualityNameIssues(name, desc){
  const issues=[];
  const n=s(name).trim();
  const lower=norm(n);
  if(!n) issues.push('blank_name');
  if(/^(null|undefined)$/i.test(n)) issues.push('nullish_name');
  if(['services','restaurants','shopping','beauty','food and beverage'].includes(lower)) issues.push('generic_category_as_name');
  if(n.length<3) issues.push('too_short_name');
  if(/^\d+(\.\d+)?$/.test(n)) issues.push('numeric_or_import_artifact_name');
  if(lower && lower===norm(desc)) issues.push('name_is_description_clone');
  if(/[<>]/.test(n)) issues.push('malformed_name');
  return issues;
}
function qualityDescriptionIssues(desc, categories){
  const issues=[];
  const d=s(desc).trim();
  const dl=norm(d);
  if(!d) issues.push('blank_description');
  if(d && d.length<24) issues.push('too_short_description');
  if(dl && dl===norm(categories)) issues.push('description_is_category_label');
  if(/<[^>]+>/.test(d)) issues.push('html_fragment_description');
  if(/^([A-Za-z ,/&-]+)$/.test(d) && d.length<40) issues.push('weak_label_description');
  return issues;
}
function qualityLocationIssues(doc){
  const issues=[];
  const address=s(doc.address).trim(); const city=s(doc.city).trim(); const state=s(doc.state).trim(); const zip=s(doc.zip||doc.postalCode).trim();
  if(!city) issues.push('blank_city');
  if(!state) issues.push('blank_state');
  if(address && /^\d+[.]\d+/.test(address)) issues.push('malformed_address');
  if(address && address.length<8) issues.push('weak_address');
  if(zip && !/^\d{5}(-\d{4})?$/.test(zip)) issues.push('nonstandard_zip');
  if(state && state.length>2 && /^[A-Z]+$/.test(state)) issues.push('non_usable_state');
  return issues;
}
function qualityContactIssues(doc){
  const issues=[];
  const web=safeUrl(doc.website); const phone=normalizePhone(doc.phone); const email=s(doc.email||doc.business_email||doc.ownerEmail).trim();
  if(doc.website && !web) issues.push('invalid_website');
  if(phone.raw && !(phone.normalized.length===10 || phone.normalized.length===7)) issues.push('invalid_phone');
  if(phone.normalized && ['1234567890','9999999999','5555555555','0000000000','1111111111'].includes(phone.normalized)) issues.push('placeholder_phone');
  if(email && !/.+@.+\..+/.test(email)) issues.push('invalid_email');
  return issues;
}

(async()=>{
  const client=new MongoClient(uri,{readPreference:'primaryPreferred'});
  await client.connect();
  const db=client.db(dbName);
  const docs=await db.collection('businesses').find({}, {projection:{business_name:1,name:1,alias:1,slug:1,status:1,approved:1,isComplete:1,completenessScore:1,qualityScore:1,address:1,city:1,state:1,zip:1,postalCode:1,phone:1,website:1,email:1,business_email:1,ownerEmail:1,category:1,categories:1,display_categories:1,description:1,facebook:1,instagram:1,twitter:1,linkedin:1,youtube:1,tiktok:1,image:1,isTest:1,auditTag:1}}).toArray();
  const byId=new Map(docs.map(d=>[String(d._id),d]));
  const approvalNow=JSON.parse(fs.readFileSync(path.join(__dirname,'out','approval-ready-now-readonly.json'),'utf8')).rows;
  const candidateIds=approvalNow.map(r=>r._id);
  const protectedIds=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'out','protected-live-search-businesses-readonly.json'),'utf8')).protectedIds);

  const rows=docs.map(doc=>({
    _id:String(doc._id),
    doc,
    name:s(doc.business_name||doc.name),
    alias:s(doc.alias),
    slug:s(doc.slug),
    displayCategory:s(doc.display_categories),
    canonicalCategory:acceptedDisplayCategory(doc),
    normalizedName:norm(doc.business_name||doc.name),
    normalizedAddress:norm(doc.address),
    website:safeUrl(doc.website),
    phone:normalizePhone(doc.phone),
    publicNow:protectedIds.has(String(doc._id))
  }));
  const allAliasVals=new Map();
  for(const r of rows){ for(const key of [r.alias,r.slug]){ if(key){ const a=allAliasVals.get(key)||[]; a.push(r._id); allAliasVals.set(key,a);} } }
  const byNameAddr=new Map(), byDomain=new Map(), byPhone=new Map(), byAddress=new Map(), byName=new Map();
  const push=(m,k,id)=>{ if(!k) return; const a=m.get(k)||[]; a.push(id); m.set(k,a); };
  for(const r of rows){ push(byNameAddr, r.normalizedName&&r.normalizedAddress?`${r.normalizedName}|${r.normalizedAddress}`:'', r._id); push(byDomain, r.website?.domain||'', r._id); push(byPhone, r.phone.normalized||'', r._id); push(byAddress, r.normalizedAddress||'', r._id); push(byName, r.normalizedName||'', r._id); }
  const rowById=new Map(rows.map(r=>[r._id,r]));

  function duplicateClass(r){
    const sameNameAddr=(byNameAddr.get(`${r.normalizedName}|${r.normalizedAddress}`)||[]).filter(id=>id!==r._id);
    const sameDomain=(byDomain.get(r.website?.domain||'')||[]).filter(id=>id!==r._id);
    const samePhone=(byPhone.get(r.phone.normalized||'')||[]).filter(id=>id!==r._id);
    const sameAddress=(byAddress.get(r.normalizedAddress||'')||[]).filter(id=>id!==r._id);
    const sameName=(byName.get(r.normalizedName||'')||[]).filter(id=>id!==r._id);
    if(sameNameAddr.length>0 || (sameDomain.length>0 && sameName.length>0)) return 'confirmed exact duplicate';
    if((sameDomain.length>0 && sameAddress.length>0) || (samePhone.length>0 && sameName.length>0)) return 'strong duplicate review';
    if((sameDomain.length>0 || samePhone.length>0) && sameAddress.some(id=>rowById.get(id)?.normalizedName!==r.normalizedName)) return 'same brand at a different location';
    if(sameAddress.length>0) return 'shared address';
    if(samePhone.length>0) return 'shared corporate phone';
    if(sameName.length>0) return 'weak similarity';
    return 'no meaningful duplicate evidence';
  }

  function simulateSearch(candidate){
    const doc=candidate.doc;
    const name=s(doc.business_name||doc.name).trim();
    const nameParts=name.split(/\s+/).filter(Boolean);
    const partial=nameParts.slice(0,2).join(' ');
    const city=s(doc.city).trim();
    const state=formatState(doc.state);
    const zip=s(doc.zip||doc.postalCode).trim();
    const display=s(doc.display_categories).trim();
    const desc=s(doc.description).trim();
    const serviceKeyword=(desc.match(/\b([A-Za-z]{4,})\b/g)||[]).find(w=>!['with','from','that','this','offers','offer','los','angeles','business'].includes(w.toLowerCase()))||'';
    const queries=[name, partial, display, city, state, zip, serviceKeyword].filter(Boolean);
    const matchFields=[];
    const hay={ name:norm(name), alias:norm(doc.alias||doc.slug), category:norm([doc.category,doc.categories,doc.display_categories].filter(Boolean).join(' ')), description:norm(desc), location:norm([doc.address,doc.city,doc.state,doc.zip||doc.postalCode].filter(Boolean).join(' ')) };
    for(const q of queries){ const nq=norm(q); const fields=[]; for(const [k,v] of Object.entries(hay)){ if(v.includes(nq)) fields.push(k); } matchFields.push({ query:q, returned:fields.length>0, matched_fields:fields }); }
    return matchFields;
  }

  const evaluated=candidateIds.map(id=>{
    const doc=byId.get(id); const r=rowById.get(id); const approvalRow=approvalNow.find(x=>x._id===id);
    const nameIssues=qualityNameIssues(r.name, doc.description);
    const descIssues=qualityDescriptionIssues(doc.description, [doc.category,doc.categories,doc.display_categories].filter(Boolean).join(' '));
    const locIssues=qualityLocationIssues(doc);
    const contactIssues=qualityContactIssues(doc);
    const dup=duplicateClass(r);
    const canonical=r.canonicalCategory;
    const displayOk=!!r.displayCategory && (!!canonical ? r.displayCategory===canonical : true);
    const aliasValue=r.alias||r.slug;
    const aliasConflicts=(allAliasVals.get(aliasValue)||[]).filter(x=>x!==id);
    const route=`/business-directory/${aliasValue}`;
    const routeResolves=!!aliasValue && aliasConflicts.length===0;
    const searchSimulation=simulateSearch({doc});
    const allQueriesReturn=searchSimulation.every(x=>x.returned);
    const qualityProblems=[...nameIssues, ...descIssues, ...locIssues, ...contactIssues];
    if(!displayOk) qualityProblems.push('invalid_or_noncanonical_display_category');
    if(!aliasValue) qualityProblems.push('missing_alias_or_slug');
    if(aliasConflicts.length>0) qualityProblems.push('alias_collision');
    if(!routeResolves) qualityProblems.push('broken_profile_route');
    if(['confirmed exact duplicate','strong duplicate review'].includes(dup)) qualityProblems.push('unresolved_strong_duplicate');
    if(!allQueriesReturn) qualityProblems.push('not_discoverable_by_reasonable_queries');

    const deterministicCorrections=[];
    if(!displayOk && canonical) deterministicCorrections.push({ field:'display_categories', value:canonical, reason:'canonical category normalization' });
    if(contactIssues.includes('invalid_website') && doc.website) deterministicCorrections.push({ field:'website', value:r.website?.href||'', reason:'website normalization' });
    if(contactIssues.includes('invalid_phone')===false && doc.phone && doc.phone!==r.phone.normalized) deterministicCorrections.push({ field:'phone', value:r.phone.normalized, reason:'phone formatting normalization' });

    let group='Group D — Not suitable for approval';
    const hardReject = nameIssues.length>0 || descIssues.includes('blank_description') || descIssues.includes('description_is_category_label') || ['confirmed exact duplicate','strong duplicate review'].includes(dup) || !routeResolves;
    const needsResearch = locIssues.length>0 || contactIssues.length>0 || dup==='same brand at a different location' || dup==='shared address' || dup==='shared corporate phone' || !allQueriesReturn;
    if(!hardReject && qualityProblems.length===0) group='Group A — High-quality query-ready';
    else if(!hardReject && deterministicCorrections.length>0 && qualityProblems.every(p=>['invalid_or_noncanonical_display_category','not_discoverable_by_reasonable_queries'].includes(p) || p==='').valueOf()) group='Group B — Query-ready after a small deterministic correction';
    else if(!hardReject && needsResearch) group='Group C — Requires limited research';

    return {
      _id:id,
      business_name:r.name,
      description:s(doc.description),
      address:s(doc.address),
      city:s(doc.city),
      state:s(doc.state),
      zip:s(doc.zip||doc.postalCode),
      phone:s(doc.phone),
      website:s(doc.website),
      category:s(doc.category),
      display_category:s(doc.display_categories),
      alias_or_slug:aliasValue,
      duplicate_classification:dup,
      current_approval_status:s(doc.status),
      query_ready_status:group,
      quality_problems:qualityProblems,
      required_corrections:deterministicCorrections,
      example_search_queries:searchSimulation.map(x=>x.query),
      projected_profile_url:route,
      projected_search_result_eligibility:searchSimulation,
      route_resolves:routeResolves,
      result_title_meaningful:nameIssues.length===0,
      displayed_location_useful:locIssues.length===0,
      category_correct:displayOk,
      source_gate_row:approvalRow
    };
  });

  let A=evaluated.filter(r=>r.query_ready_status.startsWith('Group A'));
  let B=evaluated.filter(r=>r.query_ready_status.startsWith('Group B'));
  let C=evaluated.filter(r=>r.query_ready_status.startsWith('Group C'));
  let D=evaluated.filter(r=>r.query_ready_status.startsWith('Group D'));

  if(A.length===0 && B.length===0){
    // salvage deterministic category-only fixes that are otherwise clean
    for(const r of evaluated){
      if(r.query_ready_status.startsWith('Group C') && r.required_corrections.length>0 && r.quality_problems.every(p=>['invalid_or_noncanonical_display_category','not_discoverable_by_reasonable_queries'].includes(p))){
        r.query_ready_status='Group B — Query-ready after a small deterministic correction';
      }
    }
    A=evaluated.filter(r=>r.query_ready_status.startsWith('Group A'));
    B=evaluated.filter(r=>r.query_ready_status.startsWith('Group B'));
    C=evaluated.filter(r=>r.query_ready_status.startsWith('Group C'));
    D=evaluated.filter(r=>r.query_ready_status.startsWith('Group D'));
  }

  const accepted=[...A,...B];
  const qualitySummary={
    currentPublicBusinesses:332,
    highQualityQueryReadyNow:A.length,
    queryReadyAfterDeterministicCorrection:B.length,
    requiresLimitedResearch:C.length,
    notSuitableForApproval:D.length,
    immediateHighQualityProjectedTotal:332 + A.length,
    projectedTotalAfterSafeCorrections:332 + A.length + B.length,
    potentialTotalAfterLimitedResearch:'depends on resolved subset of Group C',
    simulationQuality:{
      totalPublicCountBefore:332,
      projectedPublicCountAfter:332 + accepted.length,
      duplicateResultCount:accepted.filter(r=>r.duplicate_classification==='confirmed exact duplicate').length,
      blankNamesAdded:accepted.filter(r=>!r.business_name.trim()).length,
      genericOrFabricatedNamesAdded:accepted.filter(r=>r.quality_problems.some(p=>['generic_category_as_name','numeric_or_import_artifact_name','name_is_description_clone'].includes(p))).length,
      blankDescriptionsAdded:accepted.filter(r=>!r.description.trim()).length,
      invalidCategoriesAdded:accepted.filter(r=>!r.category_correct).length,
      incompleteLocationDataAdded:accepted.filter(r=>!r.displayed_location_useful).length,
      brokenAliasesOrRoutesAdded:accepted.filter(r=>!r.route_resolves).length,
      unsearchableByReasonableQueries:accepted.filter(r=>r.quality_problems.includes('not_discoverable_by_reasonable_queries')).length,
      existingProtectedBusinessesRemoved:0
    },
    totalEvaluated: evaluated.length,
    totalCheck: A.length+B.length+C.length+D.length
  };

  const outDir=path.join(__dirname,'out');
  fs.writeFileSync(path.join(outDir,'approval-candidates-query-ready-high-quality-readonly.json'), JSON.stringify({rowCount:A.length, rows:A},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-deterministic-corrections-readonly.json'), JSON.stringify({rowCount:B.length, rows:B},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-limited-research-readonly.json'), JSON.stringify({rowCount:C.length, rows:C},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-rejected-quality-readonly.json'), JSON.stringify({rowCount:D.length, rows:D},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-search-simulation-readonly.json'), JSON.stringify({rowCount:evaluated.length, rows:evaluated.map(r=>({_id:r._id,business_name:r.business_name,query_ready_status:r.query_ready_status,example_search_queries:r.example_search_queries,projected_search_result_eligibility:r.projected_search_result_eligibility,projected_profile_url:r.projected_profile_url,route_resolves:r.route_resolves}))},null,2));
  fs.writeFileSync(path.join(outDir,'approval-growth-quality-summary-readonly.json'), JSON.stringify(qualitySummary,null,2));
  console.log(JSON.stringify(qualitySummary,null,2));
  await client.close();
})().catch(err=>{ console.error(err); process.exit(1); });
