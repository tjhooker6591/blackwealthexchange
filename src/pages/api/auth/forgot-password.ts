// src/pages/api/auth/forgot-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import clientPromise from "../../../lib/mongodb";
import { sendEmail } from "@/lib/sendEmail";

/**
 * Build APP_URL safely:
 * - Uses NEXT_PUBLIC_APP_URL / APP_URL when provided
 * - Falls back to localhost only in development
 * - In production, do NOT silently fall back to localhost
 */
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

const RESET_TOKEN_SECRET =
  process.env.RESET_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  "dev-reset-secret";

const RESET_TTL_MINUTES = 60;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
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
    const db = client.db("bwes-cluster");

    // Prevent spam/replay: ignore repeated active requests for same email within 10 minutes
    const recent = await db.collection("password_resets").findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (recent) {
      console.log(
        "[forgot-password] recent active token exists, suppressing resend",
        {
          email,
        },
      );
      return genericOk();
    }

    // Find account across all supported account collections
    const account = await findAccountByEmail(db, email);
    if (!account) {
      console.log("[forgot-password] no matching account", { email });
      return genericOk();
    }

    // Create token + hashed token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(`${token}.${RESET_TOKEN_SECRET}`);
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

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

    // Build reset link
    const baseUrl =
      APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL ||
      "";

    const normalizedBaseUrl =
      baseUrl && !baseUrl.startsWith("http") ? `https://${baseUrl}` : baseUrl;

    if (!normalizedBaseUrl) {
      throw new Error(
        "Missing APP_URL / NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_BASE_URL / VERCEL_URL",
      );
    }

    const resetLink = `${normalizedBaseUrl}/reset-password?token=${encodeURIComponent(
      token,
    )}`;

    const text = `We received a request to reset your password.

Reset link (valid for ${RESET_TTL_MINUTES} minutes):
${resetLink}

If you didn’t request this, you can ignore this email.`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Reset your password</h2>
        <p>We received a request to reset your Black Wealth Exchange password.</p>
        <p>
          <a
            href="${resetLink}"
            style="display:inline-block;padding:12px 16px;text-decoration:none;border-radius:8px;background:#d4af37;color:#000;font-weight:bold;"
          >
            Reset Password
          </a>
        </p>
        <p style="color:#555;">
          This link expires in <strong>${RESET_TTL_MINUTES} minutes</strong>.
        </p>
        <p>If you didn’t request this, you can ignore this email.</p>
      </div>
    `;

    console.log("[forgot-password] sending reset email", {
      email,
      accountType: account.accountType,
    });

    const info = await sendEmail({
      to: email,
      subject: "Reset your Black Wealth Exchange password",
      text,
      html,
    });

    console.log("[forgot-password] email sent", {
      email,
      messageId: info?.messageId,
      response: info?.response,
    });

    return genericOk();
  } catch (err: any) {
    console.error("forgot-password error:", err);

    if (
      process.env.NODE_ENV !== "production" ||
      process.env.RESET_DEBUG_MODE === "1"
    ) {
      return res.status(500).json({
        error: "Password reset email failed.",
        details: err?.message || String(err),
      });
    }

    return res.status(200).json({
      message: "If this email exists, reset instructions will be sent.",
    });
  }
}
