// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import NavBar from "@/components/NavBar";
import Footer from "@/components/footer";
import { SessionProvider } from "next-auth/react";
import "leaflet/dist/leaflet.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const router = useRouter();
  useEffect(() => {
    const trackPageView = (url: string) => {
      emitFlowEvent({
        eventType: "page_view",
        pageRoute: url,
        section: "global_navigation",
        source: "app_router",
      });
    };

    trackPageView(router.asPath || "/");
    router.events.on("routeChangeComplete", trackPageView);


    // Blur on PrintScreen
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        document.body.style.filter = "blur(10px)";
        setTimeout(() => {
          document.body.style.filter = "none";
        }, 1500);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      router.events.off("routeChangeComplete", trackPageView);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  return (
    <SessionProvider session={session}>
      <Head>
        {/* ensure proper initial zoom + width on mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Black Wealth Exchange</title>
        <meta
          name="description"
          content="Empowering Black-owned businesses and wealth-building."
        />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
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
