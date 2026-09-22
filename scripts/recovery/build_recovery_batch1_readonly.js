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
function phone(v){const d=s(v).replace(/\D/g,''); return d.length===11&&d.startsWith('1')?d.slice(1):d;}
function url(v){let x=s(v).trim(); if(!x) return ''; if(!/^https?:\/\//i.test(x)) x='https://'+x; try{const u=new URL(x); u.hash=''; let p=u.pathname.replace(/\/+$/,''); if(p==='/')p=''; return `${u.protocol}//${u.hostname.toLowerCase()}${p}`;}catch{return ''}}
function domain(v){const u=url(v); if(!u) return ''; try{return new URL(u).hostname.replace(/^www\./i,'').toLowerCase();}catch{return ''}}
function emailDomain(v){const x=s(v).trim().toLowerCase(); const i=x.lastIndexOf('@'); return i>-1?x.slice(i+1):''}
function addr(v){return norm(v).replace(/\bavenue\b/g,'ave').replace(/\bstreet\b/g,'st').replace(/\broad\b/g,'rd').replace(/\bboulevard\b/g,'blvd').replace(/\bdrive\b/g,'dr').replace(/\blane\b/g,'ln').replace(/\bplace\b/g,'pl').replace(/\bsuite\b/g,'ste').replace(/\bunit\b/g,'unit').trim();}
function titleCase(x){return s(x).replace(/\b\w/g,m=>m.toUpperCase());}
function slugify(x){return norm(x).replace(/ /g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');}
function mapCategory(doc){
  const raw=s(doc.display_categories||doc.categories||doc.category);
  const n=norm(raw+' '+s(doc.description)+' '+s(doc.business_name||doc.name));
  if(/\brestaurant\b|\bcafe\b|\bcatering\b/.test(n)) return 'Restaurants';
  if(/\bbakery\b|\bcoffee\b/.test(n)) return 'Food and Beverage';
  if(/\bbeauty\b|\bhair\b|\bbarber\b|\bgrooming\b|\bskincare\b|\bskin care\b|\bcosmetics\b|\bsalon\b|\bnails?\b/.test(n)) return 'Beauty, Grooming and Personal Care';
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

  const rows = docs.map(doc=>{
    const protectedBusiness = protectedState(doc);
    return {
      _id:String(doc._id), doc, protectedBusiness,
      currentName:s(doc.business_name||doc.name),
      inferred: inferredName(doc),
      normalizedPhone: phone(doc.phone),
      normalizedWebsite: url(doc.website),
      websiteDomain: domain(doc.website),
      emailDomain: emailDomain(doc.business_email||doc.email||doc.ownerEmail),
      normalizedAddress: addr(doc.address),
      normalizedCategory: mapCategory(doc),
      aliasOrSlug: s(doc.alias||doc.slug),
      city:s(doc.city), state:s(doc.state), description:s(doc.description)
    }
  });

  const byPhone = new Map(), byDomain = new Map(), byAddr = new Map();
  const push=(m,k,id)=>{ if(!k) return; const a=m.get(k)||[]; a.push(id); m.set(k,a); };
  for(const r of rows){
    push(byPhone,r.normalizedPhone,r._id);
    push(byDomain,r.websiteDomain,r._id);
    push(byAddr,r.normalizedAddress && norm(r.city) && norm(r.state) ? `${r.normalizedAddress}|${norm(r.city)}|${norm(r.state)}` : '',r._id);
  }
  const byId = new Map(rows.map(r=>[r._id,r]));

  function duplicateStatus(r){
    const hits=[];
    const samePhone=(byPhone.get(r.normalizedPhone)||[]).filter(x=>x!==r._id);
    const sameDomain=(byDomain.get(r.websiteDomain)||[]).filter(x=>x!==r._id);
    const sameAddr=(byAddr.get(r.normalizedAddress && norm(r.city) && norm(r.state) ? `${r.normalizedAddress}|${norm(r.city)}|${norm(r.state)}` : '')||[]).filter(x=>x!==r._id);
    if(samePhone.length) hits.push('exact_phone');
    if(sameDomain.length) hits.push('exact_website_domain');
    if(sameAddr.length) hits.push('exact_address');
    const matched = samePhone[0] || sameDomain[0] || sameAddr[0] || '';
    let status='none';
    if((samePhone.length&&sameAddr.length)||(sameDomain.length&&sameAddr.length)) status='confirmed exact duplicate key collision';
    else if(sameDomain.length&&!sameAddr.length) status='same brand, separate location';
    else if(samePhone.length||sameAddr.length||sameDomain.length) status='possible duplicate';
    return {status, matchedId: matched, evidence: hits};
  }

  function missingFields(r){
    const out=[];
    if(isBlank(r.currentName) && isBlank(r.inferred.name)) out.push('business_name');
    if(isBlank(r.doc.address) && (isBlank(r.doc.city)||isBlank(r.doc.state))) out.push('location');
    if(isBlank(r.normalizedCategory)) out.push('category');
    if(isBlank(r.description)) out.push('description');
    if(isBlank(r.aliasOrSlug)) out.push('alias_or_slug');
    return out;
  }

  const candidates=[];
  for(const r of rows){
    if(r.protectedBusiness) continue;
    const dup=duplicateStatus(r);
    const proposed={};
    const evidence=[];
    let strength=0;

    if(isBlank(r.currentName) && r.inferred.name){
      proposed.business_name=r.inferred.name;
      evidence.push({field:'business_name', source:r.inferred.source, type:r.inferred.source.includes('website')?'MongoDB cross-field':'MongoDB cross-field'});
      strength += r.inferred.source==='mongodb_website_domain' ? 3 : 2;
    }
    if(s(r.doc.phone)!==r.normalizedPhone && r.normalizedPhone){ proposed.phone=r.normalizedPhone; evidence.push({field:'phone', source:'mongodb_direct_normalization', type:'MongoDB-direct'}); strength += 1; }
    if(s(r.doc.website)!==r.normalizedWebsite && r.normalizedWebsite){ proposed.website=r.normalizedWebsite; evidence.push({field:'website', source:'mongodb_direct_normalization', type:'MongoDB-direct'}); strength += 1; }
    if(mapCategory(r.doc) && mapCategory(r.doc)!==s(r.doc.display_categories||r.doc.categories||r.doc.category)) { proposed.display_categories=mapCategory(r.doc); evidence.push({field:'display_categories', source:'mongodb_cross_field_category_mapping', type:'MongoDB cross-field'}); strength += 2; }
    if(isBlank(r.doc.alias) && isBlank(r.doc.slug) && (proposed.business_name || r.currentName)) { proposed.alias=slugify(proposed.business_name||r.currentName); evidence.push({field:'alias', source:'derived_from_business_name', type:'MongoDB cross-field'}); strength += 1; }

    const fieldsMissing=missingFields(r);
    const nearlyComplete = fieldsMissing.length <= 2;
    const strongClues = Boolean((r.normalizedWebsite && (isBlank(r.currentName)||proposed.business_name)) || (r.emailDomain && isBlank(r.currentName)) || (r.normalizedPhone && r.normalizedAddress) || (r.normalizedAddress && r.normalizedCategory && r.description));
    if(!strongClues) continue;
    if(Object.keys(proposed).length===0 && dup.status==='none' && !nearlyComplete) continue;

    const confidence = dup.status==='confirmed exact duplicate key collision' ? 'high' : strength >=4 ? 'high' : strength >=2 ? 'medium' : 'low';
    const approvalReadiness = dup.status==='none' && fieldsMissing.filter(f=>!Object.keys(proposed).includes(f==='alias_or_slug'?'alias':f)).length===0 ? 'requires verification before approval' : 'not ready';
    const manual = confidence!=='high' || dup.status!=='none' || approvalReadiness!=='requires verification before approval';

    candidates.push({
      _id:r._id,
      current_values:{
        business_name:r.currentName,
        phone:s(r.doc.phone),
        website:s(r.doc.website),
        address:s(r.doc.address),
        city:s(r.doc.city),
        state:s(r.doc.state),
        category:s(r.doc.category),
        categories:s(r.doc.categories),
        display_categories:s(r.doc.display_categories),
        description:s(r.doc.description),
        alias:s(r.doc.alias),
        slug:s(r.doc.slug),
      },
      proposed_values:proposed,
      evidence_source:evidence,
      evidence_basis: evidence.map(e=>e.type),
      duplicate_status:dup.status,
      matched_existing_record_id:dup.matchedId,
      duplicate_evidence:dup.evidence,
      confidence,
      fields_still_missing:fieldsMissing.filter(f=>!(f==='business_name'&&proposed.business_name)&&!(f==='alias_or_slug'&&proposed.alias)&&!(f==='category'&&proposed.display_categories)),
      approval_readiness:approvalReadiness,
      manual_review_required:manual,
      protected_business:false,
      candidate_reason:[
        isBlank(r.currentName)&&r.websiteDomain?'website_plus_missing_name':'',
        isBlank(r.currentName)&&r.emailDomain?'email_domain_plus_missing_name':'',
        r.normalizedPhone&&r.normalizedAddress?'phone_plus_address':'',
        r.normalizedAddress&&r.normalizedCategory&&r.description?'address_category_description':'',
        dup.status==='confirmed exact duplicate key collision'?'exact_duplicate_key_collision':'',
        nearlyComplete?'nearly_complete':''
      ].filter(Boolean)
    });
  }

  candidates.sort((a,b)=>{
    const rank=x=>x.confidence==='high'?3:x.confidence==='medium'?2:1;
    return rank(b)-rank(a) || a.manual_review_required-b.manual_review_required || a.fields_still_missing.length-b.fields_still_missing.length;
  });

  const top = candidates.slice(0,300);
  const summary = {
    environment:{ database:dbName, collection:'businesses', executionTimestamp:new Date().toISOString(), script:path.join(__dirname,'build_recovery_batch1_readonly.js') },
    totals:{ totalCandidates: candidates.length, deliveredCandidates: top.length },
    protectedSimulation:{ protectedBefore: rows.filter(r=>r.protectedBusiness).length, protectedAfter: rows.filter(r=>r.protectedBusiness).length, protectedIdsRemoved: 0, protectedBusinessesUnapproved: 0, protectedBusinessesDeactivated: 0 }
  };

  const outDir = path.join(__dirname,'out');
  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'recovery-batch1-candidates-readonly.json'), JSON.stringify(top,null,2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-candidates-full-readonly.json'), JSON.stringify(candidates,null,2));
  fs.writeFileSync(path.join(outDir,'recovery-batch1-summary-readonly.json'), JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
  await client.close();
})().catch(err=>{console.error(err);process.exit(1)});
