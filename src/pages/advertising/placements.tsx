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
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-yellow-300">
            Paid Placement Definitions (Source of Truth)
          </h1>
          <p className="mt-2 text-sm text-white/75">
            This page defines exactly what each paid visibility product
            includes, where it appears, and how limits/duration/expiration are
            enforced.
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-white/15 text-left text-yellow-200">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Where it appears</th>
                  <th className="py-2 pr-4">How it appears</th>
                  <th className="py-2 pr-4">Limits</th>
                  <th className="py-2 pr-4">Duration</th>
                  <th className="py-2">Expiration behavior</th>
                </tr>
              </thead>
              <tbody>
                {PAID_PLACEMENT_DEFINITIONS.map((row: PlacementDefinition) => (
                  <tr
                    key={row.product}
                    className="border-b border-white/10 align-top"
                  >
                    <td className="py-3 pr-4 font-semibold text-white">
                      {row.product}
                    </td>
                    <td className="py-3 pr-4 text-white/80">{row.where}</td>
                    <td className="py-3 pr-4 text-white/80">{row.how}</td>
                    <td className="py-3 pr-4 text-white/80">{row.limits}</td>
                    <td className="py-3 pr-4 text-white/80">{row.duration}</td>
                    <td className="py-3 text-white/80">{row.expiration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/advertise-with-us"
              className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black"
            >
              Back to Advertise Hub
            </Link>
            <Link
              href="/advertising"
              className="rounded-xl border border-yellow-500/30 px-4 py-2 text-sm font-bold text-yellow-200"
            >
              Open Advertising
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
