import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";
import { getUserFromRequest } from "@/lib/auth";
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES } from "@/lib/support";

const err = (res: NextApiResponse, code: number, c: string, m: string) =>
  res.status(code).json({ ok: false, code: c, message: m });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return err(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }
  const u = await getUserFromRequest(req);
  const b: any =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const email = String(u?.email || b.email || "")
    .trim()
    .toLowerCase();
  const userId = String(u?.id || b.userId || "").trim() || null;
  const accountType = String(u?.accountType || b.accountType || "guest").trim();
  const category = String(b.category || "General Question").trim();
  let priority = String(b.priority || "Normal").trim();
  if (
    ["Billing/Refund", "Security/Trust & Safety"].includes(category) &&
    ["Low", "Normal"].includes(priority)
  )
    priority = category.includes("Security") ? "Security" : "Financial";
  const subject = String(b.subject || "").trim();
  const message = sanitizeRichHtml(String(b.message || "")).trim();
  if (!email || subject.length < 4 || message.length < 10)
    return err(res, 400, "INVALID_INPUT", "email, subject, message required");
  if (!SUPPORT_CATEGORIES.includes(category as any))
    return err(res, 400, "INVALID_CATEGORY", "Invalid category");
  if (!SUPPORT_PRIORITIES.includes(priority as any))
    return err(res, 400, "INVALID_PRIORITY", "Invalid priority");

  const db = (await clientPromise).db(getMongoDbName());
  await ensureApiRateLimitIndexes(db);
  const ip = getClientIp(req);
  const ipLimit = await hitApiRateLimit(
    db,
    `support:create-ticket:ip:${ip}`,
    20,
    30,
  );
  const actorLimit = await hitApiRateLimit(
    db,
    `support:create-ticket:actor:${userId || email}`,
    10,
    30,
  );
  if (ipLimit.blocked || actorLimit.blocked) {
    res.setHeader(
      "Retry-After",
      String(Math.max(ipLimit.retryAfterSeconds, actorLimit.retryAfterSeconds)),
    );
    return err(res, 429, "RATE_LIMITED", "Too many support submissions");
  }

  const now = new Date();
  const ticketId = `SUP-${now.getTime()}`;
  const ticket = {
    ticketId,
    userId,
    accountType,
    name: String(b.name || "").trim() || null,
    email,
    category,
    priority,
    subject,
    message,
    relatedOrderId: String(b.relatedOrderId || "").trim() || null,
    relatedPaymentId: String(b.relatedPaymentId || "").trim() || null,
    relatedBusinessId: String(b.relatedBusinessId || "").trim() || null,
    relatedProductId: String(b.relatedProductId || "").trim() || null,
    relatedJobId: String(b.relatedJobId || "").trim() || null,
    relatedAdCampaignId: String(b.relatedAdCampaignId || "").trim() || null,
    status: "New",
    publicReplies: [],
    internalNotes: [],
    assignedTo: null,
    firstResponseAt: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("support_tickets").insertOne(ticket);
  return res.status(201).json({ ok: true, ticketId });
}
