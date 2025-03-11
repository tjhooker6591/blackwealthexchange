import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<string>('user'); // Default as user type
  const [isPremium, setIsPremium] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch user data from localStorage
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      console.warn("No user found. Redirecting to login.");
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setAccountType(parsedUser?.accountType || 'user'); // Get account type
      setIsPremium(parsedUser?.isPremium || false); // Get premium status
    } catch (error) {
      console.error("Error loading user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // Ensure we redirect user based on account type
  useEffect(() => {
    if (accountType === 'user') {
      router.push("/user-dashboard"); // Redirect to user dashboard
    } else if (accountType === 'business') {
      router.push("/business-dashboard"); // Redirect to business dashboard
    }
  }, [accountType]); // Trigger redirection when accountType changes

  // If the component is still loading, show a loading message
  if (loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome, {user?.email || "User"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Explore the **Black Wealth Exchange** and unlock opportunities.
        </p>

        {/* Show different content based on account type */}
        {accountType === 'user' && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">Your User Dashboard</h2>
            <p className="text-gray-600 mt-4">
              As a regular user, you can explore businesses, browse listings, and more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-gold text-black font-semibold rounded-lg shadow-md">
                <h3 className="text-xl">Business Directory</h3>
                <p>Find Black-owned businesses.</p>
                <a href="/business-directory" className="text-blue-700 mt-2 block">
                  Explore Listings →
                </a>
              </div>

              <div className="p-6 bg-blue-500 text-white font-semibold rounded-lg shadow-md">
                <h3 className="text-xl">Marketplace</h3>
                <p>View products only.</p>
                <a href="/marketplace" className="mt-2 block">
                  Explore Marketplace →
                </a>
              </div>
            </div>
          </div>
        )}

        {accountType === 'business' && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">Your Business Dashboard</h2>
            <p className="text-gray-600 mt-4">
              As a business, you have access to exclusive tools to manage your listings and sell products.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-gold text-black font-semibold rounded-lg shadow-md">
                <h3 className="text-xl">Business Directory</h3>
                <p>Manage your business profile.</p>
                <a href="/business-directory" className="text-blue-700 mt-2 block">
                  Manage Your Listings →
                </a>
              </div>

              <div className="p-6 bg-blue-500 text-white font-semibold rounded-lg shadow-md">
                <h3 className="text-xl">Marketplace</h3>
                <p>Sell your products to a larger audience.</p>
                <a href="/marketplace" className="mt-2 block">
                  Start Selling →
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Premium User Section */}
        {isPremium && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">Premium Features</h2>
            <p className="text-gray-600 mt-4">As a premium user, enjoy exclusive access to our premium features.</p>
          </div>
        )}

        {/* Non-Premium Users - Call-to-Action to Upgrade */}
        {!isPremium && (
          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-gray-800">Upgrade to Premium Features</h2>
            <p className="text-gray-600">Unlock full access to all premium features.</p>
            <a href="/pricing" className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-block">
              Upgrade Now →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
