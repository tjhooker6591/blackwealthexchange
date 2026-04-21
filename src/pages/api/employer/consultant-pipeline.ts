import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import { normalizePipelineStatus } from "@/lib/consultants/normalize";

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function requireEmployer(req: NextApiRequest) {
  const parsed = cookie.parse(req.headers.cookie || "");
  const token = parsed.session_token || req.cookies?.session_token;
  if (!token) return null;
  const payload = jwt.verify(token, getJwtSecret()) as {
    userId?: string;
    id?: string;
    email?: string;
    accountType?: string;
  };
  if (payload.accountType !== "employer") return null;
  return {
    employerId: String(payload.userId || payload.id || payload.email || ""),
    employerEmail: String(payload.email || ""),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const auth = requireEmployer(req);
    if (!auth) return res.status(403).json({ error: "Access denied" });

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const col = db.collection("employer_consultant_pipeline");

    if (req.method === "GET") {
      const items = await col
        .find({ employerId: auth.employerId })
        .sort({ updatedAt: -1 })
        .limit(200)
        .toArray();
      return res.status(200).json({
        ok: true,
        items: items.map((x: any) => ({
          id: String(x._id),
          consultantId: x.consultantId,
          status: x.status,
          notes: x.notes || "",
          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
        })),
      });
    }

    if (req.method === "POST") {
      const consultantId = asText(req.body?.consultantId);
      const status = normalizePipelineStatus(req.body?.status);
      const notes = asText(req.body?.notes);
      if (!consultantId) {
        return res.status(400).json({ error: "consultantId is required" });
      }

      const now = new Date();
      await col.updateOne(
        { employerId: auth.employerId, consultantId },
        {
          $set: {
            employerId: auth.employerId,
            employerEmail: auth.employerEmail,
            consultantId,
            status,
            notes,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );

      await db.collection("flow_events").insertOne({
        eventType: "consultant_pipeline_status_set",
        pageRoute: "/api/employer/consultant-pipeline",
        section: "consultant_pipeline",
        source: "consultant_pipeline_api",
        source_variant: "post",
        employerId: auth.employerId,
        consultantId,
        status,
        createdAt: now,
      });

      return res.status(200).json({ ok: true, consultantId, status });
    }

    if (req.method === "PATCH") {
      const itemId = asText(req.body?.id);
      if (!itemId || !ObjectId.isValid(itemId)) {
        return res.status(400).json({ error: "Valid pipeline id required" });
      }
      const status = normalizePipelineStatus(req.body?.status);
      const notes = asText(req.body?.notes);

      const now = new Date();
      const updated = await col.updateOne(
        { _id: new ObjectId(itemId), employerId: auth.employerId },
        { $set: { status, notes, updatedAt: now } },
      );
      if (!updated.matchedCount) {
        return res.status(404).json({ error: "Pipeline item not found" });
      }

      await db.collection("flow_events").insertOne({
        eventType: "consultant_pipeline_status_set",
        pageRoute: "/api/employer/consultant-pipeline",
        section: "consultant_pipeline",
        source: "consultant_pipeline_api",
        source_variant: "patch",
        employerId: auth.employerId,
        pipelineId: itemId,
        status,
        createdAt: now,
      });

      return res.status(200).json({ ok: true, id: itemId, status });
    }

    res.setHeader("Allow", ["GET", "POST", "PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("[api/employer/consultant-pipeline]", error);
    return res.status(500).json({ error: "Failed to process request" });
  }
}
