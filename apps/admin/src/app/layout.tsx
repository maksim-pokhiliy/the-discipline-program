import { Box } from "@mui/material";
import { NextProvider } from "@repo/mui";
import { Metadata } from "next";

import { AuthProvider, QueryProvider } from "@app/shared/components/providers";

export const metadata: Metadata = {
  title: "The Discipline Program - Admin",
  description: "Admin panel for The Discipline Program",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <NextProvider>
          <AuthProvider>
            <QueryProvider>
              <Box component="main" sx={{ minHeight: "100vh" }}>
                {children}
              </Box>
            </QueryProvider>
          </AuthProvider>
        </NextProvider>
      </body>
    </html>
  );
}
