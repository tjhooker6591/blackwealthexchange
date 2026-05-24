import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function containsSuspiciousContent(message: string) {
  const lower = message.toLowerCase();
  const blockedTerms = [
    "wire money",
    "crypto only",
    "send gift card",
    "telegram only",
    "whatsapp only",
  ];
  const hasBlockedTerm = blockedTerms.some((x) => lower.includes(x));
  const urlCount = (message.match(/https?:\/\//gi) || []).length;
  const repeatedCharRun = /(.)\1{7,}/.test(message);
  const excessiveCaps =
    message.length > 30 &&
    message.replace(/[^A-Z]/g, "").length / message.length > 0.5;

  return {
    flagged: hasBlockedTerm || urlCount > 2 || repeatedCharRun || excessiveCaps,
    reasons: [
      hasBlockedTerm ? "blocked_term" : null,
      urlCount > 2 ? "too_many_links" : null,
      repeatedCharRun ? "repeated_characters" : null,
      excessiveCaps ? "excessive_caps" : null,
    ].filter(Boolean),
  };
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
          moderationStatus: x.moderationStatus || "clean",
          consultantResponseAction: x.consultantResponseAction || null,
          consultantResponseNote: x.consultantResponseNote || "",
          consultantRespondedAt: x.consultantRespondedAt || null,
          createdAt: x.createdAt,
          updatedAt: x.updatedAt || x.createdAt,
        })),
      });
    }

    if (req.method === "POST") {
      const consultantId = asText(req.body?.consultantId);
      const requestType = asText(req.body?.requestType).toLowerCase();
      const message = sanitizeRichHtml(asText(req.body?.message)).trim();

      if (!consultantId) {
        return res.status(400).json({ error: "consultantId is required" });
      }
      if (!message || message.length < 20 || message.length > 1200) {
        return res.status(400).json({
          error:
            "Message is required and should be between 20 and 1200 characters.",
        });
      }

      await ensureApiRateLimitIndexes(db);
      const ip = getClientIp(req);
      const ipLimit = await hitApiRateLimit(
        db,
        `consultant_contact:ip:${ip}`,
        30,
        15,
      );
      const employerLimit = await hitApiRateLimit(
        db,
        `consultant_contact:employer:${auth.employerId}`,
        20,
        15,
      );

      if (ipLimit.blocked || employerLimit.blocked) {
        res.setHeader(
          "Retry-After",
          String(
            Math.max(
              ipLimit.retryAfterSeconds,
              employerLimit.retryAfterSeconds,
            ),
          ),
        );
        return res
          .status(429)
          .json({ error: "Too many contact requests. Please try later." });
      }

      const moderation = containsSuspiciousContent(message);
      if (moderation.flagged) {
        const now = new Date();
        const blockedInsert = await requestsCol.insertOne({
          employerId: auth.employerId,
          employerEmail: auth.employerEmail,
          consultantId,
          requestType: requestType || "contact",
          message,
          moderationStatus: "blocked",
          moderationReasons: moderation.reasons,
          status: "blocked",
          createdAt: now,
          updatedAt: now,
        });

        await db.collection("flow_events").insertOne({
          eventType: "consultant_contact_request_blocked",
          pageRoute: "/api/employer/consultant-contact-requests",
          section: "consultant_contact",
          source: "consultant_contact_api",
          source_variant: requestType || "contact",
          employerId: auth.employerId,
          consultantId,
          requestId: String(blockedInsert.insertedId),
          moderationReasons: moderation.reasons,
          createdAt: now,
        });

        return res.status(400).json({
          error:
            "Request was blocked by moderation checks. Please revise message.",
          requestId: String(blockedInsert.insertedId),
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
        moderationStatus: "clean",
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

      await db.collection("flow_events").insertOne({
        eventType: "consultant_contact_request_submitted",
        pageRoute: "/api/employer/consultant-contact-requests",
        section: "consultant_contact",
        source: "consultant_contact_api",
        source_variant: normalizedRequestType,
        employerId: auth.employerId,
        consultantId,
        resultingPipelineStatus: nextPipelineStatus,
        createdAt: now,
      });

      await db.collection("flow_events").insertOne({
        eventType: "consultant_pipeline_status_set",
        pageRoute: "/api/employer/consultant-contact-requests",
        section: "consultant_pipeline",
        source: "consultant_contact_api",
        source_variant: normalizedRequestType,
        employerId: auth.employerId,
        consultantId,
        status: nextPipelineStatus,
        createdAt: now,
      });

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
