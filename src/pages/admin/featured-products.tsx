import { useEffect, useState } from "react";

type Product = {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  isFeatured?: boolean;
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/admin/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error(err); // <-- Log error for debugging, fixes linter
        setMessage("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Toggle featured status
  const handleToggleFeatured = async (productId: string, current: boolean) => {
    setMessage("");
    try {
      const res = await fetch("/api/admin/feature-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, isFeatured: !current }),
      });
      if (!res.ok) throw new Error("Failed to update featured status");
      // Update UI immediately
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, isFeatured: !current } : p
        )
      );
      setMessage("Featured status updated!");
    } catch (err) {
      console.error(err); // <-- Log error for debugging, fixes linter
      setMessage("Error updating featured status.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-gold mb-6">
        Manage Featured Products
      </h1>
      <p className="mb-8 text-gray-400">
        Select which products are highlighted as “Featured” on the marketplace.
      </p>
      {message && (
        <div className="mb-4 p-3 bg-yellow-700 rounded text-center">{message}</div>
      )}
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length === 0 && (
            <p className="col-span-3 text-gray-400">No products found.</p>
          )}
          {products.map((product) => (
            <div
              key={product._id}
              className={`bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center transition ${
                product.isFeatured
                  ? "border-2 border-yellow-400 shadow-yellow-400"
                  : "border border-gray-700"
              }`}
            >
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-32 h-32 object-cover mb-2 rounded"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-600 mb-2 rounded text-gray-400">
                  No Image
                </div>
              )}
              <div className="w-full text-center">
                <h2 className="text-lg font-semibold mb-1">{product.name}</h2>
                <p className="text-gold font-bold mb-2">${product.price.toFixed(2)}</p>
                <button
                  className={`px-4 py-2 rounded font-semibold text-sm transition ${
                    product.isFeatured
                      ? "bg-yellow-500 text-black hover:bg-yellow-600"
                      : "bg-gray-700 text-yellow-300 hover:bg-gray-600"
                  }`}
                  onClick={() => handleToggleFeatured(product._id, !!product.isFeatured)}
                  disabled={loading}
                >
                  {product.isFeatured ? "Unfeature" : "Make Featured"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

