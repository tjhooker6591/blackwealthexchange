import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
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

function normalizeSponsorImagePath(v: string) {
  const value = s(v);
  if (!value) return "/images/sponsors/house-draft.jpg";

  const aliases: Record<string, string> = {
    "/images/sponsors/guardiansoftheforgottenrealm.jpg":
      "/images/sponsors/Guardiansoftheforgottenrealm.jpg",
    "/images/sponsors/Guardiansoftheforgottenreleam.jpg":
      "/images/sponsors/Guardiansoftheforgottenrealm.jpg",
    "/images/sponsors/guardiansoftheforgottenreleam.jpg":
      "/images/sponsors/Guardiansoftheforgottenrealm.jpg",
    "/images/sponsors/pamfaunitedcitizens.jpg":
      "/images/sponsors/pamfaunitedcitizen.jpg",
  };

  return aliases[value] || value;
}

function getQueryValue(
  raw: string | string[] | undefined,
  fallbackValue: string,
) {
  if (Array.isArray(raw)) return s(raw[0]) || fallbackValue;
  return s(raw) || fallbackValue;
}

export default function FeaturedBusinessPage() {
  const router = useRouter();

  const queryFromAsPath = useMemo(() => {
    const asPath = router.asPath || "";
    const queryIndex = asPath.indexOf("?");

    if (queryIndex === -1) return new URLSearchParams();

    return new URLSearchParams(asPath.slice(queryIndex + 1));
  }, [router.asPath]);

  const name = useMemo(() => {
    const fromRouter = getQueryValue(router.query.name, "");
    const fromAsPath = s(queryFromAsPath.get("name"));
    return fromRouter || fromAsPath || "Featured Business";
  }, [router.query.name, queryFromAsPath]);

  const tagline = useMemo(() => {
    const fromRouter = getQueryValue(router.query.tagline, "");
    const fromAsPath = s(queryFromAsPath.get("tagline"));
    return fromRouter || fromAsPath || "";
  }, [router.query.tagline, queryFromAsPath]);

  const img = useMemo(() => {
    const fromRouter = getQueryValue(router.query.img, "");
    const fromAsPath = s(queryFromAsPath.get("img"));
    return normalizeSponsorImagePath(fromRouter || fromAsPath);
  }, [router.query.img, queryFromAsPath]);

  const target = useMemo(() => {
    const fromRouter = getQueryValue(router.query.target, "");
    const fromAsPath = s(queryFromAsPath.get("target"));
    return safeExternal(fromRouter || fromAsPath);
  }, [router.query.target, queryFromAsPath]);

  const title = `${name} | Featured Business | Black Wealth Exchange`;
  const canonical = useMemo(
    () => canonicalUrl(`/featured?name=${encodeURIComponent(name)}`),
    [name],
  );

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={
            tagline || `${name} is currently featured on Black Wealth Exchange.`
          }
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-xs font-bold uppercase tracking-wide text-[#D4AF37]">
          Featured business
        </div>

        <h1 className="mt-2 text-3xl font-extrabold text-[#F1D57A]">{name}</h1>

        {tagline ? <p className="mt-2 text-white/80">{tagline}</p> : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <Image
            src={img}
            alt={name}
            width={1200}
            height={560}
            className="h-56 w-full object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {target ? (
            <a
              href={target}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400"
            >
              Visit business website
            </a>
          ) : null}

          <Link
            href={`/business-directory?search=${encodeURIComponent(name)}`}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
          >
            Find in business directory
          </Link>

          <Link
            href="/business-directory"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
          >
            Back to directory
          </Link>
        </div>
      </div>
    </main>
  );
}
