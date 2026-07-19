import { ObjectId, type Db } from "mongodb";

export const ENTITY_CLAIM_PENDING = "ownership_verification_pending";
export const ENTITY_CLAIM_MORE_EVIDENCE = "additional_evidence_required";
export const ENTITY_CLAIM_FAILED = "ownership_verification_failed";
export const ENTITY_CLAIM_DISPUTED = "disputed";
export const ENTITY_CLAIM_VERIFIED = "ownership_verified";
export const ENTITY_CLAIM_REVOKED = "revoked";

export type EntityClaimStatus =
  | typeof ENTITY_CLAIM_PENDING
  | typeof ENTITY_CLAIM_MORE_EVIDENCE
  | typeof ENTITY_CLAIM_FAILED
  | typeof ENTITY_CLAIM_DISPUTED
  | typeof ENTITY_CLAIM_VERIFIED
  | typeof ENTITY_CLAIM_REVOKED;

export function newAuditEntry(args: {
  action: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  reason?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
}) {
  return {
    id: new ObjectId().toString(),
    action: args.action,
    actorUserId: args.actorUserId || null,
    actorEmail: args.actorEmail || null,
    reason: args.reason || null,
    fromStatus: args.fromStatus || null,
    toStatus: args.toStatus || null,
    timestamp: new Date(),
  };
}

export function buildEntityClaimTransition(action: string) {
  switch (action) {
    case "verify":
      return {
        claimStatus: ENTITY_CLAIM_VERIFIED,
        verificationStatus: ENTITY_CLAIM_VERIFIED,
        ownershipStatus: "active",
        disputeLocked: false,
        revokedAt: null,
      };
    case "request_more_evidence":
      return {
        claimStatus: ENTITY_CLAIM_MORE_EVIDENCE,
        verificationStatus: ENTITY_CLAIM_MORE_EVIDENCE,
        ownershipStatus: null,
        disputeLocked: false,
        revokedAt: null,
      };
    case "verification_failed":
      return {
        claimStatus: ENTITY_CLAIM_FAILED,
        verificationStatus: ENTITY_CLAIM_FAILED,
        ownershipStatus: null,
        disputeLocked: false,
        revokedAt: null,
      };
    case "mark_disputed":
      return {
        claimStatus: ENTITY_CLAIM_DISPUTED,
        verificationStatus: ENTITY_CLAIM_DISPUTED,
        ownershipStatus: null,
        disputeLocked: true,
        revokedAt: null,
      };
    case "revoke":
      return {
        claimStatus: ENTITY_CLAIM_REVOKED,
        verificationStatus: ENTITY_CLAIM_REVOKED,
        ownershipStatus: "revoked",
        disputeLocked: false,
        revokedAt: new Date(),
      };
    default:
      return null;
  }
}

export async function ensureActiveOwnershipLink(
  db: Db,
  args: {
    entityType: "organization";
    entityId: string;
    userId: string;
    claimId: string;
    adminUserId?: string | null;
    adminEmail?: string | null;
  },
) {
  const now = new Date();
  await db.collection("entity_ownerships").updateOne(
    {
      entityType: args.entityType,
      entityId: args.entityId,
      userId: args.userId,
    },
    {
      $set: {
        entityType: args.entityType,
        entityId: args.entityId,
        userId: args.userId,
        claimId: args.claimId,
        status: "active",
        disputeLocked: false,
        revokedAt: null,
        updatedAt: now,
        verifiedAt: now,
        verifiedByAdminUserId: args.adminUserId || null,
        verifiedByAdminEmail: args.adminEmail || null,
      },
      $setOnInsert: {
        createdAt: now,
        ownershipTransferHistory: [],
      },
      $push: {
        auditHistory: newAuditEntry({
          action: "verify",
          actorUserId: args.adminUserId,
          actorEmail: args.adminEmail,
          toStatus: "active",
        }),
      } as any,
    },
    { upsert: true },
  );
}
