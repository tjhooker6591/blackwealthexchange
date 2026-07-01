#!/bin/bash
set -e

echo "Building Wealth Builder full first-pass backend + next Travel Map stubs in $(pwd)..."

mkdir -p src/lib/wealth-builder
mkdir -p src/pages/api/wealth-builder/debts
mkdir -p src/pages/api/wealth-builder/goals
mkdir -p src/pages/api/wealth-builder/budget
mkdir -p src/pages/api/wealth-builder/transactions
mkdir -p src/pages/api/travel-map/business
mkdir -p src/pages/api/travel-map/saved
mkdir -p src/pages/travel-map/business

# =========================================================
# src/lib/wealth-builder/mongo.ts
# =========================================================
cat > src/lib/wealth-builder/mongo.ts <<'TS'
import { Db, MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __wealthMongoClientPromise__: Promise<MongoClient> | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI");
  }
  return uri;
}

function getDbName(): string {
  return process.env.MONGODB_DB || "bwes-cluster";
}

async function getClient(): Promise<MongoClient> {
  if (!global.__wealthMongoClientPromise__) {
    global.__wealthMongoClientPromise__ = new MongoClient(getMongoUri()).connect();
  }
  return global.__wealthMongoClientPromise__;
}

export async function getWealthDb(): Promise<Db> {
  const client = await getClient();
  return client.db(getDbName());
}
TS

# =========================================================
# src/lib/wealth-builder/helpers.ts
# =========================================================
cat > src/lib/wealth-builder/helpers.ts <<'TS'
import { ObjectId } from "mongodb";

export function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function toObjectId(value: string): ObjectId | null {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

export function toNonNegativeNumber(value: unknown, fallback = 0): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : NaN;

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export function toIntegerInRange(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : NaN;

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

export function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function serializeDoc<T extends Record<string, any>>(doc: T | null) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: typeof _id?.toString === "function" ? _id.toString() : _id,
    ...rest,
  };
}

export function serializeDocs<T extends Record<string, any>>(docs: T[]) {
  return docs.map((doc) => serializeDoc(doc));
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}
TS

# =========================================================
# src/lib/wealth-builder/auth.ts
# =========================================================
cat > src/lib/wealth-builder/auth.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { verify, type JwtPayload } from "jsonwebtoken";
import { getWealthDb } from "./mongo";
import { toObjectId } from "./helpers";

type WealthAuthResult = {
  userId: string;
  accountType: "user";
  email: string | null;
  user: Record<string, any>;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET or NEXTAUTH_SECRET");
  }
  return secret;
}

function getStringClaim(payload: JwtPayload, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

export async function requireWealthUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<WealthAuthResult | null> {
  try {
    const token = req.cookies?.session_token;

    if (!token) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return null;
    }

    const decoded = verify(token, getSecret());
    if (typeof decoded === "string") {
      res.status(401).json({ ok: false, message: "Invalid session token." });
      return null;
    }

    const payload = decoded as JwtPayload;
    const payloadAccountType =
      getStringClaim(payload, ["accountType", "role"]) || req.cookies?.accountType || "user";

    if (payloadAccountType !== "user") {
      res.status(403).json({
        ok: false,
        message: "Wealth Builder is currently available to user accounts only.",
      });
      return null;
    }

    const rawUserId = getStringClaim(payload, ["userId", "id", "sub"]);
    if (!rawUserId) {
      res.status(401).json({ ok: false, message: "Unable to resolve user from session." });
      return null;
    }

    const db = await getWealthDb();
    const users = db.collection("users");

    let user =
      (toObjectId(rawUserId) && (await users.findOne({ _id: toObjectId(rawUserId)! }))) ||
      (await users.findOne({ _id: rawUserId as any }));

    if (!user) {
      user = await users.findOne({ email: getStringClaim(payload, ["email"]) || null });
    }

    if (!user) {
      res.status(401).json({ ok: false, message: "Authenticated user record not found." });
      return null;
    }

    return {
      userId: user._id.toString(),
      accountType: "user",
      email: typeof user.email === "string" ? user.email : null,
      user,
    };
  } catch (error) {
    console.error("Wealth auth error:", error);
    res.status(401).json({ ok: false, message: "Authentication failed." });
    return null;
  }
}
TS

