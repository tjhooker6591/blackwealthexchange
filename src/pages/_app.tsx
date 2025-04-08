import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import Footer from "@/components/footer";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Global <head> settings */}
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <title>Black Wealth Exchange</title>
        <meta
          name="description"
          content="Empowering Black-owned businesses and wealth-building."
        />
      </Head>

      {/* Global navigation */}
      <NavBar />

      {/* Page layout wrapper */}
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <Component {...pageProps} />
      </main>

      {/* Global footer */}
      <Footer />
    </>
  );
}
