import React, { useEffect, useState } from "react";
import Image from "next/legacy/image";

// Define types for user and business data.
interface Business {
  id: string;
  name: string;
  description?: string;
  logo?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  business?: Business;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data from an API endpoint.
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          throw new Error("Failed to fetch profile data");
        }
        const data: UserProfile = await res.json();
        setProfile(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        No profile found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Your Profile</h1>
        <div className="flex items-center space-x-4">
          <Image
            src={profile.avatar}
            alt="User Avatar"
            width={100}
            height={100}
            className="rounded-full"
          />
          <div>
            <h2 className="text-2xl">{profile.name}</h2>
            <p>{profile.email}</p>
          </div>
        </div>

        {profile.business ? (
          <div className="mt-8">
            <h2 className="text-3xl font-bold mb-4">Your Business</h2>
            <div className="flex items-center space-x-4">
              {profile.business.logo && (
                <Image
                  src={profile.business.logo}
                  alt={`${profile.business.name} Logo`}
                  width={80}
                  height={80}
                  className="rounded"
                />
              )}
              <div>
                <h3 className="text-xl">{profile.business.name}</h3>
                {profile.business.description && (
                  <p>{profile.business.description}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-8">
            You have not registered a business yet. Please update your profile.
          </p>
        )}
      </div>
    </div>
  );
}
