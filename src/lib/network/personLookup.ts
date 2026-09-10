// src/lib/network/personLookup.ts
//
// BWE Pulse Phase 2 -- people (as opposed to businesses) live in one of
// three collections depending on accountType (users/sellers/employers) --
// see collectionFor() in src/pages/api/profile.ts, which this mirrors.
// Follow-a-person and public profiles need to resolve an account by _id
// without already knowing which collection it's in.

import type { Db } from "mongodb";
import { buildIdFilter } from "@/lib/network/shared";

export const PERSON_COLLECTIONS = ["users", "sellers", "employers"] as const;

export async function findPersonById(db: Db, userId: string) {
  const filter = buildIdFilter("_id", userId);
  if (!filter) return null;

  for (const collection of PERSON_COLLECTIONS) {
    const doc = await db.collection(collection).findOne(filter as any);
    if (doc) return { doc, collection };
  }
  return null;
}
