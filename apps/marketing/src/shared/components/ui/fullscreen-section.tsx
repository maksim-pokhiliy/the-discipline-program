"use client";

import { Children, type ReactNode } from "react";

import { Stack, Container, alpha, Box } from "@mui/material";
import { type Variants, motion } from "framer-motion";

type OverlayVariant = "uniform" | "gradient";

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0, 0, 0.58, 1] } },
};

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
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <Stack
            spacing={4}
            alignItems={{ xs: "center", md: "flex-start" }}
            sx={{ maxWidth: { md: "65%" } }}
          >
            {Children.map(children, (child) => (
              <motion.div variants={fadeSlideUp}>{child}</motion.div>
            ))}
          </Stack>
        </motion.div>
      </Container>
    </Stack>
  );
};
