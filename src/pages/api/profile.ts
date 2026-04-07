import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type AssetMeta = {
  url: string;
  filename?: string;
  uploadedAt?: string;
  contentType?: string;
  size?: number;
};

type ProfileResponse = {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profileImageUrl?: string;
  avatar: AssetMeta | null;
  resume: AssetMeta | null;
  // backward-compat fields used by older UI
  profileImage?: string;
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

function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function normalizeAsset(doc: any, key: "avatar" | "resume"): AssetMeta | null {
  const raw = doc?.[key];
  if (
    raw &&
    typeof raw === "object" &&
    typeof raw.url === "string" &&
    raw.url
  ) {
    return {
      url: raw.url,
      filename: typeof raw.filename === "string" ? raw.filename : undefined,
      uploadedAt: toIso(raw.uploadedAt),
      contentType:
        typeof raw.contentType === "string" ? raw.contentType : undefined,
      size: typeof raw.size === "number" ? raw.size : undefined,
    };
  }

  if (key === "avatar") {
    const fallback = doc?.profileImage || doc?.avatar;
    if (typeof fallback === "string" && fallback) return { url: fallback };
  }

  if (key === "resume") {
    const fallback = doc?.resumeUrl;
    if (typeof fallback === "string" && fallback) return { url: fallback };
  }

  return null;
}

function mapProfile(doc: any, email: string): ProfileResponse {
  const avatar = normalizeAsset(doc, "avatar");
  const resume = normalizeAsset(doc, "resume");

  return {
    id: String(doc._id),
    name: nameFromDoc(doc),
    email: doc.email || email,
    bio: doc.bio || "",
    profileImageUrl: avatar?.url || "",
    avatar,
    resume,
    profileImage: avatar?.url || "",
    resumeUrl: resume?.url || "",
  };
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
      return res.status(200).json(mapProfile(doc, email));
    }

    if (req.method === "PATCH") {
      const updateSet: Record<string, unknown> = { updatedAt: new Date() };
      const updateUnset: Record<string, ""> = {};

      if (typeof req.body?.name === "string") {
        const name = req.body.name.trim();
        if (!name) return res.status(400).json({ error: "Name is required" });
        if (payload.accountType === "business") updateSet.businessName = name;
        else updateSet.fullName = name;
      }

      if (typeof req.body?.bio === "string") {
        updateSet.bio = req.body.bio.trim();
      }

      // explicit remove contract
      // PATCH /api/profile { "removeAvatar": true }
      // PATCH /api/profile { "removeResume": true }
      if (req.body?.removeAvatar === true) {
        updateUnset.avatar = "";
        updateUnset.profileImage = "";
      }

      if (req.body?.removeResume === true) {
        updateUnset.resume = "";
        updateUnset.resumeUrl = "";
      }

      const update: Record<string, unknown> = {};
      if (Object.keys(updateSet).length) update.$set = updateSet;
      if (Object.keys(updateUnset).length) update.$unset = updateUnset;

      await col.updateOne({ _id: new ObjectId(String(doc._id)) }, update);

      const updated = await col.findOne({ _id: new ObjectId(String(doc._id)) });
      if (!updated)
        return res.status(500).json({ error: "Profile update failed" });

      return res.status(200).json(mapProfile(updated, email));
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("/api/profile error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
