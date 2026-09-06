// src/pages/api/user/save-opportunity.ts
//
// Phase 5 -- Save Opportunity (scholarships, grants, internships from the
// existing Student Hub catalog -- src/lib/studentHub/repository.ts). Same
// toggle-and-list pattern as save-business.ts / save-product.ts, resolving
// saved ids against the real, already-existing student hub catalog rather
// than caching a copy of opportunity data.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession, s } from "@/lib/network/shared";
import { getStudentHubResolvedCatalog } from "@/lib/studentHub/repository";
import { deriveStudentHubLifecycle } from "@/lib/studentHub/lifecycle";

async function ensureIndexes(db: any) {
  await db
    .collection("saved_opportunities")
    .createIndex(
      { userId: 1, opportunityId: 1 },
      { unique: true, name: "uniq_saved_opportunities_user_opportunity" },
    )
    .catch(() => null);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const session = getNetworkSession(req);
  if (!session) return res.status(401).json({ error: "Login required" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureIndexes(db);

  if (req.method === "GET") {
    const rows = await db
      .collection("saved_opportunities")
      .find({ userId: session.userId })
      .sort({ savedAt: -1 })
      .limit(200)
      .toArray();

    const savedIds = new Set(rows.map((row: any) => s(row.opportunityId)));
    const { records } = await getStudentHubResolvedCatalog({ page: "hub" });
    const byId = new Map(records.map((record) => [record.id, record]));

    return res.status(200).json({
      opportunities: rows
        .map((row: any) => {
          const record = byId.get(s(row.opportunityId));
          if (!record) return null;
          return {
            opportunityId: record.id,
            savedAt:
              row.savedAt instanceof Date
                ? row.savedAt.toISOString()
                : row.savedAt || null,
            title: record.title,
            organization: record.organization,
            opportunityType: record.opportunityType,
            status: deriveStudentHubLifecycle(record).status,
            href: record.applicationUrl,
          };
        })
        .filter(Boolean),
      savedCount: savedIds.size,
    });
  }

  if (req.method === "POST" || req.method === "DELETE") {
    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const opportunityId = s(body.opportunityId);
    if (!opportunityId) {
      return res.status(400).json({ error: "opportunityId is required" });
    }

    if (req.method === "DELETE") {
      await db
        .collection("saved_opportunities")
        .deleteOne({ userId: session.userId, opportunityId });
      return res.status(200).json({ saved: false });
    }

    const { records } = await getStudentHubResolvedCatalog({ page: "hub" });
    const record = records.find((item) => item.id === opportunityId);
    if (!record) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    await db.collection("saved_opportunities").updateOne(
      { userId: session.userId, opportunityId },
      {
        $setOnInsert: {
          userId: session.userId,
          opportunityId,
          opportunityType: record.opportunityType,
          savedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return res.status(201).json({ saved: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
