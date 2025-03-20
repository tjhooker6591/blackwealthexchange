// pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "../../../lib/mongodb"; // Adjust the path if necessary

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "user@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Ensure credentials is defined
        if (!credentials) return null;
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        // Connect to MongoDB and get the database
        const client = await clientPromise;
        const db = client.db("bwes"); // Replace "bwes" with your database name if needed

        // Look for the user in the "users" collection
        const user = await db.collection("users").findOne({ email });

        // Check if user exists and the password matches
        if (user && user.password === password) {
          // Convert the MongoDB ObjectId to a string and return the user data
          return { id: user._id.toString(), name: user.name, email: user.email };
        }

        // If no user is found or password doesn't match, return null
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.SECRET,
};

export default NextAuth(authOptions);

