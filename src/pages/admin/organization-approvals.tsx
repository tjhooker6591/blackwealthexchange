import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LegacyOrganizationApprovalsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/organizations");
  }, [router]);
  return null;
}
