import { ObjectId, type Db } from "mongodb";

export const FOUNDING_MEMBERSHIP_ITEM_ID =
  "founding-verified-business-growth-membership";
export const FOUNDING_MEMBERSHIP_PRODUCT_KEY =
  "founding_verified_business_growth_membership";
export const FOUNDING_MEMBERSHIP_NAME =
  "Founding Verified Business Growth Membership";
export const FOUNDING_MEMBERSHIP_PRICE_CENTS = 4900;
export const FOUNDING_MEMBERSHIP_CURRENCY = "usd";
export const FOUNDING_MEMBERSHIP_PILOT_LIMIT = 10;

export type FoundingMembershipStatus = "active" | "past_due" | "cancelled";

export type FoundingClaimStatus =
  | "claim_initiated"
  | "ownership_review_pending"
  | "additional_evidence_required"
  | "ownership_approved"
  | "ownership_rejected";

function stringOrNull(v: unknown) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function isFoundingMembershipItemId(itemId: string) {
  return itemId.trim().toLowerCase() === FOUNDING_MEMBERSHIP_ITEM_ID;
}

export function isFoundingMembershipProductKey(productKey: string) {
  return productKey.trim().toLowerCase() === FOUNDING_MEMBERSHIP_PRODUCT_KEY;
}

export async function countActiveFoundingMemberships(db: Db) {
  return db.collection("business_memberships").countDocuments({
    productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
    membershipStatus: "active",
  });
}

export async function getClaimablePublicBusinesses(db: Db, limit = 25) {
  const rows = await db
    .collection("businesses")
    .find(
      {
        $and: [
          {
            $or: [
              { status: "approved" },
              { status: "verified" },
              { status: "active" },
            ],
          },
          {
            $or: [
              { alias: { $exists: true, $type: "string", $ne: "" } },
              { slug: { $exists: true, $type: "string", $ne: "" } },
            ],
          },
          {
            $or: [
              { directoryVisibilityApproved: true },
              { isComplete: true },
              { completenessScore: { $gte: 70 } },
              { qualityScore: { $gte: 70 } },
            ],
          },
          {
            $nor: [
              { isTest: true },
              { auditTag: { $exists: true } },
              { email: /@local\.test$/i },
            ],
          },
        ],
      },
      {
        projection: {
          _id: 1,
          business_name: 1,
          name: 1,
          alias: 1,
          slug: 1,
          category: 1,
          categories: 1,
          display_categories: 1,
          city: 1,
          state: 1,
          address: 1,
          website: 1,
          phone: 1,
          description: 1,
          status: 1,
          claimStage: 1,
          trustStatus: 1,
          isVerified: 1,
          verified: 1,
        },
      },
    )
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .toArray();

  return rows.map((row: any) => {
    const publicStatus =
      String(row.status || row.trustStatus || "")
        .trim()
        .toLowerCase() || "public";
    const currentClaimState =
      String(row.claimStage || "")
        .trim()
        .toLowerCase() || null;
    const alreadyVerified =
      row.verified === true ||
      row.isVerified === true ||
      publicStatus === "verified";
    const unavailableReason = alreadyVerified
      ? "already_verified"
      : currentClaimState === "claim_initiated"
        ? "claim_already_initiated"
        : currentClaimState === "ownership_review_pending"
          ? "ownership_review_pending"
          : currentClaimState === "founding_growth_member"
            ? "membership_already_active"
            : null;

    return {
      id: String(row._id),
      businessName: String(row.business_name || row.name || "").trim(),
      slug: String(row.alias || row.slug || row._id),
      category: String(
        row.display_categories || row.category || row.categories || "",
      ).trim(),
      city: String(row.city || "").trim(),
      state: String(row.state || "").trim(),
      address: String(row.address || "").trim(),
      website: stringOrNull(row.website),
      phone: stringOrNull(row.phone),
      description: String(row.description || "").trim(),
      publicStatus,
      claimable: unavailableReason == null,
      currentClaimState,
      unavailableReason,
    };
  });
}

export async function getClaimableBusinessById(db: Db, businessId: string) {
  if (!ObjectId.isValid(businessId)) return null;
  const row = await db.collection("businesses").findOne(
    { _id: new ObjectId(businessId) },
    {
      projection: {
        _id: 1,
        business_name: 1,
        name: 1,
        alias: 1,
        slug: 1,
        category: 1,
        categories: 1,
        display_categories: 1,
        city: 1,
        state: 1,
        address: 1,
        website: 1,
        phone: 1,
        description: 1,
        status: 1,
        directoryVisibilityApproved: 1,
        isComplete: 1,
        completenessScore: 1,
        qualityScore: 1,
      },
    },
  );
  if (!row) return null;

  const status = String((row as any).status || "").toLowerCase();
  const publicish =
    status === "approved" || status === "verified" || status === "active";
  const claimable =
    publicish &&
    (Boolean((row as any).directoryVisibilityApproved) ||
      Boolean((row as any).isComplete) ||
      Number((row as any).completenessScore || 0) >= 70 ||
      Number((row as any).qualityScore || 0) >= 70);

  if (!claimable) return null;

  return {
    id: String((row as any)._id),
    businessName: String(
      (row as any).business_name || (row as any).name || "",
    ).trim(),
    slug: String((row as any).alias || (row as any).slug || (row as any)._id),
    category: String(
      (row as any).display_categories ||
        (row as any).category ||
        (row as any).categories ||
        "",
    ).trim(),
    city: String((row as any).city || "").trim(),
    state: String((row as any).state || "").trim(),
    address: String((row as any).address || "").trim(),
    website: stringOrNull((row as any).website),
    phone: stringOrNull((row as any).phone),
    description: String((row as any).description || "").trim(),
  };
}
