"use client";

import { useCallback } from "react";

import { Box, Container, Stack } from "@mui/material";

import { SessionGuard } from "@repo/auth";
import { signOut, useSession } from "@repo/auth/client";
import { type PlatformNavigationConfig } from "@repo/shared";

import { PlatformBottomNav } from "@app/lib/components/platform-bottom-nav";
import { PlatformHeader } from "@app/lib/components/platform-header";

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
  const { data: session } = useSession();
  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  return (
    <SessionGuard>
      <Stack sx={{ minHeight: "100dvh" }}>
        <Box
          component="a"
          href="#main-content"
          sx={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            "&:focus": {
              position: "static",
              width: "auto",
              height: "auto",
              overflow: "visible",
              p: 2,
            },
          }}
        >
          Skip to content
        </Box>

        <PlatformHeader
          logoHref={logoHref}
          profileHref={profileHref}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          userImage={session?.user?.image}
          onSignOut={handleSignOut}
        />

        <Container
          component="main"
          id="main-content"
          maxWidth="lg"
          sx={(theme) => ({
            flex: 1,
            pt: 4,
            pb: `calc(${theme.spacing(16)} + env(safe-area-inset-bottom))`,
            pl: `calc(${theme.spacing(3)} + env(safe-area-inset-left))`,
            pr: `calc(${theme.spacing(3)} + env(safe-area-inset-right))`,
          })}
        >
          <Box component="section">{children}</Box>
        </Container>

        <PlatformBottomNav navigation={navigation} />
      </Stack>
    </SessionGuard>
  );
};
