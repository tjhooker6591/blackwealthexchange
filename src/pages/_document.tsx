// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ensures proper initial zoom + width on mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* optional: sets Android address‑bar color */}
        <meta name="theme-color" content="#000000" />
      </Head>

      {/* antialiased text, black site‑wide bg, no horizontal scroll */}
      <body className="bg-black antialiased overflow-x-hidden">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
