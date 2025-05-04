import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import clientPromise from "../../../lib/mongodb";
import { serialize } from "cookie";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      email,
      password,
      accountType,
      businessName,
      businessAddress,
      businessPhone,
      description,
    } = req.body;

    const allowedRoles = ["user", "seller", "business", "employer"];
    if (!allowedRoles.includes(accountType)) {
      return res.status(400).json({ error: "Invalid account type." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    let newUser;
    let collection;

    if (accountType === "business") {
      if (!businessName || !businessAddress || !businessPhone) {
        return res.status(400).json({
          error: "Business name, address, and phone number are required",
        });
      }

      collection = db.collection("businesses");
      const existingBusiness = await collection.findOne({ email });

      if (existingBusiness) {
        return res.status(400).json({ error: "Business already exists" });
      }

      newUser = {
        email,
        password: hashedPassword,
        accountType: "business",
        businessName,
        businessAddress,
        businessPhone,
        description: description || "",
        isVerified: false,
        createdAt: new Date(),
      };
    } else if (accountType === "seller") {
      collection = db.collection("sellers");
      const existingSeller = await collection.findOne({ email });

      if (existingSeller) {
        return res.status(400).json({ error: "Seller already exists" });
      }

      newUser = {
        email,
        password: hashedPassword,
        accountType: "seller",
        storeName: businessName || "",
        createdAt: new Date(),
      };
    } else if (accountType === "employer") {
      collection = db.collection("employers");
      const existingEmployer = await collection.findOne({ email });

      if (existingEmployer) {
        return res.status(400).json({ error: "Employer already exists" });
      }

      newUser = {
        email,
        password: hashedPassword,
        accountType: "employer",
        createdAt: new Date(),
      };
    } else {
      collection = db.collection("users");
      const existingUser = await collection.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      newUser = {
        email,
        password: hashedPassword,
        accountType: "user",
        createdAt: new Date(),
      };
    }

    const result = await collection.insertOne(newUser);
    const userId = result.insertedId;

    const token = jwt.sign(
      {
        userId,
        email: newUser.email,
        accountType: newUser.accountType,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // ✉️ Send welcome email (Nodemailer)
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Or another provider like Mailgun/SendGrid
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Black Wealth Exchange" <blackwealth24@gmail.com>`,
      to: newUser.email,
      subject: "Welcome to Black Wealth Exchange!",
      text: `Welcome to the movement, ${newUser.email}!
    
    You did not just create an account — you joined a revolution.
    
    Black Wealth Exchange was born from a vision: to reclaim our economic power, circulate our dollars with intention, and build a future rooted in ownership, equity, and legacy. You are now part of a growing collective committed to reshaping what prosperity looks like for our people.
    
    As a member, you can now:
    - Discover or post job opportunities that uplift our communities
    - Explore a powerful marketplace filled with Black-owned products
    - Showcase your business and gain visibility
    - Invest in the future of Black wealth and innovation
    
    This is more than a platform. It is a movement.
    And we are honored to build it with you.
    
    Let's make history — together.
    
    — The Black Wealth Exchange Team`,
    
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome to the movement, <strong>${newUser.email}</strong>!</h2>
          <p>You did not just create an account — you joined a <strong>revolution</strong>.</p>
    
          <p>Black Wealth Exchange was born from a vision: to reclaim our economic power, circulate our dollars with intention, and build a future rooted in ownership, equity, and legacy.</p>
    
          <p>You are now part of a growing collective committed to reshaping what prosperity looks like for our people.</p>
    
          <p>As a member, you can now:</p>
          <ul>
            <li>Discover or post job opportunities that uplift our communities</li>
            <li>Explore a powerful marketplace filled with Black-owned products</li>
            <li>Showcase your business and gain visibility</li>
            <li>Invest in the future of Black wealth and innovation</li>
          </ul>
    
          <p>This is more than a platform. It is a movement.<br/>
          And we are honored to build it with you.</p>
    
          <p><strong>Let's make history — together.</strong></p>
    
          <p>— The Black Wealth Exchange Team</p>
        </div>
      `,
    };
    
    

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${newUser.email}`);
    } catch (emailErr) {
      console.error("❌ Failed to send welcome email:", emailErr);
    }

    res.setHeader("Set-Cookie", [
      serialize("session_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      }),
      serialize("accountType", newUser.accountType, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: "Account created and logged in!",
      accountType: newUser.accountType,
      user: {
        userId,
        email: newUser.email,
        accountType: newUser.accountType,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
