// src/pages/_document.tsx

import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from "next/document";

export default class MyDocument extends Document {
  // Ensure Next.js collects and injects its default props (styles, etc.)
  static async getInitialProps(
    ctx: DocumentContext,
  ): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return initialProps;
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Android status bar color */}
          <meta name="theme-color" content="#000000" />

          {/* Primary favicon (legacy + modern) */}
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="icon" href="/favicon.ico" sizes="any" />

          {/* PNG favicons for different sizes */}
          <link
            rel="icon"
            type="image/png"
            href="/favicon-32x32.png"
            sizes="32x32"
          />
          <link
            rel="icon"
            type="image/png"
            href="/favicon-16x16.png"
            sizes="16x16"
          />

          {/* Android home-screen icons */}
          <link
            rel="icon"
            type="image/png"
            href="/android-chrome-192x192.png"
            sizes="192x192"
          />
          <link
            rel="icon"
            type="image/png"
            href="/android-chrome-512x512.png"
            sizes="512x512"
          />

          {/* iOS home-screen icon */}
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

          {/* PWA manifest */}
          <link rel="manifest" href="/site.webmanifest" />
        </Head>
        <body className="bg-black antialiased overflow-x-hidden">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
