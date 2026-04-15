import { type MetadataRoute } from "next";

import { SEO_CONFIG } from "@app/lib/seo";

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: "/",
    disallow: "/api/",
  },
  sitemap: `${SEO_CONFIG.siteUrl}/sitemap.xml`,
});

export default robots;
