// src/lib/sponsorSearchCapIndexes.ts
//
// Missing-index fix (2026-09-07). sponsor_search_session_caps is
// upserted on { sessionKey, sponsorId } on every sponsored search hit in
// src/pages/api/search/businesses.ts, and carries an `expiresAt` field
// meant to bound its own growth -- neither was backed by an index (the
// collection had only the default _id_ index), so every upsert did a
// full collection scan and nothing ever actually expired old caps.
import type { Db } from "mongodb";
let ensured = false;
export async function ensureSponsorSearchCapIndexes(db: Db) {
  if (ensured) return;
  const ensure = async (key: Record<string, any>, options?: object) => {
    try {
      await db
        .collection("sponsor_search_session_caps")
        .createIndex(key, options as any);
    } catch {
      // tolerate existing equivalent indexes with different names/options
    }
  };

  await Promise.all([
    ensure({ sessionKey: 1, sponsorId: 1 }),
    ensure({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  ensured = true;
}
