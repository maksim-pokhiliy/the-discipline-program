import { type ReactNode } from "react";

import { Stack, Container, alpha } from "@mui/material";

interface FullscreenSectionProps {
  backgroundImage: string;
  children: ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}

export const FullscreenSection = ({
  backgroundImage,
  children,
  overlay = true,
  overlayOpacity = 0.5,
  maxWidth = "md",
}: FullscreenSectionProps) => {
  return (
    <Stack
      sx={(theme) => ({
        position: "relative",
        height: `calc(100vh - ${theme.layout.appBarHeight}px)`,
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: overlay
          ? `linear-gradient(${alpha(theme.palette.common.black, overlayOpacity)}, ${alpha(theme.palette.common.black, overlayOpacity)}), url(${backgroundImage})`
          : `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: theme.palette.common.white,
        textAlign: "center",
      })}
    >
      <Container maxWidth={maxWidth}>
        <Stack spacing={4} alignItems="center">
          {children}
        </Stack>
      </Container>
    </Stack>
  );
};
