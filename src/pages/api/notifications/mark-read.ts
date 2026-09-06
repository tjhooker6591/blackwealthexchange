// src/pages/api/notifications/mark-read.ts
//
// Phase 5 -- Notifications. Marks one notification (or all of the caller's
// own unread notifications) read. Session-scoped, same as list.ts.

import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession, isValidObjectId, s } from "@/lib/network/shared";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = getNetworkSession(req);
  if (!session) return res.status(401).json({ error: "Login required" });

  const body: any =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (body.all === true) {
    await db
      .collection("notifications")
      .updateMany(
        { userId: session.userId, read: { $ne: true } },
        { $set: { read: true } },
      );
    return res.status(200).json({ ok: true });
  }

  const id = s(body.id);
  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: "A valid id is required" });
  }

  await db
    .collection("notifications")
    .updateOne(
      { _id: new ObjectId(id), userId: session.userId },
      { $set: { read: true } },
    );
  return res.status(200).json({ ok: true });
}
