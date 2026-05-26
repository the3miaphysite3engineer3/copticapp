import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/securityHeaders";

const securityHeaders = buildSecurityHeaders({
  includeContentSecurityPolicy: false,
});
const localizedStaticSecurityHeaders = buildSecurityHeaders();
const publicAssetCacheHeaders = [
  {
    key: "Cache-Control",
    value:
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        source: "/:locale(en|nl)",
        headers: localizedStaticSecurityHeaders,
      },
      {
        source: "/:locale(en|nl)/:path*",
        headers: localizedStaticSecurityHeaders,
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/logo/:path*",
        headers: publicAssetCacheHeaders,
      },
      {
        source: "/publications/:path*",
        headers: publicAssetCacheHeaders,
      },
      {
        source: "/readme/:path*",
        headers: publicAssetCacheHeaders,
      },
      {
        source: "/data/:path*",
        headers: publicAssetCacheHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tools.applemediaservices.com",
      },
      {
        protocol: "https",
        hostname: "toolbox.marketingtools.apple.com",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/(.*)": ["public/data/**/*"],
  },
  serverExternalPackages: ["pdf-img-convert"],
};

export default nextConfig;
