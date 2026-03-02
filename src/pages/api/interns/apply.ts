import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

/**
 * POST /api/interns/apply
 * Writes intern applications to MongoDB:
 * DB: bwes-cluster
 * Collection: intern_applications
 *
 * Prod-safe rate limiting is implemented via MongoDB (serverless-safe).
 * Requires TTL index on: intern_rate_limits.expiresAt
 */

type ApplyBody = {
  fullName?: string;
  email?: string;
  role?: string;
  skills?: string;
  links?: string;
  why?: string;
  company?: string; // honeypot (should be empty)
};

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQ = 10;

function getIP(req: NextApiRequest) {
  const xf = req.headers["x-forwarded-for"];
  const ip = Array.isArray(xf) ? xf[0] : xf?.split(",")[0]?.trim();
  return ip || req.socket.remoteAddress || "unknown";
}

/**
 * Serverless-safe limiter using Mongo
 * Collection: intern_rate_limits
 * Document per ip per window
 */
async function allowRequest(db: any, ip: string) {
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const key = `${ip}:${windowStart}`;

  const expiresAt = new Date(windowStart + WINDOW_MS);

  const result = await db.collection("intern_rate_limits").findOneAndUpdate(
    { _id: key },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        ip,
        windowStart: new Date(windowStart),
        createdAt: new Date(),
        expiresAt,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const count = result?.value?.count ?? 1;
  return count <= MAX_REQ;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  const body = (req.body || {}) as ApplyBody;

  // Honeypot check (bots fill hidden fields) — return success so bots don't learn
  if (String(body.company || "").trim().length > 0) {
    return res.status(200).json({ success: true });
  }

  const ip = getIP(req);

  const fullName = String(body.fullName || "")
    .trim()
    .slice(0, 120);
  const email = String(body.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 200);
  const role = String(body.role || "")
    .trim()
    .slice(0, 120);
  const skills = String(body.skills || "")
    .trim()
    .slice(0, 2000);
  const links = String(body.links || "")
    .trim()
    .slice(0, 2000);
  const why = String(body.why || "")
    .trim()
    .slice(0, 5000);

  if (fullName.length < 2) {
    return res
      .status(400)
      .json({ success: false, error: "Full name is required." });
  }
  if (!isEmail(email)) {
    return res
      .status(400)
      .json({ success: false, error: "A valid email is required." });
  }
  if (role.length < 2) {
    return res.status(400).json({ success: false, error: "Role is required." });
  }
  if (why.length < 20) {
    return res.status(400).json({
      success: false,
      error: "Please tell us why you want to join (min 20 characters).",
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // ✅ Serverless-safe rate limit
    const allowed = await allowRequest(db, ip);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Try again shortly.",
      });
    }

    // ✅ Duplicate guard: if same email applied recently, silently accept
    const recent = await db.collection("intern_applications").findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24h
    });

    if (recent) {
      // Return success so user can’t brute-force “did this email apply?”
      return res.status(200).json({ success: true });
    }

    await db.collection("intern_applications").insertOne({
      fullName,
      email,
      role,
      skills,
      links,
      why,
      status: "new", // new | reviewed | contacted | accepted | rejected
      createdAt: new Date(),
      meta: {
        ip,
        userAgent: req.headers["user-agent"] || "",
      },
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("[/api/interns/apply] error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
