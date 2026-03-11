import jwt, { JwtPayload } from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === "object") {
      return decoded as JwtPayload;
    }
    return null;
  } catch {
    return null;
  }
}
