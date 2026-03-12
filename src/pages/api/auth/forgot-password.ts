import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import clientPromise from "../../../lib/mongodb";
import nodemailer from "nodemailer";
import { getAppUrl, getMongoDbName, getResetTokenSecret } from "@/lib/env";

const RESET_TTL_MINUTES = 60;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getBaseUrl() {
  try {
    return getAppUrl();
  } catch {
    return process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "";
  }
}

function buildMailer() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    return {
      mode: "smtp" as const,
      fromEmail: user,
      transporter: nodemailer.createTransport({
        service: "Gmail",
        auth: { user, pass },
      }),
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      mode: "json" as const,
      fromEmail: "blackwealth24@gmail.com",
      transporter: nodemailer.createTransport({ jsonTransport: true }),
    };
  }

  return null;
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

    // Prevent spam/replay: ignore repeated active requests for same email within 10 minutes
    const recent = await db.collection("password_resets").findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (recent) {
      return genericOk();
    }

    const account = await findAccountByEmail(db, email);
    if (!account) {
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
      ip:
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        null,
      userAgent: req.headers["user-agent"] || null,
    });

    const resetLink = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const mailer = buildMailer();

    if (!mailer) {
      console.warn("forgot-password: EMAIL_USER/EMAIL_PASS missing in production; skipping send");
      return genericOk();
    }

    const info = await mailer.transporter.sendMail({
      from: `"Black Wealth Exchange" <${mailer.fromEmail}>`,
      to: email,
      subject: "Reset your Black Wealth Exchange password",
      text: `We received a request to reset your password.\n\nReset link (valid for ${RESET_TTL_MINUTES} minutes):\n${resetLink}\n\nIf you didn’t request this, you can ignore this email.`,
      html: `
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
      `,
    });

    if (mailer.mode === "json") {
      console.info("forgot-password jsonTransport preview", {
        email,
        resetLink,
        messageId: info.messageId,
      });
    }

    return genericOk();
  } catch (err) {
    console.error("forgot-password error:", err);
    return genericOk();
  }
}
