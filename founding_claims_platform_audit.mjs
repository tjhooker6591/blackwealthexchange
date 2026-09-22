import { MongoClient } from "mongodb";
import fs from "node:fs";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#")) continue;
  const idx = line.indexOf("=");
  if (idx === -1) continue;
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1);
  if (!(key in process.env)) process.env[key] = value;
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
if (!uri) throw new Error("Missing MONGODB_URI");

function norm(value) {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return null;
  if (["claim_pending"].includes(s)) return "claim_initiated";
  if (["pending_review", "ownership_review_pending", "verification_pending"].includes(s)) return "ownership_verification_pending";
  if (["approved", "ownership_approved"].includes(s)) return "ownership_verified";
  if (["rejected", "ownership_rejected"].includes(s)) return "ownership_verification_failed";
  return s;
}

function paymentStatus(row) {
  const status = String(row?.status || "").trim().toLowerCase();
  const ps = String(row?.paymentStatus || "").trim().toLowerCase();
  if (ps === "paid" || status === "paid" || row?.paid === true || row?.paidAt) return "paid";
  return ps || status || "pending";
}

function formatUsd(cents) {
  const n = Number(cents || 0);
  return Number.isFinite(n) ? `$${(n / 100).toFixed(2)} USD` : "$0.00 USD";
}

function classify(row) {
  const issues = [];
  if (!row.claim) issues.push("missing_claim_record");
  if (!row.review) issues.push("missing_review_record");
  if (!row.business) issues.push("missing_business_record");
  if (!row.payment || row.paymentStatus !== "paid") issues.push("payment_inconsistency");
  if (row.duplicateClaims > 1) issues.push("duplicate_claim");
  if (row.conflictingClaimant) issues.push("conflicting_claimant");
  if (row.legacyStatus) issues.push("legacy_status_requiring_normalization");
  if (row.queueState === "ownership_verified") {
    if (
      row.claimStatus !== "ownership_verified" ||
      row.reviewStatus !== "ownership_verified" ||
      row.claimStage !== "ownership_verified" ||
      row.publicListingStatus !== "ownership_verified" ||
      row.managementAccessStatus !== "approved" ||
      row.ownershipAccessStatus !== "approved" ||
      row.fulfillmentStatus !== "active" ||
      row.evidencePortalStatus !== "complete"
    ) {
      issues.push("conflicting_state");
    }
  }
  if (!issues.length && row.queueState === "ownership_verified") return { classification: "consistent_verified", issues };
  if (!issues.length && ["ownership_verification_pending", "additional_evidence_required", "disputed"].includes(row.queueState || "")) {
    return { classification: "consistent_pending_verification", issues };
  }
  if (issues.includes("missing_claim_record") || issues.includes("missing_review_record") || issues.includes("missing_business_record")) {
    return { classification: "missing_linked_record", issues };
  }
  if (issues.includes("duplicate_claim")) return { classification: "duplicate_claim", issues };
  if (issues.includes("conflicting_claimant")) return { classification: "conflicting_claimant", issues };
  if (issues.includes("payment_inconsistency")) return { classification: "payment_inconsistency", issues };
  if (issues.includes("conflicting_state")) return { classification: "conflicting_state", issues };
  return { classification: "legacy_status_requiring_normalization", issues };
}

const client = new MongoClient(uri, { readPreference: "primaryPreferred" });

