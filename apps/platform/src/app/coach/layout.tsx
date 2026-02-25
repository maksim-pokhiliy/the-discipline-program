import { Box, Container } from "@mui/material";

import { PlatformBottomNav, PlatformHeader } from "@repo/ui";

type CoachLayoutProps = {
  children: React.ReactNode;
};

const CoachLayout = ({ children }: CoachLayoutProps) => {
  return (
    <>
      <PlatformHeader />

      <Container component="main" maxWidth="lg" disableGutters sx={{ py: 4 }}>
        <Box component="section">{children}</Box>
      </Container>

      <PlatformBottomNav />
    </>
  );
};

export default CoachLayout;
