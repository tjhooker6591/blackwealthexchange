import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

// Define an interface for the business object
interface Business {
  business_name: string;
  categories: string;
  address: string;
  description?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  website?: string;
}

const BusinessDetail = () => {
  const router = useRouter();
  const { alias } = router.query; // Get alias from the URL
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (alias) {
      fetch(`/api/getBusiness?alias=${alias}`)
        .then((res) => res.json())
        .then((data: Business) => {
          setBusiness(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching business details:", err);
          setIsLoading(false);
        });
    }
  }, [alias]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!business) {
    return <p>Business not found</p>;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="hero bg-gray-800 p-20 text-center shadow-md">
        <h1 className="text-4xl font-bold text-gold">
          {business.business_name}
        </h1>
        <p className="text-lg mt-2 text-gray-300">{business.categories}</p>
        <p className="text-lg mt-2 text-gray-300">{business.address}</p>
      </header>

      {/* Business Information */}
      <div className="container mx-auto p-6">
        <div className="mt-4">
          <h2 className="text-2xl font-semibold">Business Information</h2>
          <p className="text-sm text-gray-300 mt-1">
            <strong>Description:</strong>{" "}
            {business.description || "No description available"}
          </p>
          <p className="text-sm text-gray-300 mt-1">
            <strong>Phone:</strong>{" "}
            {business.phone || "No phone number available"}
          </p>
          <p className="text-sm text-gray-300 mt-1">
            <strong>Address:</strong> {business.address}
          </p>
          <p className="text-sm text-gray-300 mt-1">
            <strong>Location:</strong> {business.latitude}, {business.longitude}
          </p>
        </div>

        {/* Map */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gold">
            Find Us on the Map
          </h3>
          <div className="w-full h-64 bg-gray-700">
            <div className="w-full h-full text-center text-white">
              <iframe
                src={`https://www.google.com/maps?q=${business.latitude},${business.longitude}&hl=es;z=14&output=embed`}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                allowFullScreen
              />
            </div>
          </div>
        </div>

        {/* Call-to-Action Button */}
        <div className="mt-6 text-center">
          <button
            className="px-6 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
            onClick={() => (window.location.href = business.website || "#")}
          >
            Visit Website
          </button>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
            onClick={() => router.back()}
          >
            Back to Directory
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;

