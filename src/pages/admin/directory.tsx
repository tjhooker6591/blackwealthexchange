import type { GetServerSideProps } from "next";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function LegacyDirectoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/directory-approvals");
  }, [router]);

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <p className="text-sm text-gray-300">
        Redirecting to directory approvals…
      </p>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/directory");
