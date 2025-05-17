// src/lib/db/orders.ts
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Marks an order as paid in the database
 */
export async function fulfillOrder(orderId: string, paymentIntentId: string) {
  const client = await clientPromise;
  const db = client.db();
  return db
    .collection("orders")
    .updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: "paid", paymentIntent: paymentIntentId } },
    );
}
