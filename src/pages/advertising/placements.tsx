import Head from "next/head";
import Link from "next/link";
import {
  PAID_PLACEMENT_DEFINITIONS,
  type PlacementDefinition,
} from "@/lib/advertising/placementDefinitions";

export default function AdvertisingPlacementsPage() {
  return (
    <>
      <Head>
        <title>Paid Placement Definitions | Black Wealth Exchange</title>
      </Head>
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative max-w-3xl">
              <div className="bwe-eyebrow">Advertising placements</div>
              <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                Paid placement definitions and delivery rules.
              </h1>
              <p className="bwe-lead mt-4 max-w-2xl">
                This is the source of truth for what each paid visibility
                product includes, where it appears, and how duration, limits,
                and expiration are enforced.
              </p>
            </div>
          </section>

          <section className="mt-8 overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]">
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-white/50">
                    <th className="py-3 pr-4 font-medium">Product</th>
                    <th className="py-3 pr-4 font-medium">Where it appears</th>
                    <th className="py-3 pr-4 font-medium">How it appears</th>
                    <th className="py-3 pr-4 font-medium">Limits</th>
                    <th className="py-3 pr-4 font-medium">Duration</th>
                    <th className="py-3 font-medium">Expiration behavior</th>
                  </tr>
                </thead>
                <tbody>
                  {PAID_PLACEMENT_DEFINITIONS.map(
                    (row: PlacementDefinition) => (
                      <tr
                        key={row.product}
                        className="border-b border-white/8 align-top"
                      >
                        <td className="py-4 pr-4 font-semibold text-white">
                          {row.product}
                        </td>
                        <td className="py-4 pr-4 text-white/74">{row.where}</td>
                        <td className="py-4 pr-4 text-white/74">{row.how}</td>
                        <td className="py-4 pr-4 text-white/74">
                          {row.limits}
                        </td>
                        <td className="py-4 pr-4 text-white/74">
                          {row.duration}
                        </td>
                        <td className="py-4 text-white/74">{row.expiration}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/advertise-with-us"
              className="bwe-cta-primary bwe-focus-ring px-6"
            >
              Back to advertise hub
            </Link>
            <Link
              href="/advertising"
              className="bwe-cta-secondary bwe-focus-ring px-6"
            >
              Open advertising
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
