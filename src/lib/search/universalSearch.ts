import { ObjectId, type Db } from "mongodb";
import { publicBusinessBaseQuery } from "@/lib/directory/publicBusinessQuery";
import {
  buildPublicMarketplaceVisibilityFilter,
  getPublicMarketplaceSellerName,
} from "@/lib/marketplace/publicCatalog";
import { getStudentHubResolvedCatalog } from "@/lib/studentHub/repository";
import { deriveStudentHubLifecycle } from "@/lib/studentHub/lifecycle";

export type UniversalSearchDomain =
  | "business"
  | "product"
  | "job"
  | "opportunity";

export type UniversalSearchTrust = {
  verified?: boolean;
  claimed?: boolean;
  sponsored?: boolean;
  approved?: boolean;
  source?: string | null;
};

export type UniversalSearchResult = {
  domain: UniversalSearchDomain;
  type: UniversalSearchDomain;
  id: string;
  title: string;
  description: string;
  url: string;
  location?: string | null;
  image?: string | null;
  trust?: UniversalSearchTrust | null;
  relevanceScore: number;
  data: Record<string, unknown>;
  // Domain-specific "what/why/where" fields (P3-02). All optional and only
  // populated from existing authoritative fields -- never inferred.
  category?: string | null;
  price?: number | null;
  sellerName?: string | null;
  jobType?: string | null;
  opportunityType?: string | null;
  eligibility?: string | null;
  deadline?: string | null;
};

export type UniversalSearchResponse = {
  query: string;
  domainsSearched: UniversalSearchDomain[];
  total: number;
  results: UniversalSearchResult[];
  countsByDomain: Record<UniversalSearchDomain, number>;
};