# =========================================================
# src/pages/api/wealth-builder/profile.ts
# =========================================================
cat > src/pages/api/wealth-builder/profile.ts <<'TS'
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
TS

# =========================================================
# src/pages/api/wealth-builder/debts/index.ts
# =========================================================
cat > src/pages/api/wealth-builder/debts/index.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  serializeDocs,
  toDateOrNull,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_STATUSES = ["active", "paid", "paused", "delinquent", "collections", "closed"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("financial_debts");

  if (req.method === "GET") {
    const debts = await collection
      .find({ userId: auth.userId, accountType: "user" })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    return res.status(200).json({
      ok: true,
      items: serializeDocs(debts),
    });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "object" && req.body ? req.body : {};

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return res.status(400).json({ ok: false, message: "Debt name is required." });
    }

    const status = ALLOWED_STATUSES.includes(body.status) ? body.status : "active";
    const now = new Date();

    const doc = {
      userId: auth.userId,
      accountType: "user",
      name,
      lender: typeof body.lender === "string" ? body.lender.trim() : "",
      balance: toNonNegativeNumber(body.balance, 0),
      interestRate: toNonNegativeNumber(body.interestRate, 0),
      minimumPayment: toNonNegativeNumber(body.minimumPayment, 0),
      dueDate: toDateOrNull(body.dueDate),
      category: typeof body.category === "string" ? body.category.trim() : "",
      status,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });

    return res.status(201).json({
      ok: true,
      item: created ? { id: created._id.toString(), ...doc } : null,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

# =========================================================
# src/pages/api/wealth-builder/debts/[id].ts
# =========================================================
cat > 'src/pages/api/wealth-builder/debts/[id].ts' <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toDateOrNull,
  toNonNegativeNumber,
  toObjectId,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_STATUSES = ["active", "paid", "paused", "delinquent", "collections", "closed"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const id = firstQueryValue(req.query.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: "Debt id is required." });
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return res.status(400).json({ ok: false, message: "Invalid debt id." });
  }

  const db = await getWealthDb();
  const collection = db.collection("financial_debts");
  const filter = { _id: objectId, userId: auth.userId, accountType: "user" as const };

  if (req.method === "PATCH") {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.name === "string") update.name = body.name.trim();
    if (typeof body.lender === "string") update.lender = body.lender.trim();
    if (body.balance !== undefined) update.balance = toNonNegativeNumber(body.balance, 0);
    if (body.interestRate !== undefined) update.interestRate = toNonNegativeNumber(body.interestRate, 0);
    if (body.minimumPayment !== undefined) update.minimumPayment = toNonNegativeNumber(body.minimumPayment, 0);
    if (body.dueDate !== undefined) update.dueDate = toDateOrNull(body.dueDate);
    if (typeof body.category === "string") update.category = body.category.trim();
    if (typeof body.notes === "string") update.notes = body.notes.trim();
    if (ALLOWED_STATUSES.includes(body.status)) update.status = body.status;

    await collection.updateOne(filter, { $set: update });
    const updated = await collection.findOne(filter);

    return res.status(200).json({
      ok: true,
      item: serializeDoc(updated),
    });
  }

  if (req.method === "DELETE") {
    const existing = await collection.findOne(filter);
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Debt record not found." });
    }

    await collection.deleteOne(filter);
    return res.status(200).json({ ok: true, deletedId: id });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

