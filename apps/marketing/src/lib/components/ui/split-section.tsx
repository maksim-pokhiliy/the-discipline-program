import { type ReactNode } from "react";

import { Box, Grid, type Theme } from "@mui/material";

import { buildOverlay } from "@repo/mui";

type SplitSectionProps = {
  backgroundImage: string;
  imageContent?: ReactNode;
  surface?: "base" | "raised";
  children: ReactNode;
};

export const SplitSection = ({
  backgroundImage,
  imageContent,
  surface = "raised",
  children,
}: SplitSectionProps) => {
  return (
    <Grid
      container
      sx={(theme) => ({ borderRadius: theme.shape.borderRadius, overflow: "hidden" })}
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
          minHeight: { xs: (theme: Theme) => theme.spacing(37.5), md: "auto" },
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
