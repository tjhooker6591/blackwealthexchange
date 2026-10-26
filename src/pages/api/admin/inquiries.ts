import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  ensureInquiryIndexes,
  inquirySummary,
  processPendingForwards,
} from "@/lib/inquiries/service";
import { inquiryDeps } from "@/lib/inquiries/deps";

// GET: recent inquiries and the summary (by category, Speed-to-Lead
// hand-offs, conversions to paying members). Opening the page also retries
// any hand-offs that are due. POST {action:"retry"}: retry them now (after
// BWE goes live in Speed-to-Lead, this sends everything that was waiting).
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  const db = (await clientPromise).db(getMongoDbName());
  await ensureInquiryIndexes(db);
  const deps = inquiryDeps();
  if (req.method === "POST") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    if (body.action !== "retry")
      return res.status(400).json({ ok: false, error: "Unknown action" });
    // Waiting hand-offs are tried now rather than at their next daily slot.
    await db
      .collection("inquiries")
      .updateMany(
        { "speedToLead.state": { $in: ["waiting_for_go_live", "retrying"] } },
        { $set: { "speedToLead.nextAttemptAt": null } },
      );
    const r = await processPendingForwards(db, deps, 200);
    return res
      .status(200)
      .json({ ok: true, ...r, summary: await inquirySummary(db) });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  await processPendingForwards(db, deps, 10).catch(() => null);
  const items = await db
    .collection("inquiries")
    .find({}, { projection: { dedupeKey: 0 } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return res.status(200).json({
    ok: true,
    speedToLeadConfigured: Boolean(deps.speedToLeadUrl),
    summary: await inquirySummary(db),
    items: items.map((i: any) => ({ ...i, _id: String(i._id) })),
  });
}