# =========================================================
# src/pages/api/wealth-builder/goals/index.ts
# =========================================================
cat > src/pages/api/wealth-builder/goals/index.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  serializeDocs,
  toDateOrNull,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_STATUSES = ["active", "completed", "paused", "cancelled", "archived"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("savings_goals");

  if (req.method === "GET") {
    const goals = await collection
      .find({ userId: auth.userId, accountType: "user" })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    return res.status(200).json({
      ok: true,
      items: serializeDocs(goals),
    });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "object" && req.body ? req.body : {};

    const goalName = typeof body.goalName === "string" ? body.goalName.trim() : "";
    if (!goalName) {
      return res.status(400).json({ ok: false, message: "Goal name is required." });
    }

    const status = ALLOWED_STATUSES.includes(body.status) ? body.status : "active";
    const now = new Date();

    const doc = {
      userId: auth.userId,
      accountType: "user",
      goalName,
      targetAmount: toNonNegativeNumber(body.targetAmount, 0),
      currentAmount: toNonNegativeNumber(body.currentAmount, 0),
      targetDate: toDateOrNull(body.targetDate),
      monthlyContributionTarget: toNonNegativeNumber(body.monthlyContributionTarget, 0),
      status,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });

    return res.status(201).json({
      ok: true,
      item: created ? { id: created._id.toString(), ...doc } : null,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

# =========================================================
# src/pages/api/wealth-builder/goals/[id].ts
# =========================================================
cat > 'src/pages/api/wealth-builder/goals/[id].ts' <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toDateOrNull,
  toNonNegativeNumber,
  toObjectId,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_STATUSES = ["active", "completed", "paused", "cancelled", "archived"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const id = firstQueryValue(req.query.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: "Goal id is required." });
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return res.status(400).json({ ok: false, message: "Invalid goal id." });
  }

  const db = await getWealthDb();
  const collection = db.collection("savings_goals");
  const filter = { _id: objectId, userId: auth.userId, accountType: "user" as const };

  if (req.method === "PATCH") {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.goalName === "string") update.goalName = body.goalName.trim();
    if (body.targetAmount !== undefined) update.targetAmount = toNonNegativeNumber(body.targetAmount, 0);
    if (body.currentAmount !== undefined) update.currentAmount = toNonNegativeNumber(body.currentAmount, 0);
    if (body.targetDate !== undefined) update.targetDate = toDateOrNull(body.targetDate);
    if (body.monthlyContributionTarget !== undefined) {
      update.monthlyContributionTarget = toNonNegativeNumber(body.monthlyContributionTarget, 0);
    }
    if (ALLOWED_STATUSES.includes(body.status)) update.status = body.status;

    await collection.updateOne(filter, { $set: update });
    const updated = await collection.findOne(filter);

    return res.status(200).json({
      ok: true,
      item: serializeDoc(updated),
    });
  }

  if (req.method === "DELETE") {
    const existing = await collection.findOne(filter);
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Goal record not found." });
    }

    await collection.deleteOne(filter);
    return res.status(200).json({ ok: true, deletedId: id });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

# =========================================================
# src/pages/api/wealth-builder/budget/index.ts
# =========================================================
cat > src/pages/api/wealth-builder/budget/index.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toIntegerInRange,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";

type BudgetCategory = {
  name: string;
  plannedAmount: number;
  actualAmount: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("budget_plans");

  if (req.method === "GET") {
    const now = new Date();
    const month = toIntegerInRange(firstQueryValue(req.query.month), 1, 12, now.getMonth() + 1);
    const year = toIntegerInRange(firstQueryValue(req.query.year), 2000, 2100, now.getFullYear());

    const plan = await collection.findOne({ userId: auth.userId, accountType: "user", month, year });

    return res.status(200).json({
      ok: true,
      item: serializeDoc(plan),
    });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const now = new Date();

    const month = toIntegerInRange(body.month, 1, 12, now.getMonth() + 1);
    const year = toIntegerInRange(body.year, 2000, 2100, now.getFullYear());

    const categories = Array.isArray(body.categories)
      ? body.categories
          .map((item): BudgetCategory | null => {
            if (!item || typeof item !== "object") return null;
            const name = typeof item.name === "string" ? item.name.trim() : "";
            if (!name) return null;

            return {
              name,
              plannedAmount: toNonNegativeNumber(item.plannedAmount, 0),
              actualAmount: toNonNegativeNumber(item.actualAmount, 0),
            };
          })
          .filter(Boolean)
      : [];

    const totalBudgeted = categories.reduce((sum, item) => sum + item!.plannedAmount, 0);

    await collection.updateOne(
      { userId: auth.userId, accountType: "user", month, year },
      {
        $set: {
          userId: auth.userId,
          accountType: "user",
          month,
          year,
          categories,
          totalBudgeted: toNonNegativeNumber(body.totalBudgeted, totalBudgeted),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    const saved = await collection.findOne({ userId: auth.userId, accountType: "user", month, year });

    return res.status(200).json({
      ok: true,
      item: serializeDoc(saved),
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

# =========================================================
# src/pages/api/wealth-builder/budget/[id].ts
# =========================================================
cat > 'src/pages/api/wealth-builder/budget/[id].ts' <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toNonNegativeNumber,
  toObjectId,
} from "@/lib/wealth-builder/helpers";

type BudgetCategory = {
  name: string;
  plannedAmount: number;
  actualAmount: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const id = firstQueryValue(req.query.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: "Budget id is required." });
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return res.status(400).json({ ok: false, message: "Invalid budget id." });
  }

  const db = await getWealthDb();
  const collection = db.collection("budget_plans");
  const filter = { _id: objectId, userId: auth.userId, accountType: "user" as const };

  if (req.method === "PATCH") {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (Array.isArray(body.categories)) {
      const categories: BudgetCategory[] = body.categories
        .map((item): BudgetCategory | null => {
          if (!item || typeof item !== "object") return null;
          const name = typeof item.name === "string" ? item.name.trim() : "";
          if (!name) return null;

          return {
            name,
            plannedAmount: toNonNegativeNumber(item.plannedAmount, 0),
            actualAmount: toNonNegativeNumber(item.actualAmount, 0),
          };
        })
        .filter(Boolean) as BudgetCategory[];

      update.categories = categories;
      update.totalBudgeted = categories.reduce((sum, item) => sum + item.plannedAmount, 0);
    }

    if (body.totalBudgeted !== undefined) {
      update.totalBudgeted = toNonNegativeNumber(body.totalBudgeted, 0);
    }

    await collection.updateOne(filter, { $set: update });
    const updated = await collection.findOne(filter);

    return res.status(200).json({
      ok: true,
      item: serializeDoc(updated),
    });
  }

  if (req.method === "DELETE") {
    const existing = await collection.findOne(filter);
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Budget plan not found." });
    }

    await collection.deleteOne(filter);
    return res.status(200).json({ ok: true, deletedId: id });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

# =========================================================
# src/pages/api/wealth-builder/transactions/index.ts
# =========================================================
cat > src/pages/api/wealth-builder/transactions/index.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDocs,
  toDateOrNull,
  toIntegerInRange,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_TYPES = ["income", "expense", "transfer", "debt-payment", "savings"] as const;
const ALLOWED_SOURCES = ["manual", "import", "sync", "adjustment"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("financial_transactions");

  if (req.method === "GET") {
    const filter: Record<string, unknown> = {
      userId: auth.userId,
      accountType: "user",
    };

    const type = firstQueryValue(req.query.type);
    const category = firstQueryValue(req.query.category);
    const from = toDateOrNull(firstQueryValue(req.query.from));
    const to = toDateOrNull(firstQueryValue(req.query.to));
    const limit = toIntegerInRange(firstQueryValue(req.query.limit), 1, 500, 100);

    if (type && ALLOWED_TYPES.includes(type as any)) filter.type = type;
    if (category) filter.category = category;

    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>).$gte = from;
      if (to) (filter.date as Record<string, unknown>).$lte = to;
    }

    const items = await collection.find(filter).sort({ date: -1, createdAt: -1 }).limit(limit).toArray();

    return res.status(200).json({
      ok: true,
      items: serializeDocs(items),
    });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "object" && req.body ? req.body : {};

    const category = typeof body.category === "string" ? body.category.trim() : "";
    if (!category) {
      return res.status(400).json({ ok: false, message: "Transaction category is required." });
    }

    const type = ALLOWED_TYPES.includes(body.type) ? body.type : "expense";
    const source = ALLOWED_SOURCES.includes(body.source) ? body.source : "manual";
    const date = toDateOrNull(body.date) || new Date();
    const now = new Date();

    const doc = {
      userId: auth.userId,
      accountType: "user",
      date,
      amount: toNonNegativeNumber(body.amount, 0),
      category,
      merchant: typeof body.merchant === "string" ? body.merchant.trim() : "",
      type,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
      source,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });

    return res.status(201).json({
      ok: true,
      item: created ? { id: created._id.toString(), ...doc } : null,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

# =========================================================
# src/pages/api/wealth-builder/transactions/[id].ts
# =========================================================
cat > 'src/pages/api/wealth-builder/transactions/[id].ts' <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toDateOrNull,
  toNonNegativeNumber,
  toObjectId,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_TYPES = ["income", "expense", "transfer", "debt-payment", "savings"] as const;
const ALLOWED_SOURCES = ["manual", "import", "sync", "adjustment"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const id = firstQueryValue(req.query.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: "Transaction id is required." });
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return res.status(400).json({ ok: false, message: "Invalid transaction id." });
  }

  const db = await getWealthDb();
  const collection = db.collection("financial_transactions");
  const filter = { _id: objectId, userId: auth.userId, accountType: "user" as const };

  if (req.method === "PATCH") {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (body.date !== undefined) update.date = toDateOrNull(body.date);
    if (body.amount !== undefined) update.amount = toNonNegativeNumber(body.amount, 0);
    if (typeof body.category === "string") update.category = body.category.trim();
    if (typeof body.merchant === "string") update.merchant = body.merchant.trim();
    if (typeof body.notes === "string") update.notes = body.notes.trim();
    if (ALLOWED_TYPES.includes(body.type)) update.type = body.type;
    if (ALLOWED_SOURCES.includes(body.source)) update.source = body.source;

    await collection.updateOne(filter, { $set: update });
    const updated = await collection.findOne(filter);

    return res.status(200).json({
      ok: true,
      item: serializeDoc(updated),
    });
  }

  if (req.method === "DELETE") {
    const existing = await collection.findOne(filter);
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Transaction record not found." });
    }

    await collection.deleteOne(filter);
    return res.status(200).json({ ok: true, deletedId: id });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

# =========================================================
# src/pages/api/wealth-builder/dashboard.ts
# =========================================================
cat > src/pages/api/wealth-builder/dashboard.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import { getMonthRange, serializeDoc } from "@/lib/wealth-builder/helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();

  const profiles = db.collection("financial_profiles");
  const debts = db.collection("financial_debts");
  const goals = db.collection("savings_goals");
  const budgets = db.collection("budget_plans");
  const transactions = db.collection("financial_transactions");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { start, end } = getMonthRange(year, month);

  const [profile, debtItems, goalItems, budgetPlan, transactionItems] = await Promise.all([
    profiles.findOne({ userId: auth.userId, accountType: "user" }),
    debts.find({ userId: auth.userId, accountType: "user" }).toArray(),
    goals.find({ userId: auth.userId, accountType: "user" }).toArray(),
    budgets.findOne({ userId: auth.userId, accountType: "user", month, year }),
    transactions
      .find({
        userId: auth.userId,
        accountType: "user",
        date: { $gte: start, $lt: end },
      })
      .toArray(),
  ]);

  const totalDebt = debtItems
    .filter((item) => item.status !== "paid" && item.status !== "closed")
    .reduce((sum, item) => sum + (typeof item.balance === "number" ? item.balance : 0), 0);

  const totalMinimumPayments = debtItems
    .filter((item) => item.status !== "paid" && item.status !== "closed")
    .reduce((sum, item) => sum + (typeof item.minimumPayment === "number" ? item.minimumPayment : 0), 0);

  const totalSavings = goalItems.reduce(
    (sum, item) => sum + (typeof item.currentAmount === "number" ? item.currentAmount : 0),
    0
  );

  const activeGoals = goalItems.filter((item) => item.status === "active").length;

  const monthIncome = transactionItems
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0), 0);

  const monthExpenses = transactionItems
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0), 0);

  return res.status(200).json({
    ok: true,
    dashboard: {
      profile: serializeDoc(profile),
      summary: {
        monthlyIncome: typeof profile?.monthlyIncome === "number" ? profile.monthlyIncome : 0,
        totalDebt,
        totalMinimumPayments,
        totalSavings,
        activeGoals,
        budgetStatus: budgetPlan ? "Configured" : "Not Set",
        monthIncome,
        monthExpenses,
      },
      budgetPlan: serializeDoc(budgetPlan),
      recentTransactionsCount: transactionItems.length,
    },
  });
}
TS

# =========================================================
# src/pages/api/wealth-builder/insights.ts
# =========================================================
cat > src/pages/api/wealth-builder/insights.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import { getMonthRange } from "@/lib/wealth-builder/helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const debts = db.collection("financial_debts");
  const goals = db.collection("savings_goals");
  const budgets = db.collection("budget_plans");
  const transactions = db.collection("financial_transactions");
  const profiles = db.collection("financial_profiles");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { start, end } = getMonthRange(year, month);

  const [profile, debtItems, goalItems, budgetPlan, transactionItems] = await Promise.all([
    profiles.findOne({ userId: auth.userId, accountType: "user" }),
    debts.find({ userId: auth.userId, accountType: "user" }).toArray(),
    goals.find({ userId: auth.userId, accountType: "user" }).toArray(),
    budgets.findOne({ userId: auth.userId, accountType: "user", month, year }),
    transactions
      .find({
        userId: auth.userId,
        accountType: "user",
        date: { $gte: start, $lt: end },
      })
      .toArray(),
  ]);

  const insights: Array<{ type: string; title: string; message: string }> = [];

  if (debtItems.length > 0) {
    const highestInterestDebt = debtItems
      .filter((item) => typeof item.interestRate === "number")
      .sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0))[0];

    if (highestInterestDebt) {
      insights.push({
        type: "debt",
        title: "Highest-interest debt",
        message: `${highestInterestDebt.name} has the highest interest rate at ${highestInterestDebt.interestRate}%.`,
      });
    }
  }

  const expenseTransactions = transactionItems.filter((item) => item.type === "expense");
  if (expenseTransactions.length > 0) {
    const totalsByCategory = expenseTransactions.reduce<Record<string, number>>((acc, item) => {
      const key = typeof item.category === "string" && item.category ? item.category : "Other";
      acc[key] = (acc[key] || 0) + (typeof item.amount === "number" ? item.amount : 0);
      return acc;
    }, {});

    const topCategory = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push({
        type: "spending",
        title: "Top spending category",
        message: `${topCategory[0]} is your largest expense category this month at $${topCategory[1].toFixed(2)}.`,
      });
    }
  }

  if (goalItems.length > 0) {
    const activeGoal = goalItems.find((item) => item.status === "active");
    if (activeGoal && typeof activeGoal.targetAmount === "number" && typeof activeGoal.currentAmount === "number") {
      const remaining = Math.max(activeGoal.targetAmount - activeGoal.currentAmount, 0);
      insights.push({
        type: "savings",
        title: "Savings progress",
        message: `${activeGoal.goalName} has $${remaining.toFixed(2)} remaining to reach the target.`,
      });
    }
  }

  if (budgetPlan && Array.isArray(budgetPlan.categories)) {
    const totalPlanned = budgetPlan.categories.reduce(
      (sum: number, item: any) => sum + (typeof item.plannedAmount === "number" ? item.plannedAmount : 0),
      0
    );
    const totalActual = budgetPlan.categories.reduce(
      (sum: number, item: any) => sum + (typeof item.actualAmount === "number" ? item.actualAmount : 0),
      0
    );

    insights.push({
      type: "budget",
      title: "Budget snapshot",
      message:
        totalActual > totalPlanned
          ? `You are currently $${(totalActual - totalPlanned).toFixed(2)} over your planned budget.`
          : `You are currently within budget by $${(totalPlanned - totalActual).toFixed(2)}.`,
    });
  }

  if (profile && typeof profile.monthlyIncome === "number") {
    const monthlyExpenses = expenseTransactions.reduce(
      (sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0),
      0
    );
    insights.push({
      type: "cashflow",
      title: "Monthly cash flow",
      message: `Based on current entries, approximately $${(profile.monthlyIncome - monthlyExpenses).toFixed(2)} remains after this month's tracked expenses.`,
    });
  }

  return res.status(200).json({
    ok: true,
    insights,
  });
}
TS

