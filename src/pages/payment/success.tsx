import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function PaymentSuccessCompat() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const sessionId =
      typeof router.query.session_id === "string"
        ? router.query.session_id
        : "";

    const dest = sessionId
      ? `/payment-success?session_id=${encodeURIComponent(sessionId)}`
      : `/payment-success`;

    router.replace(dest);
  }, [router.isReady, router.query.session_id]);

  return (
    <>
      <Head>
        <title>Redirecting… | Black Wealth Exchange</title>
      </Head>
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-white/80">Redirecting to your receipt…</p>
        </div>
      </main>
    </>
  );
}
