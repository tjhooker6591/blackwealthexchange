import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  // Credential-based provider configuration
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { email, password } = credentials;
        const client = await clientPromise;
        const db = client.db("bwes-cluster");
        const collections = ["users", "sellers", "businesses", "employers"];
        for (const col of collections) {
          const user = await db.collection(col).findOne({ email });
          if (user && user.password) {
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid) {
              return {
                id: user._id.toString(),
                name: user.name || user.businessName || user.fullName || email,
                email: user.email,
                accountType: col === "users" ? "user" : col.slice(0, -1),
              };
            }
          }
        }
        return null;
      },
    }),
  ],

  // Use JWT for sessions
  session: {
    strategy: "jwt",
  },

  // Required secret
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug logging in non-production
  debug: process.env.NODE_ENV !== "production",

  // Explicit cookie settings
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        // scope to root domain in production for both www and apex
        ...(process.env.NODE_ENV === "production"
          ? { domain: ".blackwealthexchange.com" }
          : {}),
      },
    },
  },

  callbacks: {
    // Populate token on sign-in
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accountType = user.accountType;
      }
      return token;
    },

    // Expose token fields in session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType as string;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
