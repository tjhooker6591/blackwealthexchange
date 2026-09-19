// src/lib/acquisition/events.ts
//
// Section 4 of the brief: buyer acquisition analytics event envelope.
// Deliberately separate from the general-purpose src/lib/analytics/
// flowEvents.ts stream -- that collection was never designed for
// campaign-attribution windows, bot filtering, or a server-confirmed vs.
// browser-declared revenue distinction, and entangling those concerns into
// a collection Phase 4 personalization/recommendations already reads
// broadly would risk unintended side effects there. This is a narrower,
// dedicated, dedup'd ledger for the acquisition/proof program only.
//
// Hard rule: a browser-sourced event can never declare inquiry_submitted
// or paid_order. paid_order additionally requires a real, verified
// bmev_records document to reference -- there is no amount field here at
// all, so this module cannot invent revenue even if misused.

import { ObjectId, type Db } from "mongodb";
import {
  COLLECTIONS,
  newId,
  nowIso,
  resolveCanonicalBusiness,
  s,
} from "./shared";
import { isAllowlistedCampaignId } from "./campaigns";
import {
  ACQUISITION_EVENT_TYPES,
  type AcquisitionEvent,
  type AcquisitionEventSource,
  type AcquisitionEventType,
} from "./types";

function toStringId(id: unknown) {
  if (id instanceof ObjectId) return id.toString();
  return String(id);
}

// Event types a raw, unauthenticated browser request is ever allowed to
// declare. Everything else requires source: "server" and passes through
// the additional checks below.
const BROWSER_ALLOWED_EVENT_TYPES: AcquisitionEventType[] = [
  "profile_view",
  "website_click",
  "phone_click",
  "directions_click",
  "storefront_view",
];

const BOT_UA_PATTERN =
  /bot|crawler|spider|headless|curl|wget|python-requests|scrapy|monitor|pingdom|uptimerobot/i;

export type RecordEventInput = {
  eventType: string;
  businessId: string;
  eventTime?: string;
  source: AcquisitionEventSource;
  campaignId?: string | null;
  sessionId?: string | null;
  entityRef?: string | null;
  dedupeKey?: string | null;
  demoFlag?: boolean;
  userAgent?: string | null;
};

export type RecordEventResult =
  | { ok: true; deduped: boolean; event: AcquisitionEvent }
  | { ok: false; code: string; message: string };

