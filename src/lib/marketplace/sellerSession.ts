import type { NextApiRequest } from "next";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import type { Db } from "mongodb";
import { getJwtSecret } from "@/lib/env";

type SellerToken = {
  userId?: string;
  email?: string;
  accountType?: string;
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

  if (decoded.accountType !== "seller") {
    return { ok: false, status: 403, error: "Forbidden: Not a seller" };
  }

  const userId = String(decoded.userId || "").trim();
  const email = String(decoded.email || "").trim().toLowerCase();

  const seller = await db.collection("sellers").findOne({
    $or: [
      ...(userId ? [{ userId }] : []),
      ...(email ? [{ email }] : []),
    ],
  });

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
