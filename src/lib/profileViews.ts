// src/lib/profileViews.ts
//
// "Who viewed your business", LinkedIn-style.
//
// - Every visit to a business page (directory page and /business/[slug]) is
//   recorded once per viewer per business per day. A signed-in viewer is
//   stored by account; a guest only by an anonymous browser session id.
// - Members who turned on "Browse privately" are recorded as a private view:
//   counted, never named.
// - Owners of an UNCLAIMED listing see only the counts (a "claim to see who"
//   teaser). Owners who have CLAIMED their listing see the named viewers.
// - A viewer's email is never returned to a business.

import { ObjectId, type Db } from "mongodb";

export const PROFILE_VIEWS_COLLECTION = "business_profile_views";

const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor/i;

let indexesReady: Promise<unknown> | null = null;
function ensureIndexes(db: Db) {
  if (!indexesReady) {
    const col = db.collection(PROFILE_VIEWS_COLLECTION);
    indexesReady = Promise.all([
      col.createIndex(
        { businessId: 1, viewerKey: 1, day: 1 },
        { unique: true, name: "one_view_per_viewer_per_day" },
      ),
      col.createIndex({ businessId: 1, viewedAt: -1 }),
    ]).catch((err) => {
      indexesReady = null;
      throw err;
    });
  }
  return indexesReady;
}

function accountCollection(accountType?: string | null) {
  if (accountType === "seller") return "sellers";
  if (accountType === "employer") return "employers";
  if (accountType === "business") return "businesses";
  return "users";
}

function idFilter(id: string) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id
    ? { _id: new ObjectId(id) }
    : { _id: id as any };
}

function monthStart(offsetMonths = 0, now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
}

export type RecordViewArgs = {
  businessId: string;
  viewer: { userId: string; accountType?: string | null } | null;
  sessionId: string | null;
  page: "directory" | "business";
  userAgent?: string | null;
  now?: Date;
};

export async function recordProfileView(
  db: Db,
  args: RecordViewArgs,
): Promise<{ recorded: boolean; reason?: string }> {
  const businessId = String(args.businessId || "").trim();
  if (!businessId) return { recorded: false, reason: "no_business" };
  if (args.userAgent && BOT_UA.test(args.userAgent)) {
    return { recorded: false, reason: "bot" };
  }

  const business = await db
    .collection("businesses")
    .findOne(idFilter(businessId), {
      projection: {
        _id: 1,
        claimedByUserId: 1,
        managedByUserId: 1,
        ownerUserIds: 1,
      },
    });
  if (!business) return { recorded: false, reason: "unknown_business" };

  const viewerId = args.viewer?.userId ? String(args.viewer.userId) : "";
  // An owner looking at their own page is not a visitor.
  if (
    viewerId &&
    (viewerId === String(business._id) ||
      viewerId === String((business as any).claimedByUserId || "") ||
      viewerId === String((business as any).managedByUserId || "") ||
      (Array.isArray((business as any).ownerUserIds) &&
        (business as any).ownerUserIds.map(String).includes(viewerId)))
  ) {
    return { recorded: false, reason: "owner" };
  }

  let isPrivate = false;
  if (viewerId) {
    const account = await db
      .collection(accountCollection(args.viewer?.accountType))
      .findOne(idFilter(viewerId), { projection: { browsePrivately: 1 } });
    isPrivate = (account as any)?.browsePrivately === true;
  }

  const sessionId = String(args.sessionId || "").slice(0, 128);
  const viewerKey = viewerId
    ? `user:${viewerId}`
    : sessionId
      ? `session:${sessionId}`
      : "";
  if (!viewerKey) return { recorded: false, reason: "no_viewer_key" };

  const now = args.now || new Date();
  const day = now.toISOString().slice(0, 10);

  await ensureIndexes(db);
  const result = await db.collection(PROFILE_VIEWS_COLLECTION).updateOne(
    { businessId: String(business._id), viewerKey, day },
    {
      $setOnInsert: {
        businessId: String(business._id),
        viewerKey,
        day,
        viewerUserId: viewerId && !isPrivate ? viewerId : null,
        viewerAccountType:
          viewerId && !isPrivate ? args.viewer?.accountType || "user" : null,
        signedIn: Boolean(viewerId),
        isPrivate,
        page: args.page,
        viewedAt: now,
      },
    },
    { upsert: true },
  );
  return {
    recorded: Boolean(result.upsertedCount),
    reason: result.upsertedCount ? undefined : "already_counted_today",
  };
}