export async function recordAcquisitionEvent(
  db: Db,
  input: RecordEventInput,
): Promise<RecordEventResult> {
  const eventType = s(input.eventType) as AcquisitionEventType;
  if (!ACQUISITION_EVENT_TYPES.includes(eventType)) {
    return {
      ok: false,
      code: "UNKNOWN_EVENT_TYPE",
      message: `Unknown event type: ${input.eventType}`,
    };
  }

  const canonical = await resolveCanonicalBusiness(db, input.businessId);
  if (!canonical) {
    return {
      ok: false,
      code: "UNAUTHORIZED_BUSINESS_REFERENCE",
      message: "businessId does not match a canonical business record.",
    };
  }

  if (
    input.source === "browser" &&
    !BROWSER_ALLOWED_EVENT_TYPES.includes(eventType)
  ) {
    return {
      ok: false,
      code: "BROWSER_CANNOT_DECLARE_EVENT_TYPE",
      message: `"${eventType}" requires a server-confirmed source and cannot be submitted from a browser.`,
    };
  }

  const entityRef = s(input.entityRef) || null;

  if (eventType === "paid_order") {
    if (input.source !== "server") {
      return {
        ok: false,
        code: "PAID_ORDER_REQUIRES_SERVER_SOURCE",
        message: "paid_order events must originate server-side.",
      };
    }
    // Reject a forged paid_order outright unless it references a real,
    // verified revenue record for this exact business -- bmev_records is
    // the single source of payment truth (see economicActivity360.ts);
    // this module never restates or invents an amount.
    if (!entityRef || !ObjectId.isValid(entityRef)) {
      return {
        ok: false,
        code: "PAID_ORDER_REQUIRES_ENTITY_REF",
        message: "paid_order events must reference a bmev_records _id.",
      };
    }
    const bmev = await db.collection("bmev_records").findOne({
      _id: new ObjectId(entityRef),
      businessId: canonical.businessId,
      paymentVerified: true,
    });
    if (!bmev) {
      return {
        ok: false,
        code: "PAID_ORDER_UNVERIFIED",
        message:
          "No matching verified bmev_records document for this business.",
      };
    }
  }

  if (eventType === "inquiry_submitted" && input.source !== "server") {
    return {
      ok: false,
      code: "INQUIRY_REQUIRES_SERVER_SOURCE",
      message:
        "inquiry_submitted must be recorded server-side, after real form processing.",
    };
  }

  let campaignId: string | null = null;
  if (input.campaignId) {
    const allowed = await isAllowlistedCampaignId(db, input.campaignId);
    if (!allowed) {
      return {
        ok: false,
        code: "CAMPAIGN_NOT_ALLOWLISTED",
        message: "campaignId is not a recognized campaign.",
      };
    }
    campaignId = s(input.campaignId);
  }

  const eventTime =
    input.eventTime && !Number.isNaN(Date.parse(input.eventTime))
      ? new Date(input.eventTime).toISOString()
      : nowIso();
  const serverReceivedTime = nowIso();
  const eventId = newId();
  const dedupeKey =
    s(input.dedupeKey) ||
    `${canonical.businessId}:${eventType}:${entityRef || input.sessionId || eventTime}`;

  const isBot = Boolean(
    input.userAgent && BOT_UA_PATTERN.test(input.userAgent),
  );

  const doc: AcquisitionEvent = {
    eventId,
    eventType,
    businessId: canonical.businessId,
    eventTime,
    serverReceivedTime,
    source: input.source,
    campaignId,
    sessionId: s(input.sessionId) || null,
    entityRef,
    dedupeKey,
    demoFlag: Boolean(input.demoFlag),
    filtered: isBot
      ? { isFiltered: true, reason: "bot_user_agent" }
      : { isFiltered: false, reason: null },
  };

  try {
    const result = await db
      .collection(COLLECTIONS.events)
      .insertOne(doc as any);
    return {
      ok: true,
      deduped: false,
      event: { ...doc, _id: toStringId(result.insertedId) },
    };
  } catch (err: any) {
    // Unique index on dedupeKey -- a retry, alias-page duplicate, or
    // redelivered webhook collapses to the single existing row instead of
    // erroring or double-counting.
    if (err?.code === 11000) {
      const existing = await db
        .collection(COLLECTIONS.events)
        .findOne({ dedupeKey });
      if (existing) {
        return {
          ok: true,
          deduped: true,
          event: {
            ...(existing as any),
            _id: toStringId((existing as any)._id),
          },
        };
      }
    }
    throw err;
  }
}

export type EventSummaryFilter = {
  businessId: string;
  since: string;
  until: string;
  includeFiltered?: boolean;
  includeDemo?: boolean;
};

export async function summarizeEvents(db: Db, filter: EventSummaryFilter) {
  const mongoFilter: Record<string, unknown> = {
    businessId: s(filter.businessId),
    eventTime: { $gte: filter.since, $lt: filter.until },
  };
  if (!filter.includeFiltered)
    mongoFilter["filtered.isFiltered"] = { $ne: true };
  if (!filter.includeDemo) mongoFilter.demoFlag = { $ne: true };

  const rows = await db
    .collection(COLLECTIONS.events)
    .find(mongoFilter)
    .toArray();

  const counts: Record<AcquisitionEventType, number> = {
    profile_view: 0,
    website_click: 0,
    phone_click: 0,
    directions_click: 0,
    inquiry_submitted: 0,
    storefront_view: 0,
    paid_order: 0,
  };
  const bySource: Record<string, number> = {};
  let unattributed = 0;
  for (const row of rows) {
    const type = (row as any).eventType as AcquisitionEventType;
    if (type in counts) counts[type] += 1;
    const campaignId = s((row as any).campaignId);
    if (campaignId) {
      bySource[campaignId] = (bySource[campaignId] || 0) + 1;
    } else {
      unattributed += 1;
    }
  }

  const totalFiltered = await db.collection(COLLECTIONS.events).countDocuments({
    businessId: s(filter.businessId),
    eventTime: { $gte: filter.since, $lt: filter.until },
    "filtered.isFiltered": true,
  });
  const totalDemo = await db.collection(COLLECTIONS.events).countDocuments({
    businessId: s(filter.businessId),
    eventTime: { $gte: filter.since, $lt: filter.until },
    demoFlag: true,
  });

  return {
    counts,
    sourceBreakdown: bySource,
    unattributedEvents: unattributed,
    excludedAsFiltered: totalFiltered,
    excludedAsDemo: totalDemo,
    totalEventsConsidered: rows.length,
  };
}
