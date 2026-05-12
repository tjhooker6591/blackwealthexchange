// pages/employer/index.tsx

import type { GetServerSideProps } from "next";
import EmployerDashboard from "@/components/dashboards/EmployerDashboard";
import { requirePageRole } from "@/lib/security/pageRoleGuard";

export default function EmployerHome() {
  return <EmployerDashboard />;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requirePageRole(ctx, ["employer"], "/employer");
};
