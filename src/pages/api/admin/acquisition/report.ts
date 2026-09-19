import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  resolveAdminFinancialReport,
  resolveEstimatedPipeline,
} from "@/lib/acquisition/reports";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const since =
    typeof req.query.since === "string"
      ? req.query.since
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const until =
    typeof req.query.until === "string"
      ? req.query.until
      : new Date().toISOString();

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const [report, pipeline] = await Promise.all([
    resolveAdminFinancialReport(db, { since, until }),
    resolveEstimatedPipeline(db),
  ]);

  return res
    .status(200)
    .json({ ok: true, report, estimatedPipeline: pipeline });
}
