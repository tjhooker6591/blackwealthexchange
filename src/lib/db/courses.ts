// src/lib/db/courses.ts
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function grantCourseAccess(userId: string, courseId: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $addToSet: { purchasedCourses: courseId } }
  );
}

