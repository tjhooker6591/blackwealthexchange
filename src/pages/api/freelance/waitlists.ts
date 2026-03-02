// pages/api/freelance/waitlist.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// tiny in-memory rate limit (basic protection)
const WINDOW_MS = 60_000;
const MAX_REQ = 10;
const hits = new Map<string, { count: number; resetAt: number }>();

function getIP(req: NextApiRequest) {
  const xf = req.headers["x-forwarded-for"];
  const ip = Array.isArray(xf) ? xf[0] : xf?.split(",")[0]?.trim();
  return ip || req.socket.remoteAddress || "unknown";
}

function allow(ip: string) {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now > cur.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (cur.count >= MAX_REQ) return false;
  cur.count += 1;
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const ip = getIP(req);
  if (!allow(ip))
    return res
      .status(429)
      .json({ error: "Too many requests. Try again soon." });

  const { email, role } = req.body || {};
  if (!email || !isEmail(String(email)))
    return res.status(400).json({ error: "Valid email required." });

  const normalizedRole = role === "business" ? "business" : "freelancer";

  const client = await clientPromise;
  const db = client.db("bwes-cluster");

  await db.collection("freelance_waitlist").updateOne(
    { email: String(email).toLowerCase().trim() },
    {
      $set: {
        email: String(email).toLowerCase().trim(),
        role: normalizedRole,
        source: "subscribe_page",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  return res.status(200).json({ ok: true });
}
