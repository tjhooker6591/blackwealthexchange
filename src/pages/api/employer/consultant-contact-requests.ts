import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

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
    const requestsCol = db.collection("employer_consultant_contact_requests");
    const pipelineCol = db.collection("employer_consultant_pipeline");

    if (req.method === "GET") {
      const items = await requestsCol
        .find({ employerId: auth.employerId })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();

      return res.status(200).json({
        ok: true,
        items: items.map((x: any) => ({
          id: String(x._id),
          consultantId: x.consultantId,
          requestType: x.requestType,
          message: x.message,
          status: x.status,
          createdAt: x.createdAt,
        })),
      });
    }

    if (req.method === "POST") {
      const consultantId = asText(req.body?.consultantId);
      const requestType = asText(req.body?.requestType).toLowerCase();
      const message = asText(req.body?.message);

      if (!consultantId) {
        return res.status(400).json({ error: "consultantId is required" });
      }
      if (!message || message.length < 20) {
        return res.status(400).json({
          error: "Message is required and should be at least 20 characters.",
        });
      }

      const normalizedRequestType =
        requestType === "interview_request" ? "interview_request" : "contact";
      const now = new Date();

      const result = await requestsCol.insertOne({
        employerId: auth.employerId,
        employerEmail: auth.employerEmail,
        consultantId,
        requestType: normalizedRequestType,
        message,
        status: "submitted",
        createdAt: now,
      });

      const nextPipelineStatus =
        normalizedRequestType === "interview_request"
          ? "interview_requested"
          : "contacted";

      await pipelineCol.updateOne(
        { employerId: auth.employerId, consultantId },
        {
          $set: {
            employerId: auth.employerId,
            employerEmail: auth.employerEmail,
            consultantId,
            status: nextPipelineStatus,
            notes: message,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );

      return res.status(201).json({
        ok: true,
        id: String(result.insertedId),
        consultantId,
        requestType: normalizedRequestType,
        pipelineStatus: nextPipelineStatus,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("[api/employer/consultant-contact-requests]", error);
    return res.status(500).json({ error: "Failed to process contact request" });
  }
}
