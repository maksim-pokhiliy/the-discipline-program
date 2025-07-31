import { Box } from "@mui/material";
import { NextProvider } from "@repo/mui";
import { Metadata } from "next";

import { QueryProvider } from "@app/lib/providers/query-provider";

export const metadata: Metadata = {
  title: "The Discipline Program - Admin",
  description: "Admin panel for The Discipline Program",
};

type RootLayoutProps = Readonly<{
  children: React.ReactElement;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <NextProvider>
          <QueryProvider>
            <Box component="main" sx={{ minHeight: "100vh" }}>
              {children}
            </Box>
          </QueryProvider>
        </NextProvider>
      </body>
    </html>
  );
}
