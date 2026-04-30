import { Box } from "@mui/material";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { type Metadata } from "next";

import { NextProvider } from "@repo/mui";
import { fontVariables } from "@repo/mui/fonts";
import { QueryProvider } from "@repo/query";
import { SkipToContent } from "@repo/ui";

import { Footer, MarketingHeader } from "@app/lib/components/layout";
import { StructuredData } from "@app/lib/components/seo";
import { SEO_CONFIG } from "@app/lib/seo";

export const metadata: Metadata = {
  title: SEO_CONFIG.defaultTitle,
  description: SEO_CONFIG.defaultDescription,
  keywords: SEO_CONFIG.defaultKeywords,
  metadataBase: new URL(SEO_CONFIG.siteUrl),
  openGraph: {
    type: "website",
    siteName: SEO_CONFIG.siteName,
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    images: [SEO_CONFIG.defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    site: SEO_CONFIG.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const isVercelDeployment = !!process.env.VERCEL_ENV;

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en">
    <head>
      <StructuredData type="website" />
      <StructuredData type="organization" />
    </head>

    <body id="body-dom-anchor" className={fontVariables}>
      <NextProvider>
        <QueryProvider>
          <SkipToContent />

          <MarketingHeader />

          <Box component="main" id="main-content" sx={{ minHeight: "100vh" }}>
            {children}
          </Box>

          <Footer />
          {isVercelDeployment && <Analytics />}
          {isVercelDeployment && <SpeedInsights />}
        </QueryProvider>
      </NextProvider>
    </body>
  </html>
);

export default RootLayout;
