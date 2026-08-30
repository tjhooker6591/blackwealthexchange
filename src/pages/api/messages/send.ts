import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "../../../lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type SessionPayload = {
  userId?: string;
  email?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const suppliedSenderId =
      typeof body.senderId === "string" ? body.senderId.trim() : "";
    const receiverId =
      typeof body.receiverId === "string" ? body.receiverId.trim() : "";
    const message = typeof body.message === "string" ? body.message : "";

    const parsed = cookie.parse(req.headers.cookie || "");
    const token = parsed.session_token || req.cookies?.session_token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const session = jwt.verify(token, getJwtSecret()) as SessionPayload;
    const senderId = String(session.userId || "").trim();
    if (!senderId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (suppliedSenderId && suppliedSenderId !== senderId) {
      return res
        .status(403)
        .json({
          message: "Sender identity must match the authenticated user.",
        });
    }

    // Validate input
    if (!senderId || !receiverId || !message) {
      return res
        .status(400)
        .json({ message: "Sender ID, Receiver ID, and Message are required." });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    // Insert message into messages collection
    await db.collection("messages").insertOne({
      senderId,
      receiverId,
      message,
      isRead: false,
      sentAt: new Date(),
    });

    return res.status(200).json({ message: "Message sent successfully." });
  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
