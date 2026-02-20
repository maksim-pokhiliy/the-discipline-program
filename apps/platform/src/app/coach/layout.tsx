import { Box } from "@mui/material";

import { PlatformBottomNav, PlatformHeader } from "@app/modules/shell";

type CoachLayoutProps = {
  children: React.ReactNode;
};

const CoachLayout = ({ children }: CoachLayoutProps) => {
  return (
    <>
      <PlatformHeader />
      <Box component="section" sx={{ pb: 7 }}>
        {children}
      </Box>
      <PlatformBottomNav />
    </>
  );
};

export default CoachLayout;
