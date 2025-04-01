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
        <link rel="icon" href="/images/favicon.ico" />
        <title>Black Wealth Exchange</title>
        <meta
          name="description"
          content="Empowering Black-owned businesses and wealth-building."
        />
      </Head>

      <NavBar />
      <main className="min-h-screen">
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  );
}
