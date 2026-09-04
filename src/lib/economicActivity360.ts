import { ObjectId, type Db } from "mongodb";
import {
  resolveBusinessActivity360,
  resolvePersonActivity360,
  type Activity360Summary,
} from "./activity360";

export type EconomicActivity360State = "LINKED" | "NOT_LINKED" | "UNKNOWN";

export type EconomicActivity360Provenance = {
  source: string;
  authoritative: boolean;
  note?: string | null;
};

export type EconomicActivity360Summary = {
  state: EconomicActivity360State;
  transactionCount: number;
  verifiedRevenueCents: number;
  businessLines: string[];
  sources: string[];
  latestTransactionAt: string | null;
  activity: Activity360Summary;
  provenance: EconomicActivity360Provenance[];
};

type QueryTracker = {
  queryCount: number;
};

type ResolveBusinessEconomicActivityOptions = {
  businessId: string;
  limit?: number;
};

type ResolvePersonEconomicActivityOptions = {
  userId: string;
  limit?: number;
};

function s(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function toId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof ObjectId) return value.toString();
  if (typeof value === "object" && (value as any)?._bsontype === "ObjectId") {
    return String(value);
  }
  return s(value);
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function asIsoDate(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  const text = s(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

async function findManyTracked(
  db: Db,
  tracker: QueryTracker,
  filter: Record<string, unknown>,
  limit: number,
) {
  tracker.queryCount += 1;
  return db
    .collection("bmev_records")
    .find(filter, { sort: { occurredAt: -1 }, limit })
    .toArray();
}

function emptySummary(
  activity: Activity360Summary,
  provenance: EconomicActivity360Provenance[],
): EconomicActivity360Summary {
  return {
    state: "UNKNOWN",
    transactionCount: 0,
    verifiedRevenueCents: 0,
    businessLines: [],
    sources: [],
    latestTransactionAt: null,
    activity,
    provenance,
  };
}

function summarizeEconomicActivity(
  records: any[],
  activity: Activity360Summary,
  provenance: EconomicActivity360Provenance[],
): EconomicActivity360Summary {
  const verifiedRecords = records.filter(
    (record) => (record as any).paymentVerified === true,
  );

  return {
    state: verifiedRecords.length ? "LINKED" : "NOT_LINKED",
    transactionCount: verifiedRecords.length,
    verifiedRevenueCents: verifiedRecords.reduce(
      (sum, record) => sum + (Number((record as any).bmevAmountCents) || 0),
      0,
    ),
    businessLines: uniq(
      verifiedRecords.map((record) => s((record as any).businessLine)),
    ),
    sources: uniq(verifiedRecords.map((record) => s((record as any).source))),
    latestTransactionAt:
      verifiedRecords
        .map((record) => asIsoDate((record as any).occurredAt))
        .filter(Boolean)
        .sort()
        .reverse()[0] || null,
    activity,
    provenance,
  };
}

export async function resolveBusinessEconomicActivity360(
  db: Db,
  tracker: QueryTracker,
  input: ResolveBusinessEconomicActivityOptions,
): Promise<EconomicActivity360Summary> {
  const businessId = toId(input.businessId);
  const limit = Math.max(1, Math.min(500, Number(input.limit || 200)));

  const activity = await resolveBusinessActivity360(db, tracker, {
    businessId,
    limit,
  });

  if (!businessId) {
    return emptySummary(activity, [
      {
        source: "missing_business_id",
        authoritative: false,
        note: "Economic activity attribution requires a businessId anchor.",
      },
    ]);
  }

  const records = await findManyTracked(db, tracker, { businessId }, limit);

  return summarizeEconomicActivity(records, activity, [
    ...(records.length
      ? [
          {
            source: "bmev_records.businessId",
            authoritative: true,
          },
        ]
      : [
          {
            source: "no_verified_economic_activity",
            authoritative: false,
          },
        ]),
  ]);
}

export async function resolvePersonEconomicActivity360(
  db: Db,
  tracker: QueryTracker,
  input: ResolvePersonEconomicActivityOptions,
): Promise<EconomicActivity360Summary> {
  const userId = toId(input.userId);
  const limit = Math.max(1, Math.min(500, Number(input.limit || 200)));

  const activity = await resolvePersonActivity360(db, tracker, {
    userId,
    limit,
  });

  if (!userId) {
    return emptySummary(activity, [
      {
        source: "missing_user_id",
        authoritative: false,
        note: "Economic activity attribution requires a users._id anchor.",
      },
    ]);
  }

  const records = await findManyTracked(
    db,
    tracker,
    { buyerUserId: userId },
    limit,
  );

  return summarizeEconomicActivity(records, activity, [
    ...(records.length
      ? [
          {
            source: "bmev_records.buyerUserId",
            authoritative: true,
          },
        ]
      : [
          {
            source: "no_verified_economic_activity",
            authoritative: false,
          },
        ]),
  ]);
}
