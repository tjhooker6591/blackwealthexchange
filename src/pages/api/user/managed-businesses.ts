import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { parseSessionIdentity } from "@/lib/directoryOwnership";
import { listVerifiedManagedBusinessSummaries } from "@/lib/personBusinessRelationships";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = parseSessionIdentity(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const results = await listVerifiedManagedBusinessSummaries(
      db,
      session.userId,
    );

    return res.status(200).json({ businesses: results });
  } catch (error) {
    console.error("[managed-businesses]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
