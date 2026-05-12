import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

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

  const type = String(req.query.type || "all");
  const limit = Math.min(Number(req.query.limit || 50), 200);

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await Promise.all([
    db.collection("products").createIndex({ status: 1, updatedAt: -1 }),
    db.collection("jobs").createIndex({ status: 1, updatedAt: -1 }),
    db.collection("businesses").createIndex({ status: 1, updatedAt: -1 }),
    db
      .collection("advertising_requests")
      .createIndex({ status: 1, updatedAt: -1 }),
    db
      .collection("admin_moderation_audit")
      .createIndex({ targetType: 1, targetId: 1, createdAt: -1 }),
  ]);

  const queues: any[] = [];
  const pushRows = (rows: any[], targetType: string) =>
    rows.forEach((r) =>
      queues.push({
        targetType,
        targetId: String(r._id),
        title:
          r.title || r.business_name || r.companyName || r.name || "(untitled)",
        status: r.status || "pending",
        updatedAt: r.updatedAt || r.createdAt || null,
      }),
    );

  if (type === "all" || type === "products")
    pushRows(
      await db
        .collection("products")
        .find({ status: { $in: ["pending", "flagged"] } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray(),
      "products",
    );
  if (type === "all" || type === "jobs")
    pushRows(
      await db
        .collection("jobs")
        .find({ status: { $in: ["pending", "flagged"] } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray(),
      "jobs",
    );
  if (type === "all" || type === "businesses")
    pushRows(
      await db
        .collection("businesses")
        .find({ status: { $in: ["pending", "flagged"] } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray(),
      "businesses",
    );
  if (type === "all" || type === "ads")
    pushRows(
      await db
        .collection("advertising_requests")
        .find({ status: { $in: ["pending", "flagged"] } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray(),
      "ads",
    );

  queues.sort(
    (a, b) =>
      new Date(b.updatedAt || 0).getTime() -
      new Date(a.updatedAt || 0).getTime(),
  );
  return res.status(200).json({
    ok: true,
    items: queues.slice(0, limit),
    requestedBy: admin.email || admin.userId || "admin",
  });
}
