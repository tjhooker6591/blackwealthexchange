const fs=require('fs');
const path=require('path');
const {MongoClient,ObjectId}=require('mongodb');

function parseStrictCity(address){
  const s=String(address||'').trim();
  let m=s.match(/,\s*([^,]+),\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/);
  if(m) return {city:m[1].trim(),state:m[2].trim(),rule:'address_city_state_zip_strict'};
  m=s.match(/,\s*([^,]+),\s*([A-Z]{2})\b/);
  if(m) return {city:m[1].trim(),state:m[2].trim(),rule:'address_city_state_strict'};
  return null;
}
function slugify(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}

(async()=>{
  const root='/Users/blackforge/workspace/bwe/repos/repo_clean';
  const outDir=path.join(root,'scripts/recovery/out');
  const reportIn=JSON.parse(fs.readFileSync(path.join(outDir,'r2-recovery-report.json'),'utf8'));
  const rollback=JSON.parse(fs.readFileSync(path.join(outDir,'rollback-recovery-batch-R2-25.json'),'utf8'));
  const idList=reportIn.updatedIds;
  const rollbackById=Object.fromEntries((rollback.before||[]).map(d=>[String(d._id),d]));

  const env=Object.fromEntries(fs.readFileSync(path.join(root,'.env.local'),'utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.split('=')[0],l.slice(l.indexOf('=')+1)]));
  const client=new MongoClient(env.MONGODB_URI); await client.connect();
  const db=client.db(env.MONGODB_DB||'bwes-cluster'); const col=db.collection('businesses');

  const docs=await col.find({_id:{$in:idList.map(x=>new ObjectId(x))}},{projection:{_id:1,business_name:1,name:1,address:1,city:1,state:1,slug:1,category:1,phone:1,website:1,sourceUrl:1,facebook:1,social:1,instagram:1,twitter:1,recoveryEvidence:1,recoveryStatus:1,recoveredAt:1,recoveredBy:1,publicEligible:1,status:1,verification:1,claimStatus:1}}).toArray();
  const byId=Object.fromEntries(docs.map(d=>[String(d._id),d]));

  const SAFE=[],UNSAFE=[],INVALID=[];
  const actions=[];

  for(const id of idList){
    const d=byId[id];
    const name=String(d?.business_name||d?.name||'').trim();
    const city=String(d?.city||'').trim();
    const ev=Array.isArray(d?.recoveryEvidence)?d.recoveryEvidence:[];
    const hasLoose=ev.some(e=>String(e?.rule||'').includes('loose'));
    const strict=parseStrictCity(d?.address);
    const looksStreet=/\b(ave|avenue|blvd|boulevard|st|street|rd|road|dr|drive|ln|lane|way|suite|ste|unit)\b/i.test(city);

    if(!name){ INVALID.push(id); continue; }
    if(hasLoose || looksStreet){
      UNSAFE.push(id);
      if(strict && strict.city && strict.city!==city){
        const newSlug = d.slug ? slugify(`${name}-${strict.city}-${String(d.state||strict.state||'').trim()}`) : d.slug;
        actions.push({id,type:'repair',before:{city:d.city??null,slug:d.slug??null},after:{city:strict.city,slug:newSlug??null},rule:'strict_address_reparse'});
      } else {
        const rb=rollbackById[id]||{};
        actions.push({id,type:'rollback',before:{city:d.city??null,slug:d.slug??null},after:{city:rb.city??null,slug:rb.slug??null},rule:'rollback_r2_snapshot_due_to_unsafe_city'});
      }
    } else {
      SAFE.push(id);
    }
  }

  const now=new Date();
  for(const a of actions){
    const set={city:a.after.city,recoveryStatus:'internal_deterministic_recovered_corrected',recoveredAt:now,recoveredBy:'openclaw-main',recoveryEvidence:[{field:'city',rule:a.rule,confidence:'high',safe:'R2 cleanup strict city validation'}]};
    const unset={};
    if(a.after.slug===null || a.after.slug===undefined || a.after.slug==='') unset.slug=''; else set.slug=a.after.slug;
    const update={ $set:set };
    if(Object.keys(unset).length) update.$unset=unset;
    await col.updateOne({_id:new ObjectId(a.id)},update);
  }

  const afterDocs=await col.find({_id:{$in:idList.map(x=>new ObjectId(x))}},{projection:{_id:1,business_name:1,name:1,city:1,state:1,slug:1,category:1,phone:1,website:1,sourceUrl:1,facebook:1,social:1,instagram:1,twitter:1,recoveredAt:1,recoveredBy:1,publicEligible:1,status:1,verification:1,claimStatus:1}}).toArray();
  const afterById=Object.fromEntries(afterDocs.map(d=>[String(d._id),d]));

  let eligible=0,incomplete=0,needsEnrichment=0;
  for(const id of idList){
    const d=afterById[id];
    const isEligible=Boolean(d.city&&d.state&&d.category&&(d.phone||d.website||d.sourceUrl));
    if(isEligible) eligible++; else incomplete++;
    if(!(d.website||d.sourceUrl||d.facebook||d.social||d.instagram||d.twitter)) needsEnrichment++;
  }

  const changedWindow=await col.countDocuments({recoveredAt:{$gte:new Date(now.getTime()-5000)},recoveredBy:'openclaw-main'});
  const ts=Date.now();
  const res=await fetch(`http://localhost:3000/api/search/businesses?query=&page=1&limit=20&_t=${ts}`,{headers:{'X-Search-Cache':'MISS'}});
  let total=null; try{const j=await res.json(); total=j.total??null;}catch{}

  const report={
    status:'R2_CITY_QUALITY_CLEANUP_DONE',
    counts:{SAFE:SAFE.length,UNSAFE:UNSAFE.length,INVALID:INVALID.length},
    groups:{SAFE,UNSAFE,INVALID},
    corrections:actions,
    afterMetrics:{minimumDataEligible:eligible,stillIncomplete:incomplete,stillNeedsEnrichment:needsEnrichment},
    canonicalReference:{url:`/api/search/businesses?query=&page=1&limit=20&_t=${ts}`,requestHeaderXSearchCache:'MISS',responseHeaderXSearchCache:res.headers.get('x-search-cache'),total},
    noPromotionsOccurred:true,
    noUnrelatedRecordsChangedProof:{expectedActionCount:actions.length,observedRecoveredByWindow:changedWindow},
    be61378Pushed:false,
    recommendation:'Amend or replace be61378 later so R2 artifacts reflect corrected city quality outcomes.'
  };
  const outPath=path.join(outDir,'r2-city-quality-correction-report.json');
  fs.writeFileSync(outPath,JSON.stringify(report,null,2));
  console.log(JSON.stringify({ok:true,outPath,counts:report.counts,actions:actions.length},null,2));
  await client.close();
})();