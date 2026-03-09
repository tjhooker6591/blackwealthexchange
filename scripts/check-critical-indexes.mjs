import { MongoClient } from "mongodb";
import fs from "node:fs";

const uri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  (() => {
    try {
      const t = fs.readFileSync("connect.js", "utf8");
      const m = t.match(/"mongodb\+srv:[^"]+"/);
      return m ? m[0].slice(1, -1) : "";
    } catch {
      return "";
    }
  })();

if (!uri) {
  console.error("Missing Mongo URI for index check");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "bwes-cluster";

const required = {
  password_resets: ["expiresAt_1", "tokenHash_1"],
  password_reset_rate_limits: ["expiresAt_1"],
  businesses: ["alias_approved_unique"],
};

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

let failed = false;
for (const [collection, names] of Object.entries(required)) {
  const idx = await db.collection(collection).indexes();
  const present = new Set(idx.map((i) => i.name));
  for (const n of names) {
    const ok = present.has(n);
    console.log(`${ok ? "OK" : "MISSING"} ${collection} ${n}`);
    if (!ok) failed = true;
  }
}

await client.close();
if (failed) process.exit(1);
