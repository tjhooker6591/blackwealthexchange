import Head from "next/head";
import Link from "next/link";

export default function FoundingMembershipEvidencePage() {
  return (
    <>
      <Head>
        <title>Ownership Evidence | BWE</title>
      </Head>
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-bold text-yellow-300">
            Ownership Evidence
          </h1>
          <p className="mt-3 text-white/75">
            Submit evidence only when your ownership verification status
            requires it. If your ownership is already verified, return to your
            membership status page.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/founding-membership/status"
              className="rounded-xl bg-yellow-500 px-4 py-2 font-bold text-black"
            >
              Back to Membership Status
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
