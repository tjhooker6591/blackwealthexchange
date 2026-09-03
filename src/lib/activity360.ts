import { ObjectId, type Db } from "mongodb";

export type Activity360State = "LINKED" | "NOT_LINKED" | "UNKNOWN";

export type Activity360Provenance = {
  source: string;
  authoritative: boolean;
  note?: string | null;
};

export type Activity360Summary = {
  state: Activity360State;
  flowEventCount: number;
  searchEventCount: number;
  recentEventTypes: string[];
  recentRoutes: string[];
  recentSources: string[];
  latestEventAt: string | null;
  provenance: Activity360Provenance[];
};

type QueryTracker = {
  queryCount: number;
};

type ResolveBusinessActivityOptions = {
  businessId: string;
  limit?: number;
};

type ResolvePersonActivityOptions = {
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
  collectionName: string,
  filter: Record<string, unknown>,
  limit: number,
) {
  tracker.queryCount += 1;
  return db
    .collection(collectionName)
    .find(filter, { sort: { createdAt: -1 }, limit })
    .toArray();
}

function summarizeActivity(
  flowEvents: any[],
  searchEvents: any[],
  provenance: Activity360Provenance[],
): Activity360Summary {
  const latestEventAt =
    [flowEvents[0], searchEvents[0]]
      .map((entry) => asIsoDate((entry as any)?.createdAt))
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

  return {
    state: flowEvents.length || searchEvents.length ? "LINKED" : "NOT_LINKED",
    flowEventCount: flowEvents.length,
    searchEventCount: searchEvents.length,
    recentEventTypes: uniq(
      flowEvents.map((row) => s((row as any).eventType)).filter(Boolean),
    ).slice(0, 10),
    recentRoutes: uniq(
      flowEvents
        .flatMap((row) => [
          s((row as any).pageRoute),
          s((row as any).path),
          s((row as any).destination),
        ])
        .filter(Boolean),
    ).slice(0, 10),
    recentSources: uniq(
      flowEvents
        .flatMap((row) => [
          s((row as any).source),
          s((row as any).section),
          s((row as any).sourceVariant),
        ])
        .filter(Boolean),
    ).slice(0, 10),
    latestEventAt,
    provenance,
  };
}

export async function resolveBusinessActivity360(
  db: Db,
  tracker: QueryTracker,
  input: ResolveBusinessActivityOptions,
): Promise<Activity360Summary> {
  const businessId = toId(input.businessId);
  const limit = Math.max(1, Math.min(200, Number(input.limit || 100)));

  if (!businessId) {
    return {
      state: "UNKNOWN",
      flowEventCount: 0,
      searchEventCount: 0,
      recentEventTypes: [],
      recentRoutes: [],
      recentSources: [],
      latestEventAt: null,
      provenance: [
        {
          source: "missing_business_id",
          authoritative: false,
          note: "Business activity requires a businessId anchor.",
        },
      ],
    };
  }

  const [flowEvents, searchEvents] = await Promise.all([
    findManyTracked(db, tracker, "flow_events", { businessId }, limit),
    findManyTracked(
      db,
      tracker,
      "search_quality_events",
      { selectedBusinessId: businessId },
      limit,
    ),
  ]);

  return summarizeActivity(flowEvents, searchEvents, [
    ...(flowEvents.length
      ? [
          {
            source: "flow_events.businessId",
            authoritative: false,
          },
        ]
      : []),
    ...(searchEvents.length
      ? [
          {
            source: "search_quality_events.selectedBusinessId",
            authoritative: false,
          },
        ]
      : []),
    ...(!flowEvents.length && !searchEvents.length
      ? [
          {
            source: "no_business_activity_overlay",
            authoritative: false,
          },
        ]
      : []),
  ]);
}

export async function resolvePersonActivity360(
  db: Db,
  tracker: QueryTracker,
  input: ResolvePersonActivityOptions,
): Promise<Activity360Summary> {
  const userId = toId(input.userId);
  const limit = Math.max(1, Math.min(200, Number(input.limit || 100)));

  if (!userId) {
    return {
      state: "UNKNOWN",
      flowEventCount: 0,
      searchEventCount: 0,
      recentEventTypes: [],
      recentRoutes: [],
      recentSources: [],
      latestEventAt: null,
      provenance: [
        {
          source: "missing_user_id",
          authoritative: false,
          note: "Person activity requires a users._id anchor.",
        },
      ],
    };
  }

  const flowEvents = await findManyTracked(
    db,
    tracker,
    "flow_events",
    { userId },
    limit,
  );

  return summarizeActivity(
    flowEvents,
    [],
    [
      ...(flowEvents.length
        ? [
            {
              source: "flow_events.userId",
              authoritative: true,
            },
          ]
        : [
            {
              source: "no_person_activity_overlay",
              authoritative: false,
            },
          ]),
    ],
  );
}
