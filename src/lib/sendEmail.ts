import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  await transporter.sendMail({
    from: `"Black Wealth Exchange" <${process.env.SMTP_FROM!}>`,
    to,
    subject,
    html,
  });
}

export async function sendBusinessAlert({
  to,
  businessName,
  message,
  ctaUrl,
  ctaText,
}: {
  to: string;
  businessName: string;
  message: string;
  ctaUrl?: string;
  ctaText?: string;
}) {
  const safeBusinessName = businessName || "Your Business";
  const safeMessage = message || "";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 12px;">Black Wealth Exchange Business Alert</h2>
        <p style="margin: 0 0 8px;"><strong>Business:</strong> ${safeBusinessName}</p>
        <p style="margin: 0 0 16px;">${safeMessage}</p>

        ${
          ctaUrl
            ? `
          <div style="margin: 20px 0;">
            <a href="${ctaUrl}"
               style="display:inline-block; padding: 12px 16px; text-decoration:none; border-radius: 8px; background:#111; color:#FFD700; font-weight:600;">
              ${ctaText || "View Details"}
            </a>
          </div>`
            : ""
        }

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />

        <p style="font-size: 12px; color: #666; margin: 0;">
          You’re receiving this email because your business is listed on Black Wealth Exchange.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Black Wealth Exchange Alert – ${safeBusinessName}`,
    html,
  });
}
