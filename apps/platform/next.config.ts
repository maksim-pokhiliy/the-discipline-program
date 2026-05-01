import "@repo/env/base";
import "@repo/env/auth";
import "@repo/env/sentry";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@mui/icons-material", "@mui/material"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  ...(process.env.SENTRY_ORG !== undefined && { org: process.env.SENTRY_ORG }),
  ...(process.env.SENTRY_PROJECT !== undefined && { project: process.env.SENTRY_PROJECT }),
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
});
