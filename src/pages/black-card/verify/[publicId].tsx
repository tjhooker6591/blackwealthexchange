import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type VerifyResponse = {
  ok: boolean;
  valid: boolean;
  verdict: string;
  cardType: string | null;
  status: string;
  lastVerifiedAt: string;
  lastUpdatedAt?: string | null;
};

export default function BlackCardVerifyPage() {
  const router = useRouter();
  const publicId =
    typeof router.query.publicId === "string" ? router.query.publicId : "";
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/black-card/verify?publicId=${encodeURIComponent(publicId)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => null);
        if (!cancelled) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicId]);

  return (
    <>
      <Head>
        <title>Black Card Verification | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Live Black Card verification status page."
        />
      </Head>
      <main className="min-h-screen bg-black text-white px-4 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/15 bg-white/5 p-6">
          <h1 className="text-2xl font-black text-yellow-200">
            Black Card Verification
          </h1>

          {loading ? <p className="mt-4 text-white/80">Verifying…</p> : null}

          {!loading && data ? (
            <div className="mt-4 space-y-3 text-sm">
              <div
                className={`rounded-lg border px-3 py-2 font-bold ${
                  data.valid
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                    : "border-red-400/40 bg-red-500/10 text-red-200"
                }`}
              >
                {data.verdict}
              </div>
              <p>
                <span className="text-white/70">Card type:</span>{" "}
                <span className="font-semibold">
                  {data.cardType || "unknown"}
                </span>
              </p>
              <p>
                <span className="text-white/70">Status:</span>{" "}
                <span className="font-semibold">{data.status}</span>
              </p>
              <p>
                <span className="text-white/70">Last verified:</span>{" "}
                <span className="font-semibold">
                  {data.lastVerifiedAt
                    ? new Date(data.lastVerifiedAt).toLocaleString()
                    : "now"}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
