// src/pages/api/admin/service-engagements.ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). One combined,
// admin-only listing across recruiting_engagements and
// consulting_engagements, tagged by type -- satisfies "one practical
// admin experience for both service types" without building two
// disconnected admin surfaces or a duplicate accounting system.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const [recruiting, consulting] = await Promise.all([
    db
      .collection("recruiting_engagements")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
    db
      .collection("consulting_engagements")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
  ]);

  const rows = [
    ...recruiting.map((r: any) => ({
      type: "recruiting" as const,
      id: String(r._id),
      customer: r.employerCompany || r.contactName || "—",
      request: r.role || "—",
      status: r.status,
      agreedAmountCents: r.agreedFeeCents ?? null,
      paymentStatus: r.paymentStatus,
      createdAt: r.createdAt,
    })),
    ...consulting.map((c: any) => ({
      type: "consulting" as const,
      id: String(c._id),
      customer: c.clientCompany || c.contactName || "—",
      request: c.serviceTitle || "—",
      status: c.status,
      agreedAmountCents: c.agreedAmountCents ?? null,
      paymentStatus: c.paymentStatus,
      createdAt: c.createdAt,
    })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime(),
  );

  return res.status(200).json({ ok: true, rows });
}
