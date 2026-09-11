import type { NextConfig } from "next";

// Names under /images and /brand are stable and the files behind them get replaced in place, so
// "immutable" pinned the old bytes in every browser that had already loaded one. Revalidation
// keeps the bandwidth saving, because a 304 carries no body, and a replacement shows up within
// the hour instead of the year.
const assetCache = [
  {
    key: "Cache-Control",
    value:
      process.env.NODE_ENV === "production"
        ? "public, max-age=3600, must-revalidate"
        : "no-store",
  },
];

// React refresh compiles with eval in development. Production never needs it.
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === "production" ? [] : ["'unsafe-eval'"]),
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://challenges.cloudflare.com",
];

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://www.googletagmanager.com https://www.google-analytics.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://*.analytics.google.com",
  "frame-src 'self' https://challenges.cloudflare.com https://www.google.com https://maps.google.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // These run only on the server and are imported from many routes. Left to Next, each route
  // chunk gets its own copy of them. sanitize-html is not in the list: it is CommonJS and requires
  // htmlparser2 12, which is ESM only, so an external require of it throws on the deploy runtime.
  serverExternalPackages: ["drizzle-orm", "@neondatabase/serverless", "nanoid", "zod"],
  experimental: {
    // Turns on forbidden(), the only way a page can answer with a real 403 status.
    authInterrupts: true,
    // The local Neon proxy takes far fewer connections than Neon itself, so a local build sets
    // BUILD_CPUS=1 to prerender one page at a time. Unset everywhere else, including CI.
    ...(process.env.BUILD_CPUS ? { cpus: Number(process.env.BUILD_CPUS) } : {}),
  },
  async headers() {
    return [
      { source: "/images/:path*", headers: assetCache },
      { source: "/brand/:path*", headers: assetCache },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
