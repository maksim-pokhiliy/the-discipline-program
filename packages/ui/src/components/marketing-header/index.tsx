"use client";

import { AppBar, Stack, Toolbar, useMediaQuery } from "@mui/material";

import { LAYOUT } from "@repo/shared";

import { Logo } from "../logo";

import { Drawer } from "./drawer";
import { HideOnScroll } from "./hide-on-scroll";
import { Navigation } from "./navigation";

export const MarketingHeader = () => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <HideOnScroll>
      <AppBar sx={{ height: LAYOUT.appBarHeight, justifyContent: "center" }}>
        <Stack
          component={Toolbar}
          sx={{ width: "100%", justifyContent: "space-between" }}
          direction="row"
        >
          <Logo />

          {!isMobile && <Navigation />}

          {isMobile && <Drawer />}
        </Stack>
      </AppBar>
    </HideOnScroll>
  );
};
