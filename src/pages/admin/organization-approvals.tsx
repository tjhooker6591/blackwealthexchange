import type { GetServerSideProps } from "next";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function LegacyOrganizationApprovalsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/organizations");
  }, [router]);
  return null;
}


export const getServerSideProps: GetServerSideProps = requireAdminPageProps("/admin/organization-approvals");
