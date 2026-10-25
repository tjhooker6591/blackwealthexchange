import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";
import { SMS_CONSENT_TEXT } from "@/lib/smsConsent";

// Employer requests are passed to Speed-to-Lead, which texts the person
// back within seconds if they checked the texting box, or alerts BWE to
// call them if not. Off until STL_LEAD_WEBHOOK_URL (the "website
// connection" address from BWE's Speed-to-Lead setup page) is set. Never
// blocks or fails the submission: the request is already saved.
async function sendToSpeedToLead(lead: {
  name: string;
  phone: string;
  email: string;
  company: string;
  smsConsent: boolean;
}) {
  const url = process.env.STL_LEAD_WEBHOOK_URL;
  if (!url || !lead.phone) return "skipped";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        service_needed: lead.company
          ? `Recruiting help for ${lead.company}`.slice(0, 200)
          : "Recruiting help",
        sms_consent: lead.smsConsent,
        campaign: "bwe-recruiting-consulting",
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(
        "speed-to-lead handoff failed",
        res.status,
        (await res.text().catch(() => "")).slice(0, 300),
      );
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("speed-to-lead handoff error", err);
    return "failed";
  }
}

type Ok = { success: true; message: string };
type Err = { success: false; error: string };

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function moderateIntakeText(message: string) {
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
  res: NextApiResponse<Ok | Err>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const type = asText(req.body?.type).toLowerCase();
    const name = asText(req.body?.name);
    const email = asText(req.body?.email).toLowerCase();
    const company = sanitizeRichHtml(asText(req.body?.company)).trim();
    const phone = asText(req.body?.phone);
    const details = sanitizeRichHtml(asText(req.body?.details)).trim();
    // Texting consent is offered on employer requests only, and only counts
    // with a phone number.
    const smsConsent =
      type === "employer" && Boolean(phone) && req.body?.sms_consent === true;

    if (!["employer", "candidate"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid intake type." });
    }

    if (!name || !email || !details) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and details are required.",
      });
    }

    if (!validEmail(email)) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter a valid email." });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      db,
      `consulting:intake:ip:${ip}`,
      30,
      10,
    );
    const emailLimit = await hitApiRateLimit(
      db,
      `consulting:intake:email:${email}`,
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

    const createdAt = new Date();
    const moderation = moderateIntakeText(details);

    const inserted = await db.collection("consulting_intake").insertOne({
      type,
      name,
      email,
      company: company || null,
      phone: phone || null,
      details,
      // The record of consent: what they agreed to, when, and from where.
      smsConsent: smsConsent
        ? {
            agreed: true,
            text: SMS_CONSENT_TEXT,
            at: createdAt,
            ip: getClientIp(req),
          }
        : { agreed: false },
      status: moderation.flagged ? "flagged" : "pending",
      lifecycleStage: "new",
      nextAction: moderation.flagged
        ? "Review moderation flags before outreach"
        : "Initial triage pending",
      moderationStatus: moderation.flagged ? "flagged" : "clean",
      moderationReasons: moderation.reasons,
      createdAt,
      source: "recruiting_consulting_page",
      requestIp: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
    });

    await db.collection("flow_events").insertOne({
      eventType: "consulting_submission_completed",
      pageRoute: "/api/consulting-intake",
      section: "consulting_intake_api",
      source: "consulting_intake_api",
      source_variant: type,
      path: req.url || "/api/consulting-intake",
      accountType: type === "employer" ? "employer" : "candidate",
      isAuthenticated: null,
      createdAt,
    });

    // Flagged submissions stay in manual review and are not followed up
    // automatically.
    if (type === "employer" && !moderation.flagged) {
      const speedToLead = await sendToSpeedToLead({
        name,
        phone,
        email,
        company,
        smsConsent,
      });
      if (speedToLead !== "skipped") {
        await db
          .collection("consulting_intake")
          .updateOne(
            { _id: inserted.insertedId },
            { $set: { speedToLead, speedToLeadAt: new Date() } },
          );
      }
    }

    return res.status(200).json({
      success: true,
      message:
        type === "employer"
          ? "Employer request received. We will contact you after triage."
          : "Talent profile received. We will review and follow up.",
    });
  } catch (err) {
    console.error("consulting-intake error", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to submit intake." });
  }
}
