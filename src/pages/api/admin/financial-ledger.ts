import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";
import {
  adminSafeLedgerProjection,
  isFinancialLedgerEnabled,
  redactStripeId,
} from "@/lib/finance/ledger";

function nowIsoKey() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
    const skip = (page - 1) * limit;
    const stream = String(
      req.query.revenueStream || req.query.stream || "",
    ).trim();
    const status = String(
      req.query.paymentStatus || req.query.status || "",
    ).trim();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    const filter: any = {};
    if (!isFinancialLedgerEnabled()) {
      return res
        .status(200)
        .json({ page, limit, total: 0, rows: [], enabled: false });
    }

    if (stream) filter.revenueStream = stream;
    if (status) filter.paymentStatus = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const db = (await clientPromise).db(getMongoDbName());
    const col = db.collection("financial_ledger");
    const [total, rows] = await Promise.all([
      col.countDocuments(filter),
      col
        .find(filter, { projection: adminSafeLedgerProjection() })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    const safeRows = rows.map((r: any) => ({
      ...r,
      stripeSessionId: redactStripeId(r.stripeSessionId),
      stripePaymentIntentId: redactStripeId(r.stripePaymentIntentId),
    }));

    return res
      .status(200)
      .json({ page, limit, total, rows: safeRows, enabled: true });
  }

  if (req.method === "POST") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const sourceType = String(body.sourceType || "manual");
    const revenueStream = String(body.revenueStream || "");
    const grossAmount = Number(body.grossAmount || 0);
    if (!revenueStream || !Number.isFinite(grossAmount) || grossAmount <= 0) {
      return res
        .status(400)
        .json({ error: "revenueStream and grossAmount are required" });
    }

    const createdAt = body.paymentDate
      ? new Date(body.paymentDate)
      : new Date();
    const txn = {
      transactionId: `manual-${nowIsoKey()}`,
      stripeSessionId: null,
      stripePaymentIntentId: null,
      revenueStream,
      sourceType,
      grossAmount,
      bweFeeAmount: Number(body.bweFeeAmount ?? grossAmount),
      netBweRevenue: Number(
        body.netBweRevenue ?? body.bweFeeAmount ?? grossAmount,
      ),
      payoutAmount: Number(body.payoutAmount || 0),
      sellerPayoutAmount: Number(body.payoutAmount || 0),
      paymentStatus: String(body.paymentStatus || "paid"),
      fulfillmentStatus: String(body.fulfillmentStatus || "not_applicable"),
      payoutStatus: String(body.payoutStatus || "not_applicable"),
      refundStatus: String(body.refundStatus || "none"),
      disputeStatus: String(body.disputeStatus || "none"),
      sourceRoute: "/api/admin/financial-ledger",
      actorType: "admin",
      createdBy: admin.email || admin.userId || "admin",
      immutableOriginalAmount: grossAmount,
      notes: String(body.notes || ""),
      metadata: {
        customerName: String(body.customerName || ""),
        businessName: String(body.businessName || ""),
        paymentMethod: String(body.paymentMethod || ""),
      },
      createdAt,
      updatedAt: new Date(),
    };

    const db = (await clientPromise).db(getMongoDbName());
    await db.collection("financial_ledger").insertOne(txn);
    return res.status(201).json({ ok: true, transactionId: txn.transactionId });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
