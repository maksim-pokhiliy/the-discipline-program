import { Box, Container } from "@mui/material";

import { PlatformBottomNav, PlatformHeader } from "@repo/ui";

type CoachLayoutProps = {
  children: React.ReactNode;
};

const CoachLayout = ({ children }: CoachLayoutProps) => {
  return (
    <>
      <PlatformHeader />

      <Container component="main" maxWidth="lg" sx={{ pt: 4, pb: 10 }}>
        <Box component="section">{children}</Box>
      </Container>

      <PlatformBottomNav />
    </>
  );
};

export default CoachLayout;
