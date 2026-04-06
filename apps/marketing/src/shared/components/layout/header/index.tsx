"use client";

import { AppBar, Box, Toolbar, alpha, useMediaQuery } from "@mui/material";

import { Logo } from "@repo/ui";

import { Drawer } from "./drawer";
import { Navigation } from "./navigation";

export const MarketingHeader = () => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <AppBar
      sx={{
        position: "fixed",
        backgroundColor: "transparent",
        backgroundImage: "none",
      }}
    >
      <Toolbar sx={{ position: "relative" }}>
        <Logo />

        {!isMobile && (
          <Box
            sx={(theme) => ({
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: alpha(theme.palette.background.default, 0.4),
              backdropFilter: "saturate(180%) blur(10px)",
              borderRadius: theme.shape.borderRadius,
              border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
              overflow: "hidden",
            })}
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
  );
};
