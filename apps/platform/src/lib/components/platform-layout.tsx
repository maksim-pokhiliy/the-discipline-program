"use client";

import { useCallback } from "react";

import { Stack } from "@mui/material";

import { SessionGuard } from "@repo/auth";
import { signOut, useSession } from "@repo/auth/client";
import { type PlatformNavigationConfig } from "@repo/shared";
import { SkipToContent } from "@repo/ui";

import { PlatformBottomNav } from "@app/lib/components/platform-bottom-nav";
import { PlatformContent } from "@app/lib/components/platform-content";
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

        <PlatformContent mainVariant={mainVariant} reserveBottomNav>
          {children}
        </PlatformContent>

        <PlatformBottomNav navigation={navigation} />
      </Stack>
    </SessionGuard>
  );
};
