import { type ReactNode } from "react";

import { Stack, Container, alpha, keyframes } from "@mui/material";

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
type ContentAlign = "center" | "left";

interface FullscreenSectionProps {
  backgroundImage: string;
  children: ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  overlayVariant?: OverlayVariant;
  contentAlign?: ContentAlign;
  animate?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
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
  contentAlign = "center",
  animate = false,
  maxWidth = "md",
}: FullscreenSectionProps) => {
  const isLeft = contentAlign === "left";

  return (
    <Stack
      sx={(theme) => ({
        position: "relative",
        height: "100vh",
        alignItems: isLeft ? { xs: "center", md: "flex-start" } : "center",
        justifyContent: "center",
        backgroundImage: overlay
          ? `${buildOverlay(overlayVariant, overlayOpacity)(theme)}, url(${backgroundImage})`
          : `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: theme.palette.common.white,
        textAlign: isLeft ? { xs: "center", md: "left" } : "center",
      })}
    >
      <Container maxWidth={maxWidth}>
        <Stack
          spacing={4}
          alignItems={isLeft ? { xs: "center", md: "flex-start" } : "center"}
          sx={(theme) => ({
            maxWidth: isLeft ? { md: "65%" } : undefined,
            ...(animate && {
              "& > *": {
                opacity: 0,
                animation: `${fadeSlideUp} 0.7s ${theme.transitions.easing.easeOut} forwards`,
              },
              "& > *:nth-of-type(1)": { animationDelay: "0.15s" },
              "& > *:nth-of-type(2)": { animationDelay: "0.35s" },
              "& > *:nth-of-type(3)": { animationDelay: "0.55s" },
              "& > *:nth-of-type(n+4)": { animationDelay: "0.7s" },
            }),
          })}
        >
          {children}
        </Stack>
      </Container>
    </Stack>
  );
};