export type ProfileViewer = {
  name: string;
  avatarUrl: string | null;
  kind: "member" | "business" | "seller" | "employer";
  lastViewedAt: string;
};

export type ProfileViewSummary = {
  thisMonth: number;
  lastMonth: number;
  last30Days: number;
  namedViewersLast30Days: number;
  privateOrGuestLast30Days: number;
  viewers: ProfileViewer[] | null; // null when locked (listing not claimed)
};

function viewerName(doc: any, accountType: string) {
  const name =
    (accountType === "business"
      ? doc?.business_name || doc?.businessName
      : doc?.fullName ||
        doc?.name ||
        [doc?.firstName, doc?.lastName].filter(Boolean).join(" ")) || "";
  return String(name).trim();
}

function viewerAvatar(doc: any): string | null {
  const url =
    (doc?.avatar && typeof doc.avatar === "object" && doc.avatar.url) ||
    doc?.profileImage ||
    doc?.logo ||
    doc?.image ||
    null;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export async function getProfileViewSummary(
  db: Db,
  businessId: string,
  opts: { includeViewers: boolean; now?: Date },
): Promise<ProfileViewSummary> {
  const now = opts.now || new Date();
  const col = db.collection(PROFILE_VIEWS_COLLECTION);
  const id = String(businessId);
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [thisMonth, lastMonth, recent] = await Promise.all([
    col.countDocuments({
      businessId: id,
      viewedAt: { $gte: monthStart(0, now) },
    }),
    col.countDocuments({
      businessId: id,
      viewedAt: { $gte: monthStart(-1, now), $lt: monthStart(0, now) },
    }),
    col
      .find(
        { businessId: id, viewedAt: { $gte: since30 } },
        { projection: { viewerUserId: 1, viewerAccountType: 1, viewedAt: 1 } },
      )
      .sort({ viewedAt: -1 })
      .limit(2000)
      .toArray(),
  ]);

  // Latest visit per named viewer.
  const latest = new Map<string, { accountType: string; viewedAt: Date }>();
  let anonymous = 0;
  for (const v of recent as any[]) {
    if (!v.viewerUserId) {
      anonymous++;
      continue;
    }
    const key = `${v.viewerAccountType || "user"}:${v.viewerUserId}`;
    if (!latest.has(key)) {
      latest.set(key, {
        accountType: v.viewerAccountType || "user",
        viewedAt: v.viewedAt,
      });
    }
  }

  let viewers: ProfileViewer[] | null = null;
  if (opts.includeViewers) {
    viewers = [];
    const entries = [...latest.entries()].slice(0, 50);
    for (const [key, meta] of entries) {
      const userId = key.slice(key.indexOf(":") + 1);
      const doc = await db
        .collection(accountCollection(meta.accountType))
        .findOne(idFilter(userId), {
          projection: {
            fullName: 1,
            name: 1,
            firstName: 1,
            lastName: 1,
            business_name: 1,
            businessName: 1,
            avatar: 1,
            profileImage: 1,
            logo: 1,
            image: 1,
            browsePrivately: 1,
          },
        });
      // Turned on "Browse privately" since the visit: stop naming them.
      if (!doc || (doc as any).browsePrivately === true) continue;
      viewers.push({
        name:
          viewerName(doc, meta.accountType) || "A Black Wealth Exchange member",
        avatarUrl: viewerAvatar(doc),
        kind:
          meta.accountType === "business"
            ? "business"
            : meta.accountType === "seller"
              ? "seller"
              : meta.accountType === "employer"
                ? "employer"
                : "member",
        lastViewedAt: meta.viewedAt.toISOString(),
      });
    }
  }

  return {
    thisMonth,
    lastMonth,
    last30Days: recent.length,
    namedViewersLast30Days: latest.size,
    privateOrGuestLast30Days: anonymous,
    viewers,
  };
}