# =========================================================
# Travel Map next stubs
# =========================================================
cat > src/pages/travel-map/saved.tsx <<'TS'
import Head from "next/head";
import TravelMapNav from "@/components/travel-map/TravelMapNav";

export default function TravelMapSavedPage() {
  return (
    <>
      <Head>
        <title>Saved Places | Travel Map</title>
      </Head>
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <TravelMapNav />
          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Saved Places
            </p>
            <h1 className="mt-3 text-4xl font-bold">Saved Black-owned businesses</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              Placeholder page for saved places. Auth-backed save/remove behavior will be connected later.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
TS

cat > 'src/pages/travel-map/business/[id].tsx' <<'TS'
import Head from "next/head";
import { useRouter } from "next/router";
import TravelMapNav from "@/components/travel-map/TravelMapNav";

export default function TravelMapBusinessDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>Travel Map Business Detail</title>
      </Head>
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <TravelMapNav />
          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Business Detail
            </p>
            <h1 className="mt-3 text-4xl font-bold">Travel Map business view</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              Placeholder business detail page for id: {String(id || "")}
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
TS

cat > src/pages/api/travel-map/nearby.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    ok: true,
    placeholder: true,
    message: "Nearby Travel Map route scaffold is active. Geospatial query logic not connected yet.",
    items: [],
  });
}
TS

