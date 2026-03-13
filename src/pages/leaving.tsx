import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/router";

function safeTarget(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  try {
    const u = new URL(value);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return "";
  } catch {
    return "";
  }
}

export default function LeavingPage() {
  const router = useRouter();
  const to = useMemo(
    () => safeTarget(router.query.to as any),
    [router.query.to],
  );

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <Head>
        <title>Leaving Black Wealth Exchange</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold text-[#D4AF37]">
          You’re leaving BWE
        </h1>
        <p className="mt-2 text-sm text-white/80">
          You’re about to open an external website. We’ll keep this page open so
          you can come right back.
        </p>

        {to ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs break-all text-white/70">
              {to}
            </div>
            <button
              type="button"
              onClick={() => window.open(to, "_blank", "noopener,noreferrer")}
              className="inline-flex rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400"
            >
              Open external site
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(to);
                } catch {}
              }}
              className="ml-2 inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
            >
              Copy link
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-red-300">Invalid destination URL.</p>
        )}

        <div className="mt-5">
          <Link
            href="/business-directory"
            className="text-sm text-white/80 underline"
          >
            ← Back to directory
          </Link>
        </div>
      </div>
    </main>
  );
}
