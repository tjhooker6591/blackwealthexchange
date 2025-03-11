import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(""); // Stores error messages
  const [loading, setLoading] = useState(false); // Prevents multiple submissions
  const [showPassword, setShowPassword] = useState(false); // Toggle Password Visibility
  const router = useRouter(); // ✅ Enables navigation

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true); // Disable button
  
    // ✅ Simple Client-side Validation
    if (!formData.email || !formData.password) {
      setError("Both email and password are required.");
      setLoading(false);
      return;
    }
  
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Invalid email format.");
      setLoading(false);
      return;
    }
  
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
      console.log("Login API Response:", data); // 🔍 Log API response
  
      if (!response.ok) {
        throw new Error(data.error || "Login failed. Please try again.");
      }
  
      // ✅ Save User Data to Local Storage for the Dashboard
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        throw new Error("User data is missing from the response.");
      }
  
      alert("Login successful!"); // Temporary alert (Replace with redirection logic)
      router.push("/dashboard"); // ✅ Redirect user after successful login
  
    } catch (error: any) {
      console.error("Login error:", error); // 🔍 Log error in console
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded-lg w-96">
        <h2 className="text-2xl font-bold text-center text-gold">Welcome Back</h2>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>} {/* Displays error messages */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full p-3 border rounded"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full p-3 border rounded pr-10"
              required
            />
            {/* 👁 Password Visibility Toggle */}
            <button
              type="button"
              className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          <button
            type="submit"
            className={`w-full py-3 bg-blue-500 text-white rounded ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* ➡️ Forgot Password - Redirect Fixed ✅ */}
        <p className="text-center mt-4">
          <a href="/reset-password" className="text-red-500 hover:underline">
            Forgot Password?
          </a>
        </p>

        <p className="text-center mt-4">
          Don't have an account?{" "}
          <a href="/signup" className="text-green-500 hover:underline">Sign Up</a>
        </p>
      </div>
    </div>
  );
}