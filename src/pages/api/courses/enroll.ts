import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb"; // Adjust if your MongoDB helper path differs

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { userId, courseId } = JSON.parse(req.body);

    // Basic validation
    if (!userId || !courseId) {
      return res
        .status(400)
        .json({ message: "User ID and Course ID are required." });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Check if course exists
    const course = await db.collection("courses").findOne({ _id: courseId });
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if user is already enrolled
    const existingEnrollment = await db
      .collection("enrollments")
      .findOne({ userId, courseId });
    if (existingEnrollment) {
      return res
        .status(200)
        .json({ message: "Already enrolled in this course." });
    }

    // Handle premium course logic
    if (course.isPremium) {
      // Placeholder for payment validation
      // Example: Check if user has purchased access (future integration)
      return res.status(403).json({
        message: "This is a premium course. Please upgrade or purchase access.",
      });
    }

    // Enroll user
    await db.collection("enrollments").insertOne({
      userId,
      courseId,
      enrolledAt: new Date(),
      progress: 0,
      completed: false,
    });

    return res.status(200).json({ message: "Enrollment successful." });
  } catch (error) {
    console.error("Enrollment Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
