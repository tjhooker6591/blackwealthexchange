import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";

type ConsultingStatus = "pending" | "approved" | "rejected" | "flagged";

function normalizeStatus(value: unknown): ConsultingStatus {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (v === "approved" || v === "rejected" || v === "flagged") return v;
  return "pending";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const dbName =
      process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "bwes-cluster";
    const db = client.db(dbName);

    if (req.method === "PATCH") {
      const { id, collection, status } = req.body || {};
      const nextStatus = normalizeStatus(status);
      if (!id || !collection) {
        return res.status(400).json({ error: "Missing id or collection" });
      }
      if (!["consulting_interest", "consulting_intake"].includes(collection)) {
        return res.status(400).json({ error: "Invalid collection" });
      }

      const { ObjectId } = await import("mongodb");
      const _id = ObjectId.isValid(String(id))
        ? new ObjectId(String(id))
        : null;
      if (!_id) return res.status(400).json({ error: "Invalid id" });

      const result = await db.collection(collection).updateOne(
        { _id },
        {
          $set: {
            status: nextStatus,
            updatedAt: new Date(),
            reviewedBy: admin.email || admin.userId || "admin",
          },
        },
      );

      if (!result.matchedCount) {
        return res.status(404).json({ error: "Lead not found" });
      }

      return res
        .status(200)
        .json({ ok: true, id, collection, status: nextStatus });
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET", "PATCH"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const [interestRows, intakeRows] = await Promise.all([
      db
        .collection("consulting_interest")
        .find({})
        .sort({ createdAt: -1 })
        .project({
          name: 1,
          fullName: 1,
          businessName: 1,
          email: 1,
          phone: 1,
          company: 1,
          service: 1,
          interestType: 1,
          message: 1,
          notes: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          source: 1,
        })
        .toArray(),
      db
        .collection("consulting_intake")
        .find({})
        .sort({ createdAt: -1 })
        .project({
          type: 1,
          name: 1,
          email: 1,
          company: 1,
          phone: 1,
          details: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          source: 1,
        })
        .toArray(),
    ]);

    const normalized = [
      ...interestRows.map((x: any) => ({
        _id: x._id.toString(),
        collection: "consulting_interest",
        name: x.name || x.fullName || "",
        businessName: x.businessName || x.company || "",
        email: x.email || "",
        phone: x.phone || "",
        service: x.service || x.interestType || "",
        message: x.message || x.notes || "",
        intakeType: "interest",
        source: x.source || "website",
        status: normalizeStatus(x.status),
        createdAt: x.createdAt ? new Date(x.createdAt).toISOString() : null,
        updatedAt: x.updatedAt ? new Date(x.updatedAt).toISOString() : null,
      })),
      ...intakeRows.map((x: any) => ({
        _id: x._id.toString(),
        collection: "consulting_intake",
        name: x.name || "",
        businessName: x.company || "",
        email: x.email || "",
        phone: x.phone || "",
        service: x.type || "",
        message: x.details || "",
        intakeType: x.type || "intake",
        source: x.source || "homepage_recruiting_section",
        status: normalizeStatus(x.status),
        createdAt: x.createdAt ? new Date(x.createdAt).toISOString() : null,
        updatedAt: x.updatedAt ? new Date(x.updatedAt).toISOString() : null,
      })),
    ].sort((a: any, b: any) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return res.status(200).json({
      ok: true,
      interests: normalized,
    });
  } catch (error) {
    console.error("[admin consulting interests] Error:", error);
    return res.status(500).json({
      error: "Failed to load consulting interests",
    });
  }
}
