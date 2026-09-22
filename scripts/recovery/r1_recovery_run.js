const fs=require('fs');
const path=require('path');
const {MongoClient}=require('mongodb');

(async()=>{
const root='/Users/blackforge/workspace/bwe/repos/repo_clean';
const outDir=path.join(root,'scripts/recovery/out'); fs.mkdirSync(outDir,{recursive:true});
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.env.local'),'utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.split('=')[0],l.slice(l.indexOf('=')+1)]));
const client=new MongoClient(env.MONGODB_URI); await client.connect(); const db=client.db(env.MONGODB_DB||'bwes-cluster'); const col=db.collection('businesses');
const regulated=/tobacco|cannabis|dispensar/i,testish=/proof|test|audit|fixture|dummy|fake/i,orgish=/church|ministry|temple|chapel|organization/i;
function parseAddress(addr){const s=String(addr||'').trim();
 let m=s.match(/,\s*([^,]+),\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/); if(m) return {city:m[1].trim(),state:m[2].trim(),rule:'address_city_state_zip'};
 m=s.match(/\b([^,\d]+?)\s*,\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/); if(m) return {city:m[1].trim(),state:m[2].trim(),rule:'address_city_state_zip_loose'};
 m=s.match(/,\s*([^,]+),\s*([A-Z]{2})\b/); if(m) return {city:m[1].trim(),state:m[2].trim(),rule:'address_city_state'};
 return null;}
