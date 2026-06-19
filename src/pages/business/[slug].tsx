import fs from "node:fs";
import path from "node:path";
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import ErrorPage from "next/error";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import clientPromise from "@/lib/mongodb";
import { Spotlight, spotlightData } from "../../lib/SpotlightEntry";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";

type BusinessEntry = {
  name: string;
  imageSrc: string | null;
  story: string;
  details: string | null;
  category: string | null;
  categoriesText: string | null;
  location: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  sourceUrl: string | null;
  status: string | null;
  isSponsored: boolean;
  isStrongProfile: boolean;
  directionsUrl: string | null;
  reference: string | null;
};

interface Props {
  entry: BusinessEntry | null;
  slug: string;
}


function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapDbBusinessToEntry(doc: any): BusinessEntry {
  const name = cleanString(doc?.business_name) || "Business";

  let imageSrc = "";
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
  const category = cleanString(doc?.category || doc?.display_categories);
  const categoriesText = cleanString(
    [doc?.display_categories, doc?.categories, doc?.category]
      .filter(Boolean)
      .join(" • "),
  );
  const city = cleanString(doc?.city) || cleanString(doc?.address?.city);
  const state = cleanString(doc?.state) || cleanString(doc?.address?.state);
  const address = cleanString(doc?.address);
  const location = [city, state].filter(Boolean).join(", ") || address;
  const status = cleanString(doc?.status || doc?.trustStatus).toLowerCase() || null;
  const isSponsored = Number(doc?.amountPaid || 0) > 0;
  const isStrongProfile =
    doc?.isComplete === true ||
    Number(doc?.qualityScore || 0) >= 70 ||
    Number(doc?.completenessScore || 0) >= 70;
  const directionsQuery = cleanString([address, city, state].filter(Boolean).join(", "));
  const directionsUrl = directionsQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`
    : null;

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
    imageSrc: imageSrc || null,
    story: description,
    details: sanitizeRichHtml(detailParts.join("")) || null,
    category: category || null,
    categoriesText: categoriesText || null,
    location: location || null,
    address: address || null,
    website: website || null,
    phone: cleanString(doc?.phone) || null,
    sourceUrl: cleanString(doc?.sourceUrl || doc?.source) || null,
    status,
    isSponsored,
    isStrongProfile,
    directionsUrl,
    reference: cleanString(doc?.source || doc?.sourceUrl || doc?.placeId) || null,
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

const BusinessDetail: NextPage<Props> = ({ entry, slug }) => {
  if (!entry) {
    return <ErrorPage statusCode={404} />;
  }

  const title = `${entry.name} | Black Business Directory | Black Wealth Exchange`;
  const description = truncateMeta(
    entry.story ||
      `${entry.name} is listed on Black Wealth Exchange. Explore business details and trusted directory information.`,
  );
  const canonical = canonicalUrl(`/business/${encodeURIComponent(slug)}`);
  const image = entry.imageSrc;
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: entry.name,
    description,
    image: image || undefined,
    url: canonical,
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        {image ? <meta property="og:image" content={image} /> : null}
        <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image ? <meta name="twitter:image" content={image} /> : null}
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      <main className="min-h-screen bg-black text-white">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
        <section className="relative max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-300 leading-tight">{entry.name}</h1>
                <div className="mt-1 sm:mt-2 text-white/70 text-sm sm:text-base">{entry.location || ""}</div>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                  {entry.category ? <span className="text-[11px] sm:text-xs rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-yellow-200">{entry.category}</span> : null}
                  {!entry.isSponsored ? <span className="text-[11px] sm:text-xs rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 sm:px-3 sm:py-1 text-white/80">Organic Listing</span> : <span className="text-[11px] sm:text-xs rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-yellow-200">Sponsored</span>}
                  {entry.isStrongProfile ? <span className="text-[11px] sm:text-xs rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-indigo-200">Strong Profile</span> : null}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2 w-full md:w-auto">
                {entry.website ? (
                  <a href={entry.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-yellow-500 text-black font-semibold text-sm px-3 py-2 hover:bg-yellow-400 transition">Visit website</a>
                ) : null}
                {entry.phone ? (
                  <a href={`tel:${String(entry.phone).replace(/\s+/g, "")}`} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm px-3 py-2 transition">Call</a>
                ) : null}
                {entry.sourceUrl ? (
                  <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm px-3 py-2 transition">Source</a>
                ) : null}
                {entry.directionsUrl ? (
                  <a href={entry.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm px-3 py-2 transition">Get directions</a>
                ) : null}
              </div>
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-5">
                {entry.imageSrc ? (
                  <div className="relative w-full h-72 rounded-xl overflow-hidden mb-4">
                    <Image src={entry.imageSrc} alt={entry.name} fill style={{ objectFit: "cover" }} priority />
                  </div>
                ) : null}
                <div className="text-sm font-semibold text-white/90 mb-2">About</div>
                {entry.categoriesText ? <div className="text-white/60 text-sm mb-2">{entry.categoriesText}</div> : null}
                <div className="text-white/75 leading-relaxed">{entry.story || "Business details are being expanded."}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                <div className="text-sm font-semibold text-white/90">Details</div>
                {entry.details ? (
                  <div className="text-sm text-white/75" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(entry.details) }} />
                ) : (
                  <div className="text-sm text-white/60">No additional details yet.</div>
                )}
                {entry.reference ? <div className="text-xs text-white/50 pt-2">Reference: {entry.reference}</div> : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
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
          imageSrc: cleanString(spotlight.imageSrc) || null,
          story: cleanString(spotlight.story) || `${cleanString(spotlight.name) || "Business"} is listed on Black Wealth Exchange.`,
          details: cleanString(spotlight.details) || null,
          category: null,
          location: null,
          website: null,
          phone: null,
          sourceUrl: null,
          categoriesText: null,
          address: null,
          status: null,
          isSponsored: false,
          isStrongProfile: false,
          directionsUrl: null,
          reference: null,
        },
        slug,
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
          phone: 1,
          sourceUrl: 1,
          source: 1,
          category: 1,
          categories: 1,
          display_categories: 1,
          city: 1,
          state: 1,
          address: 1,
          status: 1,
          trustStatus: 1,
          amountPaid: 1,
          isComplete: 1,
          qualityScore: 1,
          completenessScore: 1,
          placeId: 1,
        },
      },
    );

    if (!doc) {
      const fallback = loadFallbackBusinessBySlug(slug);
      if (!fallback) return { notFound: true };
      return { props: { entry: fallback, slug } };
    }

    return {
      props: {
        entry: mapDbBusinessToEntry(doc),
        slug,
      },
    };
  } catch {
    const fallback = loadFallbackBusinessBySlug(slug);
    if (!fallback) return { notFound: true };
    return { props: { entry: fallback, slug } };
  }
};

export default BusinessDetail;
