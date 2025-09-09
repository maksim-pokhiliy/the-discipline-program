import { Box } from "@mui/material";

import { Header } from "@app/shared/components/layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />

      <Box>{children}</Box>
    </>
  );
}
