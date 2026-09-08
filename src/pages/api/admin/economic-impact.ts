// src/pages/api/admin/economic-impact.ts
//
// Phase 6 -- Economic Impact Engine API. Admin-only full snapshot across
// all 8 categories, reusing the existing admin auth guard
// (src/lib/adminAuth.ts) already used by every other admin metrics route.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { resolveEconomicImpactSnapshot } from "@/lib/economicImpact/engine";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const decoded = await requireAdminFromRequest(req, res);
  if (!decoded) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  try {
    const snapshot = await resolveEconomicImpactSnapshot(db);
    return res.status(200).json(snapshot);
  } catch (error) {
    console.error("[admin/economic-impact] failed:", error);
    return res
      .status(500)
      .json({ error: "Failed to resolve economic impact snapshot" });
  }
}
