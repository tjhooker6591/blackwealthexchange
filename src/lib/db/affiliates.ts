// src/lib/db/affiliates.ts
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

export async function recordAffiliateConversion(
  affiliateCode: string,
  amount: number,
  sessionId: string,
) {
  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  return db.collection("affiliateConversions").insertOne({
    affiliateCode,
    amount,
    sessionId,
    date: new Date(),
  });
}

// (You could add `export {}` here as a fallback, but it's not necessary
//  if you already have the above named export.)
