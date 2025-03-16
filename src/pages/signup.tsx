import { useState } from "react";

export default function Signup() {
  const [accountType, setAccountType] = useState("user"); // Default to "user"
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "", // Added for business account
    businessAddress: "", // Added for business account
    businessPhone: "", // Added for business account
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to validate email format
  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // Function to validate password security
  const validatePassword = (password: string) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password,
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Reset errors on input change
  };

  const handleAccountTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAccountType(e.target.value); // Update account type when changed
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Ensure required fields are filled
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required.");
      return;
    }
  
    // Validate email format
    if (!validateEmail(formData.email)) {
      setError("Invalid email format.");
      return;
    }
  
    // Validate password strength
    if (!validatePassword(formData.password)) {
      setError(
        "Password must be at least 8 characters long, include 1 uppercase letter, 1 number, and 1 special character.",
      );
      return;
    }
  
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password, // Password field specified once
          accountType, // Use accountType directly
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          businessPhone: formData.businessPhone,
        }),
      });
  
      // Handle response and reset form data if successful
      if (!response.ok) {
        throw new Error("Failed to create account.");
      }
  
      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        businessAddress: "",
        businessPhone: "",
      });
    } catch {
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 p-6">
      <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gold">
          Create an Account
        </h2>
        <p className="text-center text-gray-600 mt-2">Join the BWE Community</p>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {success && (
          <p className="text-green-500 text-center mt-2">
            Signup Successful! 🎉
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Account Type Selection */}
          <div>
            <label className="block text-Gray-700 font-semibold">
              Account Type
            </label>
            <select
              name="accountType"
              value={accountType}
              onChange={handleAccountTypeChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold text-black bg-gray-200"
            >
              <option value="user">User</option>
              <option value="business">Business</option>
            </select>
          </div>

          {/* Common User Fields */}
          <div>
            <label className="block text-gray-700 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold text-black bg-gray-200"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter a strong password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold text-black bg-gray-200"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold text-black bg-gray-200"
              required
            />
          </div>

          {/* Business Fields (Only shown for business account type) */}
          {accountType === "business" && (
            <>
              <div>
                <label className="block text-gray-700 font-semibold">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold text-black bg-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold">
                  Business Address
                </label>
                <input
                  type="text"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold text-black bg-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold">
                  Business Phone
                </label>
                <input
                  type="text"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold text-black bg-gray-200"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gold text-black font-semibold rounded-lg hover:bg-opacity-90 transition"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-gold font-semibold hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
