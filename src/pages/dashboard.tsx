import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

interface User {
  email: string;
  accountType?: string;
  isPremium?: boolean;
  // add other properties as needed
}

export default function Dashboard() {
  // Use a typed interface for the user state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<string>("user");
  const [isPremium, setIsPremium] = useState(false);
  const router = useRouter();

  // First effect: load user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      console.warn("No user found. Redirecting to login.");
      router.push("/login");
      return;
    }

    try {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      setAccountType(parsedUser?.accountType || "user");
      setIsPremium(parsedUser?.isPremium || false);
    } catch (error) {
      console.error("Error loading user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Second effect: redirect based on account type
  useEffect(() => {
    if (accountType === "user") {
      router.push("/user-dashboard");
    } else if (accountType === "business") {
      router.push("/business-dashboard");
    }
  }, [accountType, router]);

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome, {user?.email || "User"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Explore the <strong>Black Wealth Exchange</strong> and unlock
          opportunities.
        </p>

        {accountType === "user" && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Your User Dashboard
            </h2>
            <p className="text-gray-600 mt-4">
              As a regular user, you can explore businesses, browse listings,
              and more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-gold text-black font-semibold rounded-lg shadow-md">
                <h3 className="text-xl">Business Directory</h3>
                <p>Find Black-owned businesses.</p>
                <Link
                  href="/business-directory"
                  className="text-blue-700 mt-2 block"
                >
                  Explore Listings →
                </Link>
              </div>

              <div className="p-6 bg-blue-500 text-white font-semibold rounded-lg shadow-md">
                <h3 className="text-xl">Marketplace</h3>
                <p>View products only.</p>
                <Link href="/marketplace" className="mt-2 block">
                  Explore Marketplace →
                </Link>
              </div>
            </div>
          </div>
        )}

        {accountType === "business" && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Your Business Dashboard
            </h2>
            <p className="text-gray-600 mt-4">
              As a business, you have access to exclusive tools to manage your
              listings and sell products.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-gold text-black font-semibold rounded-lg shadow-md">
                <h3 className="text-xl">Business Directory</h3>
                <p>Manage your business profile.</p>
                <Link
                  href="/business-directory"
                  className="text-blue-700 mt-2 block"
                >
                  Manage Your Listings →
                </Link>
              </div>

              <div className="p-6 bg-blue-500 text-white font-semibold rounded-lg shadow-md">
                <h3 className="text-xl">Marketplace</h3>
                <p>Sell your products to a larger audience.</p>
                <Link href="/marketplace" className="mt-2 block">
                  Start Selling →
                </Link>
              </div>
            </div>
          </div>
        )}

        {isPremium && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Premium Features
            </h2>
            <p className="text-gray-600 mt-4">
              As a premium user, enjoy exclusive access to our premium features.
            </p>
          </div>
        )}

        {!isPremium && (
          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-gray-800">
              Upgrade to Premium Features
            </h2>
            <p className="text-gray-600">
              Unlock full access to all premium features.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Upgrade Now →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
