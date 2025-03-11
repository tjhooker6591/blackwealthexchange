// pages/user-dashboard.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const UserDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      console.warn("No user found. Redirecting to login.");
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome, {user?.email || "User"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Explore the Black Wealth Exchange platform and start engaging.
        </p>
        {/* Add User Dashboard Content */}
      </div>
    </div>
  );
};

export default UserDashboard;
