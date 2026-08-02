/** @type {import('next').NextConfig} */
const nextConfig = {
  // Job search can take well over Next's default 30s rewrite-proxy timeout
  // (scraping + batched Claude scoring for up to 50 jobs), so raise it.
  experimental: {
    proxyTimeout: 180000,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
