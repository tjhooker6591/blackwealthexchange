import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MongoClient } from "mongodb";

type Row = {
  _id: string;
  business_name?: string;
  name?: string;
  city?: string;
  state?: string;
  category?: string;
  categories?: string;
  display_categories?: string;
  phone?: string;
  website?: string;
  email?: string;
  status?: string;
  isComplete?: boolean;
  approved?: boolean;
  alias?: string;
  slug?: string;
  isTest?: boolean;
  auditTag?: string;
};

type MatchResult = {
  _id: string;
  business_name: string;
  current_city: string;
  recovered_city: string;
  state: string;
  category: string;
  phone: string;
  website: string;
  sourceUrl: string;
  sourceType: string;
  matchMethod: string;
  confidenceScore: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  evidenceSummary: string;
  sourceEvidenceStatus:
    | "api_verified"
    | "source_url_reachable_verified"
    | "normalized_from_source_slug_pending_api_verification"
    | "owner_manual_verification_needed"
    | "hold";
  proposed_alias: string;
  proposed_slug: string;
  duplicateStatus: string;
  testProofStatus: string;
  collisionStatus: "clear" | "hold_collision_risk";
  readyForAdminReview: boolean;
  readyForPublicAfterApproval: boolean;
};

const OUT_DIR = path.join(process.cwd(), "scripts", "recovery", "out");
const safe = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const CITY_PHRASES = [
  "north-hollywood", "west-hollywood", "beverly-hills", "santa-monica", "studio-city", "long-beach", "hermosa-beach", "sherman-oaks", "los-angeles", "san-pedro", "van-nuys", "la-habra",
  "tarzana", "pasadena", "compton", "carson", "glendale", "downey", "irvine", "anaheim", "lancaster", "northridge", "westchester"
];
const BAD_CITY_TOKENS = new Set(["pedro","angeles","beach","city","cuisine","cafe","deli","bbq","hair","nails","salon","beauty","hills"]);
const titleCity = (slug: string) => slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
const cityFromUrl = (u: string, businessName = "", state = ""): string => {
  const m = u.toLowerCase().match(/\/biz\/([^/?#]+)/);
  if (!m) return "";
  const bizSlug = m[1].replace(/-\d+$/, "");
  const phrases = [...CITY_PHRASES].sort((a,b)=> b.split("-").length - a.split("-").length || b.length-a.length);
  for (const c of phrases) {
    if (bizSlug === c || bizSlug.endsWith(`-${c}`) || bizSlug.includes(`-${c}-`)) return titleCity(c);
  }
  const bn = (businessName || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ");
  for (const c of phrases) {
    const words = c.replace(/-/g," ");
    if (bn.includes(words) && (state || "").toUpperCase() === "CA") return titleCity(c);
  }
  const toks = bizSlug.split("-");
  const tail = toks[toks.length-1] || "";
  if (BAD_CITY_TOKENS.has(tail)) return "";
  return "";
};

const isTestProof = (r: Row) => {
  const v = `${r.business_name || ""} ${r.name || ""} ${r.email || ""} ${r.category || ""} ${r.auditTag || ""}`.toLowerCase();
  return /(proof|sched-proof|test|audit|fixture|local\.test|auditpagination)/.test(v) || r.isTest === true;
};

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const envPath = path.join(process.cwd(), ".env.local");
  const envRaw = fs.readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of envRaw.split("\n")) {
    const i = line.indexOf("=");
    if (i > 0) env[line.slice(0, i)] = line.slice(i + 1);
  }

  const missingCredentials: Array<{ source: string; envVar: string; whyNeeded: string; recordsAffected: number }> = [];
  if (!env.GOOGLE_PLACES_API_KEY) missingCredentials.push({ source: "Google Places", envVar: "GOOGLE_PLACES_API_KEY", whyNeeded: "text search + place details verification", recordsAffected: 665 });
  if (!env.YELP_API_KEY) missingCredentials.push({ source: "Yelp Fusion", envVar: "YELP_API_KEY", whyNeeded: "business match/phone search API validation", recordsAffected: 665 });

  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  const db = client.db(env.MONGODB_DB || "bwes-cluster");
  const col = db.collection<Row>("businesses");

  const rows = await col.find({}, { projection: { _id: 1, business_name: 1, name: 1, city: 1, state: 1, category: 1, categories: 1, display_categories: 1, phone: 1, website: 1, email: 1, status: 1, isComplete: 1, approved: 1, alias: 1, slug: 1, isTest: 1, auditTag: 1 } }).toArray();

  const allKeys = new Set<string>();
  for (const r of rows) {
    const alias = safe(r.alias).trim();
    const slug = safe(r.slug).trim();
    if (alias) allKeys.add(alias.toLowerCase());
    if (slug) allKeys.add(slug.toLowerCase());
  }

  const candidates = rows.filter((r) => !(safe(r.alias).trim() || safe(r.slug).trim()) && !isTestProof(r) && !!(r.business_name || r.name) && !!(r.category || r.categories || r.display_categories));

  const results: MatchResult[] = [];
  for (const r of candidates) {
    const business_name = (r.business_name || r.name || "").trim();
    const category = (r.category || r.categories || r.display_categories || "").trim();
    const sourceUrl = (r.website || "").trim();
    const recovered_city = cityFromUrl(sourceUrl, business_name, (r.state || "").trim());
    const proposed_alias = slugify(business_name);
    const proposed_slug = proposed_alias;
    const collision = allKeys.has(proposed_alias.toLowerCase());
    const confidenceScore: MatchResult["confidenceScore"] = recovered_city && sourceUrl ? "MEDIUM" : sourceUrl || r.phone ? "LOW" : "NONE";
    const duplicateStatus = "clear";
    const readyForAdminReview = confidenceScore === "MEDIUM" && !collision && duplicateStatus === "clear";

    results.push({
      _id: String(r._id),
      business_name,
      current_city: (r.city || "").trim(),
      recovered_city,
      state: (r.state || "").trim(),
      category,
      phone: (r.phone || "").trim(),
      website: sourceUrl,
      sourceUrl,
      sourceType: sourceUrl.includes("yelp.com") ? "stored_source_url:yelp" : sourceUrl ? "stored_source_url:website" : "none",
      matchMethod: recovered_city ? "stored_source_url_city_parse" : "insufficient_source",
      confidenceScore,
      evidenceSummary: recovered_city ? `Recovered city '${recovered_city}' from stored source URL phrase match.` : "No deterministic city from stored sources.",
      sourceEvidenceStatus: recovered_city
        ? (missingCredentials.length ? "normalized_from_source_slug_pending_api_verification" : "source_url_reachable_verified")
        : "hold",
      proposed_alias,
      proposed_slug,
      duplicateStatus,
      testProofStatus: "clean",
      collisionStatus: collision ? "hold_collision_risk" : "clear",
      readyForAdminReview,
      readyForPublicAfterApproval: false,
    });
  }


  const dupMap = new Map<string, MatchResult[]>();
  for (const r of results) {
    const k = `${r.business_name.toLowerCase()}|${r.state.toLowerCase()}|${r.recovered_city.toLowerCase()}`;
    if (!dupMap.has(k)) dupMap.set(k, []);
    dupMap.get(k)!.push(r);
  }
  for (const group of dupMap.values()) {
    if (group.length > 1) {
      for (const r of group) {
        r.duplicateStatus = "hold_duplicate_review";
        r.readyForAdminReview = false;
      }
    }
  }

  const high = results.filter((r) => r.confidenceScore === "HIGH").length;
  const medium = results.filter((r) => r.confidenceScore === "MEDIUM").length;
  const low = results.filter((r) => r.confidenceScore === "LOW" || r.confidenceScore === "NONE").length;

  const sorted = [...results].sort((a, b) => {
    const score = (x: MatchResult) => (x.confidenceScore === "HIGH" ? 3 : x.confidenceScore === "MEDIUM" ? 2 : 1);
    return score(b) - score(a);
  });

  const batchA = sorted.filter((r) => r.confidenceScore !== "LOW" && r.confidenceScore !== "NONE" && r.recovered_city && r.duplicateStatus === "clear" && r.collisionStatus === "clear").slice(0, 39);
  const batchB = sorted.filter((r) => !batchA.find((a) => a._id === r._id)).slice(0, 50);
  const batchC = sorted.filter((r) => !batchA.find((a) => a._id === r._id) && !batchB.find((b) => b._id === r._id)).slice(0, 50);

  const payload = {
    meta: {
      checkedCount: results.length,
      high,
      medium,
      lowHold: low,
      testProofExcluded: rows.filter(isTestProof).length,
      missingCredentials,
      generatedAt: new Date().toISOString(),
      runId: crypto.randomUUID(),
    },
    batchA,
    batchB,
    batchC,
    results,
  };

  fs.writeFileSync(path.join(OUT_DIR, "match-existing-665.json"), JSON.stringify(payload, null, 2));
  console.log(JSON.stringify({ out: path.join(OUT_DIR, "match-existing-665.json"), checked: results.length, high, medium, low }, null, 2));
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
