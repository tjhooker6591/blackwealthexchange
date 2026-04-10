#!/usr/bin/env node
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
if (!uri) throw new Error("MONGODB_URI is required");

const query = (process.argv[2] || "black coffee").trim();

function score(item, q) {
  const text = `${item.business_name || ""} ${item.description || ""} ${item.category || ""} ${item.categories || ""} ${item.display_categories || ""} ${item.city || ""} ${item.state || ""}`.toLowerCase();
  const name = String(item.business_name || "").toLowerCase();
  const qq = q.toLowerCase();
  let s = 0;
  if (name === qq) s += 120;
  if (name.startsWith(qq)) s += 65;
  if (name.includes(qq)) s += 35;
  if (text.includes(qq)) s += 15;
  if (item.verified || item.isVerified) s += 8;
  if (Number(item.amountPaid || 0) > 0) s += 4;
  return s;
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const col = db.collection("businesses");

const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
const docs = await col
  .find({
    $or: [
      { business_name: rx },
      { description: rx },
      { category: rx },
      { categories: rx },
      { display_categories: rx },
      { city: rx },
      { state: rx },
    ],
  })
  .limit(80)
  .toArray();

const baseline = [...docs]
  .sort((a, b) => Number(b.amountPaid || 0) - Number(a.amountPaid || 0))
  .slice(0, 5)
  .map((x) => x.business_name || x._id.toString());

const ranked = [...docs]
  .map((item) => ({ item, score: score(item, query) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
  .map((x) => ({
    name: x.item.business_name || x.item._id.toString(),
    score: x.score,
    amountPaid: Number(x.item.amountPaid || 0),
  }));

console.log(
  JSON.stringify({
    ok: true,
    query,
    candidateCount: docs.length,
    beforeSponsorFirstTop5: baseline,
    afterRelevanceTop5: ranked,
  }, null, 2),
);

await client.close();
