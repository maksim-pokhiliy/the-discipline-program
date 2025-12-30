import { Box } from "@mui/material";
import { AuthProvider } from "@repo/auth";
import { NextProvider } from "@repo/mui";
import { QueryProvider } from "@repo/query";
import { Metadata } from "next";

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
