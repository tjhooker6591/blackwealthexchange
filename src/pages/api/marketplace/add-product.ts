import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import formidable, { Fields, Files } from "formidable";
import path from "path";
import fs from "fs";
import clientPromise from "../../../lib/mongodb";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), "/public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const safeField = (field: string | string[] | undefined): string =>
  Array.isArray(field) ? field[0] : field || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm({
    uploadDir,
    keepExtensions: true,
    multiples: false,
  });

  form.parse(
    req,
    async (err: NodeJS.ErrnoException | null, fields: Fields, files: Files) => {
      if (err)
        return res.status(500).json({ error: "Error parsing form data." });

      const { name, description, price, category } = fields;
      const image = Array.isArray(files.image) ? files.image[0] : files.image;

      if (!name || !price || !category || !image) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      const filename = `${uuidv4()}-${image.originalFilename}`;
      const filepath = path.join(uploadDir, filename);
      fs.renameSync(image.filepath, filepath);

      const imageUrl = `/uploads/${filename}`;

      try {
        const client = await clientPromise;
        const db = client.db("bwes-cluster");
        const collection = db.collection("products");

        const newProduct = {
          name: safeField(name),
          description: safeField(description),
          price: parseFloat(safeField(price)),
          category: safeField(category),
          imageUrl,
          createdAt: new Date(),
        };

        await collection.insertOne(newProduct);

        return res.status(200).json({ message: "Product added successfully!" });
      } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "Failed to save product." });
      }
    },
  );
}
