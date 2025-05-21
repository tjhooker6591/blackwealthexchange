// src/models/user.ts

import { Collection } from "mongodb";
import clientPromise from "../lib/mongodb"; // import clientPromise
import { IUser } from "../../types/user";

/**
 * Returns the `users` collection typed as IUser.
 */
export async function getUserCollection(): Promise<Collection<IUser>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<IUser>("users");
}
