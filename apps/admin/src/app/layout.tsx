import { Box } from "@mui/material";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { type Metadata } from "next";

import { AuthProvider } from "@repo/auth";
import { NextProvider } from "@repo/mui";
import { fontVariables } from "@repo/mui/fonts";
import { QueryProvider } from "@repo/query";
import { SkipToContent, Toaster } from "@repo/ui";

export const metadata: Metadata = {
  title: "The Discipline Program - Admin",
  description: "Admin panel for The Discipline Program",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en">
    <body className={fontVariables}>
      <NextProvider>
        <QueryProvider>
          <AuthProvider>
            <SkipToContent />
            <Box sx={{ minHeight: "100vh" }}>
              {children}

              <Toaster />
              <Analytics />
              <SpeedInsights />
            </Box>
          </AuthProvider>
        </QueryProvider>
      </NextProvider>
    </body>
  </html>
);

export default RootLayout;
