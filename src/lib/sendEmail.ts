import nodemailer from "nodemailer";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host) throw new Error("Missing SMTP_HOST");
  if (!port || Number.isNaN(port)) throw new Error("Invalid SMTP_PORT");
  if (!user) throw new Error("Missing SMTP_USER");
  if (!pass) throw new Error("Missing SMTP_PASS");
  if (!from) throw new Error("Missing SMTP_FROM");

  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    from,
  };
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs) {
  const smtp = getSmtpConfig();

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"Black Wealth Exchange" <${smtp.from}>`,
    to,
    subject,
    text,
    html,
  });

  console.log("[email] sent", {
    to,
    subject,
    messageId: info.messageId,
    response: info.response,
  });

  return info;
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

  const textParts = [
    "Black Wealth Exchange Business Alert",
    `Business: ${safeBusinessName}`,
    safeMessage,
    ctaUrl ? `${ctaText || "View Details"}: ${ctaUrl}` : "",
    "You’re receiving this email because your business is listed on Black Wealth Exchange.",
  ].filter(Boolean);

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
    text: textParts.join("\n\n"),
    html,
  });
}
