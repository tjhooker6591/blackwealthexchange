// /pages/api/auth/forgot-password.ts

import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 mins

    await users.updateOne(
      { email },
      {
        $set: {
          resetPasswordToken: token,
          resetPasswordExpires: expiresAt,
        },
      }
    );

    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `Black Wealth Exchange <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: `<p>Click below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Reset email sent" });
  } catch (err) {
    console.error("Password Reset Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
