// src/pages/api/auth/request-reset.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import clientPromise from "../../../lib/mongodb";
import nodemailer from "nodemailer";

/**
 * Build APP_URL safely:
 * - Uses NEXT_PUBLIC_APP_URL / APP_URL when provided
 * - Only falls back to localhost in development
 * - Fails fast in production (and any non-dev) if missing
 */
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

if (!APP_URL && process.env.NODE_ENV !== "development") {
  throw new Error(
    "Missing NEXT_PUBLIC_APP_URL (or APP_URL). Set it to your deployed domain (e.g. https://blackwealthexchange.com).",
  );
}

const RESET_TOKEN_SECRET =
  process.env.RESET_TOKEN_SECRET || process.env.JWT_SECRET || "dev-reset-secret";

// Keep this short (security + usability)
const RESET_TTL_MINUTES = 60;

// Basic hygiene
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Find user across your separated collections
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const raw = req.body?.email;
  if (typeof raw !== "string") {
    // Safe to 400 because it's not “does this account exist”
    return res.status(400).json({ error: "Email is required." });
  }

  const email = raw.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Always return generic success (avoid leaking account existence)
    const genericOk = () =>
      res.status(200).json({
        message: "If this email exists, reset instructions will be sent.",
      });

    // Rate-limit: block repeated requests for same email within 10 minutes
    // (still return 200 to avoid leaking anything)
    const recent = await db.collection("password_resets").findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      usedAt: null,
    });

    if (recent) return genericOk();

    // Find account (but do NOT change response if not found)
    const account = await findAccountByEmail(db, email);
    if (!account) return genericOk();

    // Create token + hash
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(`${token}.${RESET_TOKEN_SECRET}`);
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    // Store reset request
    await db.collection("password_resets").insertOne({
      email,
      accountType: account.accountType,
      collection: account.collection,
      tokenHash,
      createdAt: new Date(),
      expiresAt,
      usedAt: null,
      ip:
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        null,
      userAgent: req.headers["user-agent"] || null,
    });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${APP_URL}/reset-password?token=${encodeURIComponent(
      token,
    )}`;

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
    // Still avoid leaking details; keep response generic
    return res.status(200).json({
      message: "If this email exists, reset instructions will be sent.",
    });
  }
}
