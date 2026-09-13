// src/lib/network/notifications.ts
//
// Canonical notification store for Phase 5. Reuses the existing
// `notifications` collection (already read by
// src/pages/api/notifications/fetch.ts, already written by the Stripe
// webhook and billing cancellation flows) as the single notification feed
// for a user, rather than inventing a second collection. Every write here
// is triggered by a real event (a real follow, a real review, a real
// business update, a real alert match) -- never fabricated.

import { ObjectId, type Db } from "mongodb";
import { s } from "./shared";

export type NetworkNotificationType =
  | "business_update"
  | "review_received"
  | "follow_received"
  | "alert_match"
  | "referral_event"
  | "inbox_message"
  | "member_post"
  | "comment_received"
  | "business_reply";

export type CreateNotificationInput = {
  userId: string;
  type: NetworkNotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  meta?: Record<string, unknown> | null;
};

export async function createNotification(
  db: Db,
  input: CreateNotificationInput,
) {
  const userId = s(input.userId);
  const title = s(input.title);
  if (!userId || !title) return null;

  const doc = {
    userId,
    type: input.type,
    title,
    body: input.body ? s(input.body) : null,
    href: input.href ? s(input.href) : null,
    meta: input.meta || null,
    read: false,
    createdAt: new Date(),
  };

  const result = await db.collection("notifications").insertOne(doc as any);
  return { id: String(result.insertedId), ...doc };
}

/** Notifies every real follower of a business. Never fabricates a follower. */
export async function notifyBusinessFollowers(
  db: Db,
  input: {
    businessId: string;
    excludeUserId?: string | null;
    type: NetworkNotificationType;
    title: string;
    body?: string | null;
    href?: string | null;
    meta?: Record<string, unknown> | null;
  },
) {
  const businessId = s(input.businessId);
  if (!businessId) return 0;

  const followers = await db
    .collection("follows")
    .find({ businessId }, { projection: { userId: 1 } })
    .toArray();

  let notified = 0;
  for (const follower of followers) {
    const userId = s((follower as any).userId);
    if (!userId || userId === s(input.excludeUserId)) continue;
    await createNotification(db, {
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      meta: input.meta,
    });
    notified += 1;
  }
  return notified;
}

/**
 * Notifies every real follower of a person (BWE Pulse Phase 2). Mirrors
 * notifyBusinessFollowers exactly, against the separate user_follows
 * collection instead of follows.
 */
export async function notifyUserFollowers(
  db: Db,
  input: {
    followingUserId: string;
    excludeUserId?: string | null;
    type: NetworkNotificationType;
    title: string;
    body?: string | null;
    href?: string | null;
    meta?: Record<string, unknown> | null;
  },
) {
  const followingUserId = s(input.followingUserId);
  if (!followingUserId) return 0;

  const followers = await db
    .collection("user_follows")
    .find({ followingUserId }, { projection: { followerId: 1 } })
    .toArray();

  let notified = 0;
  for (const follower of followers) {
    const userId = s((follower as any).followerId);
    if (!userId || userId === s(input.excludeUserId)) continue;
    await createNotification(db, {
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      meta: input.meta,
    });
    notified += 1;
  }
  return notified;
}

export async function ensureNotificationIndexes(db: Db) {
  await db
    .collection("notifications")
    .createIndex({ userId: 1, createdAt: -1 })
    .catch(() => null);
  await db
    .collection("notifications")
    .createIndex({ userId: 1, read: 1 })
    .catch(() => null);
}

export function serializeNotification(doc: any) {
  return {
    id: String(doc._id),
    type: doc.type || "business_update",
    title: doc.title || "",
    body: doc.body || null,
    href: doc.href || null,
    read: Boolean(doc.read),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt || null,
  };
}

export { ObjectId };
