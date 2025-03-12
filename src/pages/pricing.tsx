import { useRouter } from "next/router";

export default function Pricing() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white p-6 rounded-lg shadow-lg text-center">
        {/* 🎯 Header */}
        <h1 className="text-4xl font-bold text-gray-800">Upgrade to Premium</h1>
        <p className="text-gray-600 mt-2">
          Unlock exclusive features and maximize your opportunities.
        </p>

        {/* 🔥 Pricing Tiers */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 🆓 Free Plan */}
          <div className="p-6 border border-gray-300 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold">Free Plan</h2>
            <p className="text-gray-600 mt-2">Great for exploring!</p>
            <ul className="mt-4 space-y-2 text-left">
              <li>✅ Limited Business Directory</li>
              <li>✅ View Only in Marketplace</li>
              <li>❌ No Access to Investments</li>
              <li>❌ No Premium Reports</li>
              <li>✅ Limited Community Features</li>
            </ul>
            <p className="mt-4 text-xl font-bold">FREE</p>
            <button className="mt-4 w-full px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed">
              Current Plan
            </button>
          </div>

          {/* 🚀 Premium Plan */}
          <div className="p-6 border border-gold rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gold">Premium Plan</h2>
            <p className="text-gray-600 mt-2">Everything you need!</p>
            <ul className="mt-4 space-y-2 text-left">
              <li>✅ Full Business Directory Access</li>
              <li>✅ Buy & Sell in Marketplace</li>
              <li>✅ Exclusive Investment Hub</li>
              <li>✅ Monthly Reports & Insights</li>
              <li>✅ Unlimited Community Access</li>
            </ul>
            <p className="mt-4 text-xl font-bold">$9.99 / month</p>
            <button
              className="mt-4 w-full px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-opacity-90 transition"
              onClick={() => router.push("/checkout")}
            >
              Upgrade Now
            </button>
          </div>
        </div>

        {/* 👀 Why Upgrade? */}
        <div className="mt-8 text-gray-700">
          <h2 className="text-xl font-bold">Why Go Premium?</h2>
          <p className="mt-2">
            Gain full access to exclusive content, business resources, and
            premium investment tools.
          </p>
        </div>
      </div>
    </div>
  );
}
