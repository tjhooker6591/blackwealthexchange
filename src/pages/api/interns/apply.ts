import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

/**
 * POST /api/interns/apply
 * Writes intern applications to MongoDB:
 * DB: bwes-cluster
 * Collection: intern_applications
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
  const current = hits.get(ip);
  if (!current || now > current.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQ) return false;
  current.count += 1;
  hits.set(ip, current);
  return true;
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

  const ip = getIP(req);
  if (!allow(ip)) {
    return res
      .status(429)
      .json({ success: false, error: "Too many requests. Try again shortly." });
  }

  const body = (req.body || {}) as ApplyBody;

  // Honeypot check (bots fill hidden fields)
  if (String(body.company || "").trim().length > 0) {
    return res.status(200).json({ success: true });
  }

  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const role = String(body.role || "").trim();
  const skills = String(body.skills || "").trim();
  const links = String(body.links || "").trim();
  const why = String(body.why || "").trim();

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
    return res
      .status(400)
      .json({
        success: false,
        error: "Please tell us why you want to join (min 20 characters).",
      });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

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
