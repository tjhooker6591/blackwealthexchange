#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const OUT_DIR = path.join(__dirname, 'out');
const REPORT_FILE = path.join(OUT_DIR, 'remaining-19-live-report.json');

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

const plans = {
  '681d1df4fd9719ad7b26dfa2': { name:'LYS Beauty', website:'https://lysbeauty.com', description:'Clean beauty brand offering makeup and skincare products for face, eyes, lips, and complexion.', category:'Makeup, Clean Beauty', display:'Beauty, Grooming and Personal Care', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://lysbeauty.com'] },
  '681d1df4fd9719ad7b26dfa6': { name:'For Them', website:'https://forthemofficial.com', description:'Brand focused on binders and related apparel designed for comfort, fit, and everyday wear.', category:'Apparel, Wellness', display:'Clothing and Accessories', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://forthemofficial.com'] },
  '681d1df4fd9719ad7b26dfa8': { name:'Ami Colé', website:'https://amicole.com', description:'Beauty brand offering complexion, lip, and skin products with a clean and minimalist product focus.', category:'Clean Beauty, Skin Care', display:'Beauty, Grooming and Personal Care', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://amicole.com'] },
  '681d1df4fd9719ad7b26dfa9': { name:'Saint Ola', website:'https://saintola.com', description:'Fashion label offering ready-to-wear, custom suiting, bridalwear, and accessories with African-inspired styling.', category:'Fashion, Accessories', display:'Clothing and Accessories', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://saintola.com'] },
  '681d1df4fd9719ad7b26dfaa': { name:'Telfar', website:'https://telfar.net', description:'Fashion brand known for bags, apparel, and accessories sold through official online releases.', category:'Luxury Goods, Accessories', display:'Clothing and Accessories', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://telfar.net'] },
  '681d1df4fd9719ad7b26dfab': { name:'Third Crown', website:'https://thirdcrown.com', description:'Jewelry brand creating rings, necklaces, bracelets, and other statement pieces.', category:'Jewelry, Design', display:'Clothing and Accessories', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://thirdcrown.com'] },
  '681d1df4fd9719ad7b26dfac': { name:'Tree Fairfax', website:'https://treefairfax.com', description:'Ethical luxury leather goods brand producing bags, wallets, belts, and other accessories.', category:'Leather Goods, Accessories', display:'Clothing and Accessories', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://treefairfax.com'] },
  '681d1df4fd9719ad7b26dfb2': { name:'BLK & Bold', website:'https://blkandbold.com', description:'Specialty coffee and tea brand selling whole bean, ground, cold brew, and tea products.', category:'Coffee, Tea', display:'Food and Beverage', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', alias:'blk-bold', evidence:['https://blkandbold.com'] },
  '681d1df4fd9719ad7b26dfb7': { name:'Topicals', website:'https://mytopicals.com', description:'Skincare brand offering science-backed products focused on chronic skin concerns.', category:'Skin Care, Clinical', display:'Beauty, Grooming and Personal Care', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://mytopicals.com'] },
  '681d1df4fd9719ad7b26dfb8': { name:'RedDrop', website:'https://reddrop.com', description:'Brand offering menstrual products and educational resources for young people and families.', category:'Menstrual Products, Education', display:'Beauty, Grooming and Personal Care', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://reddrop.com'] },
  '681d1df4fd9719ad7b26dfbb': { name:'Barkal', website:'https://barkal.com', description:'Footwear brand offering leather shoes and related fashion products.', category:'Footwear, Design', display:'Clothing and Accessories', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://barkal.com'] },
  '681d1df4fd9719ad7b26dfbd': { name:'Camille Rose', website:'https://camillerose.com', description:'Beauty brand offering products for hair, skin, and body care.', category:'Hair Care, Skin Care, Body Care', display:'Beauty, Grooming and Personal Care', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://camillerose.com'] },
  '681d1df4fd9719ad7b26dfc2': { name:'The Sip', website:'https://thesip.com', description:'Wine subscription company offering curated boxes and tasting-focused wine selections.', category:'Wine Subscription', display:'Food and Beverage', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://thesip.com'] },
  '681d1df4fd9719ad7b26dfc4': { name:'Be Rooted', website:'https://berootedco.com', description:'Stationery and lifestyle brand offering journals, planners, office items, and related goods.', category:'Stationery, Home Goods', display:'Home and Kitchen', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://berootedco.com'] },
  '681d1df4fd9719ad7b26dfc5': { name:'Clare', website:'https://clare.com', description:'Paint company selling interior paint colors, supplies, and peel-and-stick swatches online.', category:'Paint, Home Improvement', display:'Home and Kitchen', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://clare.com'] },
  '681d1df4fd9719ad7b26dfc6': { name:'Bolé Road Textiles', website:'https://boleroadtextiles.com', description:'Textiles and home decor brand offering pillows, rugs, linens, and other home goods.', category:'Home Decor, Textiles', display:'Home and Kitchen', locationType:'headquarters', country:'United States', city:'Brooklyn', state:'New York', postalCode:'', address:'', evidence:['https://boleroadtextiles.com'] },
  '681d1df4fd9719ad7b26dfcb': { name:'The Whitney Collection', website:'https://thewhitneycollection.com', description:'Home fragrance brand offering candles and scent-focused products.', category:'Candles, Home Fragrance', display:'Home and Kitchen', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://thewhitneycollection.com'] },
  '681d1df4fd9719ad7b26dfce': { name:'Fourth Phase', website:'https://thefourthphase.com', description:'Postpartum care brand offering curated recovery products for mothers and families.', category:'Postnatal Care, Subscription', display:'Baby and Kids', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://thefourthphase.com'] },
  '681d1df4fd9719ad7b26dfd3': { name:'Royal Nation', website:'https://royal-nation.com', description:'Kids clothing brand offering gender-neutral apparel and story-driven collections.', category:'Clothing, Kids', display:'Baby and Kids', locationType:'online business', country:'United States', city:'', state:'', postalCode:'', address:'', evidence:['https://royal-nation.com'] },
};

function aliasFor(name) {
  return name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function safe(v){ return typeof v === 'string' ? v.trim() : ''; }
function arr(v){ return Array.isArray(v) ? v : safe(v) ? safe(v).split(',').map(s=>s.trim()).filter(Boolean) : []; }
function computeCompleteness(doc){
  const fields = [
    safe(doc.name || doc.business_name),
    safe(doc.description),
    safe(doc.address),
    safe(doc.city),
    safe(doc.state),
    safe(doc.phone),
    safe(doc.category),
    safe(doc.website),
    safe(doc.image),
  ];
  const present = fields.filter(Boolean).length;
  return { present, completenessScore: Math.round((present / 9) * 100), isComplete: present >= 7 };
}
function computeQuality(doc){
  let score = 0;
  if (safe(doc.business_name || doc.name)) score += 18;
  if (safe(doc.alias || doc.slug)) score += 10;
  if (safe(doc.description).length >= 40) score += 15;
  if (safe(doc.category) || arr(doc.categories).length || safe(doc.display_categories)) score += 15;
  if (safe(doc.website)) score += 15;
  if (safe(doc.phone) || safe(doc.email) || safe(doc.business_email) || safe(doc.ownerEmail)) score += 10;
  if (safe(doc.locationType)) score += 7;
  if (safe(doc.country) || safe(doc.city) || safe(doc.state) || safe(doc.address)) score += 5;
  if (doc.approved === true && safe(doc.status).toLowerCase() === 'active') score += 5;
  return Math.min(100, score);
}
async function fetchJson(url){
  const res = await fetch(url, { headers: { 'accept':'application/json' } });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

async function main(){
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'bwes-cluster');
  const col = db.collection('businesses');
  const base = process.env.APP_URL || 'http://127.0.0.1:3000';
  const report = [];

  for (const [id, expectedName] of ids){
    const plan = plans[id];
    const before = await col.findOne({ _id: new ObjectId(id) });
    if (!before) continue;

    const originalIssues = [];
    for (const field of ['address','city','state','postalCode','phone','category','website','alias','description','qualityScore']) {
      const v = before[field];
      if (v === null || v === undefined || v === '') originalIssues.push(field);
    }

    const aliasBase = plan.alias || aliasFor(plan.name);
    let alias = aliasBase;
    const owner = await col.findOne({ alias, _id: { $ne: before._id } }, { projection: { _id:1 } });
    if (owner) alias = `${aliasBase}-${id.slice(-4)}`;

    const set = {
      business_name: plan.name,
      alias,
      slug: alias,
      website: plan.website,
      description: plan.description,
      category: plan.category,
      categories: arr(plan.category),
      display_categories: plan.display,
      country: plan.country,
      locationType: plan.locationType,
      approved: true,
      status: 'active',
      searchKeywords: Array.from(new Set([plan.name, plan.category, plan.display, plan.city, plan.state, plan.country].join(' ').split(/[^\p{L}\p{N}]+/u).map(s=>s.trim()).filter(Boolean))),
    };
    const unset = {};
    if (plan.address) set.address = plan.address; else unset.address = '';
    if (plan.city) set.city = plan.city; else unset.city = '';
    if (plan.state) set.state = plan.state; else unset.state = '';
    if (plan.postalCode) set.postalCode = plan.postalCode; else unset.postalCode = '';
    unset.zip = '';

    const tempDoc = { ...before, ...set };
    delete tempDoc.address; if (plan.address) tempDoc.address = plan.address;
    delete tempDoc.city; if (plan.city) tempDoc.city = plan.city;
    delete tempDoc.state; if (plan.state) tempDoc.state = plan.state;
    delete tempDoc.postalCode; if (plan.postalCode) tempDoc.postalCode = plan.postalCode;
    const completeness = computeCompleteness(tempDoc);
    const qualityScore = computeQuality(tempDoc);
    set.completenessScore = completeness.completenessScore;
    set.isComplete = completeness.isComplete;
    set.qualityScore = qualityScore;

    await col.updateOne({ _id: before._id }, { $set: set, $unset: unset });

    const after = await col.findOne({ _id: before._id });
    report.push({
      _id: id,
      canonical_business_name: plan.name,
      original_missing_or_corrupted_fields: originalIssues,
      verified_data_found: {
        website: plan.website,
        description: plan.description,
        category: plan.category,
        display_categories: plan.display,
        country: plan.country,
        locationType: plan.locationType,
        city: plan.city || '',
        state: plan.state || '',
        postalCode: plan.postalCode || '',
        evidence_sources: plan.evidence,
      },
      fields_repaired: Object.keys(set),
      fields_intentionally_left_blank: ['phone','image'].concat(plan.address ? [] : ['address']).concat(plan.city ? [] : ['city']).concat(plan.state ? [] : ['state']).concat(plan.postalCode ? [] : ['postalCode']),
      final_category: after.display_categories || plan.display,
      final_location_type: after.locationType || plan.locationType,
      final_location_data: {
        address: safe(after.address), city: safe(after.city), state: safe(after.state), country: safe(after.country), postalCode: safe(after.postalCode)
      },
      final_alias: alias,
      final_completeness_score: after.completenessScore,
      final_quality_score: after.qualityScore,
      approved_status_values: { approved: after.approved, status: after.status },
      public_selector_match: Boolean(after.isComplete === true || Number(after.completenessScore || 0) >= 70 || Number(after.qualityScore || 0) >= 70),
      production_search_result: null,
      production_profile_result: null,
    });
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ written: REPORT_FILE, processed: report.length }, null, 2));
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
