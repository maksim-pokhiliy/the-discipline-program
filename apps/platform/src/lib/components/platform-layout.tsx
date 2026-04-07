import { Box, Container, Stack } from "@mui/material";

import { SessionGuard } from "@repo/auth";
import { type PlatformNavigationConfig } from "@repo/shared";
import { PlatformBottomNav, PlatformHeader } from "@repo/ui";

type PlatformLayoutProps = {
  logoHref: string;
  profileHref: string;
  navigation: PlatformNavigationConfig;
  children: React.ReactNode;
};

export const PlatformLayout = ({
  logoHref,
  profileHref,
  navigation,
  children,
}: PlatformLayoutProps) => {
  return (
    <SessionGuard>
      <Stack sx={{ minHeight: "100dvh" }}>
        <PlatformHeader logoHref={logoHref} profileHref={profileHref} />

        <Container component="main" maxWidth="lg" sx={{ flex: 1, pt: 4, pb: 16 }}>
          <Box component="section">{children}</Box>
        </Container>

        <PlatformBottomNav navigation={navigation} />
      </Stack>
    </SessionGuard>
  );
};
