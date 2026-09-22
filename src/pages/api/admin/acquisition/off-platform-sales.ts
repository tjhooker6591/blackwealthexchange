import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  listOffPlatformSales,
  recordOffPlatformSale,
} from "@/lib/acquisition/offPlatformSales";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const businessId = String(req.query.businessId || "");
    if (!businessId) {
      return res
        .status(400)
        .json({
          ok: false,
          code: "MISSING_BUSINESS_ID",
          message: "businessId is required.",
        });
    }
    const rows = await listOffPlatformSales(db, businessId);
    return res.status(200).json({ ok: true, offPlatformSales: rows });
  }

  if (req.method === "POST") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const result = await recordOffPlatformSale(db, {
      businessId: body.businessId,
      attesterId: body.attesterId || admin.userId || "",
      attesterEmail: body.attesterEmail || admin.email || "",
      date: body.date,
      amountCents: Number(body.amountCents),
      evidenceRef: body.evidenceRef,
      attributionExplanation: body.attributionExplanation,
    });
    if (!result.ok) return res.status(400).json(result);
    return res.status(201).json({ ok: true, attestation: result.attestation });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
