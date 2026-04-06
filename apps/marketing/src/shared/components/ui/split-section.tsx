"use client";

import { type ReactNode } from "react";

import { Box, Grid } from "@mui/material";

import { buildOverlay } from "@app/lib/utils/overlay";

type SplitSectionProps = {
  backgroundImage: string;
  imageContent?: ReactNode;
  minHeight?: string | Record<string, string>;
  surface?: "base" | "raised";
  offset?: number;
  children: ReactNode;
};

export const SplitSection = ({
  backgroundImage,
  imageContent,
  minHeight,
  surface = "raised",
  children,
}: SplitSectionProps) => {
  return (
    <Grid
      container
      sx={(theme) => ({ borderRadius: theme.shape.borderRadius, overflow: "hidden", minHeight })}
    >
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={(theme) => ({
          position: "relative",
          backgroundImage: `${buildOverlay(theme)}, url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: theme.palette.common.white,
          minHeight: { xs: 300, md: "auto" },
        })}
      >
        {imageContent && (
          <Box
            sx={{
              position: "relative",
              height: "100%",
              p: 4,
            }}
          >
            {imageContent}
          </Box>
        )}
      </Grid>

      <Grid
        size={{ xs: 12, md: 6 }}
        sx={(theme) => ({
          backgroundColor:
            surface === "raised"
              ? theme.palette.background.paper
              : theme.palette.background.default,
          p: { xs: 4, md: 6 },
        })}
      >
        {children}
      </Grid>
    </Grid>
  );
};
