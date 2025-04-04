"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/marketplace/get-product?id=${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      try {
        const res = await fetch("/api/marketplace/get-products");
        const all = await res.json();
        const related = all
          .filter(
            (p: Product) =>
              p.category === product.category && p._id !== product._id,
          )
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    };

    fetchRelated();
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white text-center py-20">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white text-center py-20">
        Product not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-5xl mx-auto bg-gray-900 border border-gold rounded-xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative w-full h-64 md:h-full">
            <Image
              src={product.imageUrl || "/placeholder.png"}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">
              {product.name}
            </h1>
            <p className="text-sm text-gray-400 mb-2">
              Category: {product.category}
            </p>
            <p className="text-xl font-semibold text-gold mb-4">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-gray-300 mb-6">{product.description}</p>

            <button
              onClick={() => setShowModal(true)}
              className="w-full py-2 px-4 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
            >
              Contact Seller
            </button>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/explore">
            <button className="px-6 py-2 bg-transparent text-gold border border-gold font-semibold rounded-lg hover:bg-gold hover:text-black transition">
              Back to Marketplace
            </button>
          </Link>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gold mb-6 text-center">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <Link
                key={item._id}
                href={`/marketplace/product/${item._id}`}
                className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden hover:scale-105 transition-transform"
              >
                <div className="relative w-full h-48">
                  <Image
                    src={item.imageUrl || "/placeholder.png"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-1">{item.category}</p>
                  <p className="text-md font-semibold text-gold">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="bg-gray-900 border border-gold text-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold text-gold mb-4 text-center">
              Contact the Seller
            </h2>
            <p className="text-gray-300 mb-4 text-sm text-center">
              This is a placeholder message. In the future, this will show the
              seller’s contact email, messaging link, or profile.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 bg-gold text-black py-2 rounded-lg font-semibold hover:bg-yellow-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
