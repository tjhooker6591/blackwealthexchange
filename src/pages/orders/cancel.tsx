import { useEffect } from "react";
import { useRouter } from "next/router";

export default function OrdersCancelRedirect() {
  const router = useRouter();

  useEffect(() => {
    const qs = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/payment-cancel${qs}`);
  }, [router]);

  return null;
}
