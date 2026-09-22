import fs from "node:fs";
import path from "node:path";
import { MongoClient, ObjectId } from "mongodb";

async function main() {
  const envRaw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const env: Record<string, string> = {};
  for (const line of envRaw.split("\n")) {
    const i = line.indexOf("=");
    if (i > 0) env[line.slice(0, i)] = line.slice(i + 1);
  }

  const snapshotPath = process.argv[2];
  if (!snapshotPath) throw new Error("Usage: tsx scripts/recovery/rollback-batch.ts <snapshot.json>");
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  const db = client.db(env.MONGODB_DB || "bwes-cluster");
  const col = db.collection("businesses");

  let restored = 0;
  for (const row of snapshot.rows || []) {
    const _id = new ObjectId(row._id);
    await col.updateOne(
      { _id },
      {
        $set: {
          city: row.old.city ?? null,
          state: row.old.state ?? null,
          alias: row.old.alias ?? null,
          slug: row.old.slug ?? null,
          status: row.old.status ?? null,
          isComplete: row.old.isComplete ?? null,
          approved: row.old.approved ?? null,
        },
      },
    );
    restored++;
  }

  console.log(JSON.stringify({ restored }, null, 2));
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
