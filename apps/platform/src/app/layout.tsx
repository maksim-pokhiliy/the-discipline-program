import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { type Metadata, type Viewport } from "next";

import { AuthProvider } from "@repo/auth";
import { NextProvider } from "@repo/mui";
import { fontVariables } from "@repo/mui/fonts";
import { QueryProvider } from "@repo/query";
import { Toaster } from "@repo/ui";

type RootLayoutProps = Readonly<{ children: React.ReactNode }>;

export const metadata: Metadata = {
  title: "The Discipline Program",
  description: "Coach & Athlete training platform",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

const isVercelDeployment = !!process.env.VERCEL_ENV;

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <body className={fontVariables}>
        <NextProvider>
          <QueryProvider>
            <AuthProvider>
              {children}

              <Toaster position="top-right" />
              {isVercelDeployment && <Analytics />}
              {isVercelDeployment && <SpeedInsights />}
            </AuthProvider>
          </QueryProvider>
        </NextProvider>
      </body>
    </html>
  );
};

export default RootLayout;
