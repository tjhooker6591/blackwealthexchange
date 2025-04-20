// pages/affiliate/earn.tsx
import Link from "next/link";

export default function Earn() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-20 space-y-16">
      <section className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-gold">Earn</h1>
        <p className="text-xl text-gray-300">
          Affiliates earn <span className="text-gold font-bold">10 – 25% CPA</span>{" "}
          on qualifying sales with a 30‑day cookie window.
        </p>
      </section>

      <section className="max-w-xl mx-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gold border-b border-gray-700">
              <th className="py-2">Product Type</th>
              <th className="py-2">Commission</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Digital Courses", "25%"],
              ["Marketplace Goods", "15%"],
              ["Job Posting Upgrades", "20%"],
              ["Advertising Packages", "10%"],
            ].map(([type, rate]) => (
              <tr key={type} className="border-b border-gray-800">
                <td className="py-3">{type}</td>
                <td className="py-3 text-gold font-semibold">{rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-bold text-gold">Real‑Time Dashboard</h2>
        <p className="text-gray-300">
          Track clicks, conversions, and payouts inside your affiliate dashboard
          (launching soon).
        </p>
        <Link
          href="/affiliate/signup"
          className="px-8 py-4 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
        >
          Become an Affiliate
        </Link>
      </section>
    </div>
  );
}
