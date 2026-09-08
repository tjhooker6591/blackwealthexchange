// src/pages/api/v1/black-card/wallet/google-pass.ts
//
// Phase 7 -- Mobile Wallet / Black Card. Google Wallet issuance requires a
// real Google Wallet API issuer account + a service account key, both
// owner-provided credentials this project does not have configured.
// Mirrors src/pages/api/v1/black-card/wallet/apple-pass.ts's honest gate
// -- see that file's header comment for the reasoning and the real,
// working QR-code alternative already shipped in this phase.

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

  const hasGoogleWalletCredentials = Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY,
  );

  if (!hasGoogleWalletCredentials) {
    return res.status(501).json({
      ok: false,
      error: {
        code: "GOOGLE_WALLET_NOT_CONFIGURED",
        message:
          "Google Wallet pass issuance requires a Google Wallet API issuer account and a service account key (GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_KEY). Neither is configured. Use the QR code on your Black Card dashboard to verify your membership today.",
      },
    });
  }

  return res.status(501).json({
    ok: false,
    error: {
      code: "GOOGLE_WALLET_NOT_IMPLEMENTED",
      message:
        "Google Wallet credentials are present but pass generation is not yet implemented.",
    },
  });
}
