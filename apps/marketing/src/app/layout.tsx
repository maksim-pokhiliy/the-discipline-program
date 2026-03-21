import { Box } from "@mui/material";
import { type Metadata } from "next";

import { NextProvider } from "@repo/mui";
import { fontVariables } from "@repo/mui/fonts";
import { QueryProvider } from "@repo/query";
import { DOM_ANCHORS, SEO_CONFIG } from "@repo/shared";
import { MarketingHeader } from "@repo/ui";

import { Footer } from "@app/shared/components/layout";
import { StructuredData } from "@app/shared/components/seo";

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

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <StructuredData type="website" />
        <StructuredData type="organization" />
      </head>

      <body id={DOM_ANCHORS.BODY} className={fontVariables}>
        <NextProvider>
          <QueryProvider>
            <MarketingHeader />

            <Box component="main" sx={{ minHeight: "100vh" }}>
              {children}
            </Box>

            <Footer />
          </QueryProvider>
        </NextProvider>
      </body>
    </html>
  );
}
