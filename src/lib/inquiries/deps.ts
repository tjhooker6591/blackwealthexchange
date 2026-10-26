// The real email, network and settings the inquiry flow runs with.
import { sendEmail } from "@/lib/sendEmail";
import { getBaseUrl } from "@/lib/seo";
import type { InquiryDeps } from "./service";

export function inquiryDeps(): InquiryDeps {
  return {
    sendEmail: (args) => sendEmail(args),
    fetch: (...a) => fetch(...a),
    now: () => new Date(),
    baseUrl: getBaseUrl(),
    secret: String(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ""),
    teamEmail: String(
      process.env.INQUIRY_ALERT_EMAIL || "blackwealth24@gmail.com",
    ),
    // BWE's website connection in Speed-to-Lead (the same one the employer
    // request form uses). Unset = inquiries stay in BWE only.
    speedToLeadUrl:
      String(process.env.STL_LEAD_WEBHOOK_URL || "").trim() || undefined,
  };
}
