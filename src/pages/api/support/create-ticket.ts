import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

type Body = {
  userId?: string;
  email?: string;
  subject?: string;
  description?: string;
  priority?: "low" | "normal" | "high";
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
  const email = String(body.email || "").trim().toLowerCase();
  const subject = String(body.subject || "").trim();
  const description = String(body.description || "").trim();
  const priority = body.priority === "high" || body.priority === "low" ? body.priority : "normal";

  if (!subject || subject.length < 4 || !description || description.length < 10) {
    return res.status(400).json({
      message: "subject (>=4 chars) and description (>=10 chars) are required",
    });
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
  const ticket = {
    userId: userId || null,
    email: email || null,
    subject,
    description,
    priority,
    status: "open",
    sourceRoute: "/api/support/create-ticket",
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("support_tickets").insertOne(ticket);
  return res.status(201).json({ ok: true, ticketId: String(result.insertedId) });
}
