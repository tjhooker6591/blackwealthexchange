import "dotenv/config";
import clientPromise from "../src/lib/mongodb";
import { getMongoDbName } from "../src/lib/env";
import { buildLiveAdminMetrics } from "../src/lib/adminSnapshot";

async function main() {
  const db = (await clientPromise).db(getMongoDbName());
  const m = await buildLiveAdminMetrics(db);
  const d = new Date();
  const snapshotDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
  const doc = {
    snapshotDate,
    revenue: m.revenue,
    support: m.support,
    growth: m.growth,
    trustSafety: m.trustSafety,
    systemHealth: m.systemHealth,
    executiveSignals: m.executiveSignals,
    createdAt: new Date(),
  };
  await db.collection("admin_metrics_snapshots").updateOne(
    { snapshotDate },
    { $set: doc, $setOnInsert: { insertedAt: new Date() } },
    { upsert: true },
  );
  console.log(JSON.stringify({ ok: true, snapshotDate }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
