import { useEffect, useState } from "react";
import axios from "axios";

type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
  approved: boolean;
};

const ProductApprovals = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnapproved = async () => {
      try {
        const res = await axios.get("/api/admin/get-unapproved-products");
        setProducts(res.data.products); // ✅ Corrected this line
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchUnapproved();
  }, []);

  const handleApprove = async (productId: string) => {
    setApprovingId(productId);
    try {
      await axios.post("/api/admin/approve-product", { productId });
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Failed to approve product.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (productId: string) => {
    const reason = window.prompt("Optional rejection reason:", "") || "";
    setRejectingId(productId);
    try {
      await axios.post("/api/admin/reject-product", { productId, reason });
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      console.error("Rejection failed:", err);
      alert("Failed to reject product.");
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gold text-center">
        🛡️ Approve Marketplace Products
      </h1>
      {products.length === 0 ? (
        <p className="text-center text-gray-400">
          No products awaiting approval.
        </p>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {products.map((product) => (
            <div key={product._id} className="bg-gray-800 p-4 rounded shadow">
              <h2 className="text-xl text-gold">{product.name}</h2>
              <p>Price: ${product.price}</p>
              <p>Category: {product.category}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleApprove(product._id)}
                  disabled={approvingId === product._id || rejectingId === product._id}
                  className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
                >
                  {approvingId === product._id ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(product._id)}
                  disabled={approvingId === product._id || rejectingId === product._id}
                  className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-500 transition disabled:opacity-50"
                >
                  {rejectingId === product._id ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductApprovals;
