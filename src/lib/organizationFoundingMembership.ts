// src/lib/organizationFoundingMembership.ts
//
// The Founding membership is one product, one price and one checkout for
// businesses and organizations (churches) alike. This file holds the parts
// that differ for an organization:
//   - checkout: is this organization claimable?
//   - webhook: record the paid membership and open an organization claim for
//     admin review (Admin > Organization claims), instead of the business
//     ownership review.
// Membership records live in the same business_memberships collection
// (entityType "organization"), so reporting, renewals and cancellations
// treat both the same way.

import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import {
  FOUNDING_MEMBERSHIP_ITEM_ID,
  FOUNDING_MEMBERSHIP_NAME,
  FOUNDING_MEMBERSHIP_PRICE_CENTS,
  FOUNDING_MEMBERSHIP_PRODUCT_KEY,
} from "@/lib/founding-membership";
import { ENTITY_CLAIM_PENDING } from "@/lib/entityClaims";
import { sendEmail } from "@/lib/sendEmail";

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function idFilter(id: string) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id
    ? { _id: new ObjectId(id) }
    : { _id: id as any };
}

export function organizationMembershipId(organizationId: string) {
  return `${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:organization:${organizationId}`;
}

export type OrganizationClaimCheck =
  | { ok: true; organization: Record<string, any> }
  | { ok: false; status: number; code: string; error: string };

export async function checkOrganizationClaimable(
  db: Db,
  organizationId: string,
): Promise<OrganizationClaimCheck> {
  const id = s(organizationId);
  if (!id)
    return {
      ok: false,
      status: 400,
      code: "FOUNDING_MEMBERSHIP_ORGANIZATION_REQUIRED",
      error: "An organization must be selected first",
    };
  const organization = await db
    .collection("organizations")
    .findOne(idFilter(id));
  if (
    !organization ||
    !["approved", "verified", "active"].includes(
      s(organization.status).toLowerCase(),
    )
  ) {
    return {
      ok: false,
      status: 404,
      code: "FOUNDING_MEMBERSHIP_ORGANIZATION_NOT_CLAIMABLE",
      error: "This organization is not publicly listed",
    };
  }
  const owned = await db.collection("entity_ownerships").findOne({
    entityType: "organization",
    entityId: String(organization._id),
    status: "active",
    revokedAt: null,
  });
  if (owned)
    return {
      ok: false,
      status: 409,
      code: "FOUNDING_MEMBERSHIP_ORGANIZATION_ALREADY_CLAIMED",
      error: "This organization already has a verified owner",
    };
  const membership = await db.collection("business_memberships").findOne({
    membershipId: organizationMembershipId(String(organization._id)),
    membershipStatus: { $in: ["active", "past_due"] },
  });
  if (membership)
    return {
      ok: false,
      status: 409,
      code: "FOUNDING_MEMBERSHIP_ALREADY_ACTIVE",
      error:
        "This organization already has an active or pending paid founding membership",
    };
  return { ok: true, organization };
}

