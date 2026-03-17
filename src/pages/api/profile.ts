import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type ProfileResponse = {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  resumeUrl?: string;
};

function collectionFor(accountType?: string) {
  if (accountType === "seller") return "sellers";
  if (accountType === "employer") return "employers";
  if (accountType === "business") return "businesses";
  return "users";
}

function nameFromDoc(doc: any) {
  return doc?.fullName || doc?.name || doc?.businessName || "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, getJwtSecret()) as {
      userId?: string;
      email?: string;
      accountType?: string;
    };

    const email = payload?.email;
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const col = db.collection(collectionFor(payload.accountType));

    const doc = await col.findOne({ email });
    if (!doc) return res.status(404).json({ error: "Profile not found" });

    if (req.method === "GET") {
      const out: ProfileResponse = {
        id: String(doc._id),
        name: nameFromDoc(doc),
        email: doc.email || email,
        profileImage: doc.profileImage || doc.avatar || "",
        bio: doc.bio || "",
        resumeUrl: doc.resumeUrl || "",
      };
      return res.status(200).json(out);
    }

    if (req.method === "PATCH") {
      const name =
        typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const bio = typeof req.body?.bio === "string" ? req.body.bio.trim() : "";
      if (!name) return res.status(400).json({ error: "Name is required" });

      const update: Record<string, unknown> = { bio, updatedAt: new Date() };
      if (payload.accountType === "business") update.businessName = name;
      else update.fullName = name;

      await col.updateOne(
        { _id: new ObjectId(String(doc._id)) },
        { $set: update },
      );

      const updated = await col.findOne({ _id: new ObjectId(String(doc._id)) });
      const out: ProfileResponse = {
        id: String(updated?._id || doc._id),
        name: nameFromDoc(updated || doc),
        email: (updated?.email || doc.email || email) as string,
        profileImage: (updated?.profileImage || updated?.avatar || "") as string,
        bio: (updated?.bio || "") as string,
        resumeUrl: (updated?.resumeUrl || "") as string,
      };
      return res.status(200).json(out);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("/api/profile error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
