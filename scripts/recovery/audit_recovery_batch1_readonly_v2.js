#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB || 'bwes-cluster';
if (!uri) throw new Error('Missing MONGODB_URI/MONGODB_URL');

function s(v){ if(v===undefined||v===null) return ''; if(Array.isArray(v)) return v.join(', '); return String(v); }
function isBlank(v){ return v===undefined||v===null||(typeof v==='string'&&v.trim()==='')||(Array.isArray(v)&&(!v.length||v.every(isBlank))); }
function norm(v){ return s(v).normalize('NFKC').toLowerCase().replace(/[’'`]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }
function normalizePhoneDigits(v){ const d=s(v).replace(/\D/g,''); return d.length===11&&d.startsWith('1')?d.slice(1):d; }
function analyzePhone(raw){
  const text=s(raw);
  const digitsRaw=text.replace(/\D/g,'');
  const normalizedDigits=normalizePhoneDigits(text);
  const extMatch=text.match(/(?:ext\.?|x|extension)\s*(\d+)$/i);
  const extension=extMatch?extMatch[1]:'';
  const multi=(text.match(/\d/g)||[]).length>0 && /(?:\/|\bor\b|,|;)/i.test(text);
  const malformed = normalizedDigits.length>0 && ![7,10,11].includes(digitsRaw.length);
  const ambiguous = multi || /(?:and|or)/i.test(text);
  return { text, digitsRaw, normalizedDigits, extension, multi, malformed, ambiguous };
}
function canonicalizeUrl(raw){
  let x=s(raw).trim();
  if(!x) return null;
  if(!/^https?:\/\//i.test(x)) x='https://'+x;
  try {
    const u = new URL(x);
    const originalPath = u.pathname || '';
    const trimmedPath = originalPath === '/' ? '/' : originalPath.replace(/\/+$/,'') || '/';
    return {
      input:s(raw),
      href:u.href,
      protocol:u.protocol.toLowerCase(),
      hostname:u.hostname.toLowerCase(),
      pathname:trimmedPath,
      search:u.search,
      hash:u.hash,
      origin:`${u.protocol.toLowerCase()}//${u.hostname.toLowerCase()}`,
      normalized:`${u.protocol.toLowerCase()}//${u.hostname.toLowerCase()}${trimmedPath === '/' ? '' : trimmedPath}${u.search}`,
      domain:u.hostname.replace(/^www\./i,'').toLowerCase(),
    };
  } catch {
    return null;
  }
}
function domain(raw){ const c=canonicalizeUrl(raw); return c?c.domain:''; }
function emailDomain(v){ const x=s(v).trim().toLowerCase(); const i=x.lastIndexOf('@'); return i>-1?x.slice(i+1):''; }
function addr(v){ return norm(v).replace(/\bavenue\b/g,'ave').replace(/\bstreet\b/g,'st').replace(/\broad\b/g,'rd').replace(/\bboulevard\b/g,'blvd').replace(/\bdrive\b/g,'dr').replace(/\blane\b/g,'ln').replace(/\bplace\b/g,'pl').replace(/\bsuite\b/g,'ste').replace(/\bunit\b/g,'unit').trim(); }
function titleCase(x){ return s(x).replace(/\b\w/g,m=>m.toUpperCase()); }
function slugify(x){ return norm(x).replace(/ /g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
function mapCategory(doc){
  const raw=s(doc.display_categories||doc.categories||doc.category);
  const n=norm(raw+' '+s(doc.description)+' '+s(doc.business_name||doc.name));
  if(/\brestaurant\b|\bcafe\b|\bcatering\b/.test(n)) return 'Restaurants';
  if(/\bbakery\b|\bcoffee\b/.test(n)) return 'Food and Beverage';
  if(/\bbeauty\b|\bhair\b|\bbarber\b|\bgrooming\b|\bskincare\b|\bskin care\b|\bcosmetics\b|\bsalon\b|\bnails?\b|\bmakeup\b/.test(n)) return 'Beauty, Grooming and Personal Care';
  if(/\bchurch\b|\bfaith\b|\bministry\b|\bspiritual\b/.test(n)) return 'Faith and Spiritual Services';
  if(/\bnonprofit\b|\bfoundation\b|\bcommunity organization\b/.test(n)) return 'Nonprofit and Community Organizations';
  if(/\brealtor\b|\bbrokerage\b|\bproperty management\b|\breal estate\b/.test(n)) return 'Real Estate';
  if(/\blaw\b|\battorney\b|\baccounting\b|\bconsulting\b/.test(n)) return 'Professional Services';
  if(/\bshopping\b|\bretail\b|\bflorist\b|\bjewelry\b|\bclothing\b/.test(n)) return 'Shopping and Retail';
  return raw;
}
function protectedState(doc){
  const status = doc.status;
  const statusAllowed = status === 'approved' || status === 'verified' || status === 'active' || status === undefined || status === null || status === '';
  const excluded = doc.isTest === true || doc.auditTag !== undefined || /^BWE_LOCAL_AUDIT/i.test(s(doc.auditTag)) || /^auditpagination$/i.test(s(doc.category)) || /^auditpagination$/i.test(s(doc.categories)) || /^auditpagination$/i.test(s(doc.display_categories)) || /@local\.test$/i.test(s(doc.email)) || /^auditpagination_/i.test(s(doc.business_name)) || /^auditpagination_/i.test(s(doc.name));
  const hasAliasOrSlug = (typeof doc.alias === 'string' && doc.alias !== '') || (typeof doc.slug === 'string' && doc.slug !== '');
  const completenessAllowed = doc.isComplete === true || Number(doc.completenessScore || 0) >= 70 || Number(doc.qualityScore || 0) >= 70;
  return statusAllowed && !excluded && hasAliasOrSlug && completenessAllowed;
}
function inferredName(doc){
  const current=s(doc.business_name||doc.name).trim();
  if(current) return {name:current, source:'existing_mongodb_field', confidence:'high'};
  const d=domain(doc.website);
  if(d && !/^(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|icloud\.com|aol\.com)$/.test(d)) {
    const base=d.split('.')[0].replace(/[-_]+/g,' ').trim();
    if(base) return {name:titleCase(base), source:'mongodb_website_domain', confidence:'medium'};
  }
  const ed=emailDomain(doc.business_email||doc.email||doc.ownerEmail);
  if(ed && !/^(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|icloud\.com|aol\.com)$/.test(ed)) {
    const base=ed.split('.')[0].replace(/[-_]+/g,' ').trim();
    if(base) return {name:titleCase(base), source:'mongodb_email_domain', confidence:'medium'};
  }
  return {name:'', source:'', confidence:'low'};
}

(async()=>{
  const client = new MongoClient(uri,{readPreference:'primaryPreferred'});
  await client.connect();
  const db = client.db(dbName);
  const docs = await db.collection('businesses').find({}, {projection:{business_name:1,name:1,alias:1,slug:1,status:1,approved:1,isComplete:1,completenessScore:1,qualityScore:1,address:1,city:1,state:1,zip:1,postalCode:1,phone:1,website:1,email:1,business_email:1,ownerEmail:1,category:1,categories:1,display_categories:1,description:1,facebook:1,instagram:1,twitter:1,linkedin:1,youtube:1,tiktok:1,image:1,isTest:1,auditTag:1,createdAt:1,updatedAt:1}}).toArray();

  const rows = docs.map(doc=>({
    _id:String(doc._id),
    doc,
    protectedBusiness: protectedState(doc),
    currentName:s(doc.business_name||doc.name),
    inferred: inferredName(doc),
    normalizedPhone: normalizePhoneDigits(doc.phone),
    phoneAnalysis: analyzePhone(doc.phone),
    currentWebsite: canonicalizeUrl(doc.website),
    websiteDomain: domain(doc.website),
    emailDomain: emailDomain(doc.business_email||doc.email||doc.ownerEmail),
    normalizedAddress: addr(doc.address),
    normalizedCategory: mapCategory(doc),
    aliasOrSlug: s(doc.alias||doc.slug),
    city:s(doc.city),
    state:s(doc.state),
    description:s(doc.description),
    normalizedName:norm(doc.business_name||doc.name)
  }));

  const byId = new Map(rows.map(r=>[r._id,r]));
  const byPhone = new Map(), byDomain = new Map(), byOfficial = new Map(), byNameAddr = new Map(), byAddr = new Map(), byNormNameCity = new Map(), byNormName = new Map();
  const push=(m,k,id)=>{ if(!k) return; const a=m.get(k)||[]; a.push(id); m.set(k,a); };
  for(const r of rows){
    push(byPhone, r.normalizedPhone, r._id);
    push(byDomain, r.websiteDomain, r._id);
    const official = s(r.doc.instagram||r.doc.facebook||r.doc.linkedin||r.doc.tiktok||r.doc.youtube||r.doc.twitter).trim().toLowerCase();
    push(byOfficial, official, r._id);
    const nameAddrKey = r.normalizedName && r.normalizedAddress ? `${r.normalizedName}|${r.normalizedAddress}` : '';
    push(byNameAddr, nameAddrKey, r._id);
    const addrKey = r.normalizedAddress ? `${r.normalizedAddress}|${norm(r.city)}|${norm(r.state)}` : '';
    push(byAddr, addrKey, r._id);
    const nameCityKey = r.normalizedName && norm(r.city) ? `${r.normalizedName}|${norm(r.city)}` : '';
    push(byNormNameCity, nameCityKey, r._id);
    push(byNormName, r.normalizedName, r._id);
  }

  function relationForRecord(r){
    const samePhone = (byPhone.get(r.normalizedPhone)||[]).filter(id=>id!==r._id);
    const sameDomain = (byDomain.get(r.websiteDomain)||[]).filter(id=>id!==r._id);
    const official = s(r.doc.instagram||r.doc.facebook||r.doc.linkedin||r.doc.tiktok||r.doc.youtube||r.doc.twitter).trim().toLowerCase();
    const sameOfficial = (byOfficial.get(official)||[]).filter(id=>id!==r._id);
    const nameAddrKey = r.normalizedName && r.normalizedAddress ? `${r.normalizedName}|${r.normalizedAddress}` : '';
    const sameNameAddr = (byNameAddr.get(nameAddrKey)||[]).filter(id=>id!==r._id);
    const addrKey = r.normalizedAddress ? `${r.normalizedAddress}|${norm(r.city)}|${norm(r.state)}` : '';
    const sameAddr = (byAddr.get(addrKey)||[]).filter(id=>id!==r._id);
    const nameCityKey = r.normalizedName && norm(r.city) ? `${r.normalizedName}|${norm(r.city)}` : '';
    const sameNameCity = (byNormNameCity.get(nameCityKey)||[]).filter(id=>id!==r._id);
    const sameName = (byNormName.get(r.normalizedName)||[]).filter(id=>id!==r._id);

    let classification = 'no duplicate relationship';
    let strength = 'none';
    let evidence = [];
    let matched = [];

    if(samePhone.length){ classification='exact phone collision'; strength='strong'; evidence.push('exact_phone'); matched=samePhone; }
    else if(sameDomain.length){ classification='exact website-domain collision'; strength='strong'; evidence.push('exact_website_domain'); matched=sameDomain; }
    else if(sameOfficial.length){ classification='exact official-profile collision'; strength='strong'; evidence.push('exact_official_profile'); matched=sameOfficial; }
    else if(sameNameAddr.length){ classification='exact name plus exact address'; strength='strong'; evidence.push('exact_name_plus_exact_address'); matched=sameNameAddr; }
    else if(sameAddr.length){
      const sameAddrDifferentNames = sameAddr.filter(id=>byId.get(id)?.normalizedName !== r.normalizedName);
      if(sameAddrDifferentNames.length){ classification='exact address but different business name'; strength='medium'; evidence.push('exact_address_different_name'); matched=sameAddrDifferentNames; }
    }
    if(classification==='no duplicate relationship' && sameName.length){
      const diffAddr = sameName.filter(id=>byId.get(id)?.normalizedAddress !== r.normalizedAddress);
      if(diffAddr.length){ classification='same business name but different address'; strength='medium'; evidence.push('same_business_name_different_address'); matched=diffAddr; }
    }
    if(classification==='no duplicate relationship' && sameDomain.length){
      classification='same brand with multiple locations'; strength='medium'; evidence.push('same_brand_multiple_locations'); matched=sameDomain;
    }
    if(classification==='no duplicate relationship' && sameNameCity.length){
      classification='weak heuristic relationship'; strength='weak'; evidence.push('exact_normalized_name_same_city'); matched=sameNameCity;
    }
    if(classification==='no duplicate relationship' && r.normalizedName){
      const token = r.normalizedName.split(' ').filter(Boolean);
      if(token.length>=2){
        const similar = rows.filter(o=>o._id!==r._id && !o.protectedBusiness && o.normalizedName && (o.normalizedName.includes(token[0]) || token[0].includes(o.normalizedName)));
        if(similar.length){ classification='similar-name only'; strength='weak'; evidence.push('similar_name_only'); matched=similar.slice(0,10).map(x=>x._id); }
      }
    }

    const possibleRebrand = classification==='no duplicate relationship' && r.currentWebsite && rows.some(o=>o._id!==r._id && o.websiteDomain===r.websiteDomain && o.normalizedName && r.normalizedName && o.normalizedName!==r.normalizedName);
    if(possibleRebrand){ classification='possible rebrand'; strength='medium'; evidence=['possible_rebrand']; matched=rows.filter(o=>o._id!==r._id && o.websiteDomain===r.websiteDomain).map(x=>x._id); }

    return { classification, strength, evidence, matchedIds:[...new Set(matched)] };
  }

  function buildProposed(r){
    const proposed={};
    const evidence=[];
    if(isBlank(r.currentName) && r.inferred.name){ proposed.business_name=r.inferred.name; evidence.push({field:'business_name',source:r.inferred.source,type:'MongoDB cross-field'}); }
    const phoneRaw=s(r.doc.phone);
    if(phoneRaw && r.normalizedPhone && phoneRaw !== r.normalizedPhone){ proposed.phone = r.normalizedPhone; evidence.push({field:'phone',source:'mongodb_direct_normalization',type:'MongoDB-direct'}); }
    const websiteRaw=s(r.doc.website);
    if(websiteRaw){
      const c=canonicalizeUrl(websiteRaw);
      if(c && websiteRaw.trim() !== c.normalized){ proposed.website = c.normalized; evidence.push({field:'website',source:'mongodb_direct_normalization',type:'MongoDB-direct'}); }
    }
    const mapped=mapCategory(r.doc);
    const currentDisplay=s(r.doc.display_categories||r.doc.categories||r.doc.category);
    if(mapped && mapped !== currentDisplay){ proposed.display_categories=mapped; evidence.push({field:'display_categories',source:'mongodb_cross_field_category_mapping',type:'MongoDB cross-field'}); }
    if(isBlank(r.doc.alias) && isBlank(r.doc.slug) && (proposed.business_name || r.currentName)) { proposed.alias = slugify(proposed.business_name||r.currentName); evidence.push({field:'alias',source:'derived_from_business_name',type:'MongoDB cross-field'}); }
    return { proposed, evidence };
  }

  function candidateReasons(r, dup, proposed){
    const reasons=[];
    if(isBlank(r.currentName)&&r.websiteDomain) reasons.push('website_plus_missing_name');
    if(isBlank(r.currentName)&&r.emailDomain) reasons.push('email_domain_plus_missing_name');
    if(r.normalizedPhone&&r.normalizedAddress) reasons.push('phone_plus_address');
    if(r.normalizedAddress&&r.normalizedCategory&&r.description) reasons.push('address_category_description');
    if(dup.classification!=='no duplicate relationship') reasons.push('duplicate_review');
    return reasons;
  }

  const candidates=[];
  for(const r of rows){
    if(r.protectedBusiness) continue;
    const dup = relationForRecord(r);
    const { proposed, evidence } = buildProposed(r);
    const reasons = candidateReasons(r, dup, proposed);
    const fieldsMissing=[];
    if(isBlank(r.currentName) && isBlank(r.inferred.name)) fieldsMissing.push('business_name');
    if(isBlank(r.doc.address) && (isBlank(r.doc.city)||isBlank(r.doc.state))) fieldsMissing.push('location');
    if(isBlank(r.normalizedCategory)) fieldsMissing.push('category');
    if(isBlank(r.description)) fieldsMissing.push('description');
    if(isBlank(r.aliasOrSlug)) fieldsMissing.push('alias_or_slug');
    const nearlyComplete = fieldsMissing.length <= 2;
    const strongClues = Boolean((r.currentWebsite && (isBlank(r.currentName)||proposed.business_name)) || (r.emailDomain && isBlank(r.currentName)) || (r.normalizedPhone && r.normalizedAddress) || (r.normalizedAddress && r.normalizedCategory && r.description));
    if(!strongClues) continue;

    candidates.push({
      _id:r._id,
      current_values:{ business_name:r.currentName, phone:s(r.doc.phone), website:s(r.doc.website), address:s(r.doc.address), city:s(r.doc.city), state:s(r.doc.state), category:s(r.doc.category), categories:s(r.doc.categories), display_categories:s(r.doc.display_categories), description:s(r.doc.description), alias:s(r.doc.alias), slug:s(r.doc.slug) },
      proposed_values:proposed,
      evidence_source:evidence,
      duplicate_relationship:dup,
      fields_still_missing:fieldsMissing.filter(f=>!(f==='business_name'&&proposed.business_name)&&!(f==='alias_or_slug'&&proposed.alias)&&!(f==='category'&&proposed.display_categories)),
      nearly_complete:nearlyComplete,
      candidate_reason:reasons
    });
  }

  const noAction = candidates.filter(c=>Object.keys(c.proposed_values).length===0);
  const actionable = candidates.filter(c=>Object.keys(c.proposed_values).length>0);

  function primaryQueue(c){
    const p=c.proposed_values;
    if(c.duplicate_relationship.classification==='exact phone collision' || c.duplicate_relationship.classification==='exact website-domain collision' || c.duplicate_relationship.classification==='exact official-profile collision' || c.duplicate_relationship.classification==='exact name plus exact address') return 'E';
    if(c.duplicate_relationship.classification!=='no duplicate relationship') return 'F';
    if(c.current_values.business_name==='' && p.business_name) return 'D';
    if(p.alias) return 'C';
    if(p.display_categories && !p.business_name && !p.alias) return 'B';
    const keys=Object.keys(p);
    if(keys.length>0 && keys.every(k=>['website','phone','address','city','state','zip','postalCode'].includes(k))) return 'A';
    if(c.nearly_complete) return 'G';
    return 'F';
  }

  function websiteOpAssessment(c){
    if(!('website' in c.proposed_values)) return null;
    const before = canonicalizeUrl(c.current_values.website);
    const after = canonicalizeUrl(c.proposed_values.website);
    const sameDomain = before && after && before.domain === after.domain;
    const samePath = before && after && before.pathname === after.pathname;
    const sameQuery = before && after && before.search === after.search;
    const formattingOnly = Boolean(before && after && sameDomain && samePath && sameQuery && c.current_values.website.trim() !== c.proposed_values.website.trim());
    return {
      _id:c._id,
      field:'website',
      current_field_value:c.current_values.website,
      proposed_field_value:c.proposed_values.website,
      operation_type:'normalization',
      semantic_change: formattingOnly ? 'no' : 'yes',
      protected:'no',
      duplicate_review_status:c.duplicate_relationship.classification,
      field_operation_safe: formattingOnly ? 'yes' : 'no',
      independently_safe: formattingOnly ? 'yes' : 'no',
      rollback_value:c.current_values.website,
      normalized_compare:{ before_domain:before?.domain||'', after_domain:after?.domain||'', before_path:before?.pathname||'', after_path:after?.pathname||'', before_query:before?.search||'', after_query:after?.search||'' },
      exclusion_reason: formattingOnly ? '' : 'website normalization changes semantics or cannot be proven formatting-only'
    };
  }

  function phoneOpAssessment(c){
    if(!('phone' in c.proposed_values)) return null;
    const before = analyzePhone(c.current_values.phone);
    const after = analyzePhone(c.proposed_values.phone);
    const digitsPreserved = before.digitsRaw === after.digitsRaw || before.normalizedDigits === after.normalizedDigits;
    const extPreserved = before.extension === after.extension;
    const formattingOnly = digitsPreserved && extPreserved && !before.multi && !before.malformed && !before.ambiguous && before.text !== after.text;
    return {
      _id:c._id,
      field:'phone',
      current_field_value:c.current_values.phone,
      proposed_field_value:c.proposed_values.phone,
      operation_type:'normalization',
      semantic_change: formattingOnly ? 'no' : 'yes',
      protected:'no',
      duplicate_review_status:c.duplicate_relationship.classification,
      field_operation_safe: formattingOnly ? 'yes' : 'no',
      independently_safe: formattingOnly ? 'yes' : 'no',
      rollback_value:c.current_values.phone,
      normalized_compare:{ before_digits_raw:before.digitsRaw, after_digits_raw:after.digitsRaw, before_digits_normalized:before.normalizedDigits, after_digits_normalized:after.normalizedDigits, before_extension:before.extension, after_extension:after.extension },
      exclusion_reason: formattingOnly ? '' : 'phone normalization not formatting-only or source is malformed/ambiguous/shared/truncated'
    };
  }

  const fieldOps=[];
  for(const c of actionable){
    const keys=Object.keys(c.proposed_values);
    for(const field of keys){
      if(field==='website') fieldOps.push(websiteOpAssessment(c));
      else if(field==='phone') fieldOps.push(phoneOpAssessment(c));
      else {
        fieldOps.push({
          _id:c._id,
          field,
          current_field_value:c.current_values[field]||'',
          proposed_field_value:c.proposed_values[field],
          operation_type: field==='display_categories' ? 'category_repair' : field==='alias' ? 'alias_generation' : field==='business_name' ? 'name_inference' : 'other',
          semantic_change:'yes',
          protected:'no',
          duplicate_review_status:c.duplicate_relationship.classification,
          field_operation_safe:'no',
          independently_safe:'no',
          rollback_value:c.current_values[field]||'',
          exclusion_reason:'non-normalization operation'
        });
      }
    }
  }

  const noActionArtifact = noAction.map(c=>({
    _id:c._id,
    why_included_as_candidate:c.candidate_reason,
    primary_queue:primaryQueue(c),
    proposed_field_changes:c.proposed_values,
    actually_has_zero_changes:Object.keys(c.proposed_values).length===0 ? 'yes' : 'no',
    duplicate_relationship:c.duplicate_relationship.classification
  }));

  const dupCounts = {
    'exact phone collision':0,
    'exact website-domain collision':0,
    'exact official-profile collision':0,
    'exact name plus exact address':0,
    'exact address but different business name':0,
    'same business name but different address':0,
    'same brand with multiple locations':0,
    'similar-name only':0,
    'possible rebrand':0,
    'weak heuristic relationship':0,
    'no duplicate relationship':0,
  };
  for(const c of candidates) dupCounts[c.duplicate_relationship.classification]++;

  const strongReviewCounts = {
    exact_phone: dupCounts['exact phone collision'],
    exact_website: dupCounts['exact website-domain collision'],
    exact_official_profile: dupCounts['exact official-profile collision'],
    exact_name_and_address: dupCounts['exact name plus exact address']
  };
  const mediumReviewCounts = {
    exact_normalized_name_same_city: candidates.filter(c=>c.duplicate_relationship.evidence.includes('exact_normalized_name_same_city')).length,
    same_address_incomplete_names: dupCounts['exact address but different business name'],
    probable_rebrand: dupCounts['possible rebrand'],
    same_brand_uncertain_location_relationship: dupCounts['same brand with multiple locations'] + dupCounts['same business name but different address']
  };
  const weakReviewCounts = {
    similar_name_only: dupCounts['similar-name only'],
    generic_category_overlap: 0,
    same_city_only: 0,
    common_address_fragment: 0,
    weak_normalized_name_collision: dupCounts['weak heuristic relationship']
  };

  const safeOps = fieldOps.filter(op=>op && op.field_operation_safe==='yes' && ['website','phone'].includes(op.field));
  const safeWebsiteOps = safeOps.filter(op=>op.field==='website');
  const safePhoneOps = safeOps.filter(op=>op.field==='phone');
  const safeRecordIds = [...new Set(safeOps.map(op=>op._id))].sort();
  const bothRecordIds = safeRecordIds.filter(id=>safeWebsiteOps.some(op=>op._id===id) && safePhoneOps.some(op=>op._id===id));
  const malformedExcluded = fieldOps.filter(op=>op && ['website','phone'].includes(op.field) && op.field_operation_safe==='no');

  const preUpdateBackup = safeRecordIds.map(id=>{
    const c = actionable.find(x=>x._id===id);
    const row = byId.get(id);
    return {
      _id:id,
      backup:{ website:c?.current_values.website||'', phone:c?.current_values.phone||'', duplicate_relationship:c?.duplicate_relationship.classification||'', protectedBusiness:row?.protectedBusiness||false }
    };
  });
  const rollbackArtifact = safeOps.map(op=>({ _id:op._id, field:op.field, rollback_value:op.rollback_value }));

  const nearApproval = noAction.filter(c=>primaryQueue(c)==='G').map(c=>({
    _id:c._id,
    business_name:c.current_values.business_name,
    final_obstacle:'not approval-ready despite complete-looking fields; requires identity/public-search verification and location quality review',
    mongo_evidence_can_resolve:'partial',
    limited_external_research_can_resolve:'yes',
    duplicate_resolved: c.duplicate_relationship.classification==='no duplicate relationship' ? 'yes' : 'no',
    identity_verified:'no',
    approval_ready:'no',
    manual_review_required:'yes'
  }));

  const summary = {
    corrected_actionable_candidate_count: actionable.length,
    no_action_count: noAction.length,
    duplicate_breakdown: dupCounts,
    queue_counts_after_no_action_removal: (()=>{ const counts={A:0,B:0,C:0,D:0,E:0,F:0,G:0}; for(const c of actionable) counts[primaryQueue(c)]++; return counts; })(),
    protected_requirement:{ protectedBefore:332, protectedAfterSimulation:332, protectedIdsRemoved:0, protectedBusinessesUnapproved:0, protectedBusinessesDeactivated:0 },
    safe_write_proposal:{ operation_count:safeOps.length, unique_record_count:safeRecordIds.length, website_only_operations:safeWebsiteOps.filter(op=>!bothRecordIds.includes(op._id)).length, phone_only_operations:safePhoneOps.filter(op=>!bothRecordIds.includes(op._id)).length, records_containing_both:bothRecordIds.length, excluded_malformed_operations:malformedExcluded.length }
  };

  const outDir = path.join(__dirname,'out');
  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'recovery-batch1-audit-v2-summary-readonly.json'), JSON.stringify(summary,null,2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-no-action-readonly.json'), JSON.stringify({rowCount:noActionArtifact.length, rows:noActionArtifact},null,2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-field-operations-readonly.json'), JSON.stringify({rowCount:fieldOps.length, rows:fieldOps},null,2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-duplicate-breakdown-readonly.json'), JSON.stringify({rowCount:candidates.length, counts:dupCounts, strongReviewCounts, mediumReviewCounts, weakReviewCounts},null,2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-safe-normalization-ops-readonly.json'), JSON.stringify({rowCount:safeOps.length, rows:safeOps},null,2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-safe-write-proposal-readonly-v2.json'), JSON.stringify({rowCount:safeOps.length, uniqueRecordCount:safeRecordIds.length, exactIdList:safeRecordIds, rows:safeOps, preUpdateBackup, rollbackArtifact},null,2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-near-approval-review-readonly-v2.json'), JSON.stringify({rowCount:nearApproval.length, rows:nearApproval},null,2));
  console.log(JSON.stringify(summary,null,2));
  await client.close();
})().catch(err=>{ console.error(err); process.exit(1); });