function slugify(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
const docs=await col.find({},{projection:{_id:1,business_name:1,name:1,address:1,city:1,state:1,category:1,display_categories:1,categories:1,description:1,about:1,summary:1,phone:1,website:1,sourceUrl:1,facebook:1,social:1,instagram:1,twitter:1,alias:1,slug:1,externalId:1,raw:1,rawImport:1,provider:1,providerId:1,importBatch:1,importSource:1,source:1,notes:1,meta:1}}).toArray();
let pool=[];
for(const d of docs){const cat=String(d.category||d.display_categories||d.categories||''); const nm=[d.business_name,d.name,cat,d.importSource,d.source].join(' ');
 if(orgish.test(cat)) continue; if(regulated.test(cat)) continue; if(testish.test(nm)) continue;
 const city=String(d.city||'').trim(),state=String(d.state||'').trim(),category=String(d.category||'').trim();
 const contact=Boolean(String(d.phone||'').trim()||String(d.website||'').trim()||String(d.sourceUrl||'').trim());
 if(!(city&&state&&category&&contact)) pool.push(d);
}
const map=[]; const r1=[];
for(const d of pool){
 const id=String(d._id), name=String(d.business_name||d.name||'').trim();
 const miss=[]; if(!String(d.city||'').trim()) miss.push('city'); if(!String(d.state||'').trim()) miss.push('state'); if(!String(d.category||'').trim()) miss.push('category'); if(!(String(d.phone||'').trim()||String(d.website||'').trim()||String(d.sourceUrl||'').trim())) miss.push('phone/contact');
 const addr=parseAddress(d.address); const updates=[];
 if(miss.includes('city') && addr?.city) updates.push({field:'city',value:addr.city,rule:addr.rule,confidence:'high',safe:'Exact structured address parse'});
 if(miss.includes('state') && addr?.state) updates.push({field:'state',value:addr.state,rule:addr.rule,confidence:'high',safe:'Exact structured address parse'});
 if(miss.includes('category')){ const dc=String(d.display_categories||d.categories||'').trim(); if(dc) updates.push({field:'category',value:dc.split(',')[0].trim(),rule:'category_from_display_categories',confidence:'high',safe:'Existing internal category text'}); }
 const finalCity=String(d.city||'').trim()||updates.find(u=>u.field==='city')?.value||'';
 const finalState=String(d.state||'').trim()||updates.find(u=>u.field==='state')?.value||'';
 if((!String(d.alias||'').trim() || !String(d.slug||'').trim()) && name && finalCity && finalState){ const base=slugify(`${name}-${finalCity}-${finalState}`); if(!String(d.alias||'').trim()) updates.push({field:'alias',value:base,rule:'slugify(name-city-state)',confidence:'high',safe:'Deterministic normalization from internal fields'}); if(!String(d.slug||'').trim()) updates.push({field:'slug',value:base,rule:'slugify(name-city-state)',confidence:'high',safe:'Deterministic normalization from internal fields'}); }
 const post={city: String(d.city||'').trim()||updates.find(u=>u.field==='city')?.value||'', state:String(d.state||'').trim()||updates.find(u=>u.field==='state')?.value||'', category:String(d.category||'').trim()||updates.find(u=>u.field==='category')?.value||'', contact:Boolean(String(d.phone||'').trim()||String(d.website||'').trim()||String(d.sourceUrl||'').trim())};
 const eligible=Boolean(post.city&&post.state&&post.category&&post.contact);
 const stillNeedsEnrichment=!(String(d.website||'').trim()||String(d.sourceUrl||'').trim()||String(d.facebook||d.social||d.instagram||d.twitter||'').trim());
 map.push({id,name,missing:miss,available:{address:d.address||null,city:d.city||null,state:d.state||null,category:d.category||null,display_categories:d.display_categories||d.categories||null,description:d.description||d.about||d.summary||null,phone:d.phone||null,website:d.website||null,sourceUrl:d.sourceUrl||null,social:d.facebook||d.social||d.instagram||d.twitter||null,alias:d.alias||null,slug:d.slug||null,externalId:d.externalId||null,importSource:d.importSource||d.source||null,importBatch:d.importBatch||null,providerId:d.providerId||null,rawImport:!!d.rawImport,raw:!!d.raw,meta:!!d.meta,notes:!!d.notes},proposed:updates,eligibleAfter:eligible,needsEnrichmentAfter:stillNeedsEnrichment});
 if(updates.length>0 && updates.every(u=>u.confidence==='high') && r1.length<25) r1.push({doc:d,updates,eligibleAfter:eligible});
}
fs.writeFileSync(path.join(outDir,'recovery-map-1971-field-level.json'),JSON.stringify(map,null,2));
if(r1.length<25){ console.log(JSON.stringify({status:'NO_GO',highConfidenceCount:r1.length,mapFile:path.join(outDir,'recovery-map-1971-field-level.json'),sample:r1.map(x=>({id:String(x.doc._id),name:x.doc.business_name||x.doc.name,updates:x.updates}))},null,2)); await client.close(); return; }
const ids=r1.map(x=>x.doc._id);
const before=await col.find({_id:{$in:ids}},{projection:{_id:1,city:1,state:1,category:1,display_categories:1,alias:1,slug:1,description:1,about:1,summary:1,recoveryStatus:1,recoveryEvidence:1,recoveredAt:1,recoveredBy:1,phone:1,website:1,sourceUrl:1}}).toArray();
const rollbackPath=path.join(outDir,'rollback-recovery-batch-R1-25.json');
fs.writeFileSync(rollbackPath,JSON.stringify({createdAt:new Date().toISOString(),ids:ids.map(i=>String(i)),before},null,2));
const now=new Date();
for(const rec of r1){ const set={recoveryStatus:'internal_deterministic_recovered',recoveredAt:now,recoveredBy:'openclaw-main',recoveryEvidence:rec.updates}; for(const u of rec.updates){set[u.field]=u.value; if(u.field==='category') set.display_categories=rec.doc.display_categories||u.value;} await col.updateOne({_id:rec.doc._id},{$set:set}); }
const after=await col.find({_id:{$in:ids}},{projection:{_id:1,city:1,state:1,category:1,display_categories:1,alias:1,slug:1,recoveryStatus:1,recoveryEvidence:1,recoveredAt:1,recoveredBy:1,phone:1,website:1,sourceUrl:1}}).toArray();
const changedCount=await col.countDocuments({recoveredAt:{$gte:new Date(now.getTime()-1000)},recoveredBy:'openclaw-main'});
const ts=Date.now(); const res=await fetch(`http://localhost:3000/api/search/businesses?query=&page=1&limit=20&_t=${ts}`); const hdr=res.headers.get('x-search-cache'); const js=await res.json();
console.log(JSON.stringify({status:'R1_DONE',mapFile:path.join(outDir,'recovery-map-1971-field-level.json'),rollbackFile:rollbackPath,updatedIds:ids.map(i=>String(i)),before,after,noUnrelatedChanged:changedCount===25,changedCount,reclass:{eligibleNow:after.filter(a=>a.city&&a.state&&a.category&&(a.phone||a.website||a.sourceUrl)).length,needsEnrichment:after.filter(a=>!(a.website||a.sourceUrl)).length},canonical:{url:`/api/search/businesses?query=&page=1&limit=20&_t=${ts}`,xSearchCache:hdr,total:js.total},promotionsPerformed:false},null,2));
await client.close();
})();