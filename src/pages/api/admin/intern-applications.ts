import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import cookie from "cookie";

function getSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing JWT secret (JWT_SECRET or NEXTAUTH_SECRET).");
  }
  return secret;
}

function requireAdmin(req: NextApiRequest) {
  const raw = req.headers.cookie || "";
  const cookies = cookie.parse(raw);
  const token = cookies.session_token;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getSecret()) as any;
    return payload?.isAdmin ? payload : null;
  } catch (err) {
    console.error("[intern-applications] JWT verify failed:", err);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const admin = requireAdmin(req);
  if (!admin) return res.status(401).json({ error: "Admin only" });

  const client = await clientPromise;
  const db = client.db("bwes-cluster");
  const col = db.collection("intern_applications");

  // ✅ GET: return array only
  if (req.method === "GET") {
    const data = await col.find().sort({ createdAt: -1 }).toArray();

    // Optional: normalize _id to string if you want:
    const normalized = data.map((d: any) => ({
      ...d,
      _id: d._id?.toString?.() ?? d._id,
    }));

    return res.status(200).json(normalized);
  }

  // ✅ PATCH: validate + safe ObjectId
  if (req.method === "PATCH") {
    const { id, status } = req.body as { id?: string; status?: string };

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing id." });
    }

    if (!status || typeof status !== "string") {
      return res.status(400).json({ error: "Missing status." });
    }

    const allowed = ["new", "reviewed", "contacted", "accepted", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return res.status(400).json({ error: "Invalid id format." });
    }

    const result = await col.updateOne({ _id: objectId }, { $set: { status } });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Application not found." });
    }

    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}

