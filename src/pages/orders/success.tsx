import { useEffect } from "react";
import { useRouter } from "next/router";

export default function OrdersSuccessRedirect() {
  const router = useRouter();

  useEffect(() => {
    const qs = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/payment-success${qs}`);
  }, [router]);

  return null;
}
