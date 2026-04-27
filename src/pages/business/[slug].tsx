import fs from "node:fs";
import path from "node:path";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import ErrorPage from "next/error";
import clientPromise from "@/lib/mongodb";
import { Spotlight, spotlightData } from "../../lib/SpotlightEntry";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";

type BusinessEntry = {
  name: string;
  imageSrc: string;
  story: string;
  details?: string;
};

interface Props {
  entry: BusinessEntry | null;
}

const DEFAULT_IMAGE = "/images/sponsors/house-draft.jpg";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapDbBusinessToEntry(doc: any): BusinessEntry {
  const name = cleanString(doc?.business_name) || "Business";

  let imageSrc = DEFAULT_IMAGE;
  if (typeof doc?.image === "string" && cleanString(doc.image)) {
    imageSrc = cleanString(doc.image);
  } else if (Array.isArray(doc?.images) && doc.images.length > 0) {
    const first = doc.images[0];
    if (typeof first === "string" && cleanString(first)) {
      imageSrc = cleanString(first);
    } else if (
      first &&
      typeof first.url === "string" &&
      cleanString(first.url)
    ) {
      imageSrc = cleanString(first.url);
    }
  }

  const description =
    cleanString(doc?.description) ||
    `${name} is listed on Black Wealth Exchange.`;

  const website = cleanString(doc?.website);
  const category = cleanString(doc?.category);
  const city = cleanString(doc?.city) || cleanString(doc?.address?.city);
  const state = cleanString(doc?.state) || cleanString(doc?.address?.state);
  const location = [city, state].filter(Boolean).join(", ");

  const detailParts: string[] = [];
  if (category)
    detailParts.push(`<p><strong>Category:</strong> ${category}</p>`);
  if (location)
    detailParts.push(`<p><strong>Location:</strong> ${location}</p>`);
  if (website)
    detailParts.push(
      `<p><strong>Website:</strong> <a href="${website}" target="_blank" rel="noreferrer">${website}</a></p>`,
    );

  return {
    name,
    imageSrc,
    story: description,
    details: sanitizeRichHtml(detailParts.join("")),
  };
}

function loadFallbackBusinessBySlug(slug: string): BusinessEntry | null {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "black_owned_geocoded.json",
    );
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const hit = parsed.find((item: any) => {
      const alias = cleanString(item?.alias || item?.slug);
      return alias === slug;
    });

    if (!hit) return null;

    return mapDbBusinessToEntry({
      business_name: hit.business_name,
      description: hit.description,
      website: hit.website,
      category: hit.category || hit.display_categories,
      image: hit.image,
      images: hit.images,
      city: hit.city,
      state: hit.state,
      address: hit.address,
    });
  } catch {
    return null;
  }
}

const BusinessDetail: NextPage<Props> = ({ entry }) => {
  if (!entry) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <main className="bg-gray-900 text-white min-h-screen">
      <section className="container mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-extrabold text-gold">{entry.name}</h1>

        <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-xl">
          <Image
            src={entry.imageSrc}
            alt={entry.name}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        <article className="prose prose-invert lg:prose-lg max-w-none">
          <p>{entry.story}</p>

          {entry.details && (
            <div
              className="mt-6"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(entry.details) }}
            />
          )}
        </article>
      </section>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
}) => {
  const slug = String(params?.slug || "").trim();
  if (!slug) return { notFound: true };

  const spotlight = (spotlightData as Spotlight[]).find(
    (item) => item.slug === slug,
  );
  if (spotlight) {
    return {
      props: {
        entry: {
          name: spotlight.name,
          imageSrc: spotlight.imageSrc,
          story: spotlight.story,
          details: spotlight.details,
        },
      },
    };
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db();

    const doc = await db.collection("businesses").findOne(
      {
        $or: [{ slug }, { alias: slug }],
        status: { $nin: ["rejected", "archived"] },
      },
      {
        projection: {
          business_name: 1,
          description: 1,
          image: 1,
          images: 1,
          website: 1,
          category: 1,
          city: 1,
          state: 1,
          address: 1,
        },
      },
    );

    if (!doc) {
      const fallback = loadFallbackBusinessBySlug(slug);
      if (!fallback) return { notFound: true };
      return { props: { entry: fallback } };
    }

    return {
      props: {
        entry: mapDbBusinessToEntry(doc),
      },
    };
  } catch {
    const fallback = loadFallbackBusinessBySlug(slug);
    if (!fallback) return { notFound: true };
    return { props: { entry: fallback } };
  }
};

export default BusinessDetail;
