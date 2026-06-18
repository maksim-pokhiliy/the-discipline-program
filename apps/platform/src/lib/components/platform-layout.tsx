"use client";

import { useCallback } from "react";

import { Box, Container, Stack } from "@mui/material";

import { SessionGuard } from "@repo/auth";
import { signOut, useSession } from "@repo/auth/client";
import { type PlatformNavigationConfig } from "@repo/shared";
import { SkipToContent } from "@repo/ui";

import { PlatformBottomNav } from "@app/lib/components/platform-bottom-nav";
import { PlatformHeader } from "@app/lib/components/platform-header";

type PlatformLayoutProps = {
  logoHref: string;
  profileHref: string;
  navigation: PlatformNavigationConfig;
  mainVariant?: "padded" | "flush";
  children: React.ReactNode;
};

export const PlatformLayout = ({
  logoHref,
  profileHref,
  navigation,
  mainVariant = "padded",
  children,
}: PlatformLayoutProps) => {
  const { data: session } = useSession();
  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  const isFlush = mainVariant === "flush";

  return (
    <SessionGuard>
      <Stack sx={{ minHeight: "100dvh", ...(isFlush ? { height: "100dvh" } : {}) }}>
        <SkipToContent />

        <PlatformHeader
          logoHref={logoHref}
          profileHref={profileHref}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          userImage={session?.user?.image}
          onSignOut={handleSignOut}
        />

        {isFlush ? (
          <Container
            component="main"
            id="main-content"
            maxWidth={false}
            disableGutters
            sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}
          >
            <Box component="section" sx={{ height: "100%" }}>
              {children}
            </Box>
          </Container>
        ) : (
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
        )}

        <PlatformBottomNav navigation={navigation} />
      </Stack>
    </SessionGuard>
  );
};
