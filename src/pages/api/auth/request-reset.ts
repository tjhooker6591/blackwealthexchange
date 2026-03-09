import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import clientPromise from "../../../lib/mongodb";
import nodemailer from "nodemailer";
import { getAppUrl, getMongoDbName, getResetTokenSecret } from "@/lib/env";

const RESET_TTL_MINUTES = 60;
const REQUEST_WINDOW_MINUTES = 10;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getClientIp(req: NextApiRequest) {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

async function ensureResetIndexes(db: any) {
  await db
    .collection("password_resets")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection("password_resets")
    .createIndex({ tokenHash: 1 }, { unique: true });
  await db
    .collection("password_resets")
    .createIndex({ email: 1, createdAt: -1 });

  await db
    .collection("password_reset_rate_limits")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection("password_reset_rate_limits")
    .createIndex({ key: 1, createdAt: -1 });
}

async function hitRateLimit(db: any, key: string, limit: number, windowMinutes: number) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const expiresAt = new Date(now.getTime() + windowMinutes * 60 * 1000);

  const col = db.collection("password_reset_rate_limits");

  const count = await col.countDocuments({ key, createdAt: { $gte: windowStart } });
  await col.insertOne({ key, createdAt: now, expiresAt });

  return count >= limit;
}

async function findAccountByEmail(db: any, email: string) {
  const checks: Array<{ type: string; collection: string }> = [
    { type: "business", collection: "businesses" },
    { type: "seller", collection: "sellers" },
    { type: "employer", collection: "employers" },
    { type: "user", collection: "users" },
  ];

  for (const c of checks) {
    const doc = await db.collection(c.collection).findOne({ email });
    if (doc) return { accountType: c.type, collection: c.collection };
  }
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const raw = req.body?.email;
  if (typeof raw !== "string") {
    return res.status(400).json({ error: "Email is required." });
  }

  const email = raw.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  const genericOk = () =>
    res.status(200).json({
      message: "If this email exists, reset instructions will be sent.",
    });

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const ip = getClientIp(req);

    await ensureResetIndexes(db);

    // Abuse protection (IP + email aware)
    if (process.env.RESET_DEBUG_MODE !== "1") {
      const ipBlocked = await hitRateLimit(db, `request:ip:${ip}`, 12, REQUEST_WINDOW_MINUTES);
      const emailBlocked = await hitRateLimit(
        db,
        `request:email:${email}`,
        3,
        REQUEST_WINDOW_MINUTES,
      );

      if (ipBlocked || emailBlocked) return genericOk();

      const recent = await db.collection("password_resets").findOne({
        email,
        createdAt: { $gte: new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60 * 1000) },
        usedAt: null,
      });

      if (recent) return genericOk();
    }

    const account = await findAccountByEmail(db, email);
    if (!account) return genericOk();

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(`${token}.${getResetTokenSecret()}`);
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    await db.collection("password_resets").insertOne({
      email,
      accountType: account.accountType,
      collection: account.collection,
      tokenHash,
      createdAt: new Date(),
      expiresAt,
      usedAt: null,
      ip,
      userAgent: req.headers["user-agent"] || null,
    });

    const resetLink = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;

    // Debug mode for local verification: skip email dependency and return token/link.
    if (process.env.RESET_DEBUG_MODE === "1") {
      return res.status(200).json({
        message: "If this email exists, reset instructions will be sent.",
        _debug: { token, resetLink },
      });
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const fromEmail = process.env.EMAIL_USER || "blackwealth24@gmail.com";

    await transporter.sendMail({
      from: `"Black Wealth Exchange" <${fromEmail}>`,
      to: email,
      subject: "Reset your Black Wealth Exchange password",
      text: `We received a request to reset your password.\n\nReset link (valid for ${RESET_TTL_MINUTES} minutes):\n${resetLink}\n\nIf you didn’t request this, you can ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Reset your password</h2>
          <p>We received a request to reset your Black Wealth Exchange password.</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 16px;text-decoration:none;border-radius:8px;background:#d4af37;color:#000;font-weight:bold;">
              Reset Password
            </a>
          </p>
          <p style="color:#555;">This link expires in <strong>${RESET_TTL_MINUTES} minutes</strong>.</p>
          <p>If you didn’t request this, you can ignore this email.</p>
        </div>
      `,
    });

    return genericOk();
  } catch (err) {
    console.error("request-reset error:", err);
    return genericOk();
  }
}
