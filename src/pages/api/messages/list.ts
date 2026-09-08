// src/pages/api/messages/list.ts
//
// Phase 5 -- BWE Inbox. Reads the existing `messages` collection (already
// written by src/pages/api/messages/send.ts, keyed by senderId/receiverId)
// rather than a new collection. Two shapes:
//   GET                    -> conversation list (one row per other party,
//                              with the last message and unread count)
//   GET ?withUserId=<id>   -> full thread with that user, marking their
//                              messages to me as read

import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession, isValidObjectId, s } from "@/lib/network/shared";

function displayName(user: any) {
  if (!user) return "BWE member";
  return (
    s(user.fullName) ||
    s(user.businessName) ||
    s(user.business_name) ||
    (s(user.email) ? s(user.email).split("@")[0] : "") ||
    "BWE member"
  );
}

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

  const withUserId = s(req.query.withUserId as string);

  if (withUserId) {
    const thread = await db
      .collection("messages")
      .find({
        $or: [
          { senderId: session.userId, receiverId: withUserId },
          { senderId: withUserId, receiverId: session.userId },
        ],
      })
      .sort({ sentAt: 1 })
      .limit(500)
      .toArray();

    await db
      .collection("messages")
      .updateMany(
        { senderId: withUserId, receiverId: session.userId, isRead: false },
        { $set: { isRead: true } },
      );

    const otherUser = isValidObjectId(withUserId)
      ? await db.collection("users").findOne(
          { _id: new ObjectId(withUserId) },
          {
            projection: { fullName: 1, email: 1, businessName: 1 },
          },
        )
      : null;

    return res.status(200).json({
      withUserId,
      withName: displayName(otherUser),
      messages: thread.map((m: any) => ({
        id: String(m._id),
        fromMe: s(m.senderId) === session.userId,
        message: m.message,
        sentAt:
          m.sentAt instanceof Date ? m.sentAt.toISOString() : m.sentAt || null,
      })),
    });
  }

  const rows = await db
    .collection("messages")
    .find({
      $or: [{ senderId: session.userId }, { receiverId: session.userId }],
    })
    .sort({ sentAt: -1 })
    .limit(500)
    .toArray();

  const byOtherParty = new Map<string, { lastMessage: any; unread: number }>();
  for (const row of rows) {
    const otherId =
      s(row.senderId) === session.userId ? s(row.receiverId) : s(row.senderId);
    if (!otherId) continue;
    const entry = byOtherParty.get(otherId) || { lastMessage: row, unread: 0 };
    if (!byOtherParty.has(otherId)) entry.lastMessage = row;
    if (s(row.receiverId) === session.userId && !row.isRead) entry.unread += 1;
    byOtherParty.set(otherId, entry);
  }

  const otherIds = Array.from(byOtherParty.keys()).filter((id) =>
    isValidObjectId(id),
  );
  const users = otherIds.length
    ? await db
        .collection("users")
        .find(
          { _id: { $in: otherIds.map((id) => new ObjectId(id)) } },
          { projection: { fullName: 1, email: 1, businessName: 1 } },
        )
        .toArray()
    : [];
  const usersById = new Map(users.map((u: any) => [String(u._id), u]));

  const conversations = Array.from(byOtherParty.entries())
    .map(([otherId, entry]) => ({
      withUserId: otherId,
      withName: displayName(usersById.get(otherId)),
      lastMessage: entry.lastMessage.message,
      lastMessageAt:
        entry.lastMessage.sentAt instanceof Date
          ? entry.lastMessage.sentAt.toISOString()
          : entry.lastMessage.sentAt || null,
      unread: entry.unread,
    }))
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime(),
    );

  return res.status(200).json({ conversations });
}
