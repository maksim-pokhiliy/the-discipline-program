import { Box, Container, Stack } from "@mui/material";

import { PlatformBottomNav, PlatformHeader } from "@repo/ui";

type CoachLayoutProps = {
  children: React.ReactNode;
};

const CoachLayout = ({ children }: CoachLayoutProps) => {
  return (
    <Stack sx={{ minHeight: "100dvh" }}>
      <PlatformHeader />

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Box component="section">{children}</Box>
      </Container>

      <PlatformBottomNav />
    </Stack>
  );
};

export default CoachLayout;
