// src/components/black-card/MembershipQrCode.tsx
//
// Phase 7 -- Mobile Wallet / Black Card. Renders a real, scannable QR code
// for the member's own real verification URL (already generated server-
// side by src/lib/black-card-identity.ts#getVerificationUrl, already
// resolvable at the existing /black-card/verify/[publicId] page). No
// external wallet provider, credential, or paid service is needed for
// this -- QR encoding is pure client-side rendering of a real URL BWE
// already generates. This is the actual "QR-verifiable membership card"
// the Black Card tier copy (src/lib/black-card.ts) already promises but
// previously only rendered as a plain text link.

import { QRCodeSVG } from "qrcode.react";

export default function MembershipQrCode({
  verificationUrl,
  size = 128,
}: {
  verificationUrl: string;
  size?: number;
}) {
  if (!verificationUrl) return null;

  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-2xl border border-[#D4AF37]/30 bg-white p-3">
      <QRCodeSVG value={verificationUrl} size={size} level="M" marginSize={0} />
      <span className="max-w-[10rem] break-all text-center text-[9px] font-mono text-black/60">
        Scan to verify
      </span>
    </div>
  );
}
