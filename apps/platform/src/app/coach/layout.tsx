"use client";

import { Box, Container, Stack } from "@mui/material";

import { SessionGuard } from "@repo/auth";
import { PlatformBottomNav, PlatformHeader } from "@repo/ui";

type CoachLayoutProps = {
  children: React.ReactNode;
};

const CoachLayout = ({ children }: CoachLayoutProps) => {
  return (
    <SessionGuard>
      <Stack sx={{ minHeight: "100dvh" }}>
        <PlatformHeader />

        <Container component="main" maxWidth="lg" sx={{ flex: 1, py: 4 }}>
          <Box component="section">{children}</Box>
        </Container>

        <PlatformBottomNav />
      </Stack>
    </SessionGuard>
  );
};

export default CoachLayout;
