"use client";

import { AppBar, Stack, Toolbar, useMediaQuery } from "@mui/material";
import { Logo } from "@repo/ui";

import { Drawer } from "./drawer";
import { HideOnScroll } from "./hide-on-scroll";
import { Navigation } from "./navigation";
import { UserMenu } from "./user-menu";

export const Header = () => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <HideOnScroll>
      <AppBar>
        <Stack
          component={Toolbar}
          sx={{ width: "100%", justifyContent: "space-between" }}
          direction="row"
        >
          <Logo />

          {isMobile ? <Drawer /> : <Navigation />}
          <UserMenu />
        </Stack>
      </AppBar>
    </HideOnScroll>
  );
};
