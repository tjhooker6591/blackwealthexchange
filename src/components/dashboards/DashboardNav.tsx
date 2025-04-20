// src/components/dashboards/DashboardNav.tsx
import Link from "next/link";
import { BarChart3, User, Settings } from "lucide-react";

export default function DashboardNav() {
  return (
    <nav className="p-6 space-y-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 hover:text-yellow-400"
      >
        <BarChart3 size={18} />
        Dashboard
      </Link>
      <Link
        href="/profile"
        className="flex items-center gap-2 hover:text-yellow-400"
      >
        <User size={18} />
        Profile
      </Link>
      <Link
        href="/settings"
        className="flex items-center gap-2 hover:text-yellow-400"
      >
        <Settings size={18} />
        Settings
      </Link>
    </nav>
  );
}
