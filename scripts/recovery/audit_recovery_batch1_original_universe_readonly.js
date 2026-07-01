#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB || 'bwes-cluster';
if (!uri) throw new Error('Missing MONGODB_URI/MONGODB_URL');

function s(v){ if(v===undefined||v===null) return ''; if(Array.isArray(v)) return v.join(', '); return String(v); }
function norm(v){ return s(v).normalize('NFKC').toLowerCase().replace(/[’'`]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }
function normalizePhoneDigits(v){ const d=s(v).replace(/\D/g,''); return d.length===11&&d.startsWith('1')?d.slice(1):d; }
function phoneMeta(v){
  const raw=s(v).trim();
  const digitsRaw=raw.replace(/\D/g,'');
  const normalized=normalizePhoneDigits(raw);
  const extMatch=raw.match(/(?:ext\.?|extension|x)\s*(\d+)$/i);
  const ext=extMatch?extMatch[1]:'';
  const multi=/(?:\bor\b|\band\b|\/|;|,)/i.test(raw) && (raw.match(/\d/g)||[]).length>10;
  const invalidPlaceholder = ['0000000000','1111111111','1234567890','9999999999','5555555555','0000000','1111111','1231231234'].includes(normalized) || /^0+$/.test(normalized) || /^1+$/.test(normalized);
  const malformed = normalized && ![7,10].includes(normalized.length);
  return { raw, digitsRaw, normalized, ext, multi, invalidPlaceholder, malformed };
}
function canonicalUrl(raw){
  let x=s(raw).trim();
  if(!x) return null;
  if(!/^https?:\/\//i.test(x)) x='https://'+x;
  try {
    const u=new URL(x);
    const pathname=(u.pathname||'/')==='/'?'/':(u.pathname||'/').replace(/\/+$/,'')||'/';
    return {
      raw:s(raw),
      href:u.href,
      protocol:u.protocol.toLowerCase(),
      hostname:u.hostname.toLowerCase(),
      domain:u.hostname.replace(/^www\./i,'').toLowerCase(),
      pathname,
      search:u.search,
      normalized:`${u.protocol.toLowerCase()}//${u.hostname.toLowerCase()}${pathname==='/'?'':pathname}${u.search}`,
    };
  } catch { return null; }
}
function officialProfile(doc){
  const vals=[doc.instagram,doc.facebook,doc.linkedin,doc.twitter,doc.tiktok,doc.youtube].map(s).map(x=>x.trim().toLowerCase()).filter(Boolean);
  return vals.sort().join('|');
}
function isGenericWebsiteDomain(domain){
  return ['facebook.com','instagram.com','twitter.com','x.com','linkedin.com','yelp.com','etsy.com','linktr.ee','square.site','wixsite.com'].includes(domain||'');
}
function protectedState(doc){
  const status = doc.status;
  const statusAllowed = status === 'approved' || status === 'verified' || status === 'active' || status === undefined || status === null || status === '';
  const excluded = doc.isTest === true || doc.auditTag !== undefined || /^BWE_LOCAL_AUDIT/i.test(s(doc.auditTag)) || /^auditpagination$/i.test(s(doc.category)) || /^auditpagination$/i.test(s(doc.categories)) || /^auditpagination$/i.test(s(doc.display_categories)) || /@local\.test$/i.test(s(doc.email)) || /^auditpagination_/i.test(s(doc.business_name)) || /^auditpagination_/i.test(s(doc.name));
  const hasAliasOrSlug = (typeof doc.alias === 'string' && doc.alias !== '') || (typeof doc.slug === 'string' && doc.slug !== '');
  const completenessAllowed = doc.isComplete === true || Number(doc.completenessScore || 0) >= 70 || Number(doc.qualityScore || 0) >= 70;
  return statusAllowed && !excluded && hasAliasOrSlug && completenessAllowed;
}

(async()=>{
  const outDir=path.join(__dirname,'out');
  const originalPath=path.join(outDir,'recovery-batch1-candidates-full-readonly.json');
  const originalRows=JSON.parse(fs.readFileSync(originalPath,'utf8'));
  const originalIds=new Set(originalRows.map(r=>r._id));
  const zeroActionRows=originalRows.filter(r=>Object.keys(r.proposed_values||{}).length===0);
  const actionableRows=originalRows.filter(r=>Object.keys(r.proposed_values||{}).length>0);

  const client = new MongoClient(uri,{readPreference:'primaryPreferred'});
  await client.connect();
  const db = client.db(dbName);
  const docs = await db.collection('businesses').find({_id:{$in:originalRows.map(r=>r._id)}},{projection:{business_name:1,name:1,alias:1,slug:1,status:1,approved:1,isComplete:1,completenessScore:1,qualityScore:1,address:1,city:1,state:1,zip:1,postalCode:1,phone:1,website:1,email:1,business_email:1,ownerEmail:1,category:1,categories:1,display_categories:1,description:1,facebook:1,instagram:1,twitter:1,linkedin:1,youtube:1,tiktok:1,image:1,isTest:1,auditTag:1}}).toArray();
  const byId=new Map(docs.map(d=>[String(d._id),d]));

  const metaRows=originalRows.map(r=>{
    const doc=byId.get(r._id)||{};
    const phone=phoneMeta(doc.phone||r.current_values?.phone||'');
    const web=canonicalUrl(doc.website||r.current_values?.website||'');
    return {
      _id:r._id,
      row:r,
      doc,
      protectedBusiness:protectedState(doc),
      businessName:s(doc.business_name||doc.name||r.current_values?.business_name),
      normalizedName:norm(doc.business_name||doc.name||r.current_values?.business_name),
      address:s(doc.address||r.current_values?.address),
      normalizedAddress:norm(doc.address||r.current_values?.address),
      city:s(doc.city||r.current_values?.city),
      state:s(doc.state||r.current_values?.state),
      phone,
      website:web,
      official:officialProfile(doc),
      category:s(doc.display_categories||doc.categories||doc.category||r.current_values?.display_categories||r.current_values?.categories||r.current_values?.category)
    };
  });

  const byPhone=new Map(), byDomain=new Map(), byNameAddr=new Map(), byOfficial=new Map(), byName=new Map(), byAddress=new Map();
  const push=(m,k,v)=>{ if(!k) return; const a=m.get(k)||[]; a.push(v); m.set(k,a); };
  for(const m of metaRows){
    if(m.phone.normalized && !m.phone.invalidPlaceholder && !m.phone.malformed) push(byPhone,m.phone.normalized,m);
    if(m.website?.domain) push(byDomain,m.website.domain,m);
    if(m.normalizedName && m.normalizedAddress) push(byNameAddr,`${m.normalizedName}|${m.normalizedAddress}`,m);
    if(m.official) push(byOfficial,m.official,m);
    if(m.normalizedName) push(byName,m.normalizedName,m);
    if(m.normalizedAddress) push(byAddress,m.normalizedAddress,m);
  }

  const phoneCollisionReport=[];
  for(const [normalizedPhone, entries] of [...byPhone.entries()].sort()){
    if(entries.length<2) continue;
    const websites=[...new Set(entries.map(e=>e.website?.domain||''))].filter(Boolean);
    const names=[...new Set(entries.map(e=>e.normalizedName).filter(Boolean))];
    const addresses=[...new Set(entries.map(e=>e.normalizedAddress).filter(Boolean))];
    let quality='real direct business phone';
    let classification='weak relationship';
    if(names.length===1 && addresses.length===1) classification='confirmed machine-key collision';
    else if(websites.length===1 && websites.length>0 && names.length<=2) classification='same brand/different location';
    else if(addresses.length===1 && names.length>1) classification='strong duplicate review';
    else if(entries.some(e=>e.protectedBusiness) && entries.some(e=>!e.protectedBusiness)) classification='strong duplicate review';
    else if(entries.length>=3) quality='shared/corporate/management/shared office';
    else quality='shared or generic';
    if(entries.some(e=>e.phone.multi)) quality='malformed/multiple';
    phoneCollisionReport.push({
      normalized_phone:normalizedPhone,
      count:entries.length,
      record_ids:entries.map(e=>e._id),
      business_names:entries.map(e=>e.businessName),
      addresses:entries.map(e=>e.address),
      websites:entries.map(e=>e.website?.raw||''),
      protected_statuses:entries.map(e=>e.protectedBusiness),
      appears_real_direct_business_phone: quality==='real direct business phone',
      phone_quality:quality,
      final_collision_classification:classification
    });
  }

  function classifyDuplicate(m){
    const phoneMatches=(m.phone.normalized && !m.phone.invalidPlaceholder && !m.phone.malformed) ? (byPhone.get(m.phone.normalized)||[]).filter(x=>x._id!==m._id) : [];
    const domainMatches=m.website?.domain ? (byDomain.get(m.website.domain)||[]).filter(x=>x._id!==m._id) : [];
    const nameAddrMatches=(m.normalizedName && m.normalizedAddress) ? (byNameAddr.get(`${m.normalizedName}|${m.normalizedAddress}`)||[]).filter(x=>x._id!==m._id) : [];
    const officialMatches=m.official ? (byOfficial.get(m.official)||[]).filter(x=>x._id!==m._id) : [];
    const nameMatches=m.normalizedName ? (byName.get(m.normalizedName)||[]).filter(x=>x._id!==m._id) : [];
    const addressMatches=m.normalizedAddress ? (byAddress.get(m.normalizedAddress)||[]).filter(x=>x._id!==m._id) : [];

    const evidence={
      exact_phone_matches:phoneMatches.map(x=>x._id),
      exact_website_domain_matches:domainMatches.map(x=>x._id),
      exact_address_and_name_matches:nameAddrMatches.map(x=>x._id),
      exact_official_profile_matches:officialMatches.map(x=>x._id),
      name_only_matches:nameMatches.filter(x=>x.normalizedAddress!==m.normalizedAddress).map(x=>x._id),
      address_only_matches:addressMatches.filter(x=>x.normalizedName!==m.normalizedName).map(x=>x._id)
    };

    const sameIdentityByDomain = domainMatches.some(x=>x.normalizedName===m.normalizedName || x.official===m.official || (x.normalizedAddress===m.normalizedAddress && m.normalizedAddress));
    const sameIdentityByPhone = phoneMatches.some(x=>(x.normalizedName===m.normalizedName && x.normalizedName) || (x.normalizedAddress===m.normalizedAddress && x.normalizedAddress) || (norm(x.city)===norm(m.city) && norm(x.category)===norm(m.category) && norm(m.city) && norm(m.category)));
    const protectedCopy = [...phoneMatches,...domainMatches,...nameAddrMatches,...officialMatches].some(x=>x.protectedBusiness!==m.protectedBusiness);
    const sameBrandDifferentLocation = domainMatches.some(x=>x.normalizedAddress && m.normalizedAddress && x.normalizedAddress!==m.normalizedAddress) || nameMatches.some(x=>x.normalizedAddress && m.normalizedAddress && x.normalizedAddress!==m.normalizedAddress);
    const probableRebrand = domainMatches.some(x=>x.normalizedName && m.normalizedName && x.normalizedName!==m.normalizedName) && !sameBrandDifferentLocation;
    const weakPhoneOnly = phoneMatches.length>0 && !sameIdentityByPhone && domainMatches.length===0 && nameAddrMatches.length===0 && officialMatches.length===0;
    const weakNameOnly = evidence.name_only_matches.length>0 && phoneMatches.length===0 && domainMatches.length===0 && nameAddrMatches.length===0 && officialMatches.length===0;
    const genericPlatform = isGenericWebsiteDomain(m.website?.domain);

    let classification='no reliable duplicate evidence';
    if(nameAddrMatches.length>0 || officialMatches.some(x=>x.normalizedName===m.normalizedName && m.normalizedName) || sameIdentityByDomain || sameIdentityByPhone){
      classification='confirmed machine-key collision';
    } else if(protectedCopy || (domainMatches.length>0 && !genericPlatform) || (phoneMatches.length>0 && norm(m.city) && phoneMatches.some(x=>norm(x.city)===norm(m.city)))){
      classification='strong duplicate review';
    } else if(sameBrandDifferentLocation){
      classification='same brand/different location';
    } else if(probableRebrand){
      classification='probable rebrand';
    } else if(weakPhoneOnly || weakNameOnly || genericPlatform || evidence.address_only_matches.length>0){
      classification='weak relationship';
    }

    return { classification, evidence };
  }

  const actionableWithClass=actionableRows.map(r=>{
    const m=metaRows.find(x=>x._id===r._id);
    const dup=classifyDuplicate(m);
    return { ...r, duplicate_classification:dup.classification, duplicate_evidence:dup.evidence, protected_business:m.protectedBusiness };
  });

  function queueForRow(r){
    const p=r.proposed_values||{};
    const keys=Object.keys(p);
    if(['confirmed machine-key collision','strong duplicate review'].includes(r.duplicate_classification)) return 'F';
    if(r.current_values.business_name==='' && p.business_name) return 'D';
    if(p.alias||p.slug) return 'C';
    if(p.display_categories && !p.business_name && !p.alias && !p.slug) return 'B';
    if(keys.length>0 && keys.every(k=>['website','phone','address','city','state','zip','postalCode'].includes(k))) return 'A';
    if(r.approval_readiness==='requires verification before approval') return 'G';
    return 'F';
  }

  const zeroArtifact=zeroActionRows.map(r=>({
    _id:r._id,
    business_name:r.current_values.business_name,
    primary_queue:queueForRow({ ...r, duplicate_classification: classifyDuplicate(metaRows.find(x=>x._id===r._id)).classification }),
    secondary_classifications:{
      duplicate_classification: classifyDuplicate(metaRows.find(x=>x._id===r._id)).classification,
      approval_readiness:r.approval_readiness,
      manual_review_required:r.manual_review_required
    },
    current_values:r.current_values,
    proposed_values:r.proposed_values,
    why_it_entered_candidate_universe:r.candidate_reason,
    zero_actual_field_changes:true
  }));

  const evidenceCounts={ exact_phone_matches:0, exact_website_domain_matches:0, exact_address_and_name_matches:0, exact_official_profile_matches:0, name_only_matches:0, address_only_matches:0 };
  const finalCounts={ 'confirmed machine-key collision':0, 'strong duplicate review':0, 'same brand/different location':0, 'probable rebrand':0, 'weak relationship':0, 'no reliable duplicate evidence':0 };
  for(const r of actionableWithClass){
    finalCounts[r.duplicate_classification]++;
    for(const k of Object.keys(evidenceCounts)) if((r.duplicate_evidence[k]||[]).length>0) evidenceCounts[k]++;
  }

  const opRows=[];
  for(const r of actionableWithClass){
    for(const [field, proposed] of Object.entries(r.proposed_values||{})){
      const current = r.current_values[field] ?? '';
      let operationType='other', formattingOnly=false, independentlySafe=false, exclusionReason='';
      if(field==='website'){
        operationType='website_normalization';
        const before=canonicalUrl(current), after=canonicalUrl(proposed);
        formattingOnly=Boolean(before&&after&&before.domain===after.domain&&before.pathname===after.pathname&&before.search===after.search&&current.trim()!==String(proposed).trim());
        independentlySafe=formattingOnly;
        if(!independentlySafe) exclusionReason='website change is not strictly formatting-only';
      } else if(field==='phone'){
        operationType='phone_normalization';
        const before=phoneMeta(current), after=phoneMeta(proposed);
        formattingOnly=Boolean(!before.invalidPlaceholder && !before.malformed && !before.multi && before.normalized && before.normalized===after.normalized && before.ext===after.ext && before.raw!==after.raw);
        independentlySafe=formattingOnly;
        if(!independentlySafe) exclusionReason='phone change is not strictly formatting-only or source is invalid/shared/malformed';
      } else if(field==='display_categories') {
        operationType='category_change'; exclusionReason='semantic category change';
      } else if(field==='business_name') {
        operationType='name_change'; exclusionReason='semantic name change';
      } else if(field==='alias' || field==='slug') {
        operationType='alias_slug_change'; exclusionReason='routing identifier change';
      } else {
        exclusionReason='non-normalization change';
      }
      opRows.push({
        _id:r._id,
        field,
        current_value:current,
        proposed_value:proposed,
        operation_type:operationType,
        change_kind:formattingOnly?'formatting-only':'semantic',
        evidence_source:(r.evidence_source||[]).filter(e=>e.field===field).map(e=>e.source),
        duplicate_classification:r.duplicate_classification,
        independently_safe:independentlySafe,
        exclusion_reason:independentlySafe?'':exclusionReason,
        rollback_value:current
      });
    }
  }

  const safeWebsiteOps=opRows.filter(o=>o.field==='website' && o.independently_safe);
  const safePhoneOps=opRows.filter(o=>o.field==='phone' && o.independently_safe);
  const safeOps=[...safeWebsiteOps,...safePhoneOps].filter(o=>!byId.get(o._id)||!protectedState(byId.get(o._id)));
  const bothIds=[...new Set(safeWebsiteOps.map(o=>o._id))].filter(id=>safePhoneOps.some(o=>o._id===id));
  const safeUniqueIds=[...new Set(safeOps.map(o=>o._id))].sort();
  const excludedOps=opRows.filter(o=>['website','phone'].includes(o.field) && !o.independently_safe);
  const excludedReasonCounts={}; for(const o of excludedOps){ excludedReasonCounts[o.exclusion_reason]=(excludedReasonCounts[o.exclusion_reason]||0)+1; }

  const nearApprovalOriginal=JSON.parse(fs.readFileSync(path.join(outDir,'recovery-batch1-near-approval-readonly.json'),'utf8')).rows;
  const nearApproval17=nearApprovalOriginal.map(r=>{
    const m=metaRows.find(x=>x._id===r._id);
    const dup=classifyDuplicate(m);
    const completeness = { isComplete: m.doc.isComplete ?? null, completenessScore: m.doc.completenessScore ?? null, qualityScore: m.doc.qualityScore ?? null };
    let blocking='identity/public-search verification required';
    let repair='manual business identity verification';
    let mongoOnly='partial';
    let external='yes';
    let readiness='not ready';
    if(r.proposed_values && Object.keys(r.proposed_values).length===0) blocking='no deterministic repair proposed in original artifact; requires manual verification';
    if(!m.businessName) blocking='missing business name';
    if(!s(m.doc.alias||m.doc.slug)) repair='needs public route key plus identity verification';
    return {
      _id:r._id,
      business_name:r.current_values.business_name,
      current_completeness:completeness,
      exact_missing_or_blocking_issue:blocking,
      duplicate_classification:dup.classification,
      required_repair:repair,
      mongodb_alone_can_resolve_it:mongoOnly,
      external_research_would_help:external,
      projected_approval_readiness_after_repair:readiness
    };
  });

  const safeProposal={
    operation_count:safeOps.length,
    unique_business_record_count:safeUniqueIds.length,
    rows:safeOps.map(o=>({
      _id:o._id,
      field:o.field,
      current_value:o.current_value,
      proposed_value:o.proposed_value,
      guard_current_value:o.current_value,
      rollback_value:o.rollback_value
    })),
    exact_id_list:safeUniqueIds,
    backup_values:safeOps.map(o=>({_id:o._id, field:o.field, backup_value:o.current_value})),
    rollback_operations:safeOps.map(o=>({_id:o._id, field:o.field, rollback_to:o.rollback_value}))
  };

  const summary={
    original_batch1_universe:1613,
    zero_change_no_action_rows:35,
    actionable_candidates:1578,
    total:1613,
    v2_widened_universe:1622,
    v2_zero_change_rows:44,
    v2_minus_original_zero_change_difference:9,
    protected_simulation:{ protectedBefore:332, protectedAfterSimulation:332, protectedIdsRemoved:0, protectedBusinessesUnapproved:0, protectedBusinessesDeactivated:0 },
    duplicate_final_classification_counts:finalCounts,
    duplicate_evidence_counts:evidenceCounts,
    normalization_safe_counts:{ safe_website_operation_count:safeWebsiteOps.length, safe_phone_operation_count:safePhoneOps.length, records_containing_both:bothIds.length, unique_record_count:safeUniqueIds.length, excluded_operation_count:excludedOps.length, excluded_reasons:excludedReasonCounts },
    safe_first_write_proposal_counts:{ operation_count:safeOps.length, unique_business_record_count:safeUniqueIds.length }
  };

  fs.writeFileSync(path.join(outDir,'recovery-batch1-no-action-readonly.json'), JSON.stringify({rowCount:zeroArtifact.length, rows:zeroArtifact}, null, 2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-duplicate-breakdown-original-universe-readonly.json'), JSON.stringify({rowCount:actionableWithClass.length, finalCounts, evidenceCounts, phoneCollisionReport}, null, 2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-field-operations-original-universe-readonly.json'), JSON.stringify({rowCount:opRows.length, rows:opRows}, null, 2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-safe-normalization-ops-original-universe-readonly.json'), JSON.stringify({rowCount:safeOps.length, rows:safeOps, safeWebsiteOperationCount:safeWebsiteOps.length, safePhoneOperationCount:safePhoneOps.length, recordsContainingBoth:bothIds.length, uniqueRecordCount:safeUniqueIds.length, excludedOperationCount:excludedOps.length, excludedReasons:excludedReasonCounts}, null, 2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-near-approval-review-original-universe-readonly.json'), JSON.stringify({rowCount:nearApproval17.length, rows:nearApproval17}, null, 2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-safe-write-proposal-original-universe-readonly.json'), JSON.stringify(safeProposal, null, 2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-summary-original-universe-readonly.json'), JSON.stringify(summary, null, 2));

  console.log(JSON.stringify(summary, null, 2));
  await client.close();
})().catch(err=>{ console.error(err); process.exit(1); });
