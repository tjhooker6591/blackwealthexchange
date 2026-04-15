import type { NextApiResponse } from "next";

export const ADMIN_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  AFFILIATE_NOT_FOUND: "AFFILIATE_NOT_FOUND",
  MISSING_AFFILIATE_ID: "MISSING_AFFILIATE_ID",
  INVALID_AFFILIATE_ID: "INVALID_AFFILIATE_ID",
} as const;

export function adminFail(
  res: NextApiResponse,
  status: number,
  code: string,
  message: string,
) {
  return res.status(status).json({ ok: false, code, message });
}
