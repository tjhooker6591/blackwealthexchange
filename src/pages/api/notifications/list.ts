// src/pages/api/notifications/list.ts
//
// Phase 5 -- Notifications. Session-scoped list of the caller's own
// notifications from the existing `notifications` collection (already read
// by the pre-existing src/pages/api/notifications/fetch.ts, which takes an
// unauthenticated userId query param -- left untouched, but not reused here
// since this endpoint derives the user from the session cookie instead of
// trusting client input).

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession } from "@/lib/network/shared";
import {
  ensureNotificationIndexes,
  serializeNotification,
} from "@/lib/network/notifications";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = getNetworkSession(req);
  if (!session) return res.status(401).json({ error: "Login required" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureNotificationIndexes(db);

  const [rows, unreadCount] = await Promise.all([
    db
      .collection("notifications")
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    db
      .collection("notifications")
      .countDocuments({ userId: session.userId, read: { $ne: true } }),
  ]);

  return res.status(200).json({
    notifications: rows.map(serializeNotification),
    unreadCount,
  });
}
