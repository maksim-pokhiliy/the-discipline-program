"use client";

import { AppBar, Container, Stack } from "@mui/material";

import { LAYOUT } from "@repo/shared";
import { Logo } from "@repo/ui";

import { PlatformUserMenu } from "./platform-user-menu";

type PlatformHeaderProps = {
  logoHref?: string;
  profileHref?: string;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
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
    <AppBar
      position="sticky"
      sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
          }}
        >
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
