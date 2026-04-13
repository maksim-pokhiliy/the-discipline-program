import { type ReactNode } from "react";

import { Box, Grid } from "@mui/material";
import Image from "next/image";

import { ImageOverlay } from "./image-overlay";

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
          overflow: "hidden",
          color: theme.palette.common.white,
          minHeight: { xs: theme.spacing(37.5), md: "auto" },
        })}
      >
        <Image
          src={backgroundImage}
          alt=""
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
        />
        <ImageOverlay />
        {imageContent && (
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
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
