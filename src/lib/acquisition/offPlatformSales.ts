// src/lib/acquisition/offPlatformSales.ts
//
// Owner-confirmed off-platform sales: a separate ledger, per the brief --
// "Do not add these to BWE checkout totals." reports.ts reads this
// collection only as its own distinct line item, never merged into
// merchant/BWE revenue sums.

import { ObjectId, type Db } from "mongodb";
import { COLLECTIONS, nowIso, resolveCanonicalBusiness, s } from "./shared";
import type { OffPlatformSaleAttestation } from "./types";

function toStringId(id: unknown) {
  if (id instanceof ObjectId) return id.toString();
  return String(id);
}

export type RecordOffPlatformSaleInput = {
  businessId: string;
  attesterId: string;
  attesterEmail: string;
  date: string;
  amountCents: number;
  evidenceRef: string;
  attributionExplanation: string;
};

export async function recordOffPlatformSale(
  db: Db,
  input: RecordOffPlatformSaleInput,
): Promise<
  | { ok: true; attestation: OffPlatformSaleAttestation }
  | { ok: false; code: string; message: string }
> {
  const canonical = await resolveCanonicalBusiness(db, input.businessId);
  if (!canonical) {
    return {
      ok: false,
      code: "BUSINESS_NOT_FOUND",
      message: "No canonical business matches this businessId.",
    };
  }
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    return {
      ok: false,
      code: "INVALID_AMOUNT",
      message: "amountCents must be a positive number.",
    };
  }
  if (!s(input.evidenceRef)) {
    return {
      ok: false,
      code: "EVIDENCE_REQUIRED",
      message: "An evidence reference is required.",
    };
  }

  const doc: OffPlatformSaleAttestation = {
    businessId: canonical.businessId,
    attesterId: input.attesterId,
    attesterEmail: input.attesterEmail,
    date: s(input.date) || nowIso(),
    amountCents: Math.round(input.amountCents),
    evidenceRef: s(input.evidenceRef),
    attributionExplanation: s(input.attributionExplanation),
    createdAt: nowIso(),
  };
  const result = await db
    .collection(COLLECTIONS.offPlatformSales)
    .insertOne(doc as any);
  return {
    ok: true,
    attestation: { ...doc, _id: toStringId(result.insertedId) },
  };
}

export async function listOffPlatformSales(db: Db, businessId: string) {
  const rows = await db
    .collection(COLLECTIONS.offPlatformSales)
    .find({ businessId: s(businessId) })
    .sort({ date: -1 })
    .toArray();
  return rows.map((r: any) => ({ ...r, _id: toStringId(r._id) }));
}
