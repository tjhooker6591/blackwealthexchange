import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accountType: string;
      isPremium?: boolean;
    };
  }

  interface User {
    id: string;
    accountType: string;
    isPremium?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accountType: string;
    isPremium?: boolean;
  }
}
