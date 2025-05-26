import nodemailer from "nodemailer";

export async function sendBusinessAlert(
  to: string,
  subject: string,
  html: string,
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: '"Black Wealth Exchange" <blackwealth24@gmail.com>',
    to,
    subject,
    html,
  });
}
