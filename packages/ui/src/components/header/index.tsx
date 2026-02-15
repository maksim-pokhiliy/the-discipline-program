"use client";

import { AppBar, Stack, Toolbar, useMediaQuery } from "@mui/material";

import { LAYOUT } from "@repo/shared";

import { Logo } from "../logo";

import { Drawer } from "./drawer";
import { HideOnScroll } from "./hide-on-scroll";
import { Navigation } from "./navigation";
import { UserMenu } from "./user-menu";

export type HeaderProps = {
  showUserMenu?: boolean;
};

export const Header = ({ showUserMenu = true }: HeaderProps) => {
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

          {!isMobile && showUserMenu && <UserMenu />}

          {isMobile && (
            <Stack direction="row" sx={{ alignItems: "center" }}>
              {showUserMenu && <UserMenu />}
              {<Drawer />}
            </Stack>
          )}
        </Stack>
      </AppBar>
    </HideOnScroll>
  );
};
