// pages/affiliate/recommend.tsx
import Link from "next/link";

export default function Recommend() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-20 space-y-12">
      <section className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-gold">Recommend</h1>
        <p className="text-xl text-gray-300">
          Once approved, you’ll receive a unique referral ID (e.g. 
          <code className="text-gold">?ref=BWEX123</code>). Append it to any
          Black Wealth Exchange URL or use the pre‑made banners below.
        </p>
      </section>

      {/* Banners / copy widgets */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {["300 × 250", "728 × 90", "1200 × 628", "Story 1080 × 1920"].map(
          (size) => (
            <div
              key={size}
              className="bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center text-center"
            >
              <span className="text-gold font-bold mb-4">{size}</span>
              <div className="bg-gray-700 h-40 w-full rounded mb-3 flex items-center justify-center text-gray-500">
                Banner Preview
              </div>
              <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
                Copy Embed Code
              </button>
            </div>
          ),
        )}
      </section>

      <div className="text-center">
        <Link
          href="/affiliate/earn"
          className="px-8 py-4 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
        >
          How Payouts Work
        </Link>
      </div>
    </div>
  );
}
