// pages/_app.tsx

import "../styles/globals.css"; // Tailwind + other global CSS
import type { AppProps } from "next/app";
import NavBar from "@/components/NavBar"; // Alias import if configured in tsconfig.json

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Global NavBar appears on every page */}
      <NavBar />

      {/* The specific page content */}
      <Component {...pageProps} />
    </>
  );
}
