import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

interface DecodedToken {
  userId: string;
  email: string;
  accountType: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const rawCookie = req.headers.cookie || "";
    const cookies = parse(rawCookie);
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    const { id, name, description, price, image, category } = req.body;

    if (!id || !name || !description || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const collection = db.collection("products");

    const existing = await collection.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (existing.userId !== decoded.userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You don't own this product" });
    }

    await collection.updateOne(
      { _id: existing._id },
      {
        $set: {
          name,
          description,
          price,
          image,
          category,
          updatedAt: new Date(),
        },
      },
    );

    return res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (err: unknown) {
    console.error("Edit product error:", err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ error: message });
  }
}
