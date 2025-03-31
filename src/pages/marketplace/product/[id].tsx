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

  if (loading) {
    return <div className="min-h-screen bg-gray-100 text-center py-20">Loading...</div>;
  }

  if (!product) {
    return <div className="min-h-screen bg-gray-100 text-center py-20">Product not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative w-full h-64 md:h-full">
            <Image
              src={product.imageUrl || "/placeholder.png"}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="rounded"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">Category: {product.category}</p>
            <p className="text-xl font-semibold text-green-600 mb-4">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-gray-700 mb-6">{product.description}</p>

            <button className="w-full py-2 px-4 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Contact Seller
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/marketplace">
            <button className="px-6 py-2 bg-black text-gold border border-gold font-semibold rounded hover:bg-gray-800 transition">
              Back to Marketplace
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
