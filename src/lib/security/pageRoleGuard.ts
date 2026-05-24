import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type Role = "user" | "seller" | "business" | "employer" | "admin";

export function requirePageRole(
  ctx: GetServerSidePropsContext,
  allowedRoles: Role[],
  redirectPath: string,
): GetServerSidePropsResult<Record<string, never>> {
  try {
    const cookies = cookie.parse(ctx.req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return {
        redirect: {
          destination: `/login?redirect=${encodeURIComponent(redirectPath)}`,
          permanent: false,
        },
      };
    }

    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
    };
    const role =
      typeof payload.accountType === "string" ? payload.accountType : "";

    if (!allowedRoles.includes(role as Role)) {
      return {
        redirect: {
          destination: `/login?redirect=${encodeURIComponent(redirectPath)}`,
          permanent: false,
        },
      };
    }

    return { props: {} };
  } catch {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(redirectPath)}`,
        permanent: false,
      },
    };
  }
}
