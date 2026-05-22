"use client";

import { AppBar, Container, Stack } from "@mui/material";

import { LAYOUT } from "@repo/shared";
import { Logo } from "@repo/ui";

import { PlatformUserMenu } from "./platform-user-menu";

type PlatformHeaderProps = {
  logoHref?: string | undefined;
  profileHref?: string | undefined;
  userName?: string | null | undefined;
  userEmail?: string | null | undefined;
  userImage?: string | null | undefined;
  onSignOut: () => void;
};

export const PlatformHeader = ({
  logoHref = "/",
  profileHref = "/profile",
  userName,
  userEmail,
  userImage,
  onSignOut,
}: PlatformHeaderProps) => {
  return (
    <AppBar position="sticky">
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 2 }}>
          <Logo href={logoHref} width={LAYOUT.platformLogoSize} height={LAYOUT.platformLogoSize} />

          <PlatformUserMenu
            profileHref={profileHref}
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            onSignOut={onSignOut}
          />
        </Stack>
      </Container>
    </AppBar>
  );
};
