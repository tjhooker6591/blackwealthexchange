import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { resolvePreviewByToken } from "@/lib/acquisition/previews";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const token = String(req.query.token || "");
  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const result = await resolvePreviewByToken(db, token);

  if (!result.ok) {
    return res.status(404).json(result);
  }
  return res.status(200).json(result);
}
