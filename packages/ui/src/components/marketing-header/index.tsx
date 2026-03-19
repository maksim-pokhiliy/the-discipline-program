"use client";

import { AppBar, Box, Toolbar, alpha, useMediaQuery, useScrollTrigger } from "@mui/material";

import { LAYOUT } from "@repo/shared";

import { Logo } from "../logo";

import { Drawer } from "./drawer";
import { HideOnScroll } from "./hide-on-scroll";
import { Navigation } from "./navigation";

export const MarketingHeader = () => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 50 });

  return (
    <HideOnScroll>
      <AppBar
        sx={{
          position: "fixed",
          height: LAYOUT.appBarHeight,
          justifyContent: "center",
          backgroundColor: "transparent",
          backgroundImage: "none",
        }}
      >
        <Box
          sx={(theme) => ({
            position: "absolute",
            inset: 0,
            backgroundColor: scrolled
              ? alpha(theme.palette.background.default, 0.4)
              : "transparent",
            backdropFilter: scrolled ? "saturate(180%) blur(20px)" : "blur(0px)",
            WebkitBackdropFilter: scrolled ? "saturate(180%) blur(20px)" : "blur(0px)",
            borderBottom: "none",
            transition: theme.transitions.create(["background-color", "backdrop-filter"], {
              duration: theme.transitions.duration.complex,
            }),
          })}
        />

        <Toolbar sx={{ position: "relative" }}>
          <Logo />

          {!isMobile && (
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <Navigation />
            </Box>
          )}

          {isMobile && (
            <Box sx={{ ml: "auto" }}>
              <Drawer />
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </HideOnScroll>
  );
};
