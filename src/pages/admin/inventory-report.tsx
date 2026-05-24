import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type Product = {
  _id: string;
  name: string;
  stock: number;
  price: number;
  imageUrl?: string;
  isFeatured?: boolean;
};

export default function InventoryReport() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/admin/inventory");
        if (!res.ok) throw new Error("Failed to fetch inventory");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error(err); // <-- Add this for lint and debugging
        setMessage("Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Filtered product list by name (case-insensitive)
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gold mb-1">
            Inventory Report
          </h1>
          <p className="text-sm text-gray-400">
            Track marketplace inventory and quickly identify low-stock or
            out-of-stock products.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Back to Admin Dashboard
        </Link>
      </div>
      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200">
          Total products: {products.length}
        </span>
        <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200">
          Results: {filteredProducts.length}
        </span>
      </div>
      <input
        className="w-full max-w-md mb-6 px-4 py-2 rounded bg-gray-800 text-white border border-gray-700"
        placeholder="Search products..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {message && (
        <div className="mb-4 p-3 bg-red-700 rounded text-center">{message}</div>
      )}
      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
          Loading inventory…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-gray-900 rounded shadow">
            <thead>
              <tr className="bg-gray-800 text-gold">
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured?</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">
                    No inventory products match the current search.
                  </td>
                </tr>
              )}
              {filteredProducts.map((product) => {
                let status = "In Stock";
                let rowClass = "";
                if (product.stock === 0) {
                  status = "Out of Stock";
                  rowClass = "bg-red-900";
                } else if (product.stock < 5) {
                  status = "Low Stock";
                  rowClass = "bg-yellow-900";
                }
                return (
                  <tr key={product._id} className={rowClass}>
                    <td className="flex items-center gap-2 px-4 py-3">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <span className="w-10 h-10 bg-gray-700 flex items-center justify-center rounded text-xs text-gray-400">
                          No image
                        </span>
                      )}
                      <span>{product.name}</span>
                    </td>
                    <td className="text-center px-4 py-3">{product.stock}</td>
                    <td className="text-center px-4 py-3">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="text-center px-4 py-3 font-semibold">
                      {status}
                    </td>
                    <td className="text-center px-4 py-3">
                      {product.isFeatured ? (
                        <span className="text-yellow-400 font-bold">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/inventory-report",
);
