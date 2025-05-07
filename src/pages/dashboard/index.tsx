// src/pages/dashboard/index.tsx

import dynamic from "next/dynamic";

// Dynamically import a wrapper to handle role-based dashboard rendering
const DashboardWrapper = dynamic(
  () => import("@/components/dashboards/DashboardWrapper"),
  { ssr: false }
);

export default function DashboardPage() {
  return <DashboardWrapper />;
}
