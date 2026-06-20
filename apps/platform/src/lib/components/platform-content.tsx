"use client";

import { Box, Container } from "@mui/material";

type PlatformContentProps = {
  mainVariant?: "padded" | "flush";
  reserveBottomNav?: boolean;
  contentMaxWidth?: number;
  children: React.ReactNode;
};

export const PlatformContent = ({
  mainVariant = "padded",
  reserveBottomNav = true,
  contentMaxWidth,
  children,
}: PlatformContentProps) => {
  const isFlush = mainVariant === "flush";

  if (isFlush) {
    return (
      <Container
        component="main"
        id="main-content"
        maxWidth={false}
        disableGutters
        sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        <Box component="section" sx={{ height: "100%" }}>
          {children}
        </Box>
      </Container>
    );
  }

  return (
    <Box
      component="main"
      id="main-content"
      sx={(theme) => ({
        flex: 1,
        width: "100%",
        maxWidth: contentMaxWidth ?? theme.breakpoints.values.lg,
        mx: "auto",
        pt: 4,
        pb: reserveBottomNav
          ? `calc(${theme.spacing(16)} + env(safe-area-inset-bottom))`
          : `calc(${theme.spacing(4)} + env(safe-area-inset-bottom))`,
        pl: `calc(${theme.spacing(3)} + env(safe-area-inset-left))`,
        pr: `calc(${theme.spacing(3)} + env(safe-area-inset-right))`,
      })}
    >
      <Box component="section">{children}</Box>
    </Box>
  );
};

export type { PlatformContentProps };
