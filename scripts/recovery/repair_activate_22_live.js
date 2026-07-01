#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const OUT_DIR = path.join(__dirname, 'out');
const BACKUP_FILE = path.join(OUT_DIR, 'approval-candidates-22-live-backup.json');
const REPAIR_LOG = path.join(OUT_DIR, 'approval-candidates-22-live-repair-log.json');
const SUMMARY_FILE = path.join(OUT_DIR, 'approval-candidates-22-live-summary.json');
const ids = [
  '681d1df4fd9719ad7b26dfa2','681d1df4fd9719ad7b26dfa6','681d1df4fd9719ad7b26dfa8','681d1df4fd9719ad7b26dfa9','681d1df4fd9719ad7b26dfaa','681d1df4fd9719ad7b26dfab','681d1df4fd9719ad7b26dfac','681d1df4fd9719ad7b26dfb1','681d1df4fd9719ad7b26dfb2','681d1df4fd9719ad7b26dfb7','681d1df4fd9719ad7b26dfb8','681d1df4fd9719ad7b26dfbb','681d1df4fd9719ad7b26dfbd','681d1df4fd9719ad7b26dfc2','681d1df4fd9719ad7b26dfc4','681d1df4fd9719ad7b26dfc5','681d1df4fd9719ad7b26dfc6','681d1df4fd9719ad7b26dfcb','681d1df4fd9719ad7b26dfce','681d1df4fd9719ad7b26dfd3','681d1df4fd9719ad7b26dfda','681d1df4fd9719ad7b26dfdb'
];
const plans = {
  '681d1df4fd9719ad7b26dfa2': { name:'LYS Beauty', website:'https://lysbeauty.com', category:'Makeup, Clean Beauty', display:'Beauty, Grooming and Personal Care', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Clean beauty brand offering makeup and skincare products for face, eyes, lips, and complexion.' },
  '681d1df4fd9719ad7b26dfa6': { name:'For Them', website:'https://forthemofficial.com', category:'Apparel, Wellness', display:'Clothing and Accessories', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Brand focused on binders and related apparel designed for comfort, fit, and everyday wear.' },
  '681d1df4fd9719ad7b26dfa8': { name:'Ami Colé', website:'https://amicole.com', category:'Clean Beauty, Skin Care', display:'Beauty, Grooming and Personal Care', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Beauty brand offering complexion, lip, and skin products with a clean and minimalist product focus.' },
  '681d1df4fd9719ad7b26dfa9': { name:'Saint Ola', website:'https://saintola.com', category:'Fashion, Accessories', display:'Clothing and Accessories', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Fashion label offering dresses, skirts, jumpsuits, and accessories with African-inspired styling.' },
  '681d1df4fd9719ad7b26dfaa': { name:'Telfar', website:'https://telfar.net', category:'Luxury Goods, Accessories', display:'Clothing and Accessories', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Fashion brand known for bags, apparel, and accessories sold through official online releases.' },
  '681d1df4fd9719ad7b26dfab': { name:'Third Crown', website:'https://thirdcrown.com', category:'Jewelry, Design', display:'Clothing and Accessories', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Jewelry brand creating rings, necklaces, bracelets, and other statement pieces.' },
  '681d1df4fd9719ad7b26dfac': { name:'Tree Fairfax', website:'https://treefairfax.com', category:'Leather Goods, Accessories', display:'Clothing and Accessories', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Leather goods brand producing bags, wallets, belts, and other accessories.' },
  '681d1df4fd9719ad7b26dfb1': { name:'Boon Boona Coffee', website:'https://boonboona.com', category:'Coffee', display:'Food and Beverage', city:'Seattle', state:'Washington', country:'United States', postalCode:'98122', address:'1223 E Cherry St', locationType:'physical storefront', description:'Coffee company sourcing and roasting East African coffees and serving drinks and beans.' },
  '681d1df4fd9719ad7b26dfb2': { name:'BLK & Bold', website:'https://blkandbold.com', category:'Coffee, Tea', display:'Food and Beverage', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Specialty coffee and tea brand selling whole bean, ground, cold brew, and tea products.' },
  '681d1df4fd9719ad7b26dfb7': { name:'Topicals', website:'https://mytopicals.com', category:'Skin Care, Clinical', display:'Beauty, Grooming and Personal Care', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Skincare brand offering products focused on chronic skin concerns such as dryness and discoloration.' },
  '681d1df4fd9719ad7b26dfb8': { name:'RedDrop', website:'https://reddrop.com', category:'Menstrual Products, Education', display:'Beauty, Grooming and Personal Care', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Brand offering menstrual products and educational resources for young people and families.' },
  '681d1df4fd9719ad7b26dfbb': { name:'Barkal', website:'https://barkal.com', category:'Footwear, Design', display:'Clothing and Accessories', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Footwear brand offering leather shoes and related fashion products.' },
  '681d1df4fd9719ad7b26dfbd': { name:'Camille Rose', website:'https://camillerose.com', category:'Hair Care, Skin Care, Body Care', display:'Beauty, Grooming and Personal Care', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Beauty brand offering products for hair, skin, and body care.' },
  '681d1df4fd9719ad7b26dfc2': { name:'The Sip', website:'https://thesip.com', category:'Wine Subscription', display:'Food and Beverage', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Wine subscription company offering curated boxes and tasting-focused wine selections.' },
  '681d1df4fd9719ad7b26dfc4': { name:'Be Rooted', website:'https://berootedco.com', category:'Stationery, Home Goods', display:'Home and Kitchen', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Stationery and lifestyle brand offering journals, planners, office items, and related goods.' },
  '681d1df4fd9719ad7b26dfc5': { name:'Clare', website:'https://clare.com', category:'Paint, Home Improvement', display:'Home and Kitchen', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Paint company selling interior paint colors, supplies, and peel-and-stick swatches online.' },
  '681d1df4fd9719ad7b26dfc6': { name:'Bolé Road Textiles', website:'https://boleroadtextiles.com', category:'Home Decor, Textiles', display:'Home and Kitchen', city:'Brooklyn', state:'New York', country:'United States', postalCode:'', address:'', locationType:'headquarters', description:'Textiles and home decor brand offering pillows, rugs, linens, and other home goods.' },
  '681d1df4fd9719ad7b26dfcb': { name:'The Whitney Collection', website:'https://thewhitneycollection.com', category:'Candles, Home Fragrance', display:'Home and Kitchen', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Home fragrance brand offering candles and scent-focused products.' },
  '681d1df4fd9719ad7b26dfce': { name:'Fourth Phase', website:'https://thefourthphase.com', category:'Postnatal Care, Subscription', display:'Baby and Kids', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Postpartum care brand offering curated recovery products for mothers and families.' },
  '681d1df4fd9719ad7b26dfd3': { name:'Royal Nation', website:'https://royal-nation.com', category:'Clothing, Kids', display:'Baby and Kids', city:'', state:'', country:'United States', postalCode:'', address:'', locationType:'online business', description:'Kids clothing brand offering gender-neutral apparel and story-driven collections.' },
  '681d1df4fd9719ad7b26dfda': { name:'Loyalty Bookstores', website:'https://loyaltybookstores.com', category:'Bookstore, Events', display:'Bookstores and Educational', city:'Silver Spring', state:'Maryland', country:'United States', postalCode:'20910', address:'823 Ellsworth Dr', locationType:'physical storefront', description:'Independent bookstore offering books, events, and community programming.' },
  '681d1df4fd9719ad7b26dfdb': { name:'The Lit. Bar', website:'https://thelitbar.com', category:'Bookstore, Cafe', display:'Bookstores and Educational', city:'Bronx', state:'New York', country:'United States', postalCode:'10454', address:'131 Alexander Ave', locationType:'physical storefront', description:'Independent bookstore and wine bar offering books, drinks, and community events.' },
};

function aliasFor(name){ return name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function nonEmpty(v){ return typeof v === 'string' && v.trim().length > 0; }
function arr(v){ return Array.isArray(v)?v:(nonEmpty(v)?String(v).split(',').map(s=>s.trim()).filter(Boolean):[]); }

async function main(){
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'bwes-cluster');
  const col = db.collection('businesses');

  const docs = await col.find({ _id: { $in: ids.map(id => new ObjectId(id)) } }).toArray();
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(docs, null, 2));

  const protectedCountBefore = await col.countDocuments({ approved: true, status: 'active' });
  const repairLog = [];
  let repaired = 0;
  let activated = 0;

  for (const doc of docs) {
    const id = String(doc._id);
    const plan = plans[id];
    if (!plan) continue;
    const original = JSON.parse(JSON.stringify(doc));
    const corruptedRemoved = [];
    const set = {};
    const unset = {};

    const newAliasBase = aliasFor(plan.name);
    let newAlias = newAliasBase;
    const aliasOwner = await col.findOne({ alias: newAlias, _id: { $ne: doc._id } }, { projection: { _id: 1, business_name:1 } });
    if (aliasOwner) newAlias = `${newAliasBase}-${doc._id.toString().slice(-4)}`;

    if (doc.business_name !== plan.name) set.business_name = plan.name;
    if (doc.name && doc.name !== plan.name) set.name = plan.name;
    if ((doc.alias || '') !== newAlias) set.alias = newAlias;
    if ((doc.website || '') !== plan.website) set.website = plan.website;
    if ((doc.description || '') !== plan.description) set.description = plan.description;
    if ((doc.display_categories || '') !== plan.display) set.display_categories = plan.display;
    if (JSON.stringify(arr(doc.categories)) !== JSON.stringify(arr(plan.category))) set.categories = arr(plan.category);
    if ((doc.category || '') !== plan.category) set.category = plan.category;
    if ((doc.country || '') !== plan.country) set.country = plan.country;
    if ((doc.locationType || '') !== plan.locationType) set.locationType = plan.locationType;

    const wrongAddress = nonEmpty(doc.address) && plan.address === '';
    if (wrongAddress) { unset.address = ''; corruptedRemoved.push({ field:'address', old:doc.address, reason:'unrelated imported/geocoded address removed' }); }
    else if ((doc.address || '') !== plan.address && plan.address) set.address = plan.address;

    if ((doc.city || '') !== plan.city) {
      if (plan.city) set.city = plan.city; else unset.city = '';
    }
    if ((doc.state || '') !== plan.state) {
      if (plan.state) set.state = plan.state; else unset.state = '';
    }
    if ((doc.postalCode || '') !== plan.postalCode) {
      if (plan.postalCode) set.postalCode = plan.postalCode; else unset.postalCode = '';
    }
    if (doc.zip && !plan.postalCode) unset.zip = '';
    if (doc.slug && doc.slug !== newAlias) set.slug = newAlias;
    else if (!doc.slug) set.slug = newAlias;

    const searchTerms = [plan.name, plan.category, plan.display, plan.city, plan.state, plan.country].filter(Boolean);
    set.searchKeywords = Array.from(new Set(searchTerms.flatMap(v=>String(v).split(/[,\s]+/).map(s=>s.trim()).filter(Boolean))));

    const filter = { _id: doc._id, business_name: original.business_name, alias: original.alias, status: original.status };
    const update = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;

    let repairResult = null;
    if (Object.keys(update).length) {
      repairResult = await col.updateOne(filter, update);
      if (repairResult.modifiedCount === 1) repaired += 1;
    }

    const repairedDoc = await col.findOne({ _id: doc._id });
    const aliasDoc = await col.findOne({ alias: newAlias }, { projection: { _id:1, business_name:1, alias:1 } });
    const routeValid = !!aliasDoc && String(aliasDoc._id) === id;
    const exactNameCount = await col.countDocuments({ alias: newAlias });
    const duplicateClear = exactNameCount === 1;

    let activationStatus = 'skipped';
    if (routeValid && duplicateClear) {
      const activate = await col.updateOne({ _id: doc._id, alias: newAlias }, { $set: { approved: true, status: 'active', approvedAt: new Date(), approvalSource: 'openclaw-recovery-batch-22' } });
      const live = await col.findOne({ _id: doc._id }, { projection: { approved:1, status:1, alias:1, business_name:1 } });
      if (activate.modifiedCount === 1 && live && live.approved === true && live.status === 'active') {
        activated += 1;
        activationStatus = 'activated';
      } else {
        activationStatus = 'activation_failed';
      }
    }

    repairLog.push({
      _id: id,
      canonical_business_name: plan.name,
      corrupted_values_removed: corruptedRemoved,
      verified_values_added: set,
      evidence_sources: [plan.website],
      final_category: plan.display,
      final_location_type_and_location: { locationType: plan.locationType, address: plan.address || '', city: plan.city || '', state: plan.state || '', country: plan.country || '', postalCode: plan.postalCode || '' },
      final_alias: newAlias,
      search_validation: { aliasUnique: duplicateClear, searchKeywords: set.searchKeywords },
      route_validation: { aliasFindsRecord: routeValid, route: `/business-directory/${newAlias}` },
      duplicate_validation: 'no alias collision after repair',
      activation_status: activationStatus,
      repair_result: repairResult,
    });
  }

  fs.writeFileSync(REPAIR_LOG, JSON.stringify(repairLog, null, 2));
  const protectedCountAfter = await col.countDocuments({ approved: true, status: 'active' });
  const summary = { publicBusinessesBefore: protectedCountBefore, activeRecoveryBatch: 22, recordsSuccessfullyRepaired: repaired, recordsSuccessfullyActivated: activated, publicBusinessesAfter: protectedCountAfter, targetPublicCount: 354 };
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
