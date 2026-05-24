import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import { normalizeConsultantProfile } from "@/lib/consultants/normalize";

function requireEmployer(req: NextApiRequest) {
  const parsed = cookie.parse(req.headers.cookie || "");
  const token = parsed.session_token || req.cookies?.session_token;
  if (!token) return null;
  const payload = jwt.verify(token, getJwtSecret()) as {
    accountType?: string;
  };
  if (payload.accountType !== "employer") return null;
  return payload;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const employer = requireEmployer(req);
    if (!employer) return res.status(403).json({ error: "Access denied" });

    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ error: "Missing consultant id" });

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    let doc: any = null;
    if (ObjectId.isValid(id)) {
      doc = await db
        .collection("consultant_profiles")
        .findOne({ _id: new ObjectId(id) });
    }

    let source = "consultant_profiles";
    if (!doc) {
      source = "consulting_intake:candidate";
      if (ObjectId.isValid(id)) {
        doc = await db
          .collection("consulting_intake")
          .findOne({ _id: new ObjectId(id), type: "candidate" });
      }
    }

    if (!doc) return res.status(404).json({ error: "Consultant not found" });

    const consultant = normalizeConsultantProfile(doc);
    return res.status(200).json({ ok: true, source, consultant });
  } catch (error) {
    console.error("[GET /api/employer/consultants/:id]", error);
    return res.status(500).json({ error: "Failed to load consultant" });
  }
}
