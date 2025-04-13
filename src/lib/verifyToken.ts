import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

interface DecodedToken {
  userId: string;
  email: string;
  accountType: string;
  iat?: number;
  exp?: number;
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}
