import type { GetServerSideProps } from "next";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function LegacyDirectoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/directory-approvals");
  }, [router]);
  return null;
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/directory");
