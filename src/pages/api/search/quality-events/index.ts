import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }
  const b: any =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const doc = {
    query: String(b.query || "").slice(0, 240),
    resultCount: Number(b.resultCount || 0),
    selectedBusinessId: b.selectedBusinessId
      ? String(b.selectedBusinessId)
      : null,
    filters: b.filters || null,
    createdAt: new Date(),
  };
  const db = (await clientPromise).db(getMongoDbName());
  await db.collection("search_quality_events").insertOne(doc);
  return res.status(201).json({ ok: true });
}
