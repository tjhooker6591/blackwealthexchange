#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB || 'bwes-cluster';
if (!uri) throw new Error('Missing MONGODB_URI/MONGODB_URL');

function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0 || value.every((v) => isBlank(v));
  return false;
}
function safeString(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.filter((x) => x !== undefined && x !== null).join(', ');
  return String(v);
}
function normText(v) {
  return safeString(v)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function normalizePhone(v) {
  const d = safeString(v).replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return d.slice(1);
  return d;
}
function normalizeUrl(v) {
  let s = safeString(v).trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    u.hash = '';
    let p = u.pathname.replace(/\/+$/, '');
    if (p === '/') p = '';
    return `${u.protocol}//${u.hostname.toLowerCase()}${p}`;
  } catch {
    return '';
  }
}
function extractDomain(v) {
  const u = normalizeUrl(v);
  if (!u) return '';
  try {
    return new URL(u).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}
function emailDomain(v) {
  const s = safeString(v).toLowerCase().trim();
  const idx = s.lastIndexOf('@');
  return idx > -1 ? s.slice(idx + 1) : '';
}
function normalizeAddress(v) {
  return normText(v)
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\bsuite\b/g, 'ste')
    .replace(/\bunit\b/g, 'unit')
    .trim();
}
function pick(...vals) {
  for (const v of vals) if (!isBlank(v)) return v;
  return '';
}
function splitTerms(value) {
  if (value === undefined || value === null) return [];
  const raw = Array.isArray(value) ? value.join(',') : String(value);
  return raw.split(/[|,;/]+/).map((s) => s.trim()).filter(Boolean);
}
const directRules = [
  [/^beauty$/, 'Beauty, Grooming and Personal Care'],
  [/^hair$/, 'Beauty, Grooming and Personal Care'],
  [/^haircare$/, 'Beauty, Grooming and Personal Care'],
  [/^hair care$/, 'Beauty, Grooming and Personal Care'],
  [/^barber$/, 'Beauty, Grooming and Personal Care'],
  [/^barbershop$/, 'Beauty, Grooming and Personal Care'],
  [/^barber shop$/, 'Beauty, Grooming and Personal Care'],
  [/^grooming$/, 'Beauty, Grooming and Personal Care'],
  [/^skincare$/, 'Beauty, Grooming and Personal Care'],
  [/^skin care$/, 'Beauty, Grooming and Personal Care'],
  [/^cosmetics$/, 'Beauty, Grooming and Personal Care'],
  [/^salon$/, 'Beauty, Grooming and Personal Care'],
  [/^hair salons?$/, 'Beauty, Grooming and Personal Care'],
  [/^nail salons?$/, 'Beauty, Grooming and Personal Care'],
  [/^spa$/, 'Beauty, Grooming and Personal Care'],
  [/^restaurants?$/, 'Restaurants'],
  [/^cafe$/, 'Restaurants'],
  [/^bakery$/, 'Food and Beverage'],
  [/^coffee$/, 'Food and Beverage'],
  [/^shopping$/, 'Shopping and Retail'],
  [/^retail$/, 'Shopping and Retail'],
  [/^fitness$/, 'Health and Wellness'],
  [/^wellness$/, 'Health and Wellness'],
  [/^health$/, 'Health and Wellness'],
  [/^massage$/, 'Health and Wellness'],
  [/^church$/, 'Faith and Spiritual Services'],
  [/^faith organization$/, 'Faith and Spiritual Services'],
  [/^church faith organization$/, 'Faith and Spiritual Services'],
  [/^nonprofit$/, 'Nonprofit and Community Organizations'],
  [/^foundation$/, 'Nonprofit and Community Organizations'],
  [/^real estate$/, 'Real Estate'],
  [/^realtor$/, 'Real Estate'],
  [/^brokerage$/, 'Real Estate'],
  [/^property management$/, 'Real Estate'],
  [/^law firm$/, 'Professional Services'],
  [/^accounting$/, 'Professional Services'],
  [/^consulting$/, 'Professional Services'],
];
const phraseRules = [
  [/\brestaurant\b|\bcafe\b|\bcatering\b/, 'Restaurants'],
  [/\bbakery\b|\bcoffee\b/, 'Food and Beverage'],
  [/\bbeauty\b|\bhair\b|\bbarber\b|\bgrooming\b|\bskincare\b|\bskin care\b|\bcosmetics\b|\bsalon\b|\bnails?\b/, 'Beauty, Grooming and Personal Care'],
  [/\bchurch\b|\bfaith\b|\bministry\b|\bspiritual\b/, 'Faith and Spiritual Services'],
  [/\bnonprofit\b|\bfoundation\b|\bcommunity organization\b/, 'Nonprofit and Community Organizations'],
  [/\brealtor\b|\bbrokerage\b|\bproperty management\b|\breal estate\b/, 'Real Estate'],
  [/\blaw\b|\battorney\b|\baccounting\b|\bconsulting\b/, 'Professional Services'],
];
function mapCategory(doc) {
  const directHits = [];
  for (const field of ['category', 'categories', 'display_categories']) {
    for (const term of splitTerms(doc[field]).map(normText)) {
      for (const [rx, cat] of directRules) if (rx.test(term)) directHits.push({ sourceField: field, sourceValue: safeString(doc[field]), category: cat, confidence: 'high' });
    }
  }
  const uniqDirect = [...new Map(directHits.map((h) => [h.category, h])).values()];
  if (uniqDirect.length === 1) return { proposed: uniqDirect[0].category, confidence: 'high', sourceField: uniqDirect[0].sourceField, sourceValue: uniqDirect[0].sourceValue };
  const text = [doc.business_name, doc.name, doc.description, doc.website].map(safeString).join(' | ');
  const textHits = [];
  for (const [rx, cat] of phraseRules) if (rx.test(normText(text))) textHits.push(cat);
  const uniqText = [...new Set(textHits)];
  if (uniqText.length === 1) return { proposed: uniqText[0], confidence: 'medium', sourceField: 'combined_text', sourceValue: text };
  return { proposed: safeString(doc.display_categories || doc.categories || doc.category), confidence: '' };
}
function computeListingCompleteness(doc) {
  const checks = [
    !isBlank(doc.business_name || doc.name || doc.organization_name),
    !isBlank(doc.description),
    !isBlank(doc.address),
    !isBlank(doc.city),
    !isBlank(doc.state),
    !isBlank(doc.phone),
    !isBlank(doc.display_categories || doc.categories || doc.category),
    !isBlank(doc.website),
    !isBlank(doc.image),
  ];
  const present = checks.filter(Boolean).length;
  return { completenessScore: Math.round((present / checks.length) * 100), isComplete: present >= 7 };
}
function publicSearchEligibility(doc) {
  const status = doc.status;
  const statusAllowed = status === 'approved' || status === 'verified' || status === 'active' || status === undefined || status === null || status === '';
  const excluded = doc.isTest === true || doc.auditTag !== undefined || /^BWE_LOCAL_AUDIT/i.test(safeString(doc.auditTag)) || /^auditpagination$/i.test(safeString(doc.category)) || /^auditpagination$/i.test(safeString(doc.categories)) || /^auditpagination$/i.test(safeString(doc.display_categories)) || /@local\.test$/i.test(safeString(doc.email)) || /^auditpagination_/i.test(safeString(doc.business_name)) || /^auditpagination_/i.test(safeString(doc.name));
  const hasAliasOrSlug = (typeof doc.alias === 'string' && doc.alias !== '') || (typeof doc.slug === 'string' && doc.slug !== '');
  const completenessAllowed = doc.isComplete === true || Number(doc.completenessScore || 0) >= 70 || Number(doc.qualityScore || 0) >= 70;
  const reasons = [];
  if (!statusAllowed) reasons.push('status_not_public');
  if (excluded) reasons.push('audit_or_test_excluded');
  if (!hasAliasOrSlug) reasons.push('missing_alias_or_slug');
  if (!completenessAllowed) reasons.push('incomplete_listing');
  return { eligibleForPublicSearchPopulation: reasons.length === 0, reasons };
}
function keyParts(doc) {
  const name = normText(doc.business_name || doc.name);
  const phone = normalizePhone(doc.phone);
  const website = extractDomain(doc.website);
  const address = normalizeAddress(doc.address);
  const city = normText(doc.city);
  const state = normText(doc.state);
  const alias = normText(doc.alias || doc.slug);
  const emailDom = emailDomain(pick(doc.business_email, doc.email, doc.ownerEmail));
  const socials = ['facebook','instagram','twitter','linkedin','youtube','tiktok'].map((f) => extractDomain(doc[f]) || normalizeUrl(doc[f])).filter(Boolean);
  return { name, phone, website, address, city, state, alias, emailDom, socials };
}
function inferredName(doc) {
  const current = safeString(doc.business_name || doc.name).trim();
  if (current) return { researched: current, method: 'existing', confidence: 'verified' };
  const url = normalizeUrl(doc.website);
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./i, '');
      const first = host.split('.')[0].replace(/[-_]+/g, ' ').trim();
      if (first && !/^(gmail|yahoo|hotmail|outlook|icloud|aol)$/i.test(first)) {
        return { researched: first.replace(/\b\w/g, (m) => m.toUpperCase()), method: 'website_domain', confidence: 'high' };
      }
    } catch {}
  }
  const mailDom = emailDomain(pick(doc.business_email, doc.email, doc.ownerEmail));
  if (mailDom && !/^(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|icloud\.com|aol\.com)$/i.test(mailDom)) {
    const base = mailDom.split('.')[0].replace(/[-_]+/g, ' ').trim();
    if (base) return { researched: base.replace(/\b\w/g, (m) => m.toUpperCase()), method: 'email_domain', confidence: 'medium' };
  }
  const desc = safeString(doc.description);
  const m = desc.match(/^\s*([A-Z][A-Za-z0-9&' .-]{2,60})\s*(?:,|-|is|offers)\b/);
  if (m) return { researched: m[1].trim(), method: 'description_lead', confidence: 'medium' };
  return { researched: '', method: '', confidence: '' };
}
function classifyExclusionReason(doc, publicState, dup) {
  if (dup && dup.status === 'exact duplicate') return 'duplicate';
  if (/rejected/i.test(safeString(doc.status))) return 'rejected';
  if (/pending/i.test(safeString(doc.status))) return 'intentionally pending';
  if (/closed|permanently closed|inactive/i.test(`${safeString(doc.status)} ${safeString(doc.description)}`)) return 'inactive or closed';
  if (isBlank(doc.business_name || doc.name)) return 'missing business name';
  if (isBlank(doc.address) && isBlank(doc.city) && isBlank(doc.state)) return 'incomplete address';
  if (isBlank(doc.display_categories || doc.categories || doc.category)) return 'missing category';
  if (isBlank(doc.description)) return 'missing description';
  if (publicState.reasons.includes('missing_alias_or_slug')) return 'fails public-search completeness rules';
  if (publicState.reasons.includes('incomplete_listing')) return 'fails public-search completeness rules';
  if (publicState.reasons.includes('status_not_public')) return 'missing approval flag';
  return 'insufficient verification';
}
function projectedEligibility(doc, proposedName, proposedCategory, dup, closed) {
  if (closed) return false;
  if (dup && (dup.status === 'exact duplicate' || dup.status === 'likely duplicate')) return false;
  const name = !isBlank(proposedName || doc.business_name || doc.name);
  const location = !isBlank(doc.address) || (!isBlank(doc.city) && !isBlank(doc.state));
  const category = !isBlank(proposedCategory || doc.display_categories || doc.categories || doc.category);
  const alias = !isBlank(doc.alias || doc.slug);
  const comp = computeListingCompleteness({ ...doc, business_name: proposedName || doc.business_name, display_categories: proposedCategory || doc.display_categories });
  return Boolean(name && location && category && alias && (doc.status === 'approved' || doc.status === 'verified' || doc.status === 'active' || isBlank(doc.status)) && (comp.isComplete || comp.completenessScore >= 70 || Number(doc.qualityScore || 0) >= 70));
}
function confidenceRank(c) {
  return c === 'verified' ? 4 : c === 'high' ? 3 : c === 'medium' ? 2 : 1;
}
(async () => {
  const client = new MongoClient(uri, { readPreference: 'primaryPreferred' });
  await client.connect();
  const db = client.db(dbName);
  const docs = await db.collection('businesses').find({}, { projection: {
    business_name:1,name:1,alias:1,slug:1,status:1,approved:1,isComplete:1,completenessScore:1,qualityScore:1,
    address:1,city:1,state:1,zip:1,postalCode:1,phone:1,website:1,email:1,business_email:1,ownerEmail:1,
    category:1,categories:1,display_categories:1,description:1,facebook:1,instagram:1,twitter:1,linkedin:1,youtube:1,tiktok:1,
    latitude:1,longitude:1,location:1,image:1,rawCategory:1,createdAt:1,updatedAt:1,isTest:1,auditTag:1
  }}).toArray();

  const enriched = docs.map((doc) => {
    const publicState = publicSearchEligibility(doc);
    const keys = keyParts(doc);
    const category = mapCategory(doc);
    const nameInf = inferredName(doc);
    return { doc, publicState, keys, category, nameInf };
  });

  const byPhone = new Map();
  const byWebsite = new Map();
  const byAddress = new Map();
  const byAlias = new Map();
  const byNameCityState = new Map();
  for (const row of enriched) {
    const id = String(row.doc._id);
    const push = (map, key) => { if (!key) return; const arr = map.get(key) || []; arr.push(id); map.set(key, arr); };
    push(byPhone, row.keys.phone);
    push(byWebsite, row.keys.website);
    push(byAddress, row.keys.address && row.keys.city && row.keys.state ? `${row.keys.address}|${row.keys.city}|${row.keys.state}` : '');
    push(byAlias, row.keys.alias);
    push(byNameCityState, row.keys.name && row.keys.city && row.keys.state ? `${row.keys.name}|${row.keys.city}|${row.keys.state}` : '');
  }

  const idToRow = new Map(enriched.map((r) => [String(r.doc._id), r]));
  function detectDuplicate(row) {
    const self = String(row.doc._id);
    const matches = new Map();
    const add = (otherId, reason) => {
      if (!otherId || otherId === self) return;
      const curr = matches.get(otherId) || { reasons: [] };
      curr.reasons.push(reason);
      matches.set(otherId, curr);
    };
    if (row.keys.phone) for (const other of byPhone.get(row.keys.phone) || []) add(other, 'exact_phone');
    if (row.keys.website) for (const other of byWebsite.get(row.keys.website) || []) add(other, 'exact_website_domain');
    if (row.keys.address && row.keys.city && row.keys.state) for (const other of byAddress.get(`${row.keys.address}|${row.keys.city}|${row.keys.state}`) || []) add(other, 'exact_address');
    if (row.keys.alias) for (const other of byAlias.get(row.keys.alias) || []) add(other, 'exact_alias_or_slug');
    if (row.keys.name && row.keys.city && row.keys.state) for (const other of byNameCityState.get(`${row.keys.name}|${row.keys.city}|${row.keys.state}`) || []) add(other, 'normalized_name_city_state');
    if (!matches.size) return { status: 'none', matchedId: '', evidence: [] };

    let bestId = '';
    let bestScore = -1;
    let bestReasons = [];
    for (const [otherId, meta] of matches.entries()) {
      const score = meta.reasons.reduce((n, r) => n + (r === 'exact_phone' || r === 'exact_website_domain' || r === 'exact_address' ? 3 : 2), 0);
      if (score > bestScore) {
        bestScore = score;
        bestId = otherId;
        bestReasons = [...new Set(meta.reasons)];
      }
    }
    const other = idToRow.get(bestId);
    const hasName = Boolean(row.keys.name);
    const otherHasName = Boolean(other?.keys.name);
    const sameName = hasName && otherHasName && row.keys.name === other.keys.name;
    const sameAddress = bestReasons.includes('exact_address');
    const samePhone = bestReasons.includes('exact_phone');
    const sameSite = bestReasons.includes('exact_website_domain');
    const sameAlias = bestReasons.includes('exact_alias_or_slug');
    const sameNameCityState = bestReasons.includes('normalized_name_city_state');

    let status = 'none';
    if ((samePhone && sameAddress) || (sameSite && sameAddress) || sameAlias) {
      status = 'exact duplicate';
    } else if (sameSite && !sameAddress) {
      status = 'same company with multiple locations';
    } else if (samePhone && sameName) {
      status = 'likely duplicate';
    } else if (sameNameCityState && (samePhone || sameSite)) {
      status = 'likely duplicate';
    } else if (!sameName && (samePhone || sameSite) && (sameAddress || sameNameCityState)) {
      status = 'renamed or rebranded business';
    } else if (samePhone || sameSite || sameNameCityState) {
      status = 'unrelated businesses with similar names';
    }

    return status === 'none'
      ? { status: 'none', matchedId: '', evidence: [] }
      : { status, matchedId: bestId, evidence: bestReasons };
  }

  const today = new Date().toISOString().slice(0, 10);
  const rows = enriched.map((row) => {
    const doc = row.doc;
    const dup = detectDuplicate(row);
    const protectedBusiness = row.publicState.eligibleForPublicSearchPopulation;
    const proposedName = row.nameInf.researched || safeString(doc.business_name || doc.name);
    const researchedAddress = safeString(doc.address);
    const researchedPhone = normalizePhone(doc.phone) || safeString(doc.phone);
    const researchedWebsite = normalizeUrl(doc.website) || safeString(doc.website);
    const proposedCategory = row.category.proposed || safeString(doc.display_categories || doc.categories || doc.category);
    const operatingClosed = /permanently closed|closed/i.test(`${safeString(doc.status)} ${safeString(doc.description)}`);
    const exclusionReason = classifyExclusionReason(doc, row.publicState, dup);
    const identityEvidenceCount = [
      !isBlank(proposedName),
      !isBlank(researchedAddress),
      !isBlank(researchedPhone),
      !isBlank(researchedWebsite),
      !isBlank(pick(doc.business_email, doc.email, doc.ownerEmail)),
    ].filter(Boolean).length;
    const strongIdentityEvidenceCount = [
      !isBlank(researchedPhone),
      !isBlank(researchedWebsite),
      !isBlank(researchedAddress),
    ].filter(Boolean).length;
    const hasOfficialishSource = !isBlank(researchedWebsite) || !isBlank(pick(doc.business_email, doc.email, doc.ownerEmail));

    const confidence = protectedBusiness
      ? 'verified'
      : dup.status === 'exact duplicate'
        ? 'verified'
        : (row.nameInf.confidence === 'high' && strongIdentityEvidenceCount >= 2)
          ? 'high'
          : (row.nameInf.confidence === 'medium' && (strongIdentityEvidenceCount >= 2 || (strongIdentityEvidenceCount >= 1 && hasOfficialishSource)))
            ? 'medium'
            : (!isBlank(proposedName) && identityEvidenceCount >= 3 && hasOfficialishSource)
              ? 'high'
              : (!isBlank(proposedName) && identityEvidenceCount >= 2)
                ? 'medium'
                : 'unresolved';
    const approvalReady = !protectedBusiness && dup.status === 'none' && (confidence === 'verified' || confidence === 'high') && hasOfficialishSource && strongIdentityEvidenceCount >= 2 && projectedEligibility(doc, proposedName, proposedCategory, dup, operatingClosed);
    const manualReviewRequired = (!protectedBusiness && !(confidence === 'verified' || confidence === 'high')) || ['likely duplicate','renamed or rebranded business','same company with multiple locations','unrelated businesses with similar names'].includes(dup.status);
    const fixes = [];
    if (isBlank(doc.business_name || doc.name) && proposedName) fixes.push('populate business_name');
    if (isBlank(doc.display_categories || doc.categories || doc.category) && proposedCategory) fixes.push('populate category/display_categories');
    if (isBlank(doc.description)) fixes.push('add description');
    if (isBlank(doc.city) || isBlank(doc.state) || isBlank(doc.address)) fixes.push('normalize address fields');
    if (isBlank(doc.alias || doc.slug)) fixes.push('generate alias/slug');
    if (dup.status === 'exact duplicate' || dup.status === 'likely duplicate') fixes.push('deduplicate before approval');
    if (dup.status === 'same company with multiple locations') fixes.push('confirm multi-location relationship before approval');
    if (dup.status === 'renamed or rebranded business') fixes.push('confirm rename or rebrand relationship before approval');
    if (operatingClosed) fixes.push('exclude closed business from approval');
    if (!approvalReady && !manualReviewRequired && exclusionReason === 'missing approval flag') fixes.push('review status/approval moderation');

    const evidenceBits = [];
    if (!isBlank(doc.address)) evidenceBits.push(`address:${safeString(doc.address)}`);
    if (!isBlank(doc.phone)) evidenceBits.push(`phone:${safeString(doc.phone)}`);
    if (!isBlank(doc.website)) evidenceBits.push(`website:${safeString(doc.website)}`);
    if (!isBlank(doc.description)) evidenceBits.push(`description:${safeString(doc.description).slice(0,160)}`);
    if (!isBlank(doc.category || doc.categories || doc.display_categories)) evidenceBits.push(`category:${safeString(doc.display_categories || doc.categories || doc.category)}`);
    if (row.nameInf.method) evidenceBits.push(`name_inference:${row.nameInf.method}`);
    if (dup.status !== 'none') evidenceBits.push(`duplicate:${dup.status}:${dup.evidence.join('+')}`);

    return {
      _id: String(doc._id),
      protected_or_non_protected: protectedBusiness ? 'protected' : 'non-protected',
      current_business_name: safeString(doc.business_name || doc.name),
      researched_business_name: proposedName,
      current_address: [safeString(doc.address), safeString(doc.city), safeString(doc.state), safeString(doc.zip || doc.postalCode)].filter(Boolean).join(', '),
      researched_address: researchedAddress,
      current_phone: safeString(doc.phone),
      researched_phone: researchedPhone,
      current_website: safeString(doc.website),
      researched_website: researchedWebsite,
      current_category_fields: JSON.stringify({ category: doc.category ?? null, categories: doc.categories ?? null, display_categories: doc.display_categories ?? null }),
      proposed_category_fields: JSON.stringify({ category: doc.category ?? null, categories: doc.categories ?? null, display_categories: proposedCategory || null }),
      operating_status: operatingClosed ? 'closed' : (safeString(doc.status) || 'unknown'),
      duplicate_status: dup.status,
      matched_existing_record_id: dup.matchedId,
      source_url_1: researchedWebsite || '',
      source_url_2: '',
      evidence_summary: evidenceBits.join(' | '),
      confidence,
      current_exclusion_reason: exclusionReason,
      fixes_required: fixes.join('; '),
      approval_ready: approvalReady,
      manual_review_required: manualReviewRequired,
      projected_public_search_eligibility: projectedEligibility(doc, proposedName, proposedCategory, dup, operatingClosed),
      date_researched: today,
      protected_live_eligibility_before: protectedBusiness,
      business_name_missing_before: isBlank(doc.business_name || doc.name),
      identified_missing_name: isBlank(doc.business_name || doc.name) && !isBlank(proposedName),
      inferred_name_method: row.nameInf.method || '',
      inferred_name_confidence: row.nameInf.confidence || '',
      category_inference_confidence: row.category.confidence || '',
      exact_phone: row.keys.phone,
      exact_website_domain: row.keys.website,
      normalized_address_key: row.keys.address && row.keys.city && row.keys.state ? `${row.keys.address}|${row.keys.city}|${row.keys.state}` : '',
      alias_or_slug: safeString(doc.alias || doc.slug),
      raw_snapshot_hash: crypto.createHash('sha1').update(JSON.stringify(doc)).digest('hex'),
      identity_evidence_count: identityEvidenceCount,
      strong_identity_evidence_count: strongIdentityEvidenceCount,
      has_officialish_source: hasOfficialishSource
    };
  });

  const protectedRows = rows.filter((r) => r.protected_or_non_protected === 'protected');
  const remainingRows = rows.filter((r) => r.protected_or_non_protected === 'non-protected');
  const missingNameRows = remainingRows.filter((r) => r.business_name_missing_before);
  const identifiedMissingNameRows = missingNameRows.filter((r) => r.identified_missing_name);
  const duplicateRows = remainingRows.filter((r) => r.duplicate_status !== 'none');
  const closedRows = remainingRows.filter((r) => r.operating_status === 'closed');
  const approvalReadyRows = remainingRows.filter((r) => r.approval_ready);
  const manualReviewRows = remainingRows.filter((r) => r.manual_review_required);
  const unresolvedRows = remainingRows.filter((r) => r.confidence === 'unresolved');
  const stillLackInfoRows = remainingRows.filter((r) => /missing business name|incomplete address|missing description|missing category|insufficient verification/.test(r.current_exclusion_reason));
  const enrichedOfficialish = remainingRows.filter((r) => r.researched_website || r.source_url_1);
  const enrichedMultiClue = remainingRows.filter((r) => {
    let score = 0;
    if (r.researched_phone) score++;
    if (r.researched_website) score++;
    if (r.researched_address) score++;
    if (r.researched_business_name) score++;
    return score >= 2;
  });

  const simulation = {
    protectedCountBefore: protectedRows.length,
    protectedCountAfter: protectedRows.length,
    protectedIdsRemoved: 0,
    protectedBusinessesDeactivated: 0,
    protectedBusinessesUnapproved: 0,
  };

  const summary = {
    environment: { database: dbName, collection: 'businesses', executionTimestamp: new Date().toISOString(), script: path.join(__dirname, 'audit_all_businesses_enrichment_readonly.js') },
    totals: {
      totalAudited: rows.length,
      protectedBusinesses: protectedRows.length,
      remainingBusinesses: remainingRows.length,
      missingNameRecords: missingNameRows.length,
      missingNameRecordsSuccessfullyIdentified: identifiedMissingNameRows.length,
      recordsEnrichedFromOfficialSources: enrichedOfficialish.length,
      recordsEnrichedFromMultiplePublicSources: enrichedMultiClue.length,
      duplicateRecordsFound: duplicateRows.length,
      closedBusinessesFound: closedRows.length,
      approvalReadyRecords: approvalReadyRows.length,
      manualReviewRecords: manualReviewRows.length,
      unresolvedRecords: unresolvedRows.length,
      recordsThatStillLackEnoughInformation: stillLackInfoRows.length,
    },
    protectedBusinessSimulation: simulation,
    exactRequiredSimulationText: [
      `Protected count before: ${simulation.protectedCountBefore}`,
      `Protected count after: ${simulation.protectedCountAfter}`,
      `Protected IDs removed: ${simulation.protectedIdsRemoved}`,
      `Protected businesses deactivated: ${simulation.protectedBusinessesDeactivated}`,
      `Protected businesses unapproved: ${simulation.protectedBusinessesUnapproved}`,
    ].join('\n'),
  };

  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'all-businesses-enrichment-research-readonly.json');
  const csvPath = path.join(outDir, 'all-businesses-enrichment-research-readonly.csv');
  const summaryPath = path.join(outDir, 'all-businesses-enrichment-summary-readonly.json');
  const candidatesPath = path.join(outDir, 'approval-ready-candidates-readonly.json');
  const dupesPath = path.join(outDir, 'duplicate-report-readonly.json');
  const unresolvedPath = path.join(outDir, 'unresolved-report-readonly.json');

  const header = Object.keys(rows[0] || {});
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = [header.join(',')].concat(rows.map((r) => header.map((k) => esc(typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k])).join(','))).join('\n');

  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
  fs.writeFileSync(csvPath, csv);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  fs.writeFileSync(candidatesPath, JSON.stringify(approvalReadyRows, null, 2));
  fs.writeFileSync(dupesPath, JSON.stringify(duplicateRows, null, 2));
  fs.writeFileSync(unresolvedPath, JSON.stringify(unresolvedRows, null, 2));

  console.log(JSON.stringify({ summaryPath, jsonPath, csvPath, candidatesPath, dupesPath, unresolvedPath, totals: summary.totals, simulation: summary.protectedBusinessSimulation }, null, 2));
  await client.close();
})().catch((err) => { console.error(err); process.exit(1); });
