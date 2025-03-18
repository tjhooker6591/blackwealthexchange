import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface User {
  email: string;
  // Add any additional properties as needed.
}

const BusinessDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      console.warn("No user found. Redirecting to login.");
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser) as User;
    setUser(parsedUser);
  }, [router]); // Added router to dependency array

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome, {user?.email || "Business"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your business and explore opportunities for growth.
        </p>
        {/* Additional Business Dashboard Content */}
      </div>
    </div>
  );
};

export default BusinessDashboard;
