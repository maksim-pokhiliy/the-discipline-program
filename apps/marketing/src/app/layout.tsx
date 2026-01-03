import { Box } from "@mui/material";
import { type Metadata } from "next";

import { NextProvider } from "@repo/mui";
import { QueryProvider } from "@repo/query";
import { DOM_ANCHORS, SEO_CONFIG } from "@repo/shared";
import { Header } from "@repo/ui";

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

      <body id={DOM_ANCHORS.BODY}>
        <NextProvider>
          <QueryProvider>
            <Header navigationType="marketing" showUserMenu={false} />

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
