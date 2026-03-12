import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/router";
import { canonicalUrl } from "@/lib/seo";

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function safeExternal(v: string) {
  if (!v) return "";
  try {
    const u = new URL(v);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return "";
  } catch {
    return "";
  }
}

export default function FeaturedBusinessPage() {
  const router = useRouter();

  const name = s(Array.isArray(router.query.name) ? router.query.name[0] : router.query.name) || "Featured Business";
  const tagline = s(Array.isArray(router.query.tagline) ? router.query.tagline[0] : router.query.tagline);
  const img = s(Array.isArray(router.query.img) ? router.query.img[0] : router.query.img) || "/images/house-draft.jpg";
  const target = safeExternal(s(Array.isArray(router.query.target) ? router.query.target[0] : router.query.target));

  const title = `${name} | Featured Business | Black Wealth Exchange`;
  const canonical = useMemo(() => canonicalUrl(`/featured?name=${encodeURIComponent(name)}`), [name]);

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={tagline || `${name} is currently featured on Black Wealth Exchange.`} />
        <link rel="canonical" href={canonical} />
      </Head>

      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-xs font-bold uppercase tracking-wide text-[#D4AF37]">Featured business</div>
        <h1 className="mt-2 text-3xl font-extrabold text-[#F1D57A]">{name}</h1>
        {tagline ? <p className="mt-2 text-white/80">{tagline}</p> : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <img src={img} alt={name} className="h-56 w-full object-cover" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {target ? (
            <a href={target} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400">
              Visit business website
            </a>
          ) : null}
          <Link href={`/business-directory?search=${encodeURIComponent(name)}`} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10">
            Find in business directory
          </Link>
          <Link href="/business-directory" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10">
            Back to directory
          </Link>
        </div>
      </div>
    </main>
  );
}
