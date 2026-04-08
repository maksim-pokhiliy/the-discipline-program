"use client";

import { useCallback } from "react";

import { Box, Container, Stack } from "@mui/material";

import { SessionGuard } from "@repo/auth";
import { signOut, useSession } from "@repo/auth/client";
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
  const { data: session } = useSession();
  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  return (
    <SessionGuard>
      <Stack sx={{ minHeight: "100dvh" }}>
        <PlatformHeader
          logoHref={logoHref}
          profileHref={profileHref}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          userImage={session?.user?.image}
          onSignOut={handleSignOut}
        />

        <Container component="main" maxWidth="lg" sx={{ flex: 1, pt: 4, pb: 16 }}>
          <Box component="section">{children}</Box>
        </Container>

        <PlatformBottomNav navigation={navigation} />
      </Stack>
    </SessionGuard>
  );
};