export async function recordOrganizationFoundingPurchase(
  db: Db,
  args: {
    organizationId: string;
    userId: string;
    email: string | null;
    claimantName?: string;
    claimantRole?: string;
    claimantPhone?: string;
    stripeSessionId: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    paymentIntentId: string | null;
    amountCents: number | null;
    currency: string | null;
    liveMode: boolean;
    paidAt: Date;
    now: Date;
  },
) {
  const organizationId = s(args.organizationId);
  const membershipId = organizationMembershipId(organizationId);

  // Stripe can deliver the same event more than once: record it once and
  // never send the claim emails twice.
  const alreadyRecorded = await db.collection("entity_claims").findOne({
    entityType: "organization",
    entityId: organizationId,
    stripeSessionId: args.stripeSessionId,
    paymentStatus: "paid",
  });
  if (alreadyRecorded) return { membershipId, duplicate: true };
  const organization = await db
    .collection("organizations")
    .findOne(idFilter(organizationId));
  const orgName = s(organization?.name) || "your organization";
  const esc = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const amountCents = args.amountCents || FOUNDING_MEMBERSHIP_PRICE_CENTS;

  await db.collection("business_memberships").updateOne(
    { membershipId },
    {
      $setOnInsert: { membershipId, createdAt: args.paidAt },
      $set: {
        productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
        membershipName: FOUNDING_MEMBERSHIP_NAME,
        membershipStatus: "active",
        billingInterval: "monthly",
        amountCents,
        currency: args.currency || "usd",
        entityType: "organization",
        organizationId,
        organizationName: orgName,
        businessId: null,
        userId: args.userId,
        email: args.email,
        stripeSessionId: args.stripeSessionId,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePaymentIntentId: args.paymentIntentId,
        ownershipReviewStatus: "ownership_review_pending",
        claimLocked: true,
        activatedAt: args.paidAt,
        updatedAt: args.now,
      },
    },
    { upsert: true },
  );

  const claimantDetails = {
    claimantName: s(args.claimantName) || null,
    claimantRole: s(args.claimantRole) || null,
    claimantPhone: s(args.claimantPhone) || null,
  };
  await db.collection("entity_claims").updateOne(
    {
      entityType: "organization",
      entityId: organizationId,
      claimantUserId: args.userId,
      productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
    },
    {
      $setOnInsert: {
        entityType: "organization",
        entityId: organizationId,
        claimantUserId: args.userId,
        productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
        claimStatus: ENTITY_CLAIM_PENDING,
        verificationStatus: ENTITY_CLAIM_PENDING,
        submittedAt: args.paidAt,
        verifiedAt: null,
        failedAt: null,
        verifyingAdministratorId: null,
        requestMoreEvidenceState: false,
        evidenceReferences: [],
        disputeState: null,
        revocationState: null,
        ownershipTransferHistory: [],
        statusChangeReason: null,
        verificationReviewId: null,
        createdAt: args.now,
      },
      $set: {
        claimantEmail: args.email,
        ...claimantDetails,
        membershipId,
        paymentStatus: "paid",
        paidAt: args.paidAt,
        amountCents,
        stripeSessionId: args.stripeSessionId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        updatedAt: args.now,
      },
      $push: {
        auditHistory: {
          action: "paid_founding_membership",
          actorUserId: args.userId,
          actorEmail: args.email,
          timestamp: args.now,
          stripeSessionId: args.stripeSessionId,
        },
      } as any,
    },
    { upsert: true },
  );

  await db.collection("payments").updateOne(
    { stripeSessionId: args.stripeSessionId },
    {
      $set: {
        membershipId,
        membershipName: FOUNDING_MEMBERSHIP_NAME,
        entityType: "organization",
        organizationId,
        userId: args.userId,
        testMode: !args.liveMode,
        liveMode: args.liveMode,
        productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
        itemId: FOUNDING_MEMBERSHIP_ITEM_ID,
        paymentStatus: "paid",
        status: "paid",
        updatedAt: args.now,
      },
    },
  );

  await db.collection("organizations").updateOne(idFilter(organizationId), {
    $set: {
      claimStage: "ownership_review_pending",
      pendingClaimUserId: args.userId,
      pendingClaimMembershipId: membershipId,
      updatedAt: args.now,
    },
  });

  // Notify the claimant and the site owner. Email trouble never fails the webhook.
  const owner = s(process.env.SMTP_FROM);
  const tasks: Promise<unknown>[] = [];
  if (args.email) {
    tasks.push(
      sendEmail({
        to: args.email,
        subject: `We received your claim for ${orgName}`,
        text: `Thank you for claiming ${orgName} on Black Wealth Exchange.\n\nYour Founding membership is active. We now confirm that you represent ${orgName}; this usually takes one to two business days, and we may reach out to you${claimantDetails.claimantPhone ? ` at ${claimantDetails.claimantPhone}` : ""}. Once confirmed, you'll be able to keep your page up to date.\n\nQuestions? Just reply to this email.\n\nThomas Hooker\nFounder, Black Wealth Exchange`,
        html: `<p>Thank you for claiming <strong>${esc(orgName)}</strong> on Black Wealth Exchange.</p><p>Your Founding membership is active. We now confirm that you represent ${orgName}; this usually takes one to two business days, and we may reach out to you${claimantDetails.claimantPhone ? ` at ${claimantDetails.claimantPhone}` : ""}. Once confirmed, you'll be able to keep your page up to date.</p><p>Questions? Just reply to this email.</p><p>Thomas Hooker<br>Founder, Black Wealth Exchange</p>`,
      }),
    );
  }
  if (owner) {
    tasks.push(
      sendEmail({
        to: owner,
        subject: `New paid organization claim: ${orgName}`,
        text: `${orgName} was claimed and paid ($${(amountCents / 100).toFixed(2)}/month).\n\nClaimant: ${claimantDetails.claimantName || "not given"} (${claimantDetails.claimantRole || "role not given"})\nEmail: ${args.email || "not given"}\nPhone: ${claimantDetails.claimantPhone || "not given"}\n\nReview it in Admin > Organization claims: https://www.blackwealthexchange.com/admin/organization-claims`,
        html: `<p><strong>${esc(orgName)}</strong> was claimed and paid ($${(amountCents / 100).toFixed(2)}/month).</p><p>Claimant: ${esc(claimantDetails.claimantName || "not given")} (${esc(claimantDetails.claimantRole || "role not given")})<br>Email: ${esc(args.email || "not given")}<br>Phone: ${esc(claimantDetails.claimantPhone || "not given")}</p><p><a href="https://www.blackwealthexchange.com/admin/organization-claims">Review it in Admin &gt; Organization claims</a></p>`,
      }),
    );
  }
  await Promise.allSettled(tasks);
  return { membershipId };
}
