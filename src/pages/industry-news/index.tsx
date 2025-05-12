import Link from "next/link";
import Head from "next/head";
import { industryNewsData, IndustryNews } from "../../lib/IndustryNewsEntry";

const IndustryNewsIndex: React.FC = () => (
  <>
    <Head>
      <title>Industry News & Trends</title>
    </Head>
    <main className="bg-gray-900 text-white min-h-screen">
      <section className="container mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-extrabold text-gold">
          Industry News & Trends
        </h1>
        <ul className="space-y-6">
          {industryNewsData.map((item: IndustryNews) => (
            <li
              key={item.id}
              className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition"
            >
              <h2 className="text-2xl font-bold text-gold">{item.title}</h2>
              <p className="mt-2">{item.summary}</p>

              <Link
                href={`/industry-news/${item.slug}`}
                className="mt-4 inline-block text-gold underline"
              >
                Read full article →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  </>
);

export default IndustryNewsIndex;
