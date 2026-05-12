import Link from "next/link";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

export default function MusicLandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const nextStepLabel = user
    ? "Continue creator setup"
    : "Log in to begin creator setup";

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
            BWE Music is where listeners discover culture and creators build
            real commerce. Start as a fan, then move into creator access when
            you are ready to launch.
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
                  user ? "/music/join" : "/login?redirect=/music/join",
                )
              }
              className="rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-5 py-2.5 font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20"
            >
              {nextStepLabel}
            </button>
            <button
              onClick={() =>
                router.push(
                  user ? "/music/pricing" : "/login?redirect=/music/pricing",
                )
              }
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 font-bold text-white hover:bg-white/10"
            >
              View Creator Plans
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-extrabold text-[#D4AF37]">
              Creator Onboarding
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Complete profile, artist identity, and creator details so your
              page is trusted from day one.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-extrabold text-[#D4AF37]">Music Commerce</h2>
            <p className="mt-2 text-sm text-white/70">
              Activate your creator plan, publish products, and run a clean
              storefront experience with clear readiness states.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-extrabold text-[#D4AF37]">What happens next</h2>
            <p className="mt-2 text-sm text-white/70">
              We guide you step-by-step: join creator flow, complete readiness,
              then unlock direct creator dashboard access.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
          <h2 className="font-extrabold text-[#D4AF37]">
            Creator access clarity
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Locked state: you complete onboarding and readiness. Unlocked state:
            you get direct creator dashboard and listing access.
          </p>
          <div className="mt-3">
            <button
              onClick={() =>
                router.push(
                  user ? "/music/join" : "/login?redirect=/music/join",
                )
              }
              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-black hover:bg-yellow-500"
            >
              {nextStepLabel}
            </button>
          </div>
        </section>

        <div className="mt-8">
          <Link
            href="/"
            className="text-sm font-bold text-[#D4AF37] hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
