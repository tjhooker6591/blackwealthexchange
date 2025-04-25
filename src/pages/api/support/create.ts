import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { userId, subject, description } = JSON.parse(req.body);

    // Basic validation
    if (!userId || !subject || !description) {
      return res
        .status(400)
        .json({ message: "User ID, Subject, and Description are required." });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        message: "Description is too short. Please provide more details.",
      });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Create support ticket
    const ticket = {
      userId,
      subject,
      description,
      status: "open", // open, in_progress, closed
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("supportTickets").insertOne(ticket);

    return res.status(200).json({
      message: "Support ticket submitted successfully.",
      ticketId: result.insertedId,
    });
  } catch (error) {
    console.error("Support Ticket Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
