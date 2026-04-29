import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES } from "@/lib/support";

type Body = {
  userId?: string;
  accountType?: string;
  name?: string;
  email?: string;
  category?: string;
  priority?: string;
  subject?: string;
  message?: string;
  relatedOrderId?: string;
  relatedPaymentId?: string;
  relatedBusinessId?: string;
  relatedProductId?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body: Body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  const userId = String(body.userId || "").trim();
  const accountType = String(body.accountType || "guest").trim();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const category = String(body.category || "General Question").trim();
  const priority = String(body.priority || "normal").trim();
  const subject = String(body.subject || "").trim();
  const message = sanitizeRichHtml(body.message || "").trim();
  const relatedOrderId = String(body.relatedOrderId || "").trim();
  const relatedPaymentId = String(body.relatedPaymentId || "").trim();
  const relatedBusinessId = String(body.relatedBusinessId || "").trim();
  const relatedProductId = String(body.relatedProductId || "").trim();

  if (!email || !subject || subject.length < 4 || !message || message.length < 10) {
    return res.status(400).json({
      message: "email, subject (>=4), and message (>=10) are required",
    });
  }
  if (!SUPPORT_CATEGORIES.includes(category as any)) {
    return res.status(400).json({ message: "Invalid category" });
  }
  if (!SUPPORT_PRIORITIES.includes(priority as any)) {
    return res.status(400).json({ message: "Invalid priority" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  await ensureApiRateLimitIndexes(db);
  const ip = getClientIp(req);
  const ipLimit = await hitApiRateLimit(db, `support:create-ticket:ip:${ip}`, 20, 30);
  const actor = userId || email || "anon";
  const actorLimit = await hitApiRateLimit(db, `support:create-ticket:actor:${actor}`, 10, 30);
  if (ipLimit.blocked || actorLimit.blocked) {
    res.setHeader("Retry-After", String(Math.max(ipLimit.retryAfterSeconds, actorLimit.retryAfterSeconds)));
    return res.status(429).json({ message: "Too many support submissions" });
  }

  const now = new Date();
  const ticketId = `SUP-${now.getTime()}`;
  const ticket = {
    ticketId,
    userId: userId || null,
    accountType,
    name: name || null,
    email,
    category,
    priority,
    subject,
    message,
    relatedOrderId: relatedOrderId || null,
    relatedPaymentId: relatedPaymentId || null,
    relatedBusinessId: relatedBusinessId || null,
    relatedProductId: relatedProductId || null,
    status: "new",
    assignedTo: null,
    internalNotes: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("support_tickets").insertOne(ticket);
  await db.collection("support_events").insertOne({
    type: "support_ticket_created",
    ticketId,
    category,
    priority,
    createdAt: now,
  });

  return res.status(201).json({ ok: true, ticketId });
}
