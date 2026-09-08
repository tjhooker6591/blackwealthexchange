// src/pages/api/consulting-service-intake.ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Public intake for
// BWE's own advisory/implementation services -- deliberately named
// distinctly from the pre-existing consulting-intake.ts, which is
// actually the platform's recruiting lead-capture (employer/candidate
// talent matching), not this. Writes to consulting_service_intake, a
// lightweight lead record; an admin later reviews it and, if it
// converts, creates a real consulting_engagements record referencing
// this intake's id.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v: unknown, max = 500): string {
  const raw = typeof v === "string" ? v : "";
  return sanitizeRichHtml(raw)
    .replace(/<[^>]*>?/gm, "")
    .trim()
    .slice(0, max);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  const clientCompany = clean(req.body?.clientCompany, 200);
  const contactName = clean(req.body?.contactName, 120);
  const contactEmail = clean(req.body?.contactEmail, 200).toLowerCase();
  const serviceTitle = clean(req.body?.serviceTitle, 200);
  const scope = clean(req.body?.scope, 4000);
  const timeframe = clean(req.body?.timeframe, 200);
  const budgetIndication = clean(req.body?.budgetIndication, 200);

  if (
    !clientCompany ||
    !contactName ||
    !EMAIL_REGEX.test(contactEmail) ||
    !serviceTitle ||
    !scope
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Company, contact name, email, service, and a brief description are required.",
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db).catch(() => null);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      db,
      `consulting-service-intake:ip:${ip}`,
      10,
      10,
    );
    const emailLimit = await hitApiRateLimit(
      db,
      `consulting-service-intake:email:${contactEmail}`,
      5,
      10,
    );
    if (ipLimit.blocked || emailLimit.blocked) {
      res.setHeader(
        "Retry-After",
        String(
          Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds),
        ),
      );
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please try again shortly.",
      });
    }

    const now = new Date();
    const result = await db.collection("consulting_service_intake").insertOne({
      clientCompany,
      contactName,
      contactEmail,
      serviceTitle,
      scope,
      timeframe: timeframe || null,
      budgetIndication: budgetIndication || null,
      status: "pending_review",
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({
      success: true,
      requestId: String(result.insertedId),
      message:
        "Thanks -- your consulting request has been received. Our team reviews new requests within 1-2 business days.",
    });
  } catch (error) {
    console.error("consulting-service-intake error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
