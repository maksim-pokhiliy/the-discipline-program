"use client";

import { AppBar, Container, Stack } from "@mui/material";

import { LAYOUT } from "@repo/shared";

import { Logo } from "../logo";

import { PlatformUserMenu } from "./platform-user-menu";

export const PlatformHeader = () => {
  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
          }}
        >
          <Logo href="/coach" width={LAYOUT.platformLogoSize} height={LAYOUT.platformLogoSize} />

          <PlatformUserMenu />
        </Stack>
      </Container>
    </AppBar>
  );
};
