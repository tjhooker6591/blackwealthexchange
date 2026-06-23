#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const OUT_DIR = path.join(__dirname, 'out');
const BACKUP = path.join(OUT_DIR, 'manual-visibility-19-backup.json');
const ROLLBACK = path.join(OUT_DIR, 'manual-visibility-19-rollback.json');
const RESULT = path.join(OUT_DIR, 'manual-visibility-19-result.json');
const REASON = 'Manually reviewed and approved for directory visibility; the available business data was cleaned and validated, and unsupported optional fields were not fabricated.';
const APPROVER = 'Thomas';

const ids = [
  ['681d1df4fd9719ad7b26dfa2','LYS Beauty'],
  ['681d1df4fd9719ad7b26dfa6','For Them'],
  ['681d1df4fd9719ad7b26dfa8','Ami Colé'],
  ['681d1df4fd9719ad7b26dfa9','Saint Ola'],
  ['681d1df4fd9719ad7b26dfaa','Telfar'],
  ['681d1df4fd9719ad7b26dfab','Third Crown'],
  ['681d1df4fd9719ad7b26dfac','Tree Fairfax'],
  ['681d1df4fd9719ad7b26dfb2','BLK & Bold'],
  ['681d1df4fd9719ad7b26dfb7','Topicals'],
  ['681d1df4fd9719ad7b26dfb8','RedDrop'],
  ['681d1df4fd9719ad7b26dfbb','Barkal'],
  ['681d1df4fd9719ad7b26dfbd','Camille Rose'],
  ['681d1df4fd9719ad7b26dfc2','The Sip'],
  ['681d1df4fd9719ad7b26dfc4','Be Rooted'],
  ['681d1df4fd9719ad7b26dfc5','Clare'],
  ['681d1df4fd9719ad7b26dfc6','Bolé Road Textiles'],
  ['681d1df4fd9719ad7b26dfcb','The Whitney Collection'],
  ['681d1df4fd9719ad7b26dfce','Fourth Phase'],
  ['681d1df4fd9719ad7b26dfd3','Royal Nation'],
];

function asTrimmed(v){ return typeof v === 'string' ? v.trim() : ''; }
function hasValue(v){ return Array.isArray(v) ? v.some(x => asTrimmed(x).length > 0) : asTrimmed(v).length > 0; }
function getAliasCategory(doc){
  if (hasValue(doc.display_categories)) return asTrimmed(doc.display_categories);
  if (Array.isArray(doc.categories)) return doc.categories.map(asTrimmed).filter(Boolean).join(', ');
  if (hasValue(doc.categories)) return asTrimmed(doc.categories);
  if (hasValue(doc.category)) return asTrimmed(doc.category);
  return '';
}
function computeListingCompleteness(doc){
  const checks = [
    hasValue(doc.business_name) || hasValue(doc.name) || hasValue(doc.organization_name),
    hasValue(doc.description),
    hasValue(doc.address),
    hasValue(doc.city),
    hasValue(doc.state),
    hasValue(doc.phone),
    hasValue(getAliasCategory(doc)),
    hasValue(doc.website),
    hasValue(doc.image),
  ];
  const present = checks.filter(Boolean).length;
  return { completenessScore: Math.round((present / 9) * 100), isComplete: present >= 7 };
}

async function main(){
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'bwes-cluster');
  const col = db.collection('businesses');
  const docs = await col.find({ _id: { $in: ids.map(([id]) => new ObjectId(id)) } }).toArray();
  fs.writeFileSync(BACKUP, JSON.stringify(docs, null, 2));
  fs.writeFileSync(ROLLBACK, JSON.stringify(docs.map(doc => ({
    _id: String(doc._id),
    directoryVisibilityApproved: doc.directoryVisibilityApproved,
    directoryVisibilityApprovedAt: doc.directoryVisibilityApprovedAt,
    directoryVisibilityApprovedBy: doc.directoryVisibilityApprovedBy,
    directoryVisibilityReason: doc.directoryVisibilityReason,
    completenessScore: doc.completenessScore,
    isComplete: doc.isComplete,
  })), null, 2));

  const results = [];
  for (const [id, expectedName] of ids){
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) continue;
    const calc = computeListingCompleteness(doc);
    const checks = {
      approved: doc.approved === true,
      active: asTrimmed(doc.status).toLowerCase() === 'active',
      canonicalName: asTrimmed(doc.business_name) === expectedName,
      hasDescription: hasValue(doc.description),
      hasCategory: hasValue(doc.category),
      hasDisplayCategory: hasValue(doc.display_categories),
      hasAlias: hasValue(doc.alias) || hasValue(doc.slug),
      noKnownClosedStatus: !['closed','archived','rejected'].includes(asTrimmed(doc.status).toLowerCase()),
    };
    if (!Object.values(checks).every(Boolean)) {
      results.push({ _id: id, business_name: doc.business_name, applied: false, checks, reason: 'precheck_failed' });
      continue;
    }
    await col.updateOne({ _id: doc._id }, {
      $set: {
        directoryVisibilityApproved: true,
        directoryVisibilityApprovedAt: doc.directoryVisibilityApprovedAt || new Date(),
        directoryVisibilityApprovedBy: APPROVER,
        directoryVisibilityReason: REASON,
        completenessScore: calc.completenessScore,
        isComplete: calc.isComplete,
      }
    });
    const after = await col.findOne({ _id: doc._id });
    results.push({
      _id: id,
      business_name: after.business_name,
      applied: after.directoryVisibilityApproved === true,
      completenessScore: after.completenessScore,
      isComplete: after.isComplete,
      approved: after.approved,
      status: after.status,
      alias: after.alias || after.slug || '',
    });
  }
  fs.writeFileSync(RESULT, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ applied: results.filter(r => r.applied).length, resultFile: RESULT }, null, 2));
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