cat > 'src/pages/api/travel-map/business/[id].ts' <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  return res.status(200).json({
    ok: true,
    placeholder: true,
    id,
    message: "Travel Map business detail route scaffold is active. Business lookup logic not connected yet.",
  });
}
TS

cat > src/pages/api/travel-map/saved/index.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      message: "Saved Travel Map places list scaffold is active.",
      items: [],
    });
  }

  if (req.method === "POST") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      message: "Saved Travel Map place create scaffold is active.",
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

cat > 'src/pages/api/travel-map/saved/[id].ts' <<'TS'
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "DELETE") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      id,
      message: "Saved Travel Map place delete scaffold is active.",
    });
  }

  res.setHeader("Allow", ["DELETE"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
TS

# =========================================================
# Update TravelMapNav to include Saved
# =========================================================
cat > src/components/travel-map/TravelMapNav.tsx <<'TS'
import Link from "next/link";
import { useRouter } from "next/router";

const items = [
  { href: "/travel-map", label: "Overview" },
  { href: "/travel-map/explore", label: "Explore" },
  { href: "/travel-map/saved", label: "Saved" },
];

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export default function TravelMapNav() {
  const router = useRouter();

  return (
    <nav
      aria-label="Travel Map Navigation"
      className="mb-8 flex flex-wrap gap-3 rounded-2xl border border-yellow-700/40 bg-black/40 p-4"
    >
      {items.map((item) => {
        const active = isActive(router.pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              active
                ? "border-yellow-400 bg-yellow-500/15 text-yellow-300"
                : "border-white/15 bg-white/5 text-white hover:border-yellow-500/40 hover:text-yellow-300",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
TS

echo "Done."
echo "Added full first-pass financial backend routes and next Travel Map stubs."
