import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/footer";
import { SessionProvider } from "next-auth/react";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  useEffect(() => {
    // Prevent right-click context menu
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", disableContextMenu);

    // Disable text selection
    document.body.style.userSelect = "none";

    // Prevent image dragging
    const disableImageDrag = () => {
      const imgs = document.querySelectorAll("img");
      imgs.forEach((img) => img.setAttribute("draggable", "false"));
    };
    disableImageDrag(); // Run once on load

    // Optional: Detect PrintScreen and blur content
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        document.body.style.filter = "blur(10px)";
        setTimeout(() => {
          document.body.style.filter = "none";
        }, 1500);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.body.style.userSelect = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <SessionProvider session={session}>
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <title>Black Wealth Exchange</title>
        <meta
          name="description"
          content="Empowering Black-owned businesses and wealth-building."
        />
      </Head>

      <NavBar />

      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <Component {...pageProps} />
      </main>

      <Footer />
    </SessionProvider>
  );
}
