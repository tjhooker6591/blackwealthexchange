import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

// Define the interface for a business search result.
interface Business {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
}

export default function SearchResults() {
  const router = useRouter();
  const { search, location } = router.query;
  // Explicitly type the state so TypeScript knows each item is a Business.
  const [results, setResults] = useState<Business[]>([]);

  useEffect(() => {
    if (search) {
      fetch(`/api/search?query=${search}&location=${location}`)
        .then((res) => res.json())
        .then((data: Business[]) => setResults(data))
        .catch((err) => console.error("Error fetching search results:", err));
    }
  }, [search, location]);

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="p-6 flex justify-between items-center bg-gray-900">
        <Link href="/">
          <Image src="/bwe-logo.png" alt="BWE Logo" width={50} height={50} />
        </Link>
        <h1 className="text-xl font-bold text-gold">Search Results</h1>
      </nav>

      <div className="container mx-auto p-6">
        <h2 className="text-3xl text-gold font-semibold text-center mb-6">
          Results for &quot;{search}&quot;
        </h2>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((business, index) => (
              <div
                key={index}
                className="p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700"
              >
                <h3 className="text-2xl font-semibold text-gold">
                  {business.name}
                </h3>
                <p className="text-gray-400 mt-2">{business.description}</p>
                <p className="text-gray-300 mt-2">📍 {business.address}</p>
                <Link
                  href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                  target="_blank"
                  className="mt-4 inline-block px-6 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
                >
                  Get Directions
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 mt-6">No results found.</p>
        )}
      </div>
    </div>
  );
}
