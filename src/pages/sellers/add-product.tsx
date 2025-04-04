'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function AddProductPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Beauty & Grooming');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    formData.append('folder', category);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setImageUrl(data.secure_url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/marketplace/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        price,
        category,
        imageUrl,
        stockQuantity,
        sellerId: 'demo_seller',
      }),
    });

    const result = await res.json();
    if (result.success) {
      setSuccess(true);
      setName('');
      setDescription('');
      setPrice('');
      setCategory('Beauty & Grooming');
      setStockQuantity(0);
      setImageUrl('');
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white px-4 py-16 overflow-hidden">
      {/* Background Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 z-0"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 z-0" />

      <div className="relative z-10 max-w-3xl mx-auto bg-gray-900 bg-opacity-90 border border-gold rounded-xl p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-gold text-center mb-6">
          Add a New Product
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-gold"
            required
          />

          <textarea
            placeholder="Product Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-gold"
            required
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-gold"
            required
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg focus:ring-2 focus:ring-gold"
          >
            <option value="Beauty & Grooming">Beauty & Grooming</option>
            <option value="Clothing & Fashion">Clothing & Fashion</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Home & Lifestyle">Home & Lifestyle</option>
            <option value="Books & Education">Books & Education</option>
            <option value="Tech & Gadgets">Tech & Gadgets</option>
            <option value="Jewelry & Accessories">Jewelry & Accessories</option>
            <option value="Health & Wellness">Health & Wellness</option>
            <option value="Baby & Kids">Baby & Kids</option>
            <option value="Art & Culture">Art & Culture</option>
            <option value="Business & Services">Business & Services</option>
          </select>

          <input
            type="number"
            placeholder="Stock Quantity"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(parseInt(e.target.value))}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-gold"
          />

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Upload Product Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-gray-800 text-white border border-gray-600 px-3 py-2 rounded-lg file:text-white file:bg-gold file:border-0"
            />
            {uploading && (
              <p className="text-sm text-yellow-400 mt-2">Uploading image...</p>
            )}
            {imageUrl && (
              <div className="mt-4">
                <Image
                  src={imageUrl}
                  alt="Preview"
                  width={128}
                  height={128}
                  className="object-cover rounded-lg border border-gold"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-gold to-yellow-500 text-black font-bold py-3 px-6 rounded-lg hover:shadow-xl transform hover:scale-105 transition animate-pulseGlow"
          >
            Save Product
          </button>

          {success && (
            <p className="text-green-500 mt-4 font-semibold text-center">
              ✅ Product saved successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
