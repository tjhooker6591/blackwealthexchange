import fs from "node:fs";
import path from "node:path";

type R = any;

const inPath = path.join(process.cwd(), "scripts", "recovery", "out", "match-existing-665.json");
const outPath = path.join(process.cwd(), "scripts", "recovery", "out", "verification-report.json");

const key = (k: string) => (process.env[k] || "").trim();
const hasGoogle = !!key("GOOGLE_PLACES_API_KEY");
const hasYelp = !!key("YELP_API_KEY");

const normalizePhone = (v: string) => {
  const d = (v || "").replace(/\D+/g, "");
  if (!d) return "";
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (d.length === 10) return `+1${d}`;
  return "";
};

const n = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const nameOverlap = (a: string, b: string) => {
  const sa = new Set(n(a).split(" ").filter(Boolean));
  const sb = new Set(n(b).split(" ").filter(Boolean));
  if (!sa.size || !sb.size) return 0;
  let hit = 0;
  sa.forEach((w) => { if (sb.has(w)) hit++; });
  return hit / Math.max(sa.size, sb.size);
};

async function googleVerify(r: R) {
  if (!hasGoogle) return { status: "not_run_missing_key" };
  const q = encodeURIComponent(`${r.business_name} ${r.recovered_city} ${r.state}`.trim());
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${key("GOOGLE_PLACES_API_KEY")}`;
  const res = await fetch(url);
  if (!res.ok) return { status: `http_${res.status}` };
  const js: any = await res.json();
  const top = js.results?.[0];
  if (!top) return { status: "no_match" };
  const score = nameOverlap(r.business_name, top.name || "");
  const cityHit = n(top.formatted_address || "").includes(n(r.recovered_city));
  return { status: score >= 0.6 && cityHit ? "match" : "weak_match", score, placeId: top.place_id || "" };
}

async function yelpVerify(r: R) {
  if (!hasYelp) return { status: "not_run_missing_key" };
  const phone = normalizePhone(r.phone || "");
  const params = new URLSearchParams();
  if (phone) params.set("phone", phone);
  params.set("name", r.business_name || "");
  params.set("city", r.recovered_city || "");
  params.set("state", r.state || "");
  params.set("country", "US");
  const url = `https://api.yelp.com/v3/businesses/matches?${params.toString()}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key("YELP_API_KEY")}` } });
  if (!res.ok) return { status: `http_${res.status}` };
  const js: any = await res.json();
  const top = js.businesses?.[0];
  if (!top) return { status: "no_match" };
  const score = nameOverlap(r.business_name, top.name || "");
  const cityHit = n(top.location?.city || "") === n(r.recovered_city || "");
  return { status: score >= 0.6 && cityHit ? "match" : "weak_match", score, id: top.id || "" };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(inPath, "utf8"));
  const target = (process.argv.find((a) => a.startsWith("--batch=")) || "--batch=A").split("=")[1].toUpperCase();
  const rows: R[] = target === "B" ? data.batchB : target === "C" ? data.batchC : data.batchA;
  const out: any[] = [];
  for (const r of rows) {
    const g = await googleVerify(r);
    const y = await yelpVerify(r);
    let verification_status = "owner_manual_verification_needed";
    let confidence = "MEDIUM";
    if ((g.status === "match") || (y.status === "match")) {
      verification_status = "api_verified";
      confidence = (g.status === "match" && y.status === "match") ? "HIGH" : "MEDIUM";
    } else if (!hasGoogle && !hasYelp) {
      verification_status = "owner_manual_verification_needed";
      confidence = "MEDIUM";
    } else if (g.status?.startsWith("http_") || y.status?.startsWith("http_")) {
      verification_status = "hold";
      confidence = "LOW";
    } else if (g.status === "no_match" && y.status === "no_match") {
      verification_status = "fail";
      confidence = "LOW";
    }
    out.push({
      _id: r._id,
      business_name: r.business_name,
      normalized_city: r.recovered_city,
      state: r.state,
      phone: normalizePhone(r.phone || ""),
      google_match: g,
      yelp_match: y,
      verification_status,
      confidence,
      ready_for_owner_approval: verification_status === "api_verified" && r.duplicateStatus === "clear" && r.collisionStatus === "clear",
    });
  }
  fs.writeFileSync(outPath, JSON.stringify({ batch: target, hasGoogle, hasYelp, count: out.length, rows: out }, null, 2));
  console.log(JSON.stringify({ outPath, batch: target, hasGoogle, hasYelp, count: out.length }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
