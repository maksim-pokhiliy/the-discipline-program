import "@repo/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scontent-iev1-1.cdninstagram.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
