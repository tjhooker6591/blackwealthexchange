import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  FOUNDING_MEMBERSHIP_NAME,
  FOUNDING_MEMBERSHIP_PILOT_LIMIT,
  FOUNDING_MEMBERSHIP_PRICE_CENTS,
  getClaimablePublicBusinesses,
  countActiveFoundingMemberships,
  getClaimableBusinessById,
} from "@/lib/founding-membership";
import { checkOrganizationClaimable } from "@/lib/organizationFoundingMembership";

const UNAVAILABLE_BY_CODE: Record<string, string> = {
  FOUNDING_MEMBERSHIP_ORGANIZATION_ALREADY_CLAIMED: "already_verified",
  FOUNDING_MEMBERSHIP_ALREADY_ACTIVE: "membership_already_active",
};

// One claim page for every listing: the listing someone clicked "Claim" on
// is returned with the list, whether it is a business or an organization
// (church), instead of only the first few claimable businesses.
async function selectedListing(db: any, id: string) {
  if (!id) return null;
  const business = await getClaimableBusinessById(db, id);
  if (business) {
    return {
      ...business,
      entityType: "business",
      publicStatus: "public",
      claimable: true,
      currentClaimState: null,
      unavailableReason: null,
    };
  }
  const check = await checkOrganizationClaimable(db, id);
  const org: any = check.ok
    ? check.organization
    : await db.collection("organizations").findOne({
        _id: id.length === 24 ? new (await import("mongodb")).ObjectId(id) : id,
      });
  if (!org) return null;
  return {
    id: String(org._id),
    entityType: "organization",
    businessName: String(org.name || "").trim(),
    slug: String(org._id),
    category: String(org.denomination || org.orgType || "").trim(),
    city: String(org.city || "").trim(),
    state: String(org.state || "").trim(),
    address: String(org.address || "").trim(),
    website: org.website || null,
    phone: org.phone || null,
    description: String(org.description || "").trim(),
    publicStatus: "public",
    claimable: check.ok,
    currentClaimState: null,
    unavailableReason: check.ok
      ? null
      : UNAVAILABLE_BY_CODE[check.code] || "unavailable",
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const requestedId = String(
      req.query.businessId ||
        req.query.organizationId ||
        req.query.listingId ||
        "",
    ).trim();
    const [list, activeCount, selected] = await Promise.all([
      getClaimablePublicBusinesses(db, 40),
      countActiveFoundingMemberships(db),
      selectedListing(db, requestedId).catch(() => null),
    ]);
    const businesses = selected
      ? [selected, ...list.filter((b: any) => b.id !== selected.id)]
      : list;

    const remainingSlots = Math.max(
      0,
      FOUNDING_MEMBERSHIP_PILOT_LIMIT - activeCount,
    );

    return res.status(200).json({
      ok: true,
      offer: {
        name: FOUNDING_MEMBERSHIP_NAME,
        amountCents: FOUNDING_MEMBERSHIP_PRICE_CENTS,
        currency: "usd",
        billing: "monthly",
        pilotLimit: FOUNDING_MEMBERSHIP_PILOT_LIMIT,
        activeCount,
        remainingSlots,
      },
      businesses,
    });
  } catch (error) {
    console.error("[founding-membership/options]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
