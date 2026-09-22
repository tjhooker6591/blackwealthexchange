import type { GetServerSideProps } from "next";
import { requirePageRole } from "@/lib/security/pageRoleGuard";

// This page has no real functionality of its own yet -- the actual
// business-management surface is /edit-business (profile editing) and
// /founding-membership/status (membership/report status). Redirecting here
// instead of rendering a placeholder so nothing looks built that isn't.
export default function BusinessDashboardRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guardResult = requirePageRole(ctx, ["business"], "/edit-business");
  if ("redirect" in guardResult) return guardResult;
  return { redirect: { destination: "/edit-business", permanent: false } };
};
