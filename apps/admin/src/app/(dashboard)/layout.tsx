"use client";
import { Box } from "@mui/material";

import { Header } from "@app/shared/components/layout/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />

      <Box sx={{ minHeight: "100vh" }}>{children}</Box>
    </>
  );
}
