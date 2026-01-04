import { Box } from "@mui/material";

import { Header } from "@repo/ui";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />

      <Box>{children}</Box>
    </>
  );
}
