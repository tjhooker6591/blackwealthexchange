export function getBaseUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export function canonicalUrl(pathname: string) {
  const base = getBaseUrl().replace(/\/$/, "");
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const [pathOnly] = cleanPath.split("?");
  const normalized = pathOnly.replace(/\/$/, "") || "/";
  return `${base}${normalized}`;
}

export function robotsDirective(options?: {
  noindex?: boolean;
  nofollow?: boolean;
}) {
  const noindex = Boolean(options?.noindex);
  const nofollow = Boolean(options?.nofollow);
  if (!noindex && !nofollow) return "index,follow";
  if (noindex && nofollow) return "noindex,nofollow";
  if (noindex) return "noindex,follow";
  return "index,nofollow";
}

export function truncateMeta(input: string, max = 155) {
  const v = (input || "").trim();
  if (v.length <= max) return v;
  return `${v.slice(0, max - 1).trim()}…`;
}
