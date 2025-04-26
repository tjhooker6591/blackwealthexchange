import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { IncomingForm, Fields, Files } from "formidable";
import path from "path";
import fs from "fs";
import clientPromise from "@/lib/mongodb";

// Get sellerId from session
async function getSellerId(req: NextApiRequest) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/me`, {
      headers: { cookie: req.headers.cookie || "" },
    });
    const data = await res.json();
    return data?.user?.accountType === "seller" ? data.user.id : null;
  } catch {
    return null;
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), "/public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const safeField = (field: string | string[] | undefined): string =>
  Array.isArray(field) ? field[0] : field || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    multiples: false,
  });

  form.parse(
    req,
    async (err: NodeJS.ErrnoException | null, fields: Fields, files: Files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Error parsing form data." });
      }

      const { name, description, price, category } = fields;
      const imageFile = Array.isArray(files.image)
        ? files.image[0]
        : files.image;

      if (!name || !price || !category || !imageFile) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      try {
        const sellerId = await getSellerId(req);
        if (!sellerId) {
          return res.status(401).json({ error: "Unauthorized: Seller access required" });
        }

        const filename = `${uuidv4()}-${imageFile.originalFilename}`;
        const filepath = path.join(uploadDir, filename);
        fs.renameSync(imageFile.filepath, filepath);
        const imageUrl = `/uploads/${filename}`;

        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + 45 * 24 * 60 * 60 * 1000);  // 45 days

        const newProduct = {
          name: safeField(name),
          description: safeField(description),
          price: parseFloat(safeField(price)),
          category: safeField(category),
          imageUrl,
          sellerId,             // ✅ Attach sellerId
          status: "pending",    // Admin approval
          isPublished: false,   // Default to unpublished until approved
          isFeatured: false,
          stockQuantity: 10,    // Default stock
          salesCount: 0,
          views: 0,
          tags: [],
          variants: [],
          sku: "",
          createdAt,
          updatedAt: createdAt,
          expiresAt
        };

        const client = await clientPromise;
        const db = client.db("bwes-cluster");

        await db.collection("products").insertOne(newProduct);

        return res.status(201).json({
          message: "Product added successfully!",
          product: newProduct,
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ error: "Failed to save product." });
      }
    },
  );
}
