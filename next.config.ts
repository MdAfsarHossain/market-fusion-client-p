import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product and store images are served from S3 / Supabase storage
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.digitaloceanspaces.com" },
    ],
  },
};

export default nextConfig;
