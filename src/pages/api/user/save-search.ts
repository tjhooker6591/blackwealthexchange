// src/pages/api/user/save-search.ts
//
// Phase 5 -- Save Search, and the shared backing for Job Alerts,
// Scholarship Alerts, and Product Alerts. Rather than building three
// near-identical alert systems, all three are the same saved-search
// record with a `domain` ("jobs" | "scholarships" | "products" | "directory"
// | "universal") and an `alertsEnabled` flag. scripts/network-alerts-scan.mjs
// scans real new documents per domain and fires a real notification only
// when a saved search's filters actually match new data -- never fabricated.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession, isValidObjectId, s } from "@/lib/network/shared";
import { ObjectId } from "mongodb";

const ALLOWED_DOMAINS = new Set([
  "jobs",
  "scholarships",
  "products",
  "directory",
  "universal",
]);

async function ensureIndexes(db: any) {
  await db
    .collection("saved_searches")
    .createIndex({ userId: 1, createdAt: -1 })
    .catch(() => null);
  await db
    .collection("saved_searches")
    .createIndex({ domain: 1, alertsEnabled: 1 })
    .catch(() => null);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const session = getNetworkSession(req);
  if (!session) return res.status(401).json({ error: "Login required" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureIndexes(db);

  if (req.method === "GET") {
    const domain = s(req.query.domain as string);
    const filter: Record<string, unknown> = { userId: session.userId };
    if (domain) filter.domain = domain;

    const rows = await db
      .collection("saved_searches")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.status(200).json({
      searches: rows.map((row: any) => ({
        id: String(row._id),
        domain: row.domain,
        label: row.label || row.query || "",
        query: row.query || "",
        filters: row.filters || {},
        alertsEnabled: Boolean(row.alertsEnabled),
        lastAlertedAt:
          row.lastAlertedAt instanceof Date
            ? row.lastAlertedAt.toISOString()
            : row.lastAlertedAt || null,
        createdAt:
          row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : row.createdAt || null,
      })),
    });
  }

  if (req.method === "POST") {
    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const domain = s(body.domain);
    const query = s(body.query).slice(0, 200);
    const label =
      s(body.label).slice(0, 140) || query || `Saved ${domain} search`;
    const alertsEnabled = Boolean(body.alertsEnabled);
    const filters =
      body.filters && typeof body.filters === "object" ? body.filters : {};

    if (!ALLOWED_DOMAINS.has(domain)) {
      return res.status(400).json({
        error: `domain must be one of: ${Array.from(ALLOWED_DOMAINS).join(", ")}`,
      });
    }
    if (!query && !Object.keys(filters).length) {
      return res
        .status(400)
        .json({ error: "query or filters is required to save a search" });
    }

    const now = new Date();
    const result = await db.collection("saved_searches").insertOne({
      userId: session.userId,
      domain,
      label,
      query,
      filters,
      alertsEnabled,
      lastAlertedAt: null,
      createdAt: now,
    });

    return res.status(201).json({
      ok: true,
      search: {
        id: String(result.insertedId),
        domain,
        label,
        query,
        filters,
        alertsEnabled,
        createdAt: now.toISOString(),
      },
    });
  }

  if (req.method === "PATCH") {
    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const id = s(body.id);
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "A valid id is required" });
    }
    const update: Record<string, unknown> = {};
    if (typeof body.alertsEnabled === "boolean") {
      update.alertsEnabled = body.alertsEnabled;
    }
    if (!Object.keys(update).length) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    await db
      .collection("saved_searches")
      .updateOne(
        { _id: new ObjectId(id), userId: session.userId },
        { $set: update },
      );
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const id = s((req.query.id as string) || (req.body as any)?.id);
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "A valid id is required" });
    }
    await db
      .collection("saved_searches")
      .deleteOne({ _id: new ObjectId(id), userId: session.userId });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
