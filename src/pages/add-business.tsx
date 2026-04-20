import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

export default function AddBusinessAliasPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return {
        redirect: {
          destination: "/login?redirect=/add-business",
          permanent: false,
        },
      };
    }

    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
    };

    if (payload.accountType !== "business") {
      return {
        redirect: {
          destination: "/login?redirect=/add-business",
          permanent: false,
        },
      };
    }

    return {
      redirect: {
        destination: "/business-directory/add-business",
        permanent: false,
      },
    };
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/add-business",
        permanent: false,
      },
    };
  }
};
