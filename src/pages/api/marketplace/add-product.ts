import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { IncomingForm, Fields, Files } from "formidable";
import path from "path";
import fs from "fs";
import clientPromise from "@/lib/mongodb";

// Disable Next.js default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "/public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper to safely extract single field values
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

  form.parse(req, async (err: NodeJS.ErrnoException | null, fields: Fields, files: Files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Error parsing form data." });
    }

    const { name, description, price, category } = fields;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!name || !price || !category || !imageFile) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    try {
      // Generate unique filename for the uploaded image
      const filename = `${uuidv4()}-${imageFile.originalFilename}`;
      const filepath = path.join(uploadDir, filename);
      fs.renameSync(imageFile.filepath, filepath);
      const imageUrl = `/uploads/${filename}`;

      // Connect to MongoDB and insert product
      const client = await clientPromise;
      const db = client.db("bwes-cluster");

      const newProduct = {
        name: safeField(name),
        description: safeField(description),
        price: parseFloat(safeField(price)),
        category: safeField(category),
        imageUrl,
        status: "pending",  // If you want admin approval
        createdAt: new Date(),
      };

      await db.collection("products").insertOne(newProduct);

      return res.status(201).json({
        message: "Product added successfully!",
        product: newProduct,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Failed to save product." });
    }
  });
}
