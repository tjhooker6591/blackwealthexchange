// src/lib/acquisition/campaigns.ts
//
// Section 4 of the brief: buyer acquisition campaign references. Every
// pilot must have an explicit buyer-distribution activity, recorded here
// (channel, audience, destination, dates, cost, operator) -- not just an
// upgraded listing. campaignId is the allowlisted short code events.ts
// requires before it will accept a campaign-attributed event.

import { ObjectId, type Db } from "mongodb";
import { COLLECTIONS, nowIso, resolveCanonicalBusiness, s } from "./shared";
import type { AcquisitionCampaign } from "./types";

function toStringId(id: unknown) {
  if (id instanceof ObjectId) return id.toString();
  return String(id);
}

export type CreateCampaignInput = {
  campaignId: string;
  businessId: string;
  channel: string;
  audience: string;
  destination: string;
  startDate: string;
  endDate?: string | null;
  costCents?: number;
  operator: string;
};

export async function createCampaign(
  db: Db,
  input: CreateCampaignInput,
): Promise<
  | { ok: true; campaign: AcquisitionCampaign }
  | { ok: false; code: string; message: string }
> {
  const campaignId = s(input.campaignId);
  if (!campaignId) {
    return {
      ok: false,
      code: "MISSING_CAMPAIGN_ID",
      message: "campaignId is required.",
    };
  }
  const canonical = await resolveCanonicalBusiness(db, input.businessId);
  if (!canonical) {
    return {
      ok: false,
      code: "BUSINESS_NOT_FOUND",
      message: "No canonical business matches this businessId.",
    };
  }
  const existing = await db
    .collection(COLLECTIONS.campaigns)
    .findOne({ campaignId });
  if (existing) {
    return {
      ok: false,
      code: "CAMPAIGN_ID_TAKEN",
      message: "campaignId must be unique.",
    };
  }

  const doc: AcquisitionCampaign = {
    campaignId,
    businessId: canonical.businessId,
    channel: s(input.channel),
    audience: s(input.audience),
    destination: s(input.destination),
    startDate: s(input.startDate) || nowIso(),
    endDate: s(input.endDate || "") || null,
    costCents: Number.isFinite(Number(input.costCents))
      ? Math.max(0, Math.round(Number(input.costCents)))
      : 0,
    operator: s(input.operator),
    createdAt: nowIso(),
  };
  const result = await db
    .collection(COLLECTIONS.campaigns)
    .insertOne(doc as any);
  return { ok: true, campaign: { ...doc, _id: toStringId(result.insertedId) } };
}

/** The allowlist events.ts checks before accepting a campaignId on an
 * inbound event -- prevents arbitrary/forged campaign attribution. */
export async function isAllowlistedCampaignId(
  db: Db,
  campaignId: string,
): Promise<boolean> {
  if (!campaignId) return false;
  const doc = await db
    .collection(COLLECTIONS.campaigns)
    .findOne({ campaignId }, { projection: { _id: 1 } });
  return Boolean(doc);
}

export async function listCampaignsForBusiness(db: Db, businessId: string) {
  const rows = await db
    .collection(COLLECTIONS.campaigns)
    .find({ businessId: s(businessId) })
    .sort({ createdAt: -1 })
    .toArray();
  return rows.map((r: any) => ({ ...r, _id: toStringId(r._id) }));
}
