import Link from "next/link";

export default function MarketplaceSupportPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold text-[#D4AF37]">
          Marketplace Support
        </h1>
        <p className="mt-2 text-sm text-white/80">
          Need help with an order, seller communication, delivery timing, or a
          payment concern? We can help.
        </p>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/85">
          <p className="font-semibold text-white">Fastest path</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Check order status in My Orders.</li>
            <li>
              Contact seller from your product or order view for fulfillment
              updates.
            </li>
            <li>Open a support ticket for unresolved marketplace issues.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/marketplace/my-orders"
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black"
          >
            Go to My Orders
          </Link>
          <Link
            href="/support/new"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
          >
            Open Support Ticket
          </Link>
          <Link
            href="/marketplace"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}
