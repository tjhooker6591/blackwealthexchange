import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  serializeDoc,
  toIntegerInRange,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_PAY_FREQUENCIES = [
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
  "annual",
  "other",
] as const;

const ALLOWED_EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("financial_profiles");

  if (req.method === "GET") {
    const profile = await collection.findOne({ userId: auth.userId, accountType: "user" });
    return res.status(200).json({
      ok: true,
      profile: serializeDoc(profile),
    });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    const body = typeof req.body === "object" && req.body ? req.body : {};

    const payFrequency = ALLOWED_PAY_FREQUENCIES.includes(body.payFrequency)
      ? body.payFrequency
      : "monthly";

    const experienceLevel = ALLOWED_EXPERIENCE_LEVELS.includes(body.experienceLevel)
      ? body.experienceLevel
      : "beginner";

    const now = new Date();

    await collection.updateOne(
      { userId: auth.userId, accountType: "user" },
      {
        $set: {
          userId: auth.userId,
          accountType: "user",
          monthlyIncome: toNonNegativeNumber(body.monthlyIncome, 0),
          payFrequency,
          householdSize: toIntegerInRange(body.householdSize, 1, 25, 1),
          primaryGoal: typeof body.primaryGoal === "string" ? body.primaryGoal.trim() : "",
          experienceLevel,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    const updated = await collection.findOne({ userId: auth.userId, accountType: "user" });

    return res.status(200).json({
      ok: true,
      profile: serializeDoc(updated),
    });
  }

  res.setHeader("Allow", ["GET", "PUT", "PATCH"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
