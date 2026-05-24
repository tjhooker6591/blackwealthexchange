import type { Db } from "mongodb";
let ensured = false;
export async function ensureTravelMapIndexes(db: Db) {
  if (ensured) return;
  const ensure = async (key: Record<string, any>) => {
    try {
      await db.collection("businesses").createIndex(key);
    } catch {
      // tolerate existing equivalent indexes with different names/options
    }
  };

  await Promise.all([
    ensure({ location: "2dsphere" as any }),
    ensure({ verified: 1, sponsored: 1, updatedAt: -1 }),
    ensure({ city: 1, state: 1, category: 1 }),
  ]);
  ensured = true;
}
