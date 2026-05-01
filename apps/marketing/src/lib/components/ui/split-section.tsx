import { type ReactNode } from "react";

import { Box, Grid } from "@mui/material";
import Image from "next/image";

import { ImageOverlay } from "./image-overlay";

type SplitSectionProps = {
  backgroundImage?: string | undefined;
  imageContent?: ReactNode | undefined;
  surface?: "base" | "raised" | undefined;
  children: ReactNode;
};

export const SplitSection = ({
  backgroundImage,
  imageContent,
  surface = "raised",
  children,
}: SplitSectionProps) => {
  return (
    <Grid container sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          position: "relative",
          overflow: "hidden",
          color: "common.white",
          minHeight: { xs: 300, md: "auto" },
        }}
      >
        {backgroundImage && (
          <Image
            src={backgroundImage}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        )}
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
        sx={{
          backgroundColor: surface === "raised" ? "background.paper" : "background.default",
          p: { xs: 4, md: 6 },
        }}
      >
        {children}
      </Grid>
    </Grid>
  );
};