try {
  await client.connect();
  const db = client.db(dbName);
  const [memberships, claims, reviews, fulfillment, onboarding, businesses, users, payments] = await Promise.all([
    db.collection("business_memberships").find({ productKey: "founding_verified_business_growth_membership" }).toArray(),
    db.collection("business_claims").find({ productKey: "founding_verified_business_growth_membership" }).toArray(),
    db.collection("ownership_reviews").find({ sourceMembershipId: /^founding_verified_business_growth_membership:/ }).toArray(),
    db.collection("membership_fulfillment").find({ membershipId: /^founding_verified_business_growth_membership:/ }).toArray(),
    db.collection("membership_onboarding").find({ membershipId: /^founding_verified_business_growth_membership:/ }).toArray(),
    db.collection("businesses").find({ foundingMembershipId: /^founding_verified_business_growth_membership:/ }).toArray(),
    db.collection("users").find({ foundingMembershipId: /^founding_verified_business_growth_membership:/ }).toArray(),
    db.collection("payments").find({ $or: [{ itemId: "founding-verified-business-growth-membership" }, { "metadata.productKey": "founding_verified_business_growth_membership" }] }).toArray(),
  ]);

  const byMembershipId = new Set();
  memberships.forEach((x) => x?.membershipId && byMembershipId.add(String(x.membershipId)));
  claims.forEach((x) => x?.membershipId && byMembershipId.add(String(x.membershipId)));
  reviews.forEach((x) => x?.sourceMembershipId && byMembershipId.add(String(x.sourceMembershipId)));
  businesses.forEach((x) => x?.foundingMembershipId && byMembershipId.add(String(x.foundingMembershipId)));
  users.forEach((x) => x?.foundingMembershipId && byMembershipId.add(String(x.foundingMembershipId)));

  const rows = [];
  for (const membershipId of byMembershipId) {
    const membership = memberships.find((x) => String(x?.membershipId || "") === membershipId) || null;
    const matchingClaims = claims.filter((x) => String(x?.membershipId || "") === membershipId);
    const claim = matchingClaims[0] || null;
    const review = reviews.find((x) => String(x?.sourceMembershipId || "") === membershipId) || null;
    const business = businesses.find((x) => String(x?.foundingMembershipId || "") === membershipId) || null;
    const fulfill = fulfillment.find((x) => String(x?.membershipId || "") === membershipId) || null;
    const onboard = onboarding.find((x) => String(x?.membershipId || "") === membershipId) || null;
    const user = users.find((x) => String(x?.foundingMembershipId || "") === membershipId) || null;
    const relatedPayments = payments.filter((x) => {
      const businessId = String(membership?.businessId || claim?.businessId || business?._id || "");
      const email = String(membership?.email || claim?.email || user?.email || "").toLowerCase();
      return String(x?.membershipId || "") === membershipId || String(x?.metadata?.businessId || x?.businessId || "") === businessId || String(x?.email || x?.customerEmail || x?.userEmail || "").toLowerCase() === email;
    });
    const paidPayment = relatedPayments.find((x) => paymentStatus(x) === "paid") || relatedPayments[0] || null;
    const queueState = norm(review?.reviewStatus || claim?.ownershipReviewStatus || claim?.claimStatus || membership?.ownershipReviewStatus || business?.claimStage || business?.publicListingStatus);
    const legacyStatus = [review?.reviewStatus, claim?.ownershipReviewStatus, claim?.claimStatus, business?.claimStage, business?.publicListingStatus].some((v) => v && norm(v) !== String(v).trim().toLowerCase());
    const conflictingClaimant = Boolean(
      business?.claimedByUserId && membership?.userId && String(business.claimedByUserId) !== String(membership.userId)
    );
    const row = {
      membershipId,
      businessId: String(membership?.businessId || claim?.businessId || business?._id || user?.claimedBusinessId || "") || null,
      businessName: String(business?.business_name || business?.name || claim?.businessName || "") || null,
      userId: String(membership?.userId || claim?.userId || review?.userId || user?._id || "") || null,
      email: String(membership?.email || claim?.email || review?.email || user?.email || "") || null,
      membershipStatus: membership?.membershipStatus || null,
      claimStatus: norm(claim?.claimStatus),
      reviewStatus: norm(review?.reviewStatus || claim?.ownershipReviewStatus || membership?.ownershipReviewStatus),
      claimStage: norm(business?.claimStage),
      publicListingStatus: norm(business?.publicListingStatus),
      managementAccessStatus: String(membership?.managementAccessStatus || "") || null,
      ownershipAccessStatus: String(fulfill?.ownershipAccessStatus || "") || null,
      fulfillmentStatus: String(fulfill?.fulfillmentStatus || "") || null,
      evidencePortalStatus: String(onboard?.evidencePortalStatus || "") || null,
      paymentStatus: paymentStatus(paidPayment || membership),
      paymentAmountCents: Number(paidPayment?.amountCents || paidPayment?.grossAmountCents || membership?.paymentAmountCents || membership?.amountCents || 0),
      paymentDisplayAmount: formatUsd(paidPayment?.amountCents || paidPayment?.grossAmountCents || membership?.paymentAmountCents || membership?.amountCents || 0),
      queueState,
      duplicateClaims: matchingClaims.length,
      conflictingClaimant,
      legacyStatus,
      claim,
      review,
      business,
      payment: paidPayment,
    };
    rows.push({ ...row, ...classify(row) });
  }

  const summary = rows.reduce((acc, row) => {
    acc.total += 1;
    acc.byClassification[row.classification] = (acc.byClassification[row.classification] || 0) + 1;
    return acc;
  }, { total: 0, byClassification: {} });

  console.log(JSON.stringify({ summary, rows }, null, 2));
} finally {
  await client.close();
}
