import Link from "next/link";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/router";

// Define a type for the InvestmentCard props.
interface InvestmentCardProps {
  bgColor: string;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
  iconSrc?: string;
  ariaLabel: string;
}

function InvestmentCard({
  bgColor,
  title,
  description,
  link,
  linkLabel,
  iconSrc,
  ariaLabel,
}: InvestmentCardProps) {
  return (
    <div
      className={`p-4 ${bgColor} font-semibold rounded-lg shadow-md transform transition-transform hover:scale-105 hover:shadow-xl border border-gold`}
    >
      {iconSrc && (
        <div className="flex justify-center mb-4">
          <Image src={iconSrc} alt={`${title} icon`} width={48} height={48} />
        </div>
      )}
      <h3 className="text-xl font-bold text-gold">{title}</h3>
      <p className="mt-2 text-sm text-gray-300">{description}</p>
      <Link href={link} passHref>
        <button
          aria-label={ariaLabel}
          className="mt-3 px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
        >
          {linkLabel}
        </button>
      </Link>
    </div>
  );
}

export default function BlackOwnedStocks() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg border border-gold">
        {/* Updated Back Button to Redirect to Home Page */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
        >
          ← Back to Home
        </button>

        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gold">
            Explore Black-Owned Publicly Traded Companies
          </h1>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "RLJ Lodging Trust", slug: "rlj-lodging-trust" },
            { title: "Urban One", slug: "urban-one" },
            { title: "Carver Bancorp", slug: "carver-bancorp" },
            { title: "Broadway Financial", slug: "broadway-financial" },
            { title: "Axsome Therapeutics", slug: "axsome-therapeutics" },
            {
              title: "American Shared Hospital Services",
              slug: "american-shared-hospital-services",
            },
          ].map(({ title, slug }) => (
            <InvestmentCard
              key={slug}
              bgColor="bg-gray-700"
              title={title}
              description={`Explore ${title}'s performance and impact stories.`}
              link={`/company/${slug}`}
              linkLabel="View Performance & Impact"
              iconSrc={`/icons/${slug}.png`}
              ariaLabel={`Explore ${title}`}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
