// pages/dashboard/index.tsx
import dynamic from "next/dynamic";

// Disable SSR for the dashboard wrapper for now (if needed)
const DashboardWrapper = dynamic(
  () => import("../../components/dashboards/DashboardWrapper"),
  { ssr: false },
);

export default function DashboardPage() {
  return <DashboardWrapper />;
}
