import type { NextApiRequest } from "next";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import type { Db } from "mongodb";
import { getJwtSecret } from "@/lib/env";

type SellerToken = {
  userId?: string;
  id?: string;
  email?: string;
  accountType?: string;
  role?: string;
};

export async function resolveSellerSession(
  req: NextApiRequest,
  db: Db,
): Promise<
  | { ok: true; sellerId: string; userId: string; email: string }
  | { ok: false; status: number; error: string }
> {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.session_token || cookies.token;
  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized: No token provided" };
  }

  let decoded: SellerToken;
  try {
    decoded = jwt.verify(token, getJwtSecret()) as SellerToken;
  } catch {
    return { ok: false, status: 401, error: "Unauthorized: Invalid token" };
  }

  const userId = String(decoded.userId || decoded.id || "").trim();
  const email = String(decoded.email || "").trim().toLowerCase();

  if (!userId && !email) {
    return { ok: false, status: 401, error: "Unauthorized: Missing identity" };
  }

  const seller = await db.collection("sellers").findOne(
    {
      $or: [
        ...(userId ? [{ userId }] : []),
        ...(email ? [{ email }, { email: email.toLowerCase() }] : []),
      ],
    },
    {
      projection: { _id: 1, userId: 1, email: 1 },
    },
  );

  if (!seller?._id) {
    return {
      ok: false,
      status: 403,
      error: "Forbidden: No seller profile found",
    };
  }

  return {
    ok: true,
    sellerId: String(seller._id),
    userId,
    email,
  };
}