const ALL_DOMAINS: UniversalSearchDomain[] = [
  "business",
  "product",
  "job",
  "opportunity",
];

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function s(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function shorten(text: string, max = 160) {
  const clean = s(text);
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Lightweight relevance score for a cross-domain preview. This is
 * intentionally simpler than the dedicated directory/marketplace ranking —
 * those remain the source of truth for their own pages. Domain results are
 * scored purely on textual match strength so no domain is artificially
 * favored to "balance" the list.
 */
function scoreMatch(haystacks: string[], query: string) {
  const q = query.toLowerCase();
  let best = 0;
  for (const raw of haystacks) {
    const text = raw.toLowerCase();
    if (!text) continue;
    if (text === q) best = Math.max(best, 100);
    else if (text.startsWith(q)) best = Math.max(best, 70);
    else if (text.includes(` ${q}`) || text.includes(`${q} `))
      best = Math.max(best, 55);
    else if (text.includes(q)) best = Math.max(best, 35);
  }
  return best;
}

async function searchBusinessesDomain(
  db: Db,
  query: string,
  limit: number,
): Promise<UniversalSearchResult[]> {
  const rx = new RegExp(escapeRegex(query), "i");
  const docs = await db
    .collection("businesses")
    .find({
      $and: [
        publicBusinessBaseQuery(),
        {
          $or: [
            { business_name: rx },
            { businessName: rx },
            { name: rx },
            { description: rx },
            { categories: rx },
            { display_categories: rx },
            { category: rx },
            { city: rx },
            { state: rx },
          ],
        },
      ],
    })
    .project({
      _id: 1,
      business_name: 1,
      businessName: 1,
      name: 1,
      description: 1,
      alias: 1,
      slug: 1,
      city: 1,
      state: 1,
      image: 1,
      isVerified: 1,
      verified: 1,
      sponsored: 1,
      status: 1,
      category: 1,
      display_categories: 1,
      claimStage: 1,
    })
    .limit(limit)
    .toArray();

  return docs.map((doc: any) => {
    const title =
      s(doc.business_name) || s(doc.businessName) || s(doc.name) || "Business";
    const publicRouteIdentity = s(doc.alias) || s(doc.slug);
    const location = [s(doc.city), s(doc.state)].filter(Boolean).join(", ");
    const category = s(doc.display_categories) || s(doc.category);
    return {
      domain: "business" as const,
      type: "business" as const,
      id: String(doc._id),
      title,
      description: shorten(doc.description) || "No description provided.",
      url: publicRouteIdentity
        ? `/business/${encodeURIComponent(publicRouteIdentity)}`
        : "/business-directory",
      location: location || null,
      image: s(doc.image) || null,
      category: category || null,
      trust: {
        // Verification-field drift fix (2026-09-07): `verified` is
        // canonical; isVerified is a deprecated mirror, no longer read
        // independently.
        verified: Boolean(doc.verified),
        claimed: s(doc.claimStage) === "ownership_verified",
        sponsored: Boolean(doc.sponsored),
        source: "businesses",
      },
      relevanceScore: scoreMatch(
        [title, s(doc.description), s(doc.category), s(doc.display_categories)],
        query,
      ),
      data: doc,
    };
  });
}

async function searchProductsDomain(
  db: Db,
  query: string,
  limit: number,
): Promise<UniversalSearchResult[]> {
  const rx = new RegExp(escapeRegex(query), "i");
  const docs = await db
    .collection("products")
    .find({
      $and: [
        buildPublicMarketplaceVisibilityFilter(),
        {
          $or: [
            { name: rx },
            { title: rx },
            { description: rx },
            { category: rx },
          ],
        },
      ],
    })
    .project({
      _id: 1,
      name: 1,
      title: 1,
      description: 1,
      category: 1,
      imageUrl: 1,
      price: 1,
      isFeatured: 1,
      slug: 1,
      sellerId: 1,
    })
    .limit(limit)
    .toArray();

  const sellerIds = Array.from(
    new Set(docs.map((doc: any) => s(doc.sellerId)).filter(Boolean)),
  );
  const sellerObjectIds = sellerIds.filter((id) => ObjectId.isValid(id));
  const sellers = sellerIds.length
    ? await db
        .collection("sellers")
        .find({
          $or: [
            { userId: { $in: sellerIds } },
            ...(sellerObjectIds.length
              ? [
                  {
                    _id: { $in: sellerObjectIds.map((id) => new ObjectId(id)) },
                  },
                ]
              : []),
          ],
        })
        .project({
          _id: 1,
          userId: 1,
          storeName: 1,
          businessName: 1,
          ownerName: 1,
          name: 1,
        })
        .toArray()
    : [];
  const sellerByKey = new Map<string, any>();
  for (const seller of sellers) {
    const sid = s(seller?._id);
    const uid = s(seller?.userId);
    if (sid) sellerByKey.set(sid, seller);
    if (uid) sellerByKey.set(uid, seller);
  }

  return docs.map((doc: any) => {
    const title = s(doc.name) || s(doc.title) || "Product";
    const seller = sellerByKey.get(s(doc.sellerId));
    const price = Number(doc.price);
    return {
      domain: "product" as const,
      type: "product" as const,
      id: String(doc._id),
      title,
      description: shorten(doc.description) || "No description provided.",
      url: `/marketplace/product/${String(doc._id)}`,
      location: null,
      image: s(doc.imageUrl) || null,
      category: s(doc.category) || null,
      price: Number.isFinite(price) ? price : null,
      sellerName: getPublicMarketplaceSellerName(seller),
      trust: {
        sponsored: Boolean(doc.isFeatured),
        source: "products",
      },
      relevanceScore: scoreMatch(
        [title, s(doc.description), s(doc.category)],
        query,
      ),
      data: doc,
    };
  });
}

async function searchJobsDomain(
  db: Db,
  query: string,
  limit: number,
): Promise<UniversalSearchResult[]> {
  const rx = new RegExp(escapeRegex(query), "i");
  const docs = await db
    .collection("jobs")
    .find({
      status: "approved",
      $or: [
        { title: rx },
        { company: rx },
        { description: rx },
        { location: rx },
      ],
    })
    .project({
      _id: 1,
      title: 1,
      company: 1,
      location: 1,
      description: 1,
      isFeatured: 1,
      type: 1,
    })
    .limit(limit)
    .toArray();

  return docs.map((doc: any) => {
    const title = s(doc.title) || "Job";
    const companyName = s(doc.company);
    return {
      domain: "job" as const,
      type: "job" as const,
      id: String(doc._id),
      title,
      description:
        shorten(doc.description) ||
        (companyName
          ? `Opportunity at ${companyName}.`
          : "No description provided."),
      url: `/job/${String(doc._id)}`,
      jobType: s(doc.type) || null,
      location: s(doc.location) || null,
      image: null,
      trust: {
        approved: true,
        sponsored: Boolean(doc.isFeatured),
        source: "jobs",
      },
      relevanceScore: scoreMatch(
        [title, companyName, s(doc.description)],
        query,
      ),
      data: doc,
    };
  });
}

async function searchOpportunitiesDomain(
  query: string,
  limit: number,
): Promise<UniversalSearchResult[]> {
  const { records } = await getStudentHubResolvedCatalog({});
  const q = query.toLowerCase();

  const matches = records
    .map((record) => {
      const lifecycle = deriveStudentHubLifecycle(record);
      return { record, lifecycle };
    })
    .filter(({ record, lifecycle }) => {
      if (lifecycle.status === "closed") return false;
      if (record.brokenLink) return false;
      const haystack = [
        record.title,
        record.organization,
        record.description,
        record.eligibilitySummary,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, limit);

  return matches.map(({ record }) => ({
    domain: "opportunity" as const,
    type: "opportunity" as const,
    id: record.id,
    title: record.title,
    description: shorten(record.description) || "No description provided.",
    url:
      record.applicationUrl ||
      record.sourceUrl ||
      "/black-student-opportunities",
    location: record.location || null,
    image: null,
    opportunityType: record.opportunityType || null,
    eligibility:
      s(record.targetAudience) || s(record.eligibilitySummary) || null,
    deadline: record.deadline || null,
    trust: {
      verified: Boolean(record.sourceVerified && record.applicationUrlVerified),
      source: record.source || "student_hub",
    },
    relevanceScore: scoreMatch(
      [record.title, record.organization, record.description],
      query,
    ),
    data: record,
  }));
}

export type ResolveUniversalSearchOptions = {
  query: string;
  domains?: UniversalSearchDomain[];
  limitPerDomain?: number;
};

export async function resolveUniversalSearch(
  db: Db,
  options: ResolveUniversalSearchOptions,
): Promise<UniversalSearchResponse> {
  const query = s(options.query);
  const limitPerDomain = Math.max(
    1,
    Math.min(50, Number(options.limitPerDomain || 20)),
  );
  const domainsSearched =
    options.domains && options.domains.length
      ? options.domains.filter((d) => ALL_DOMAINS.includes(d))
      : ALL_DOMAINS;

  if (!query) {
    return {
      query,
      domainsSearched,
      total: 0,
      results: [],
      countsByDomain: { business: 0, product: 0, job: 0, opportunity: 0 },
    };
  }

  const tasks: Array<Promise<UniversalSearchResult[]>> = [];
  if (domainsSearched.includes("business")) {
    tasks.push(searchBusinessesDomain(db, query, limitPerDomain));
  }
  if (domainsSearched.includes("product")) {
    tasks.push(searchProductsDomain(db, query, limitPerDomain));
  }
  if (domainsSearched.includes("job")) {
    tasks.push(searchJobsDomain(db, query, limitPerDomain));
  }
  if (domainsSearched.includes("opportunity")) {
    tasks.push(searchOpportunitiesDomain(query, limitPerDomain));
  }

  const settled = await Promise.allSettled(tasks);
  const allResults: UniversalSearchResult[] = [];
  for (const outcome of settled) {
    if (outcome.status === "fulfilled") allResults.push(...outcome.value);
  }

  allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const countsByDomain: Record<UniversalSearchDomain, number> = {
    business: 0,
    product: 0,
    job: 0,
    opportunity: 0,
  };
  for (const result of allResults) {
    countsByDomain[result.domain] += 1;
  }

  return {
    query,
    domainsSearched,
    total: allResults.length,
    results: allResults,
    countsByDomain,
  };
}
