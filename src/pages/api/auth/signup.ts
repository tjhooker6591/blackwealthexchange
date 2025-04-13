import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import clientPromise from "../../../lib/mongodb";
import { serialize } from "cookie";

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

    // 🔸 Business signup
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
    }

    // 🔸 Seller signup
    else if (accountType === "seller") {
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
    }

    // 🔸 Employer signup
    else if (accountType === "employer") {
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
    }

    // 🔸 General user signup
    else {
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
