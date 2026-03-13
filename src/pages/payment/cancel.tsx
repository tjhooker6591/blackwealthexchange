import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function PaymentCancelCompat() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace("/payment-cancel");
  }, [router]);

  return (
    <>
      <Head>
        <title>Redirecting… | Black Wealth Exchange</title>
      </Head>
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-white/80">Redirecting…</p>
        </div>
      </main>
    </>
  );
}
