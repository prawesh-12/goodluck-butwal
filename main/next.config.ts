import type { NextConfig } from "next";

const immutableCache = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // These run only on the server and are imported from many routes. Left to Next, each route
  // chunk gets its own copy and the worker blows past its 2.50 MB cap.
  serverExternalPackages: ["drizzle-orm", "@neondatabase/serverless", "sanitize-html", "nanoid"],
  experimental: {
    // Turns on forbidden(), the only way a page can answer with a real 403 status.
    authInterrupts: true,
    // The local Neon proxy takes far fewer connections than Neon itself, so a local build sets
    // BUILD_CPUS=1 to prerender one page at a time. Unset everywhere else, including CI.
    ...(process.env.BUILD_CPUS ? { cpus: Number(process.env.BUILD_CPUS) } : {}),
  },
  async headers() {
    return [
      { source: "/images/:path*", headers: immutableCache },
      { source: "/brand/:path*", headers: immutableCache },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
