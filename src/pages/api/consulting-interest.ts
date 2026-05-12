// src/pages/api/consulting-interest.ts

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";

type Data =
  | { success: true; message: string }
  | { success: false; error: string };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function moderateInterestText(message: string) {
  const lower = message.toLowerCase();
  const blockedTerms = [
    "wire money",
    "crypto only",
    "gift card",
    "telegram only",
    "whatsapp only",
  ];
  const hasBlockedTerm = blockedTerms.some((x) => lower.includes(x));
  const urlCount = (message.match(/https?:\/\//gi) || []).length;
  const repeatedCharRun = /(.)\1{7,}/.test(message);

  return {
    flagged: hasBlockedTerm || urlCount > 4 || repeatedCharRun,
    reasons: [
      hasBlockedTerm ? "blocked_term" : null,
      urlCount > 4 ? "too_many_links" : null,
      repeatedCharRun ? "repeated_characters" : null,
    ].filter(Boolean),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const rawName = typeof req.body?.name === "string" ? req.body.name : "";
    const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";

    const name = sanitizeRichHtml(rawName)
      .replace(/<[^>]*>?/gm, "")
      .trim();
    const email = rawEmail.trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address.",
      });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      db,
      `consulting:interest:ip:${ip}`,
      30,
      10,
    );
    const emailLimit = await hitApiRateLimit(
      db,
      `consulting:interest:email:${email}`,
      5,
      60,
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
        error: "Too many submissions. Please try again later.",
      });
    }

    // Optional duplicate protection:
    const existing = await db
      .collection("consulting_interest")
      .findOne({ email });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Your interest has already been recorded.",
      });
    }

    const createdAt = new Date();
    const moderation = moderateInterestText(name);

    await db.collection("consulting_interest").insertOne({
      name,
      email,
      createdAt,
      status: moderation.flagged ? "flagged" : "pending",
      lifecycleStage: "new",
      nextAction: moderation.flagged
        ? "Review moderation flags before outreach"
        : "Initial triage pending",
      moderationStatus: moderation.flagged ? "flagged" : "clean",
      moderationReasons: moderation.reasons,
      requestIp: ip,
      userAgent: String(req.headers["user-agent"] || ""),
      source: "website",
    });

    await db.collection("flow_events").insertOne({
      eventType: "consulting_submission_completed",
      pageRoute: "/api/consulting-interest",
      section: "consulting_interest_api",
      source: "consulting_interest_api",
      source_variant: "interest_capture",
      path: req.url || "/api/consulting-interest",
      accountType: "lead",
      isAuthenticated: null,
      createdAt,
    });

    return res.status(200).json({
      success: true,
      message: "Interest saved successfully.",
    });
  } catch (error) {
    console.error("consulting-interest error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to save interest.",
    });
  }
}
