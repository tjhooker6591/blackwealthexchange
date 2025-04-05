import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // ✅ this adds support for session.user.id
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
