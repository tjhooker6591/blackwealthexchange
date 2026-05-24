import { randomBytes } from "crypto";
import type { Db } from "mongodb";

export type BlackCardIdentityType =
  | "user"
  | "seller"
  | "business"
  | "employer"
  | "admin_internal";

export type BlackCardIdentityStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "expired"
  | "revoked"
  | "replaced";

export type PhysicalRequestStatus =
  | "requested"
  | "approved"
  | "sent_to_vendor"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "replaced";

function pad(n: number, width: number) {
  return String(n).padStart(width, "0");
}

function typeCode(type: BlackCardIdentityType) {
  if (type === "seller") return "SEL";
  if (type === "business") return "BUS";
  if (type === "employer") return "EMP";
  if (type === "admin_internal") return "ADM";
  return "USR";
}

async function nextSeq(db: Db, scope: string) {
  const now = new Date();
  const seq = await db.collection("black_card_sequences").findOneAndUpdate(
    { scope },
    {
      $inc: { nextValue: 1 },
      $setOnInsert: { scope, createdAt: now },
      $set: { updatedAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  return Number(seq?.nextValue || 1);
}

export async function generateMemberId(
  db: Db,
  type: BlackCardIdentityType,
): Promise<string> {
  const seq = await nextSeq(db, `black_card_member_${typeCode(type)}`);
  return `BWE-${typeCode(type)}-${pad(seq, 4)}`;
}

export async function generateCardSerial(db: Db): Promise<string> {
  const year = new Date().getUTCFullYear();
  const seq = await nextSeq(db, `black_card_serial_${year}`);
  return `BWE-${year}-${pad(seq, 6)}`;
}

export function generatePublicVerificationId() {
  return randomBytes(18).toString("base64url");
}

export function getVerificationUrl(publicVerificationId: string) {
  const base =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  const root = base.startsWith("http")
    ? base.replace(/\/$/, "")
    : `https://${base.replace(/\/$/, "")}`;
  return `${root}/black-card/verify/${encodeURIComponent(publicVerificationId)}`;
}

export function mapAccountTypeToCardType(
  accountType?: string | null,
): BlackCardIdentityType {
  const v = String(accountType || "user").toLowerCase();
  if (v === "seller") return "seller";
  if (v === "business") return "business";
  if (v === "employer") return "employer";
  if (v === "admin") return "admin_internal";
  return "user";
}
