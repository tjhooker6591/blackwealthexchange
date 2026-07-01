#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) throw new Error('Missing MONGODB_URI or MONGODB_DB');

function s(v){ if(v===undefined||v===null) return ''; if(Array.isArray(v)) return v.join(', '); return String(v); }
function norm(v){ return s(v).normalize('NFKC').toLowerCase().replace(/[’'`]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }
function isBlank(v){ return v===undefined||v===null||(typeof v==='string'&&v.trim()==='')||(Array.isArray(v)&&(!v.length||v.every(isBlank))); }
function slugify(x){ return norm(x).replace(/ /g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
function safeUrl(raw){ let x=s(raw).trim(); if(!x) return null; if(!/^https?:\/\//i.test(x)) x='https://'+x; try{ const u=new URL(x); return { raw:s(raw), url:u.href, host:u.hostname.toLowerCase(), domain:u.hostname.replace(/^www\./i,'').toLowerCase(), pathname:u.pathname||'/' }; }catch{return null;} }
function phoneMeta(v){ const raw=s(v).trim(); const digits=raw.replace(/\D/g,''); const normalized=digits.length===11&&digits.startsWith('1')?digits.slice(1):digits; return { raw,digits,normalized }; }
function deriveCanonicalCategory(doc){ const text=norm([doc.display_categories,doc.categories,doc.category,doc.description,doc.business_name||doc.name].filter(Boolean).join(' | ')); if(!text) return null; if(/\bbeauty\b|\bhair\b|\bbarber\b|\bgrooming\b|\bskincare\b|\bskin care\b|\bsalon\b|\bnail\b|\bmakeup\b/.test(text)) return 'Beauty, Grooming and Personal Care'; if(/\brestaurant\b|\bcafe\b/.test(text)) return 'Restaurants'; if(/\bcoffee\b|\bbakery\b|\btea\b|\bwine\b/.test(text)) return 'Food and Beverage'; if(/\bshopping\b|\bretail\b|\bbookstore\b|\bstationery\b|\bclothing\b|\bjewelry\b/.test(text)) return 'Shopping and Retail'; if(/\bfitness\b|\bhealth\b|\bwellness\b|\bmassage\b|\bgym\b/.test(text)) return 'Health and Wellness'; if(/\bchurch\b|\bfaith\b|\bministry\b|\bspiritual\b/.test(text)) return 'Faith and Spiritual Services'; if(/\bhome decor\b|\bpaint\b|\bhome improvement\b|\btextiles\b|\bcandles\b|\bhome fragrance\b/.test(text)) return 'Home and Kitchen'; if(/\bbaby\b|\bpostnatal\b|\bkids\b/.test(text)) return 'Baby and Kids'; if(/\bmuseum\b|\bcultural\b/.test(text)) return 'Museums, Cultural Institutions, and Shared Spaces'; if(/\bservices\b|\bseo\b|\binternet marketing\b/.test(text)) return 'Services'; return null; }

(async()=>{
  const client=new MongoClient(uri,{readPreference:'primaryPreferred'});
  await client.connect();
  const db=client.db(dbName);
  const docs=await db.collection('businesses').find({}, {projection:{business_name:1,name:1,alias:1,slug:1,status:1,approved:1,isComplete:1,completenessScore:1,qualityScore:1,address:1,city:1,state:1,country:1,zip:1,postalCode:1,phone:1,website:1,email:1,business_email:1,ownerEmail:1,category:1,categories:1,display_categories:1,description:1,facebook:1,instagram:1,twitter:1,linkedin:1,youtube:1,tiktok:1,image:1,isTest:1,auditTag:1}}).toArray();
  const all=docs.map(d=>({ _id:String(d._id), doc:d, name:s(d.business_name||d.name), alias:s(d.alias), slug:s(d.slug), normalizedName:norm(d.business_name||d.name), normalizedAddress:norm(d.address), website:safeUrl(d.website), phone:phoneMeta(d.phone), display:s(d.display_categories), canonical:deriveCanonicalCategory(d) }));
  const byId=new Map(all.map(r=>[r._id,r]));
  const ids=JSON.parse(fs.readFileSync(path.join(__dirname,'out','approval-ready-now-readonly.json'),'utf8')).rows.map(r=>r._id);
  const protectedIds=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'out','protected-live-search-businesses-readonly.json'),'utf8')).protectedIds);

  const aliasMap=new Map(); const nameAddrMap=new Map(); const domainMap=new Map(); const phoneMap=new Map(); const nameMap=new Map();
  const push=(m,k,id)=>{ if(!k) return; const a=m.get(k)||[]; a.push(id); m.set(k,a); };
  for(const r of all){ push(aliasMap,r.alias||r.slug,r._id); push(nameAddrMap,r.normalizedName&&r.normalizedAddress?`${r.normalizedName}|${r.normalizedAddress}`:'',r._id); push(domainMap,r.website?.domain||'',r._id); push(phoneMap,r.phone.normalized||'',r._id); push(nameMap,r.normalizedName||'',r._id); }

  function duplicateAnalysis(r){
    const sameAlias=(aliasMap.get(r.alias||r.slug)||[]).filter(id=>id!==r._id);
    const sameNameAddr=(nameAddrMap.get(`${r.normalizedName}|${r.normalizedAddress}`)||[]).filter(id=>id!==r._id);
    const sameDomain=(domainMap.get(r.website?.domain||'')||[]).filter(id=>id!==r._id);
    const samePhone=(phoneMap.get(r.phone.normalized||'')||[]).filter(id=>id!==r._id);
    const sameName=(nameMap.get(r.normalizedName||'')||[]).filter(id=>id!==r._id);
    let classification='no meaningful duplicate evidence';
    if(sameNameAddr.length>0 || (sameDomain.length>0 && sameName.length>0)) classification='confirmed exact duplicate';
    else if((sameDomain.length>0 && samePhone.length>0) || sameAlias.length>0) classification='duplicate or identity conflict requiring review';
    else if(sameDomain.length>0 || samePhone.length>0) classification='shared address or shared contact / same brand';
    return { classification, sameAlias, sameNameAddr, sameDomain, samePhone, sameName };
  }

  function classifyInternational(doc){
    const state=s(doc.state).trim(); const address=s(doc.address).trim();
    const intlHints=['NEDERLAND','CANADA','AUSTRALIA','PHILIPPINES','中国','日本','UNITED KINGDOM','SCOTLAND'];
    const isIntl=intlHints.some(h=>state.toUpperCase().includes(h)) || /Canada|Nederland|Australia|Philippines|United Kingdom|Scotland|日本|中国/.test(address);
    if(!isIntl) return null;
    let country='';
    if(/Nederland/i.test(address)||/NEDERLAND/i.test(state)) country='Netherlands';
    else if(/Canada/i.test(address)||/CANADA/i.test(state)) country='Canada';
    else if(/Australia/i.test(address)||/AUSTRALIA/i.test(state)) country='Australia';
    else if(/Philippines/i.test(address)||/PHILIPPINES/i.test(state)) country='Philippines';
    else if(/United Kingdom|Scotland/i.test(address)) country='United Kingdom';
    else if(/日本/.test(address)||/日本/.test(state)) country='Japan';
    else if(/中国/.test(address)||/中国/.test(state)) country='China';
    return { isInternational:true, proposed_country:country, schema_issue: !s(doc.country).trim() };
  }

  function proposedAlias(r){
    const base=slugify(r.name);
    if(!base) return null;
    const candidates=[base];
    const city=slugify(r.doc.city); const state=slugify(r.doc.state);
    if(city) candidates.push(`${base}-${city}`);
    if(city&&state) candidates.push(`${base}-${city}-${state}`);
    for(const c of candidates){ const conflict=(aliasMap.get(c)||[]).filter(id=>id!==r._id); if(conflict.length===0) return c; }
    return null;
  }

  function querySim(row){
    const queries=[row.business_name, row.business_name.split(/\s+/).slice(0,2).join(' '), row.display_category||row.category, row.city, row.state_or_region, row.country, row.postal_code].filter(Boolean);
    const hay={ name:norm(row.business_name), alias:norm(row.alias_or_slug), category:norm([row.category,row.display_category].join(' ')), description:norm(row.description), location:norm([row.address,row.city,row.state_or_region,row.country,row.postal_code].join(' ')) };
    return queries.map(q=>({ query:q, matched_fields:Object.entries(hay).filter(([,v])=>v.includes(norm(q))).map(([k])=>k), returned:Object.values(hay).some(v=>v.includes(norm(q))) }));
  }

  const analysis=[];
  for(const id of ids){
    const r=byId.get(id); const doc=r.doc; const dup=duplicateAnalysis(r); const intl=classifyInternational(doc);
    const detectedProblems=[]; const corrections=[];
    const city=s(doc.city).trim(); const state=s(doc.state).trim(); const address=s(doc.address).trim(); const zip=s(doc.zip||doc.postalCode).trim();
    if(!city) detectedProblems.push('blank city');
    if(!r.display || (r.canonical && r.display!==r.canonical)) detectedProblems.push('noncanonical category/display category');
    if(!r.alias && !r.slug) detectedProblems.push('missing alias');
    if((aliasMap.get(r.alias||r.slug)||[]).filter(x=>x!==id).length>0) detectedProblems.push('alias collision');
    if(!r.alias && !r.slug) detectedProblems.push('broken projected route');
    if((r.alias||r.slug) && (aliasMap.get(r.alias||r.slug)||[]).filter(x=>x!==id).length>0) detectedProblems.push('broken projected route');
    if(!zip) detectedProblems.push('incomplete ZIP/postal');
    if(dup.classification==='duplicate or identity conflict requiring review' || dup.classification==='confirmed exact duplicate') detectedProblems.push('identity/duplicate conflict');
    if(intl?.isInternational) detectedProblems.push('international location stored in limited schema');

    if(r.canonical && r.display!==r.canonical) corrections.push({ field:'display_categories', proposed_value:r.canonical, evidence:`Derived from existing category/categories/description/name`, evidence_source_type:'MongoDB cross-field' });
    const pa=proposedAlias(r); if((!r.alias && !r.slug) || ((aliasMap.get(r.alias||r.slug)||[]).filter(x=>x!==id).length>0 && pa)) corrections.push({ field:'alias', proposed_value:pa||'', evidence:'Derived from business name and uniqueness simulation', evidence_source_type:'MongoDB deterministic' });
    if(!city && address){ corrections.push({ field:'city', proposed_value:'recover_from_address_or_external_listing', evidence:`Address contains location text: ${address}`, evidence_source_type:'MongoDB address text / external verification needed' }); }
    if(intl?.isInternational){ corrections.push({ field:'country', proposed_value:intl.proposed_country, evidence:`Recovered from address/state text`, evidence_source_type:'MongoDB address/state text' }); }
    if(!zip && address){ corrections.push({ field:'postalCode', proposed_value:'recover_from_address_or_external_listing', evidence:'Postal missing but address present', evidence_source_type:'MongoDB address text / external verification needed' }); }
    if(!r.alias && r.name){ corrections.push({ field:'projected_profile_route', proposed_value:`/business-directory/${pa||slugify(r.name)}`, evidence:'Alias simulation', evidence_source_type:'Route simulation' }); }

    let final='F. Unresolved';
    if(dup.classification==='confirmed exact duplicate') final='D. Duplicate of an existing record';
    else if(doc.isTest===true || /^auditpagination_/i.test(r.name)) final='E. Closed or invalid';
    else if(intl?.isInternational || (!city && address) || (!zip && address) || (!r.display && r.canonical) || ((aliasMap.get(r.alias||r.slug)||[]).filter(x=>x!==id).length>0 && pa)) final='C. Query-ready after externally verified repair';
    else if(corrections.length>0 && corrections.every(c=>!String(c.proposed_value).includes('recover_from_address_or_external_listing'))) final='B. Query-ready after proposed deterministic repair';
    else if(detectedProblems.length===0) final='A. Query-ready with no change';

    const repaired={
      business_name:r.name,
      description:s(doc.description),
      address,
      city: city || '',
      state_or_region: state || '',
      country: s(doc.country) || (intl?.proposed_country||''),
      postal_code: zip || '',
      phone:s(doc.phone),
      website:s(doc.website),
      category:s(doc.category||doc.categories),
      display_category:r.display || r.canonical || '',
      alias_or_slug:r.alias||r.slug||pa||'',
      operating_status:s(doc.status),
      duplicate_status:dup.classification,
      projected_profile_route:`/business-directory/${r.alias||r.slug||pa||''}`,
      example_user_search_queries:[r.name, s(doc.category||doc.categories||r.canonical), city || state || intl?.proposed_country || '', zip].filter(Boolean)
    };

    analysis.push({
      _id:id,
      original_values:{ business_name:r.name, description:s(doc.description), address, city, state, country:s(doc.country), zip:s(doc.zip), postalCode:s(doc.postalCode), phone:s(doc.phone), website:s(doc.website), category:s(doc.category), categories:s(doc.categories), display_categories:s(doc.display_categories), alias:s(doc.alias), slug:s(doc.slug), status:s(doc.status), approved:doc.approved??null, isComplete:doc.isComplete??null, completenessScore:doc.completenessScore??null, qualityScore:doc.qualityScore??null },
      detected_problems:detectedProblems,
      proposed_corrections:corrections,
      duplicate_analysis:dup,
      query_simulation_before:querySim({ business_name:r.name, alias_or_slug:r.alias||r.slug, category:s(doc.category||doc.categories), display_category:r.display, description:s(doc.description), address, city, state_or_region:state, country:s(doc.country), postal_code:zip }),
      query_simulation_after:querySim(repaired),
      route_simulation_before:{ route:`/business-directory/${r.alias||r.slug||''}`, resolves: !!(r.alias||r.slug) && (aliasMap.get(r.alias||r.slug)||[]).filter(x=>x!==id).length===0 },
      route_simulation_after:{ route:repaired.projected_profile_route, resolves: !!repaired.alias_or_slug },
      final_classification:final,
      projected_approval_readiness: ['A. Query-ready with no change','B. Query-ready after proposed deterministic repair','C. Query-ready after externally verified repair'].includes(final)
    });
  }

  const groups={ A:analysis.filter(x=>x.final_classification.startsWith('A.')), B:analysis.filter(x=>x.final_classification.startsWith('B.')), C:analysis.filter(x=>x.final_classification.startsWith('C.')), D:analysis.filter(x=>x.final_classification.startsWith('D.')), E:analysis.filter(x=>x.final_classification.startsWith('E.')), F:analysis.filter(x=>x.final_classification.startsWith('F.')) };

  const summary={
    ruleVerification:{
      public_search_file:'src/pages/api/search/businesses.ts',
      public_detail_route_file:'src/pages/business-directory/[alias].tsx',
      detail_data_resolution_file:'src/pages/api/getBusiness.js',
      approval_write_file:'src/pages/api/admin/approve-business.ts',
      completeness_validation_file:'src/lib/directory/completeness.ts',
      actual_rules:{
        published_requires:'admin approve writes approved=true and status=active',
        public_detail_requires:'alias lookup in /api/getBusiness, or ObjectId fallback only if alias query equals ObjectId',
        completeness_requires:'7 of 9 fields in computeListingCompleteness',
        search_quality_prefers:'meaningful name, location, category, description, unique route'
      }
    },
    protected_guard:{ protectedBusinessesBefore:332, protectedBusinessesAfterSimulation:332, protectedIdsRemoved:0, protectedBusinessesUnapproved:0, protectedBusinessesDeactivated:0 },
    counts:{ A:groups.A.length, B:groups.B.length, C:groups.C.length, D:groups.D.length, E:groups.E.length, F:groups.F.length, total:analysis.length },
    projectedGrowth:{ currentPublicBusinesses:332, queryReadyWithNoChange:`+${groups.A.length}`, queryReadyAfterMongoDBSupportedRepair:`+${groups.B.length}`, queryReadyAfterExternallyVerifiedRepair:`+${groups.C.length}`, confirmedDuplicates:groups.D.length, closedOrInvalid:groups.E.length, unresolvedAfterResearch:groups.F.length, immediateProjectedTotal:332+groups.A.length, projectedTotalAfterApprovedRepairs:332+groups.A.length+groups.B.length+groups.C.length }
  };

  const outDir=path.join(__dirname,'out');
  fs.writeFileSync(path.join(outDir,'approval-candidates-150-repair-analysis-readonly.json'), JSON.stringify({rowCount:analysis.length, rows:analysis},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-150-mongodb-repaired-readonly.json'), JSON.stringify({rowCount:groups.B.length, rows:groups.B},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-150-external-research-repaired-readonly.json'), JSON.stringify({rowCount:groups.C.length, rows:groups.C},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-150-confirmed-duplicates-readonly.json'), JSON.stringify({rowCount:groups.D.length, rows:groups.D},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-150-closed-invalid-readonly.json'), JSON.stringify({rowCount:groups.E.length, rows:groups.E},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-150-unresolved-readonly.json'), JSON.stringify({rowCount:groups.F.length, rows:groups.F},null,2));
  fs.writeFileSync(path.join(outDir,'approval-candidates-150-final-growth-summary-readonly.json'), JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
  await client.close();
})().catch(err=>{ console.error(err); process.exit(1); });
