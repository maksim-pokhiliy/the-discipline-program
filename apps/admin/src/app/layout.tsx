import { Box } from "@mui/material";
import { type Metadata } from "next";

import { AuthProvider } from "@repo/auth";
import { NextProvider } from "@repo/mui";
import { fontVariables } from "@repo/mui/fonts";
import { QueryProvider } from "@repo/query";
import { Toaster } from "@repo/ui";

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
            <Box component="main" sx={{ minHeight: "100vh" }}>
              {children}

              <Toaster />
            </Box>
          </AuthProvider>
        </QueryProvider>
      </NextProvider>
    </body>
  </html>
);

export default RootLayout;
