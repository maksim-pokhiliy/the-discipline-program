"use client";

import { type ReactNode, useCallback } from "react";

import { Box, Stack, useMediaQuery, useTheme } from "@mui/material";
import { type Theme } from "@mui/material/styles";

import { SessionGuard } from "@repo/auth";
import { signOut, useSession } from "@repo/auth/client";
import { type PlatformNavigationConfig } from "@repo/shared";
import { SkipToContent } from "@repo/ui";

import { PlatformBottomNav } from "@app/lib/components/platform-bottom-nav";
import { PlatformContent } from "@app/lib/components/platform-content";
import { PlatformHeader } from "@app/lib/components/platform-header";
import { PlatformSidebar } from "@app/lib/components/platform-sidebar";

type PlatformLayoutProps = {
  logoHref: string;
  profileHref: string;
  navigation: PlatformNavigationConfig;
  mainVariant?: "padded" | "flush";
  showSidebar?: boolean;
  children: ReactNode;
};

export const PlatformLayout = ({
  logoHref,
  profileHref,
  navigation,
  mainVariant = "padded",
  showSidebar = false,
  children,
}: PlatformLayoutProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery<Theme>((value) => value.breakpoints.up("md"));
  const { data: session } = useSession();
  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  const useDesktopChrome = isDesktop && showSidebar;
  const isFlush = mainVariant === "flush";

  const renderDesktop = (): ReactNode => (
    <Stack direction="row" sx={{ minHeight: "100dvh" }}>
      <SkipToContent />

      <PlatformSidebar
        navigation={navigation}
        logoHref={logoHref}
        profileHref={profileHref}
        userName={session?.user?.name}
        userEmail={session?.user?.email}
        userImage={session?.user?.image}
        onSignOut={handleSignOut}
      />

      <Box sx={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        <PlatformContent
          mainVariant={mainVariant}
          reserveBottomNav={false}
          contentMaxWidth={theme.layout.platformContentMaxWidth}
        >
          {children}
        </PlatformContent>
      </Box>
    </Stack>
  );

  const renderMobile = (): ReactNode => (
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

      <PlatformContent mainVariant={mainVariant} reserveBottomNav>
        {children}
      </PlatformContent>

      <PlatformBottomNav navigation={navigation} />
    </Stack>
  );

  return <SessionGuard>{useDesktopChrome ? renderDesktop() : renderMobile()}</SessionGuard>;
};
