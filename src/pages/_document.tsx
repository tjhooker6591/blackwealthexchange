// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Android status bar color */}
        <meta name="theme-color" content="#000000" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16" />
        <link rel="icon" type="image/png" href="/android-chrome-192x192.png" sizes="192x192" />
        <link rel="icon" type="image/png" href="/android-chrome-512x512.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preload" as="image" href="/favicon.ico" />
      </Head>
      <body className="bg-black antialiased overflow-x-hidden">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
