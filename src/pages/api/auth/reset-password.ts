import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import clientPromise from "../../../lib/mongodb";
import { getMongoDbName, getResetTokenSecret } from "@/lib/env";

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

async function ensureRateIndex(db: any) {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { token, newPassword } = req.body || {};

  if (typeof token !== "string" || token.trim().length < 20) {
    return res.status(400).json({ error: "Invalid token." });
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long." });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureRateIndex(db);

    const tokenHash = sha256(`${token}.${getResetTokenSecret()}`);
    const ip = getClientIp(req);

    const ipBlocked = await hitRateLimit(db, `reset:ip:${ip}`, 20, 10);
    const tokenBlocked = await hitRateLimit(db, `reset:token:${tokenHash}`, 5, 10);
    if (ipBlocked || tokenBlocked) {
      return res.status(429).json({ error: "Too many attempts. Please try again later." });
    }

    const reset = await db.collection("password_resets").findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!reset) {
      return res.status(400).json({ error: "Token is invalid or expired." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const collectionName = typeof reset.collection === "string" ? reset.collection : null;

    if (!collectionName) {
      return res.status(500).json({ error: "Reset record is malformed." });
    }

    const updateResult = await db.collection(collectionName).updateOne(
      { email: reset.email },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    );

    await db.collection("password_resets").updateOne(
      { _id: reset._id },
      { $set: { usedAt: new Date(), consumedAt: new Date() } },
    );

    if (updateResult.matchedCount === 0) {
      return res.status(200).json({ success: true, message: "Password updated." });
    }

    return res.status(200).json({ success: true, message: "Password updated." });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
