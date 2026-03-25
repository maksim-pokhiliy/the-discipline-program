import { type ReactNode } from "react";

import { Stack, Container, alpha, keyframes, Box } from "@mui/material";

const fadeSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

type OverlayVariant = "uniform" | "gradient";

interface FullscreenSectionProps {
  backgroundImage: string;
  children: ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  overlayVariant?: OverlayVariant;
  offset?: number;
}

const buildOverlay =
  (variant: OverlayVariant, opacity: number) =>
  (theme: { palette: { common: { black: string } } }) => {
    const black = theme.palette.common.black;

    if (variant === "gradient") {
      return `linear-gradient(
      to top right,
      ${alpha(black, Math.min(opacity * 1.5, 1))} 0%,
      ${alpha(black, opacity * 0.85)} 40%,
      ${alpha(black, opacity * 0.25)} 100%
    )`;
    }

    return `linear-gradient(${alpha(black, opacity)}, ${alpha(black, opacity)})`;
  };

export const FullscreenSection = ({
  backgroundImage,
  children,
  overlay = true,
  overlayOpacity = 0.5,
  overlayVariant = "uniform",
  offset = 0,
}: FullscreenSectionProps) => {
  return (
    <Stack
      sx={(theme) => ({
        position: "relative",
        height: "100vh",
        alignItems: { xs: "center", md: "flex-start" },
        justifyContent: "center",
        backgroundImage: overlay
          ? `${buildOverlay(overlayVariant, overlayOpacity)(theme)}, url(${backgroundImage})`
          : `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: theme.palette.common.white,
        textAlign: { xs: "center", md: "left" },
      })}
    >
      {Array.from({ length: offset }, (_, i) => (
        <Box key={i} sx={(theme) => ({ ...theme.mixins.toolbar })} />
      ))}

      <Container maxWidth="lg">
        <Stack
          spacing={4}
          alignItems={{ xs: "center", md: "flex-start" }}
          sx={(theme) => ({
            maxWidth: { md: "65%" },
            "& > *": {
              opacity: 0,
              animation: `${fadeSlideUp} 0.7s ${theme.transitions.easing.easeOut} forwards`,
            },
            "& > *:nth-of-type(1)": { animationDelay: "0.15s" },
            "& > *:nth-of-type(2)": { animationDelay: "0.35s" },
            "& > *:nth-of-type(3)": { animationDelay: "0.55s" },
            "& > *:nth-of-type(n+4)": { animationDelay: "0.7s" },
          })}
        >
          {children}
        </Stack>
      </Container>
    </Stack>
  );
};
