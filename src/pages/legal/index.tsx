// pages/legal/index.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";

const LegalIndex = () => {
  return (
    <>
      <Head>
        <title>Legal | Black Wealth Exchange</title>
      </Head>
      <div className="max-w-2xl mx-auto px-4 py-12 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Legal & Policies</h1>
        <p className="mb-8 text-base">
          Review our official platform policies and terms. Your use of Black
          Wealth Exchange means you agree to these policies.
        </p>
        <ul className="space-y-4 text-lg">
          <li>
            <Link
              href="/terms-of-service"
              className="text-blue-600 hover:underline"
            >
              Terms of Service
            </Link>
          </li>
          <li>
            <Link
              href="/privacy-policy"
              className="text-blue-600 hover:underline"
            >
              Privacy Policy
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default LegalIndex;
