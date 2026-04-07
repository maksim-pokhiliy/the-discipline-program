"use client";

import { Box, Container, Stack } from "@mui/material";

import { SessionGuard } from "@repo/auth";
import { PlatformBottomNav, PlatformHeader } from "@repo/ui";

type AthleteLayoutProps = {
  children: React.ReactNode;
};

const AthleteLayout = ({ children }: AthleteLayoutProps) => {
  return (
    <SessionGuard>
      <Stack sx={{ minHeight: "100dvh" }}>
        <PlatformHeader />

        <Container component="main" maxWidth="lg" sx={{ flex: 1, pt: 4, pb: 16 }}>
          <Box component="section">{children}</Box>
        </Container>

        <PlatformBottomNav />
      </Stack>
    </SessionGuard>
  );
};

export default AthleteLayout;
