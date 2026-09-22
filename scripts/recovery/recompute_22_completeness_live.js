#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

function asTrimmed(v){ if(typeof v==='string') return v.trim(); if(v==null) return ''; return String(v).trim(); }
function hasValue(v){ if(Array.isArray(v)) return v.some(x=>asTrimmed(x).length>0); return asTrimmed(v).length>0; }
function getAliasCategory(doc){
  if(hasValue(doc.display_categories)) return asTrimmed(doc.display_categories);
  if(Array.isArray(doc.categories)) return doc.categories.map(asTrimmed).filter(Boolean).join(', ');
  if(hasValue(doc.categories)) return asTrimmed(doc.categories);
  if(hasValue(doc.category)) return asTrimmed(doc.category);
  if(hasValue(doc.orgType)) return asTrimmed(doc.orgType);
  return '';
}
function computeListingCompleteness(doc){
  const checks = [
    ['name', hasValue(doc.business_name) || hasValue(doc.name) || hasValue(doc.organization_name)],
    ['description', hasValue(doc.description)],
    ['address', hasValue(doc.address)],
    ['city', hasValue(doc.city)],
    ['state', hasValue(doc.state)],
    ['phone', hasValue(doc.phone)],
    ['category', hasValue(getAliasCategory(doc))],
    ['website', hasValue(doc.website)],
    ['image', hasValue(doc.image)],
  ];
  const present = checks.filter(([,ok])=>ok).length;
  return {
    checks: Object.fromEntries(checks),
    presentCount: present,
    completenessScore: Math.round((present / checks.length) * 100),
    isComplete: present >= 7,
    missingFields: checks.filter(([,ok])=>!ok).map(([k])=>k),
  };
}

const ids = [
  '681d1df4fd9719ad7b26dfa2','681d1df4fd9719ad7b26dfa6','681d1df4fd9719ad7b26dfa8','681d1df4fd9719ad7b26dfa9','681d1df4fd9719ad7b26dfaa','681d1df4fd9719ad7b26dfab','681d1df4fd9719ad7b26dfac','681d1df4fd9719ad7b26dfb1','681d1df4fd9719ad7b26dfb2','681d1df4fd9719ad7b26dfb7','681d1df4fd9719ad7b26dfb8','681d1df4fd9719ad7b26dfbb','681d1df4fd9719ad7b26dfbd','681d1df4fd9719ad7b26dfc2','681d1df4fd9719ad7b26dfc4','681d1df4fd9719ad7b26dfc5','681d1df4fd9719ad7b26dfc6','681d1df4fd9719ad7b26dfcb','681d1df4fd9719ad7b26dfce','681d1df4fd9719ad7b26dfd3','681d1df4fd9719ad7b26dfda','681d1df4fd9719ad7b26dfdb'
];
const OUT = path.join(__dirname,'out');

(async()=>{
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'bwes-cluster');
  const col = db.collection('businesses');
  const docs = await col.find({_id:{$in:ids.map(id=>new ObjectId(id))}}).toArray();
  const beforeVisible = await col.countDocuments({
    $and:[
      {$or:[{status:'approved'},{status:'verified'},{status:'active'},{status:{$exists:false}},{status:''},{status:null}]},
      {$or:[{alias:{$exists:true,$type:'string',$ne:''}},{slug:{$exists:true,$type:'string',$ne:''}}]},
      {$or:[{isComplete:true},{completenessScore:{$gte:70}},{qualityScore:{$gte:70}}]}
    ]
  });

  const backup=[]; const report=[]; let stale=0; let atLeast7=0; let oneAdditional=0; let updated=0;
  for(const doc of docs){
    const calc = computeListingCompleteness(doc);
    const storedScore = doc.completenessScore;
    const storedComplete = doc.isComplete;
    const staleMeta = storedScore !== calc.completenessScore || storedComplete !== calc.isComplete;
    if(staleMeta) stale++;
    if(calc.presentCount >= 7) atLeast7++;
    if(calc.presentCount === 6) oneAdditional++;
    backup.push({_id:String(doc._id), completenessScore:doc.completenessScore, isComplete:doc.isComplete, qualityScore:doc.qualityScore});

    if(calc.isComplete && (staleMeta || doc.completenessScore !== calc.completenessScore || doc.isComplete !== true)){
      await col.updateOne({_id:doc._id},{ $set: { completenessScore: calc.completenessScore, isComplete: true, missingFields: calc.missingFields, completenessVersion: 2 }});
      updated++;
    }

    const after = await col.findOne({_id:doc._id},{projection:{business_name:1,alias:1,status:1,approved:1,completenessScore:1,isComplete:1,qualityScore:1,address:1,city:1,state:1,phone:1,website:1,image:1,category:1,categories:1,display_categories:1}});
    const selectorMatch = !!(after && ((after.isComplete===true) || (Number(after.completenessScore||0) >= 70) || (Number(after.qualityScore||0) >= 70)));
    report.push({
      _id:String(doc._id),
      business_name:after.business_name,
      alias:after.alias,
      checks:calc.checks,
      actual_present_field_count:calc.presentCount,
      calculated_percentage:calc.completenessScore,
      calculated_isComplete:calc.isComplete,
      currently_stored_completenessScore:storedScore,
      currently_stored_isComplete:storedComplete,
      stored_metadata_stale:staleMeta,
      missingFields:calc.missingFields,
      nowStored:{ completenessScore: after.completenessScore, isComplete: after.isComplete, qualityScore: after.qualityScore },
      matchesPublicSelector:selectorMatch,
    });
  }

  const afterVisible = await col.countDocuments({
    $and:[
      {$or:[{status:'approved'},{status:'verified'},{status:'active'},{status:{$exists:false}},{status:''},{status:null}]},
      {$or:[{alias:{$exists:true,$type:'string',$ne:''}},{slug:{$exists:true,$type:'string',$ne:''}}]},
      {$or:[{isComplete:true},{completenessScore:{$gte:70}},{qualityScore:{$gte:70}}]}
    ]
  });

  fs.writeFileSync(path.join(OUT,'approval-candidates-22-completeness-recompute-backup.json'), JSON.stringify(backup,null,2));
  fs.writeFileSync(path.join(OUT,'approval-candidates-22-completeness-recompute-report.json'), JSON.stringify(report,null,2));
  const summary = { recordsTargeted:22, recordsWhoseCompletenessMetadataWasStale:stale, recordsCalculatingToAtLeast7of9:atLeast7, recordsRequiringOneAdditionalVerifiedField:oneAdditional, recordsUpdatedFromActualCompleteness:updated, publicDirectoryCountBeforeThese22:beforeVisible, publicDirectoryCountAfterThese22:afterVisible, netIncrease:afterVisible-beforeVisible };
  fs.writeFileSync(path.join(OUT,'approval-candidates-22-completeness-recompute-summary.json'), JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
  await client.close();
})().catch(err=>{console.error(err);process.exit(1)});
