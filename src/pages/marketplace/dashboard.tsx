// src/pages/marketplace/dashboard.tsx
"use client";

import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import SellerDashboard from "@/components/dashboards/SellerDashboard";
import { getJwtSecret } from "@/lib/env";

export default function SellerDashboardPage() {
  return <SellerDashboard />;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return {
        redirect: {
          destination: "/login?redirect=/marketplace/dashboard",
          permanent: false,
        },
      };
    }

    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
    };

    if (payload.accountType !== "seller") {
      return {
        redirect: {
          destination: "/login?redirect=/marketplace/dashboard",
          permanent: false,
        },
      };
    }

    return { props: {} };
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/marketplace/dashboard",
        permanent: false,
      },
    };
  }
};
