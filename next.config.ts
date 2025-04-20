// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // These values are only available on the server (e.g. in getServerSideProps)
  serverRuntimeConfig: {
    mongoUri: process.env.MONGODB_URI as string,
    jwtSecret: process.env.JWT_SECRET as string,
  },

  // You can still expose safe, public vars (if you need them) here:
  publicRuntimeConfig: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  },
};

export default nextConfig;
