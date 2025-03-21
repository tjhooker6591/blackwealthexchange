import type { NextApiRequest, NextApiResponse } from "next";

// Define interfaces for business and user profile data.
interface Business {
  id: string;
  name: string;
  description?: string;
  logo?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  business?: Business;
}

// Sample profile data. In a real application, you might fetch this from a database.
const sampleProfile: UserProfile = {
  id: "1",
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "/images/avatar.png", // Ensure this image exists or replace with a valid path
  business: {
    id: "b1",
    name: "John's Business",
    description: "A description of John's Business.",
    logo: "/images/business-logo.png", // Ensure this image exists or update the path
  },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserProfile>
) {
  res.status(200).json(sampleProfile);
}

