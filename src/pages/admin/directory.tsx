import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LegacyDirectoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/directory-approvals");
  }, [router]);
  return null;
}
