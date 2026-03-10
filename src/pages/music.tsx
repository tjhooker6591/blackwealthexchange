import Link from "next/link";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

export default function MusicLandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#D4AF37]/10 to-black p-8">
          <p className="text-xs font-bold tracking-[0.08em] text-[#D4AF37] uppercase">
            BWE Music / Creator Platform
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
            Discover Music. Support Creators. Build Ownership.
          </h1>
          <p className="mt-3 max-w-3xl text-white/75">
            This is the canonical entry for music and creator commerce on BWE.
            Browse featured artists, launch creator storefronts, and route
            buyers into verified checkout and fulfillment flows.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/black-entertainment-news")}
              className="rounded-xl bg-[#D4AF37] px-5 py-2.5 font-extrabold text-black hover:bg-yellow-500"
            >
              Explore Music
            </button>
            <button
              onClick={() =>
                router.push(
                  user
                    ? "/marketplace/become-a-seller"
                    : "/login?redirect=/marketplace/become-a-seller",
                )
              }
              className="rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-5 py-2.5 font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20"
            >
              Sell Your Music
            </button>
            <button
              onClick={() =>
                router.push(user ? "/marketplace" : "/login?redirect=/marketplace")
              }
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 font-bold text-white hover:bg-white/10"
            >
              Join as a Creator
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-extrabold text-[#D4AF37]">Creator Onboarding</h2>
            <p className="mt-2 text-sm text-white/70">
              Use seller onboarding to start listing albums, tracks, and creator
              products under one commerce system.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-extrabold text-[#D4AF37]">Music Commerce</h2>
            <p className="mt-2 text-sm text-white/70">
              Purchases flow through canonical checkout + webhook fulfillment,
              with entitlement and payout/connect readiness tracking.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-extrabold text-[#D4AF37]">Road to Delivery</h2>
            <p className="mt-2 text-sm text-white/70">
              Final closure requires post-payment entitlement/delivery proof,
              not just checkout initialization.
            </p>
          </div>
        </section>

        <div className="mt-8">
          <Link href="/" className="text-sm font-bold text-[#D4AF37] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
