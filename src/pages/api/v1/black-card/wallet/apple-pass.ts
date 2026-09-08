// src/pages/api/v1/black-card/wallet/apple-pass.ts
//
// Phase 7 -- Mobile Wallet / Black Card. Apple Wallet (.pkpass) issuance
// requires a real Apple Developer "Pass Type ID" certificate + the Apple
// WWDR intermediate certificate, both owner-provided credentials this
// project does not have configured. Rather than fabricate a fake pass or
// silently no-op, this endpoint honestly reports that gate -- the same
// pattern already used by the pre-existing src/pages/api/ai/answers.ts
// for its own missing OPENAI_API_KEY.
//
// The real, working alternative already shipped in this phase is the
// scannable QR code (src/components/black-card/MembershipQrCode.tsx) of
// the member's real, already-existing verification URL -- that requires
// no external credential and is live today.

import type { NextApiRequest, NextApiResponse } from "next";
import { getNetworkSession } from "@/lib/network/shared";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "GET only" },
    });
  }

  const session = getNetworkSession(req);
  if (!session) {
    return res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Login required" },
    });
  }

  const hasAppleWalletCredentials = Boolean(
    process.env.APPLE_PASS_TYPE_ID_CERT &&
    process.env.APPLE_PASS_TYPE_ID_KEY &&
    process.env.APPLE_WWDR_CERT,
  );

  if (!hasAppleWalletCredentials) {
    return res.status(501).json({
      ok: false,
      error: {
        code: "APPLE_WALLET_NOT_CONFIGURED",
        message:
          "Apple Wallet pass issuance requires an Apple Developer Pass Type ID certificate, its private key, and the Apple WWDR certificate (APPLE_PASS_TYPE_ID_CERT, APPLE_PASS_TYPE_ID_KEY, APPLE_WWDR_CERT). None are configured. Use the QR code on your Black Card dashboard to verify your membership today.",
      },
    });
  }

  // Real .pkpass generation would go here once the owner provides the
  // certificates above -- intentionally not implemented against
  // credentials that don't exist, to avoid ever claiming a working
  // integration that hasn't been proven.
  return res.status(501).json({
    ok: false,
    error: {
      code: "APPLE_WALLET_NOT_IMPLEMENTED",
      message:
        "Apple Wallet credentials are present but pass generation is not yet implemented.",
    },
  });
}
