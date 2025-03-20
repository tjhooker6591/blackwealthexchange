import clientPromise from "../lib/mongodb";
import { MongoClient } from "mongodb";

// Define the Seller interface (do not include _id here)
export interface Seller {
  name: string;
  email: string;
  businessName: string;
  phone: string;
  website?: string;
  description?: string;
  createdAt?: Date;
}

export async function saveSellerToDatabase(
  seller: Seller
): Promise<Seller & { _id: string }> {
  // Connect to MongoDB using our client promise
  const client: MongoClient = await clientPromise;
  const db = client.db("bwes"); // Replace with your actual database name

  // Create the seller data without an _id field
  const sellerData: Seller = {
    ...seller,
    createdAt: new Date(),
  };

  // Insert the seller into the "sellers" collection
  const result = await db.collection("sellers").insertOne(sellerData);

  // Return the seller object with the insertedId (converted to a string)
  return { ...sellerData, _id: result.insertedId.toString() };
}
