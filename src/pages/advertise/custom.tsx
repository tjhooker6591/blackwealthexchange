"use client";

import React from "react";
import Link from "next/link";

export default function CustomAdPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gold mb-4">
        Custom Advertising Solutions
      </h1>
      <p className="text-lg text-gray-400 max-w-xl mb-6">
        Need something tailored just for you? We are working on offering fully
        customized advertising solutions to help you reach your ideal audience
        with precision.
      </p>
      <Link href="/advertise-form">
        <button className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition">
          Back to Ad Options
        </button>
      </Link>
    </div>
  );
}
