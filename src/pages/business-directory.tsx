import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Fuse from "fuse.js"; // Import Fuse.js for fuzzy searching

export default function BusinessDirectory() {
  const [businesses, setBusinesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // for controlling the search bar
  const [filteredBusinesses, setFilteredBusinesses] = useState([]); // filtered businesses after Fuse.js search
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { search } = router.query; // Get the search query from the URL

  // Fuse.js setup configuration
  const fuseOptions = {
    keys: ["business_name", "description"], // Specify fields to search in
    includeScore: true, // Include a score for the matches (useful for ranking)
    threshold: 0.3, // Define fuzzy matching threshold (0.0 exact match, 1.0 no match)
  };

  useEffect(() => {
    if (search || searchQuery) {
      const query = search || searchQuery;
      setIsLoading(true); // Set loading to true before fetching data
      fetch(`/api/searchBusinesses?search=${query}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setBusinesses(data); // Store the search results in state
            // Initialize Fuse.js
            const fuse = new Fuse(data, fuseOptions);
            const result = fuse.search(query);
            setFilteredBusinesses(result.map((res) => res.item)); // Set filtered businesses after Fuse.js search
          } else {
            setBusinesses([]); // Clear state if no valid data
          }
          setIsLoading(false); // Set loading to false after fetching
        })
        .catch((err) => {
          console.error("Error fetching data: ", err);
          setIsLoading(false); // Set loading to false on error
        });
    }
  }, [search, searchQuery]); // Re-run when the search query changes

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = () => {
    router.push(`/business-directory?search=${searchQuery}`);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Hero Section */}
      <header className="hero bg-gray-800 p-20 text-center shadow-md">
        <h1 className="text-4xl font-bold text-gold">Business Directory</h1>
        <p className="text-lg mt-2 text-gray-300">
          Discover and support Black-owned businesses across various industries.
        </p>
        {/* Back Button */}
        <div className="mt-4">
          <Link href="/">
            <button className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition">
              Back to Home
            </button>
          </Link>
        </div>
      </header>

      {/* Search Bar */}
      <div className="container mx-auto p-6">
        <div className="relative w-full mb-6">
          <input
            type="text"
            placeholder="Find Black-Owned Businesses..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-gold focus:outline-none transition-all"
          />
          <button
            onClick={handleSearchSubmit}
            className="absolute right-2 top-1 px-3 py-1 bg-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition"
          >
            Search
          </button>
        </div>

        {/* Display results */}
        {isLoading ? (
          <p>Loading...</p> // Show loading message while fetching results
        ) : filteredBusinesses.length > 0 ? (
          <div className="search-results mt-6">
            {filteredBusinesses.map((business) => (
              <div
                key={business._id}
                className="search-result-item flex items-start space-x-4 py-4 border-b border-gray-700"
              >
                <img
                  src={business.image || "/default-image.jpg"}
                  alt={business.business_name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  {/* Make business name clickable */}
                  <Link href={`/business-directory/${business.alias}`} passHref>
                    <span className="text-lg font-semibold text-gold hover:underline cursor-pointer">
                      {business.business_name}
                    </span>
                  </Link>
                  <p className="text-sm text-gray-300 mt-1">
                    {business.description || "Description not available"}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    {business.phone || "No phone number available"}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    {business.address || "No address available"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No businesses found for "{search || searchQuery}"</p> // Show message if no businesses are found
        )}
      </div>
    </div>
  );
}
