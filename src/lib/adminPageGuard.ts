import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type SessionPayload = {
  accountType?: string;
  role?: string;
  isAdmin?: boolean;
  roles?: string[];
};

function isAdminPayload(payload: SessionPayload) {
  return (
    payload.isAdmin === true ||
    payload.accountType === "admin" ||
    payload.role === "admin" ||
    (Array.isArray(payload.roles) && payload.roles.includes("admin"))
  );
}

export function requireAdminPageProps(
  redirectPath: string,
): GetServerSideProps {
  return async ({ req }: GetServerSidePropsContext) => {
    try {
      const cookies = cookie.parse(req.headers.cookie || "");
      const token = cookies.session_token;

      if (!token) {
        return {
          redirect: {
            destination: `/login?redirect=${encodeURIComponent(redirectPath)}`,
            permanent: false,
          },
        };
      }

      const payload = jwt.verify(token, getJwtSecret()) as SessionPayload;

      if (!isAdminPayload(payload)) {
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
  };
}
