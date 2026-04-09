"use client";

import { Children, isValidElement, type ReactNode } from "react";

import {
  type SxProps,
  type Theme,
  alpha,
  Box,
  Button,
  Stack,
  Container,
  Typography,
} from "@mui/material";
import { type Variants, motion } from "framer-motion";
import Link from "next/link";

import { buildOverlay } from "@repo/mui";

const MotionBox = motion.create(Box);

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

type FullscreenSectionProps = {
  backgroundImage: string;
  sx?: SxProps<Theme>;
} & (
  | { children: ReactNode; title?: never; subtitle?: never; buttonText?: never; buttonHref?: never }
  | {
      children?: never;
      title: string;
      subtitle: string;
      buttonText?: string;
      buttonHref?: string;
    }
);

export const FullscreenSection = ({
  backgroundImage,
  sx: sxOverride,
  children,
  title,
  subtitle,
  buttonText,
  buttonHref,
}: FullscreenSectionProps) => {
  return (
    <Stack
      alignItems={{ xs: "center", md: "flex-start" }}
      justifyContent="center"
      sx={[
        (theme) => ({
          position: "relative",
          height: "100vh",
          backgroundImage: `${buildOverlay(theme)}, url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: theme.palette.common.white,
          textAlign: { xs: "center", md: "left" },
        }),
        ...(Array.isArray(sxOverride) ? sxOverride : sxOverride ? [sxOverride] : []),
      ]}
    >
      <Container maxWidth="lg">
        <MotionBox
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {children ? (
            <Stack spacing={3} alignItems="center">
              {Children.map(children, (child, i) => (
                <MotionBox
                  key={isValidElement(child) ? (child.key ?? i) : i}
                  variants={fadeSlideUp}
                >
                  {child}
                </MotionBox>
              ))}
            </Stack>
          ) : (
            <Stack
              spacing={4}
              alignItems={{ xs: "center", md: "flex-start" }}
              sx={{ maxWidth: { md: "65%" } }}
            >
              <MotionBox variants={fadeSlideUp}>
                <Typography variant="display1" component="h1">
                  {title}
                </Typography>
              </MotionBox>

              <MotionBox variants={fadeSlideUp}>
                <Typography
                  variant="h3"
                  component="p"
                  sx={(theme) => ({
                    color: alpha(theme.palette.common.white, 0.7),
                    maxWidth: { xs: "100%", md: theme.spacing(69) },
                  })}
                >
                  {subtitle}
                </Typography>
              </MotionBox>

              {buttonText && buttonHref && (
                <MotionBox variants={fadeSlideUp}>
                  <Button component={Link} href={buttonHref} variant="contained" size="large">
                    {buttonText}
                  </Button>
                </MotionBox>
              )}
            </Stack>
          )}
        </MotionBox>
      </Container>
    </Stack>
  );
};
