import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import clientPromise from "../../../lib/mongodb";
import { sendEmail } from "@/lib/sendEmail";
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

async function hitRateLimit(
  db: any,
  key: string,
  limit: number,
  windowMinutes: number,
) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const expiresAt = new Date(now.getTime() + windowMinutes * 60 * 1000);

  const col = db.collection("password_reset_rate_limits");

  const count = await col.countDocuments({
    key,
    createdAt: { $gte: windowStart },
  });

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

    if (process.env.RESET_DEBUG_MODE !== "1") {
      const ipBlocked = await hitRateLimit(
        db,
        `request:ip:${ip}`,
        12,
        REQUEST_WINDOW_MINUTES,
      );

      const emailBlocked = await hitRateLimit(
        db,
        `request:email:${email}`,
        3,
        REQUEST_WINDOW_MINUTES,
      );

      if (ipBlocked || emailBlocked) {
        console.warn("[reset] rate-limited", { email, ip });
        return genericOk();
      }

      const recent = await db.collection("password_resets").findOne({
        email,
        createdAt: {
          $gte: new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60 * 1000),
        },
        usedAt: null,
      });

      if (recent) {
        console.log("[reset] recent token exists, suppressing resend", {
          email,
        });
        return genericOk();
      }
    }

    const account = await findAccountByEmail(db, email);

    if (!account) {
      console.log("[reset] no matching account", { email });
      return genericOk();
    }

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

    const fallbackOrigin =
      process.env.NODE_ENV === "production"
        ? `https://${req.headers.host || "www.blackwealthexchange.com"}`
        : `http://${req.headers.host || "localhost:3000"}`;

    let appUrl: string;
    try {
      appUrl = getAppUrl();
    } catch {
      appUrl = fallbackOrigin;
    }

    const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

    if (
      process.env.RESET_DEBUG_MODE === "1" &&
      process.env.NODE_ENV !== "production"
    ) {
      return res.status(200).json({
        message: "If this email exists, reset instructions will be sent.",
        _debug: { token, resetLink },
      });
    }

    const text = [
      "We received a request to reset your Black Wealth Exchange password.",
      "",
      `Reset link (valid for ${RESET_TTL_MINUTES} minutes):`,
      resetLink,
      "",
      "If you didn’t request this, you can ignore this email.",
    ].join("\n");

    const html = `
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
    `;

    console.log("[reset] sending email", {
      email,
      accountType: account.accountType,
    });

    try {
      const info = await sendEmail({
        to: email,
        subject: "Reset your Black Wealth Exchange password",
        text,
        html,
      });

      console.log("[reset] email sent", {
        email,
        messageId: info?.messageId,
        response: info?.response,
      });

      return genericOk();
    } catch (mailErr: any) {
      console.error("[reset] email send failed:", mailErr);

      await db.collection("password_reset_delivery_failures").insertOne({
        email,
        accountType: account.accountType,
        collection: account.collection,
        reason: mailErr?.message || String(mailErr),
        createdAt: new Date(),
      });

      // Fallback behavior in production: do not fail reset token creation when mail provider is down.
      if (process.env.NODE_ENV === "production") {
        return genericOk();
      }

      if (process.env.RESET_DEBUG_MODE === "1") {
        return res.status(200).json({
          message: "If this email exists, reset instructions will be sent.",
          _debug: {
            token,
            resetLink,
            mailError: mailErr?.message || String(mailErr),
          },
        });
      }

      return res.status(500).json({
        error: "Password reset email failed to send.",
        details: mailErr?.message || String(mailErr),
      });
    }
  } catch (err: any) {
    console.error("[reset] request-reset error:", err);

    if (
      process.env.NODE_ENV !== "production" ||
      process.env.RESET_DEBUG_MODE === "1"
    ) {
      return res.status(500).json({
        error: "Password reset request failed.",
        details: err?.message || String(err),
      });
    }

    return genericOk();
  }
}
