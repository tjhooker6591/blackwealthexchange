// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { canonicalUrl, getBaseUrl } from "@/lib/seo";
import NavBar from "@/components/NavBar";
import Footer from "@/components/footer";
import { SessionProvider } from "next-auth/react";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const router = useRouter();
  const currentPath = router.asPath?.split("?")[0] || "/";
  const canonical = canonicalUrl(currentPath);
  const site = getBaseUrl();
  useEffect(() => {
    // Keep app-level side effects intentionally minimal for performance and usability.
  }, []);

  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta property="og:site_name" content="Black Wealth Exchange" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@BlackWealthX" />
        <link rel="canonical" href={canonical} />
        <link rel="preconnect" href="https://checkout.stripe.com" />
        <link rel="dns-prefetch" href="https://checkout.stripe.com" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="sitemap" type="application/xml" title="Sitemap" href={`${site}/sitemap.xml`} />
      </Head>

      {/* Global Header / Navigation */}
      <NavBar />

      {/* Page Content */}
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <Component {...pageProps} />
      </main>

      {/* Global Footer */}
      <Footer />
    </SessionProvider>
  );
}
