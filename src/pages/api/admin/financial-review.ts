import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";
import { getAdminFinanceSummary } from "@/lib/adminFinanceSummary";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const summary = await getAdminFinanceSummary(db);

  return res.status(200).json({
    ...summary,
    notes: {
      consultingOpportunityNetwork: "Manual entry (Phase 1)",
      manualRevenue: "Manual / Offline Revenue",
    },
  });
}
