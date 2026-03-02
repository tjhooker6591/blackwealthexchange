// src/pages/api/auth/reset-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import clientPromise from "../../../lib/mongodb";

const RESET_TOKEN_SECRET =
  process.env.RESET_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  "dev-reset-secret";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
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
    const db = client.db("bwes-cluster");

    const tokenHash = sha256(`${token}.${RESET_TOKEN_SECRET}`);

    const reset = await db.collection("password_resets").findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!reset) {
      return res.status(400).json({ error: "Token is invalid or expired." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the right collection (based on what we stored at request time)
    const collectionName =
      typeof reset.collection === "string" ? reset.collection : null;

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

    // Mark token used regardless (prevents replay)
    await db
      .collection("password_resets")
      .updateOne({ _id: reset._id }, { $set: { usedAt: new Date() } });

    if (updateResult.matchedCount === 0) {
      // Account missing now; keep response safe
      return res
        .status(200)
        .json({ success: true, message: "Password updated." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Password updated." });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
