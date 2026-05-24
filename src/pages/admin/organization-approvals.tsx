import type { GetServerSideProps } from "next";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function LegacyOrganizationApprovalsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/organizations");
  }, [router]);

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <p className="text-sm text-gray-300">Redirecting to organizations…</p>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/organization-approvals",
);
