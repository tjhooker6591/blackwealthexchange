import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  toDateOrNull,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";
import { getWealthBuilderEntitlementForUser } from "@/lib/wealth-builder/entitlements";

const ALLOWED_STATUSES = [
  "active",
  "completed",
  "paused",
  "cancelled",
  "archived",
] as const;

type GoalStatus = (typeof ALLOWED_STATUSES)[number];

type SavingsGoalItem = {
  id: string;
  userId: string;
  accountType: "user";
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
  monthlyContributionTarget: number;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
};

type GoalsResponse = {
  ok: boolean;
  items?: SavingsGoalItem[];
  item?: SavingsGoalItem | null;
  code?: string;
  message?: string;
};

function getGoalStatus(value: unknown): GoalStatus {
  return typeof value === "string" &&
    ALLOWED_STATUSES.includes(value as GoalStatus)
    ? (value as GoalStatus)
    : "active";
}

function formatGoalDoc(doc: any): SavingsGoalItem {
  return {
    id: doc._id.toString(),
    userId: String(doc.userId ?? ""),
    accountType: "user",
    goalName: typeof doc.goalName === "string" ? doc.goalName : "",
    targetAmount: Number(doc.targetAmount) || 0,
    currentAmount: Number(doc.currentAmount) || 0,
    targetDate:
      doc.targetDate instanceof Date
        ? doc.targetDate
        : doc.targetDate
        ? new Date(doc.targetDate)
        : null,
    monthlyContributionTarget: Number(doc.monthlyContributionTarget) || 0,
    status: getGoalStatus(doc.status),
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GoalsResponse>
) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("savings_goals");

  if (req.method === "GET") {
    try {
      const goals = await collection
        .find({ userId: auth.userId, accountType: "user" })
        .sort({ updatedAt: -1, createdAt: -1 })
        .toArray();

      return res.status(200).json({
        ok: true,
        items: goals.map(formatGoalDoc),
      });
    } catch (error) {
      console.error("GET /api/wealth-builder/goals error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to load savings goals.",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const entitlement = await getWealthBuilderEntitlementForUser(auth.userId);
      const existingCount = await collection.countDocuments({
        userId: auth.userId,
        accountType: "user",
      });

      if (existingCount >= entitlement.limits.maxSavingsGoals) {
        return res.status(403).json({
          ok: false,
          code: "PREMIUM_REQUIRED",
          message:
            "Free Wealth Builder includes up to 2 savings goals. Upgrade to Premium for unlimited goals.",
        });
      }

      const body = typeof req.body === "object" && req.body ? req.body : {};
      const goalName = typeof body.goalName === "string" ? body.goalName.trim() : "";

      if (!goalName) {
        return res.status(400).json({
          ok: false,
          message: "Goal name is required.",
        });
      }

      const now = new Date();
      const status = getGoalStatus(body.status);

      const doc = {
        userId: auth.userId,
        accountType: "user" as const,
        goalName,
        targetAmount: toNonNegativeNumber(body.targetAmount, 0),
        currentAmount: toNonNegativeNumber(body.currentAmount, 0),
        targetDate: toDateOrNull(body.targetDate),
        monthlyContributionTarget: toNonNegativeNumber(
          body.monthlyContributionTarget,
          0
        ),
        status,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(doc);
      const created = await collection.findOne({ _id: result.insertedId });

      return res.status(201).json({
        ok: true,
        item: created ? formatGoalDoc(created) : null,
      });
    } catch (error) {
      console.error("POST /api/wealth-builder/goals error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to create savings goal.",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({
    ok: false,
    message: `Method ${req.method} not allowed.`,
  });
}
