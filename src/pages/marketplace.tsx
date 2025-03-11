import React from "react";
import Link from "next/link";

export default function Marketplace() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Section */}
      <header className="hero bg-cover bg-center p-20 text-center">
        <h1 className="text-4xl font-bold text-gold">BWE Marketplace</h1>
        <p className="text-lg mt-2">
          Discover and shop from Black-owned brands worldwide.
        </p>
      </header>

      <div className="container mx-auto p-6">
        {/* Featured Categories Section */}
        <div className="section bg-gray-900 p-6 my-6 rounded shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Featured Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* Black-Owned Fashion */}
            <div className="category-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <img src="/fashion-category.jpg" alt="Black-Owned Fashion" className="rounded mb-4" />
              <h3 className="text-lg font-semibold">Black-Owned Fashion</h3>
              <p className="mt-2">Clothing, accessories, shoes, and jewelry.</p>
              <Link href="/marketplace/fashion">
                <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                  Shop Fashion
                </button>
              </Link>
            </div>

            {/* Black-Owned Beauty & Wellness */}
            <div className="category-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <img src="/beauty-category.jpg" alt="Black-Owned Beauty" className="rounded mb-4" />
              <h3 className="text-lg font-semibold">Black-Owned Beauty & Wellness</h3>
              <p className="mt-2">Skincare, haircare, and wellness products.</p>
              <Link href="/marketplace/beauty">
                <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                  Shop Beauty & Wellness
                </button>
              </Link>
            </div>

            {/* Black Tech */}
            <div className="category-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <img src="/tech-category.jpg" alt="Black Tech" className="rounded mb-4" />
              <h3 className="text-lg font-semibold">Black Tech</h3>
              <p className="mt-2">Tech gadgets, software, and services from Black tech companies.</p>
              <Link href="/marketplace/tech">
                <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                  Shop Tech
                </button>
              </Link>
            </div>

            {/* Subscription Boxes */}
            <div className="category-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <img src="/subscription-box.jpg" alt="Subscription Boxes" className="rounded mb-4" />
              <h3 className="text-lg font-semibold">Subscription Boxes</h3>
              <p className="mt-2">Curated subscription boxes for beauty, food, fashion, or books by Black authors.</p>
              <Link href="/marketplace/subscription">
                <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                  Shop Subscription Boxes
                </button>
              </Link>
            </div>

            {/* Black Financial Services */}
            <div className="category-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <img src="/financial-services.jpg" alt="Black Financial Services" className="rounded mb-4" />
              <h3 className="text-lg font-semibold">Black Financial Services</h3>
              <p className="mt-2">Investment opportunities, financial literacy courses, and banking services.</p>
              <Link href="/marketplace/financial-services">
                <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                  Shop Financial Services
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Products */}
        <div className="section bg-gray-900 p-6 my-6 rounded shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Featured Products</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* Product 1 */}
            <div className="product-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <img src="/product1.jpg" alt="Handmade Shea Butter" className="rounded mb-4" />
              <h3 className="text-lg font-semibold">Handmade Shea Butter</h3>
              <p className="mt-2">$15.99</p>
              <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                Buy Now
              </button>
            </div>
            {/* Product 2 */}
            <div className="product-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <img src="/product2.jpg" alt="African Print Clothing" className="rounded mb-4" />
              <h3 className="text-lg font-semibold">African Print Clothing</h3>
              <p className="mt-2">$39.99</p>
              <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                Buy Now
              </button>
            </div>
            {/* Product 3 */}
            <div className="product-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <img src="/product3.jpg" alt="Organic Herbal Tea" className="rounded mb-4" />
              <h3 className="text-lg font-semibold">Organic Herbal Tea</h3>
              <p className="mt-2">$12.50</p>
              <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Sell Your Product Section */}
        <div className="section bg-gray-900 p-6 my-6 rounded shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Sell Your Product</h2>
          <p className="mt-2">
            Are you a Black entrepreneur? List your products on BWE Marketplace and reach a global audience.
          </p>
          <Link href="/sellers/register">
            <button className="mt-4 p-4 bg-gold text-black font-bold rounded">
              Become a Seller
            </button>
          </Link>
        </div>

        {/* Call to Action */}
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gold">Shop & Support Black-Owned Businesses</h2>
          <p className="mt-2">
            Every purchase helps build Black wealth. Find unique and high-quality products today.
          </p>
          <button className="mt-4 p-4 bg-gold text-black font-bold rounded">
            Explore the Marketplace
          </button>
        </div>

        {/* Back to Homepage Button */}
        <div className="text-center mt-10">
          <Link href="/">
            <button className="p-4 bg-white text-black font-bold rounded-lg shadow-lg hover:bg-gold hover:text-black transition duration-300">
              Back to Homepage
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}