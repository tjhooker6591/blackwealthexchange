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
function normalizePhone(v){ const d=s(v).replace(/\D/g,''); return d.length===11&&d.startsWith('1')?d.slice(1):d; }
function urlMeta(raw){ let x=s(raw).trim(); if(!x) return null; if(!/^https?:\/\//i.test(x)) x='https://'+x; try{ const u=new URL(x); const pathname=(u.pathname||'/')==='/'?'/':(u.pathname||'/').replace(/\/+$/,'')||'/'; return { raw:s(raw), domain:u.hostname.replace(/^www\./i,'').toLowerCase(), host:u.hostname.toLowerCase(), pathname, search:u.search, normalized:`${u.protocol.toLowerCase()}//${u.hostname.toLowerCase()}${pathname==='/'?'':pathname}${u.search}`}; }catch{return null;} }
function slugify(x){ return norm(x).replace(/ /g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
function officialProfile(doc){ const vals=[doc.instagram,doc.facebook,doc.linkedin,doc.twitter,doc.tiktok,doc.youtube].map(s).map(v=>v.trim().toLowerCase()).filter(Boolean); return vals.sort().join('|'); }
function emailDomain(v){ const x=s(v).trim().toLowerCase(); const i=x.lastIndexOf('@'); return i>-1?x.slice(i+1):''; }
function isGenericDomain(d){ return ['facebook.com','instagram.com','twitter.com','x.com','linkedin.com','yelp.com','etsy.com','linktr.ee','square.site','wixsite.com','google.com','business.site'].includes(d||''); }

function protectedState(doc){
  const status = doc.status;
  const statusAllowed = status === 'approved' || status === 'verified' || status === 'active' || status === undefined || status === null || status === '';
  const excluded = doc.isTest === true || doc.auditTag !== undefined || /^BWE_LOCAL_AUDIT/i.test(s(doc.auditTag)) || /^auditpagination$/i.test(s(doc.category)) || /^auditpagination$/i.test(s(doc.categories)) || /^auditpagination$/i.test(s(doc.display_categories)) || /@local\.test$/i.test(s(doc.email)) || /^auditpagination_/i.test(s(doc.business_name)) || /^auditpagination_/i.test(s(doc.name));
  const hasAliasOrSlug = (typeof doc.alias === 'string' && doc.alias !== '') || (typeof doc.slug === 'string' && doc.slug !== '');
  const completenessAllowed = doc.isComplete === true || Number(doc.completenessScore || 0) >= 70 || Number(doc.qualityScore || 0) >= 70;
  return statusAllowed && !excluded && hasAliasOrSlug && completenessAllowed;
}

function categoryProposal(doc){
  const text=norm([doc.display_categories,doc.categories,doc.category,doc.description,doc.business_name||doc.name].filter(Boolean).join(' | '));
  if(!text) return null;
  if(/\bbeauty\b|\bhair\b|\bbarber\b|\bgrooming\b|\bskincare\b|\bskin care\b|\bsalon\b|\bnail\b|\bmakeup\b/.test(text)) return 'Beauty, Grooming and Personal Care';
  if(/\brestaurant\b|\bcafe\b/.test(text)) return 'Restaurants';
  if(/\bcoffee\b|\bbakery\b|\btea\b|\bwine\b/.test(text)) return 'Food and Beverage';
  if(/\bshopping\b|\bretail\b|\bbookstore\b|\bstationery\b/.test(text)) return 'Shopping and Retail';
  if(/\bfitness\b|\bhealth\b|\bwellness\b|\bmassage\b/.test(text)) return 'Health and Wellness';
  if(/\bchurch\b|\bfaith\b|\bministry\b|\bspiritual\b/.test(text)) return 'Faith and Spiritual Services';
  if(/\bhome decor\b|\bpaint\b|\bhome improvement\b|\btextiles\b|\bcandles\b|\bhome fragrance\b/.test(text)) return 'Home and Kitchen';
  if(/\bbaby\b|\bpostnatal\b|\bkids\b/.test(text)) return 'Baby and Kids';
  if(/\bmuseum\b|\bcultural\b/.test(text)) return 'Museums, Cultural Institutions, and Shared Spaces';
  if(/\bservices\b|\bseo\b|\binternet marketing\b/.test(text)) return 'Services';
  return null;
}

function computeEligibility(doc){
  const businessName=s(doc.business_name||doc.name).trim();
  const alias=s(doc.alias).trim();
  const slug=s(doc.slug).trim();
  const address=s(doc.address).trim();
  const city=s(doc.city).trim();
  const state=s(doc.state).trim();
  const display=s(doc.display_categories).trim();
  const category=s(doc.category).trim();
  const categories=s(doc.categories).trim();
  const description=s(doc.description).trim();
  const website=s(doc.website).trim();
  const phone=s(doc.phone).trim();
  const status=s(doc.status).trim();
  const hasAliasOrSlug=!!(alias||slug);
  const completenessAllowed = doc.isComplete === true || Number(doc.completenessScore||0) >= 70 || Number(doc.qualityScore||0) >= 70;
  const auditExcluded = doc.isTest === true || doc.auditTag !== undefined || /^BWE_LOCAL_AUDIT/i.test(s(doc.auditTag)) || /^auditpagination$/i.test(category) || /^auditpagination$/i.test(categories) || /^auditpagination$/i.test(display) || /@local\.test$/i.test(s(doc.email)) || /^auditpagination_/i.test(businessName);
  const statusAllowed = status === 'approved' || status === 'verified' || status === 'active' || status === '';
  const publicNow = protectedState(doc);
  const blockers=[];
  if(auditExcluded) blockers.push('audit_or_test_excluded');
  if(!statusAllowed) blockers.push('status_not_public');
  if(!businessName) blockers.push('missing_business_name');
  if(!address && !(city&&state)) blockers.push('missing_location');
  if(!state) blockers.push('missing_state');
  if(!display) blockers.push('missing_display_category');
  if(!description) blockers.push('missing_description');
  if(!hasAliasOrSlug) blockers.push('missing_alias_or_slug');
  if(!completenessAllowed) blockers.push('incomplete_listing_gate');
  if(!website && !phone) blockers.push('missing_contact_or_website');
  return { publicNow, blockers, hasAliasOrSlug, completenessAllowed, statusAllowed, auditExcluded };
}

(async()=>{
  const client=new MongoClient(uri,{readPreference:'primaryPreferred'});
  await client.connect();
  const db=client.db(dbName);
  const docs=await db.collection('businesses').find({}, {projection:{business_name:1,name:1,alias:1,slug:1,status:1,approved:1,isComplete:1,completenessScore:1,qualityScore:1,address:1,city:1,state:1,zip:1,postalCode:1,phone:1,website:1,email:1,business_email:1,ownerEmail:1,category:1,categories:1,display_categories:1,description:1,facebook:1,instagram:1,twitter:1,linkedin:1,youtube:1,tiktok:1,image:1,isTest:1,auditTag:1,createdAt:1,updatedAt:1}}).toArray();

  const protectedIds = new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'out','protected-live-search-businesses-readonly.json'),'utf8')).protectedIds);
  const nearApproval = JSON.parse(fs.readFileSync(path.join(__dirname,'out','recovery-batch1-near-approval-readonly.json'),'utf8')).rows;
  const category75 = JSON.parse(fs.readFileSync(path.join(__dirname,'out','recovery-batch1-direct-category-readonly.json'),'utf8')).rows;
  const alias31 = JSON.parse(fs.readFileSync(path.join(__dirname,'out','recovery-batch1-alias-slug-readonly.json'),'utf8')).rows;

  const rows=docs.map(doc=>{
    const _id=String(doc._id);
    const e=computeEligibility(doc);
    return {
      _id,
      doc,
      publicNow: protectedIds.has(_id) || e.publicNow,
      blockers:e.blockers,
      business_name:s(doc.business_name||doc.name),
      normalizedName:norm(doc.business_name||doc.name),
      normalizedAddress:norm(doc.address),
      city:norm(doc.city),
      state:norm(doc.state),
      phone:normalizePhone(doc.phone),
      website:urlMeta(doc.website),
      official:officialProfile(doc),
      categoryProposal: categoryProposal(doc),
      aliasProposal: (!s(doc.alias).trim() && !s(doc.slug).trim() && s(doc.business_name||doc.name).trim()) ? slugify(doc.business_name||doc.name) : null,
      emailDomain: emailDomain(doc.business_email||doc.email||doc.ownerEmail),
      completeness: { isComplete:doc.isComplete??null, completenessScore:doc.completenessScore??null, qualityScore:doc.qualityScore??null },
      status:s(doc.status)
    };
  });

  const byPhone=new Map(), byDomain=new Map(), byNameAddr=new Map(), byOfficial=new Map(), byAddress=new Map(), byName=new Map();
  const push=(m,k,id)=>{ if(!k) return; const a=m.get(k)||[]; a.push(id); m.set(k,a); };
  for(const r of rows){
    if(r.phone && !/^0+$/.test(r.phone) && !/^1+$/.test(r.phone) && !['1234567890','9999999999','5555555555'].includes(r.phone)) push(byPhone,r.phone,r._id);
    if(r.website?.domain) push(byDomain,r.website.domain,r._id);
    if(r.normalizedName && r.normalizedAddress) push(byNameAddr,`${r.normalizedName}|${r.normalizedAddress}`,r._id);
    if(r.official) push(byOfficial,r.official,r._id);
    if(r.normalizedAddress) push(byAddress,r.normalizedAddress,r._id);
    if(r.normalizedName) push(byName,r.normalizedName,r._id);
  }
  const byId=new Map(rows.map(r=>[r._id,r]));

  function duplicateClass(r){
    const phone=(byPhone.get(r.phone)||[]).filter(id=>id!==r._id).map(id=>byId.get(id));
    const domain=(byDomain.get(r.website?.domain)||[]).filter(id=>id!==r._id).map(id=>byId.get(id));
    const nameAddr=(byNameAddr.get(`${r.normalizedName}|${r.normalizedAddress}`)||[]).filter(id=>id!==r._id).map(id=>byId.get(id));
    const official=(byOfficial.get(r.official)||[]).filter(id=>id!==r._id).map(id=>byId.get(id));
    const address=(byAddress.get(r.normalizedAddress)||[]).filter(id=>id!==r._id).map(id=>byId.get(id));
    const name=(byName.get(r.normalizedName)||[]).filter(id=>id!==r._id).map(id=>byId.get(id));
    if(nameAddr.length>0 || official.some(x=>x.normalizedName===r.normalizedName) || domain.some(x=>x.normalizedName===r.normalizedName && r.normalizedName) || phone.some(x=>x.normalizedName===r.normalizedName && r.normalizedName && x.city===r.city && r.city)) return 'confirmed exact duplicate only';
    if(domain.length>0 || phone.some(x=>x.city===r.city && x.city) || [...phone,...domain,...official].some(x=>x.publicNow!==r.publicNow)) return 'strong duplicate review';
    if((domain.length>0 || phone.length>0 || name.length>0) && ((address.length>0 && address.some(x=>x.normalizedName!==r.normalizedName)) || name.some(x=>x.normalizedAddress!==r.normalizedAddress))) return 'same brand/different location';
    if(address.length>0 || phone.length>0) return 'shared address or shared contact';
    if(name.length>0) return 'weak machine relationship';
    return 'no meaningful duplicate evidence';
  }

  const nonPublic=rows.filter(r=>!r.publicNow);
  const analyzed=nonPublic.map(r=>{
    const dup=duplicateClass(r);
    const proposedRepairs=[];
    const blockers=[...r.blockers];

    if(blockers.includes('missing_display_category') && r.categoryProposal){
      proposedRepairs.push({ field:'display_categories', value:r.categoryProposal, evidence:'derived from existing MongoDB category/categories/description/name' });
    }
    if(blockers.includes('missing_alias_or_slug') && r.aliasProposal){
      const conflict = rows.some(o=>o._id!==r._id && (s(o.doc.alias).trim()===r.aliasProposal || s(o.doc.slug).trim()===r.aliasProposal));
      proposedRepairs.push({ field:'alias', value:r.aliasProposal, evidence:'derived from existing MongoDB business_name/name', unique:!conflict });
    }
    if(blockers.includes('missing_business_name')){
      const wd=r.website?.domain; const ed=r.emailDomain;
      if(wd && !isGenericDomain(wd)) proposedRepairs.push({ field:'business_name', value:wd.split('.')[0].replace(/[-_]+/g,' '), evidence:'recoverable from official website domain' });
      else if(ed && !isGenericDomain(ed)) proposedRepairs.push({ field:'business_name', value:ed.split('.')[0].replace(/[-_]+/g,' '), evidence:'recoverable from email domain' });
    }
    if(blockers.includes('incomplete_listing_gate')){
      const presentCount=[r.business_name,s(r.doc.description),s(r.doc.website),s(r.doc.phone),s(r.doc.address),s(r.doc.city),s(r.doc.state),s(r.doc.alias||r.doc.slug),s(r.doc.display_categories||r.doc.category||r.doc.categories)].filter(v=>!isBlank(v)).length;
      if(presentCount>=7) proposedRepairs.push({ field:'isComplete/completenessScore', value:'derived pass', evidence:'existing required fields already present in MongoDB' });
    }
    if(blockers.includes('status_not_public') && ['pending','draft','inactive'].includes(r.status)) proposedRepairs.push({ field:'status', value:'approved_or_active_requires_human_decision', evidence:'status gate only, but not automatic' });

    let bucket='insufficient information';
    const deterministic=proposedRepairs.filter(p=>!String(p.value).includes('requires_human')).filter(p=>p.unique!==false);
    const hardDup = dup==='confirmed exact duplicate only' || dup==='strong duplicate review';
    const invalid = r.blockers.includes('audit_or_test_excluded');
    const enoughIdentity = !!r.business_name && (!!s(r.doc.address).trim() || (!!s(r.doc.city).trim() && !!s(r.doc.state).trim())) && (!!s(r.doc.website).trim() || !!s(r.doc.phone).trim());
    const statusOnly = r.blockers.every(b=>['status_not_public','incomplete_listing_gate'].includes(b));

    if(invalid) bucket='invalid, closed, or unusable';
    else if(hardDup) bucket='duplicate review required';
    else if(r.blockers.length===0 || (statusOnly && enoughIdentity)) bucket='approval-ready now';
    else if(deterministic.length===1 && r.blockers.every(b=>['missing_display_category','missing_alias_or_slug','missing_business_name','incomplete_listing_gate'].includes(b) || (b==='missing_contact_or_website' && false))) bucket='one MongoDB-supported repair away';
    else if(deterministic.length>=2 && r.blockers.every(b=>['missing_display_category','missing_alias_or_slug','missing_business_name','incomplete_listing_gate'].includes(b))) bucket='two or more deterministic repairs away';
    else if(enoughIdentity && (s(r.doc.website).trim() || s(r.doc.phone).trim() || s(r.doc.address).trim() || r.emailDomain)) bucket='limited external research required';
    else bucket='insufficient information';

    const beforeReady = bucket==='approval-ready now';
    const afterDeterministic = bucket==='approval-ready now' || bucket==='one MongoDB-supported repair away' || bucket==='two or more deterministic repairs away';
    const publicEligibilityAfter = afterDeterministic && dup!=='confirmed exact duplicate only' && dup!=='strong duplicate review';

    return {
      _id:r._id,
      business_name:r.business_name,
      current_completeness:r.completeness,
      current_blockers:r.blockers,
      proposed_repairs:proposedRepairs,
      duplicate_classification:dup,
      approval_readiness_before_repair: beforeReady,
      approval_readiness_after_repair: afterDeterministic,
      projected_public_search_eligibility: publicEligibilityAfter,
      external_research_used:false,
      source_urls:[],
      bucket,
      doc_snapshot:{ status:r.status, alias:r.doc.alias||'', slug:r.doc.slug||'', address:r.doc.address||'', city:r.doc.city||'', state:r.doc.state||'', website:r.doc.website||'', phone:r.doc.phone||'', display_categories:r.doc.display_categories||'', category:r.doc.category||'', categories:r.doc.categories||'', description:r.doc.description||'' }
    };
  });

  const groups={
    'approval-ready now': analyzed.filter(r=>r.bucket==='approval-ready now'),
    'one MongoDB-supported repair away': analyzed.filter(r=>r.bucket==='one MongoDB-supported repair away'),
    'two or more deterministic repairs away': analyzed.filter(r=>r.bucket==='two or more deterministic repairs away'),
    'limited external research required': analyzed.filter(r=>r.bucket==='limited external research required'),
    'duplicate review required': analyzed.filter(r=>r.bucket==='duplicate review required'),
    'invalid, closed, or unusable': analyzed.filter(r=>r.bucket==='invalid, closed, or unusable'),
    'insufficient information': analyzed.filter(r=>r.bucket==='insufficient information'),
  };

  const summary={
    totalMongoBusinesses: rows.length,
    currentProtectedPublicBusinesses: 332,
    formattingOperationsProposed: 1744,
    recordsAffectedByFormatting: 1476,
    businessesProvenApprovalReadyAfterFormattingOperations: 332,
    projectedPublicCountAfterFormattingOnlyWork: 332,
    nonPublicRecords: analyzed.length,
    groups:{
      approvalReadyNow: groups['approval-ready now'].length,
      oneMongoRepairAway: groups['one MongoDB-supported repair away'].length,
      twoOrMoreDeterministicRepairsAway: groups['two or more deterministic repairs away'].length,
      limitedExternalResearchRequired: groups['limited external research required'].length,
      duplicateReviewRequired: groups['duplicate review required'].length,
      invalidClosedOrUnusable: groups['invalid, closed, or unusable'].length,
      insufficientInformation: groups['insufficient information'].length,
    },
    projectedIncrease:{
      currentPublicBusinesses:332,
      approvalReadyNow:`+${groups['approval-ready now'].length}`,
      approvalReadyAfterOneDeterministicRepair:`+${groups['one MongoDB-supported repair away'].length}`,
      approvalReadyAfterMultipleDeterministicRepairs:`+${groups['two or more deterministic repairs away'].length}`,
      potentiallyReadyAfterLimitedResearch:`+${groups['limited external research required'].length}`,
      blockedByStrongDuplicateEvidence: groups['duplicate review required'].length,
      invalidClosedUnusable: groups['invalid, closed, or unusable'].length,
      insufficientInformation: groups['insufficient information'].length,
      conservativeProjectedPublicTotal: 332 + groups['approval-ready now'].length,
      projectedTotalAfterDeterministicRepairs: 332 + groups['approval-ready now'].length + groups['one MongoDB-supported repair away'].length + groups['two or more deterministic repairs away'].length,
      potentialTotalAfterLimitedResearch: 332 + groups['approval-ready now'].length + groups['one MongoDB-supported repair away'].length + groups['two or more deterministic repairs away'].length + groups['limited external research required'].length,
    },
    exactGroupTotalCheck: Object.values(groups).reduce((a,v)=>a+v.length,0)
  };

  const outDir=path.join(__dirname,'out');
  fs.writeFileSync(path.join(outDir,'approval-conversion-summary-readonly.json'), JSON.stringify(summary,null,2));
  fs.writeFileSync(path.join(outDir,'approval-ready-now-readonly.json'), JSON.stringify({rowCount:groups['approval-ready now'].length, rows:groups['approval-ready now']},null,2));
  fs.writeFileSync(path.join(outDir,'approval-ready-after-deterministic-repair-readonly.json'), JSON.stringify({rowCount:groups['one MongoDB-supported repair away'].length + groups['two or more deterministic repairs away'].length, oneRepair:groups['one MongoDB-supported repair away'], multiRepair:groups['two or more deterministic repairs away']},null,2));
  fs.writeFileSync(path.join(outDir,'approval-ready-after-limited-research-readonly.json'), JSON.stringify({rowCount:groups['limited external research required'].length, rows:groups['limited external research required']},null,2));
  fs.writeFileSync(path.join(outDir,'approval-blocked-by-duplicate-review-readonly.json'), JSON.stringify({rowCount:groups['duplicate review required'].length, rows:groups['duplicate review required']},null,2));
  fs.writeFileSync(path.join(outDir,'approval-unresolved-readonly.json'), JSON.stringify({invalid:groups['invalid, closed, or unusable'], insufficient:groups['insufficient information']},null,2));

  const categoryEval = category75.map(r=>{
    const live=byId.get(r._id); const analyzedRow=analyzed.find(x=>x._id===r._id);
    const otherBlockers=(analyzedRow?.current_blockers||[]).filter(b=>b!=='missing_display_category');
    const correctionWouldReady = (analyzedRow?.bucket==='one MongoDB-supported repair away') && otherBlockers.length===0;
    return { _id:r._id, business_name:live?.business_name||'', category_only_blocker: otherBlockers.length===0, other_blockers:otherBlockers, correcting_display_categories_would_make_ready: correctionWouldReady, legitimate_separate_business: analyzedRow?.duplicate_classification!=='confirmed exact duplicate only', conflicts_with_protected_332: analyzedRow?.duplicate_classification==='strong duplicate review' };
  });
  fs.writeFileSync(path.join(outDir,'approval-category-queue-review-readonly.json'), JSON.stringify({rowCount:categoryEval.length, rows:categoryEval},null,2));

  const aliasEval = alias31.map(r=>{
    const live=byId.get(r._id); const analyzedRow=analyzed.find(x=>x._id===r._id);
    const proposedAlias=r.proposed_values?.alias||'';
    const unique = proposedAlias ? !rows.some(o=>o._id!==r._id && ((o.doc.alias||'')===proposedAlias || (o.doc.slug||'')===proposedAlias)) : false;
    const otherBlockers=(analyzedRow?.current_blockers||[]).filter(b=>b!=='missing_alias_or_slug');
    const aliasOnly=otherBlockers.length===0;
    return { _id:r._id, business_name:live?.business_name||'', alias_only_blocker:aliasOnly, proposed_alias:proposedAlias, proposed_alias_unique:unique, remaining_data_complete:otherBlockers.length===0, generating_alias_would_make_ready: aliasOnly && unique, route_generation_safe: unique && !!proposedAlias };
  });
  fs.writeFileSync(path.join(outDir,'approval-alias-queue-review-readonly.json'), JSON.stringify({rowCount:aliasEval.length, rows:aliasEval},null,2));

  console.log(JSON.stringify(summary,null,2));
  await client.close();
})().catch(err=>{ console.error(err); process.exit(1); });
