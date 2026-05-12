import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type RolePayload = {
  accountType?: string;
  role?: string;
};

export function requireWealthBuilderPageUser(
  context: GetServerSidePropsContext,
  redirectPath: string,
): GetServerSidePropsResult<Record<string, never>> {
  const cookies = cookie.parse(context.req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(redirectPath)}`,
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as RolePayload | string;
    if (typeof payload === "string") throw new Error("Invalid token payload");

    const accountType = (
      payload.accountType ||
      payload.role ||
      "user"
    ).toLowerCase();
    if (accountType !== "user") {
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
