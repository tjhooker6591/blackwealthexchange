"use client";

import Link from "next/link";

export default function MarketplaceTerms() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 max-w-5xl mx-auto">
      <h1 className="text-4xl text-gold font-extrabold mb-6">Marketplace Terms of Use</h1>

      <p className="text-gray-300 mb-6">
        These Marketplace Terms of Use (&quot;Terms&quot;) govern your access to and use of the Black Wealth Exchange Marketplace (&quot;Marketplace&quot;), whether as a buyer or seller. By using this Marketplace, you agree to be legally bound by these Terms. If you do not agree, do not use this Marketplace.
      </p>

      {/* Section: Platform Role and Limitation of Liability */}
      <h2 className="text-2xl text-gold font-bold mt-10 mb-2">1. Platform Role and Limitation of Liability</h2>
      <p className="text-gray-400 mb-6">
        Black Wealth Exchange is a neutral venue that facilitates the listing, sale, and purchase of products between independent sellers and buyers. We do not manufacture, warehouse, inspect, or ship any products. We are not a party to any transaction between buyers and sellers. All contracts for the purchase and sale of goods are entered into directly between the buyer and the seller.
      </p>
      <p className="text-gray-400 mb-6">
        You acknowledge and agree that Black Wealth Exchange shall not be held liable for any damages, losses, liabilities, claims, or expenses arising from or related to any transaction conducted on the Marketplace, including but not limited to product defects, delivery delays, inaccurate listings, misrepresentations, or failure to deliver.
      </p>

      {/* Section: For Buyers */}
      <h2 className="text-2xl text-gold font-bold mt-10 mb-2">2. Buyer Responsibilities</h2>
      <ul className="list-disc list-inside text-gray-400 space-y-2 mb-6">
        <li>You are purchasing from an independent third-party seller, not from Black Wealth Exchange.</li>
        <li>You must carefully review product details, pricing, seller policies, shipping costs, and estimated delivery times before placing an order.</li>
        <li>All payments are final unless otherwise agreed by the seller. Refunds and returns are solely handled by the seller, not Black Wealth Exchange.</li>
        <li>In the event of a dispute or claim, you must contact the seller directly to resolve the matter. We do not mediate or arbitrate disputes.</li>
        <li>You agree to hold Black Wealth Exchange harmless from any claims, damages, or losses resulting from your transaction with a seller.</li>
      </ul>

      {/* Section: For Sellers */}
      <h2 className="text-2xl text-gold font-bold mt-10 mb-2">3. Seller Responsibilities</h2>
      <ul className="list-disc list-inside text-gray-400 space-y-2 mb-6">
        <li>You represent and warrant that you have legal authority to sell the products you list and that your listings are accurate, lawful, and not misleading.</li>
        <li>You are solely responsible for setting prices, shipping costs, taxes, and handling all logistics, including fulfillment and delivery.</li>
        <li>You must honor all orders received through the Marketplace in accordance with your stated terms and fulfill them promptly.</li>
        <li>Black Wealth Exchange collects a platform service fee or commission on each transaction. Sellers agree to these deductions as part of using the platform.</li>
        <li>You assume all liability for any product sold, including safety, compliance, and customer service obligations.</li>
        <li>Black Wealth Exchange reserves the right to suspend or remove any seller for failure to meet performance standards or violations of these Terms.</li>
      </ul>

      {/* Section: No Warranty */}
      <h2 className="text-2xl text-gold font-bold mt-10 mb-2">4. No Warranty</h2>
      <p className="text-gray-400 mb-6">
        The Marketplace is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind. Black Wealth Exchange makes no warranties or representations regarding the quality, safety, legality, or fitness for a particular purpose of any product listed. All warranties, express or implied, are hereby disclaimed to the fullest extent permitted by law.
      </p>

      {/* Section: Indemnification */}
      <h2 className="text-2xl text-gold font-bold mt-10 mb-2">5. Indemnification</h2>
      <p className="text-gray-400 mb-6">
        To the maximum extent permitted by law, you agree to indemnify, defend, and hold harmless Black Wealth Exchange, its officers, directors, agents, and affiliates from any claims, liabilities, damages, losses, and expenses (including attorney fees) arising out of or in any way connected with your use of the Marketplace, your transactions, or your violation of these Terms.
      </p>

      {/* Section: Modifications and Termination */}
      <h2 className="text-2xl text-gold font-bold mt-10 mb-2">6. Modifications and Termination</h2>
      <p className="text-gray-400 mb-6">
        Black Wealth Exchange reserves the right to modify these Terms at any time by posting updates to this page. Continued use of the Marketplace after such changes constitutes your acceptance. We may suspend or terminate access to the Marketplace at our discretion, with or without cause or notice.
      </p>

      {/* Section: Governing Law */}
      <h2 className="text-2xl text-gold font-bold mt-10 mb-2">7. Governing Law</h2>
      <p className="text-gray-400 mb-6">
        These Terms shall be governed by and construed in accordance with the laws of the State of Nevada, without regard to its conflict of law principles. You agree to submit to the exclusive jurisdiction of the courts located in Washoe County, Nevada for any dispute arising under these Terms.
      </p>

      {/* Back to Home Link */}
      <Link href="/" className="inline-block mt-4 text-gold underline hover:text-white">
        Back to Home
      </Link>
    </div>
  );
}
