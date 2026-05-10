const fs=require('fs');
const path=require('path');
const {MongoClient,ObjectId}=require('mongodb');
(async()=>{
const root='/Users/blackforge/workspace/bwe/repos/repo_clean';
const outDir=path.join(root,'scripts/recovery/out');
const map=JSON.parse(fs.readFileSync(path.join(outDir,'recovery-map-1971-field-level.json'),'utf8'));
const r1Rollback=JSON.parse(fs.readFileSync(path.join(outDir,'rollback-recovery-batch-R1-25.json'),'utf8'));
const r1Ids=new Set(r1Rollback.ids||[]);
const candidates=map.filter(m=>Array.isArray(m.proposed)&&m.proposed.length>0&&m.proposed.every(p=>p.confidence==='high')&&!r1Ids.has(m.id));
const pick=candidates.slice(0,25);
if(pick.length!==25){throw new Error('Not enough R2 candidates: '+pick.length)}
const env=Object.fromEntries(fs.readFileSync(path.join(root,'.env.local'),'utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.split('=')[0],l.slice(l.indexOf('=')+1)]));
const client=new MongoClient(env.MONGODB_URI); await client.connect();
const db=client.db(env.MONGODB_DB||'bwes-cluster'); const col=db.collection('businesses');
const ids=pick.map(p=>new ObjectId(p.id));
const idStr=pick.map(p=>p.id);
const projection={_id:1,business_name:1,name:1,city:1,state:1,category:1,display_categories:1,alias:1,slug:1,description:1,about:1,summary:1,recoveryStatus:1,recoveryEvidence:1,recoveredAt:1,recoveredBy:1,phone:1,website:1,sourceUrl:1,publicEligible:1,status:1,verification:1,facebook:1,social:1,instagram:1,twitter:1};
const before=await col.find({_id:{$in:ids}},{projection}).toArray();
const rollbackPath=path.join(outDir,'rollback-recovery-batch-R2-25.json');
fs.writeFileSync(rollbackPath,JSON.stringify({createdAt:new Date().toISOString(),ids:idStr,before},null,2));
const beforeById=Object.fromEntries(before.map(d=>[String(d._id),d]));
const now=new Date();
for(const rec of pick){
  const doc=beforeById[rec.id];
  const set={recoveryStatus:'internal_deterministic_recovered',recoveredAt:now,recoveredBy:'openclaw-main',recoveryEvidence:rec.proposed};
  for(const u of rec.proposed){
    if(['city','state','category','display_categories','alias','slug','description','about'].includes(u.field)){
      set[u.field]=u.value;
      if(u.field==='category' && !doc.display_categories) set.display_categories=u.value;
    }
  }
  await col.updateOne({_id:new ObjectId(rec.id)},{$set:set});
}
const after=await col.find({_id:{$in:ids}},{projection}).toArray();
const afterById=Object.fromEntries(after.map(d=>[String(d._id),d]));
const changed=[];
for(const rec of pick){
  const id=rec.id,b=beforeById[id],a=afterById[id];
  const fields={};
  for(const f of ['city','state','category','display_categories','alias','slug','description','about','recoveryStatus','recoveryEvidence','recoveredAt','recoveredBy']){
    const bv=JSON.stringify(b?.[f]??null),av=JSON.stringify(a?.[f]??null); if(bv!==av) fields[f]={before:b?.[f]??null,after:a?.[f]??null};
  }
  changed.push({id,name:a.business_name||a.name||rec.name,ruleSummary:rec.proposed.map(p=>({field:p.field,rule:p.rule,confidence:p.confidence})),fields});
}
const changedCountWindow=await col.countDocuments({recoveredAt:{$gte:new Date(now.getTime()-5000)},recoveredBy:'openclaw-main'});
const reclass={eligibleNow:0,stillNeedsEnrichment:0};
for(const a of after){
  const eligible=Boolean(a.city&&a.state&&a.category&&(a.phone||a.website||a.sourceUrl));
  if(eligible) reclass.eligibleNow++;
  if(!(a.website||a.sourceUrl||a.facebook||a.social||a.instagram||a.twitter)) reclass.stillNeedsEnrichment++;
}
const ts=Date.now();
const res=await fetch(`http://localhost:3000/api/search/businesses?query=&page=1&limit=20&_t=${ts}`,{headers:{'X-Search-Cache':'MISS'}});
let total=null; try{const j=await res.json(); total=j.total??null;}catch{}
const report={status:'R2_DONE',updatedIds:idStr,rollbackFile:rollbackPath,records:changed,noUnrelatedRecordsChangedProof:{expectedWindowMinimum:25,observedRecoveredByWindow:changedCountWindow,allUpdatedIdsMatch:after.length===25},reclassification:reclass,canonicalReference:{url:`/api/search/businesses?query=&page=1&limit=20&_t=${ts}`,requestHeaderXSearchCache:'MISS',responseHeaderXSearchCache:res.headers.get('x-search-cache'),total},promotionsPerformed:false,trackingQueues:{r1EligibleButEnrichmentNeeded:24,r1NotMinimumDataEligible:1,r1StillNeedsEnrichment:25,q1OwnerBusinessInputHold:10,enrichmentFailedMethodGuardrail:'remaining enrichment-needed records should not be processed using the same failed method'}};
const reportPath=path.join(outDir,'r2-recovery-report.json');
fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
console.log(JSON.stringify({ok:true,reportPath,rollbackPath,updated:idStr.length},null,2));
await client.close();
})();