// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* optional: sets Android address‑bar color */}
        <meta name="theme-color" content="#000000" />
      </Head>
      <body className="bg-black antialiased overflow-x-hidden">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
