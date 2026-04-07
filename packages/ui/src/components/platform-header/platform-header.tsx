"use client";

import { AppBar, Container, Stack } from "@mui/material";

import { LAYOUT } from "@repo/shared";

import { Logo } from "../logo";

import { PlatformUserMenu } from "./platform-user-menu";

type PlatformHeaderProps = {
  logoHref?: string;
  profileHref?: string;
};

export const PlatformHeader = ({
  logoHref = "/",
  profileHref = "/profile",
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

          <PlatformUserMenu profileHref={profileHref} />
        </Stack>
      </Container>
    </AppBar>
  );
};
