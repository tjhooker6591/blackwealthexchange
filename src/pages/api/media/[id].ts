import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

// Serves images uploaded through the site (stored in media_files, see
// api/business/media). The id may carry a file extension, e.g. <id>.jpg.
// A stored image never changes, so it can be cached for good.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).end();
  }

  const raw = String(req.query.id || "").replace(/\.(jpg|png|webp)$/i, "");
  if (!ObjectId.isValid(raw)) return res.status(404).end();

  const client = await clientPromise;
  const doc = await client
    .db(getMongoDbName())
    .collection("media_files")
    .findOne(
      { _id: new ObjectId(raw) },
      { projection: { data: 1, contentType: 1 } },
    );
  if (!doc?.data) return res.status(404).end();

  const body: Buffer = Buffer.isBuffer(doc.data)
    ? doc.data
    : Buffer.from(doc.data.buffer);
  res.setHeader("Content-Type", String(doc.contentType || "image/jpeg"));
  res.setHeader("Content-Length", String(body.length));
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method === "HEAD") return res.status(200).end();
  return res.status(200).send(body);
}
