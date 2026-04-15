"use client";

import { type ReactNode } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Container, Stack, Typography, type ButtonProps } from "@mui/material";
import { type Variants, motion } from "framer-motion";
import Link from "next/link";

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

export type ContentAction = ButtonProps & {
  label: string;
};

export type ContentSectionProps = {
  title?: string;
  subtitle?: string;
  surface?: "base" | "raised";
  maxWidth?: "sm" | "md" | "lg" | "xl";
  backHref?: string;
  backLabel?: string;
  actions?: ContentAction[];
  offset?: number;
  textAlign?: "left" | "center";
  id?: string;
  animated?: boolean;
  children?: ReactNode;
};

export const ContentSection = ({
  title,
  subtitle,
  surface = "base",
  maxWidth = "lg",
  backHref,
  backLabel = "Back",
  actions = [],
  offset = 0,
  textAlign = "center",
  id = "",
  animated = true,
  children,
}: ContentSectionProps) => {
  const MotionWrapper = animated ? MotionBox : Box;
  const motionWrapperProps = animated
    ? {
        variants: staggerContainer,
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.1 },
      }
    : {};
  const MotionItem = animated ? MotionBox : Box;
  const motionItemProps = animated ? { variants: fadeSlideUp } : {};

  return (
    <Box
      id={id}
      sx={(theme) => ({
        py: 8,
        bgcolor:
          surface === "raised" ? theme.palette.background.paper : theme.palette.background.default,
      })}
    >
      {Array.from({ length: offset }, (_, i) => (
        <Box key={i} sx={(theme) => ({ ...theme.mixins.toolbar })} />
      ))}

      <Container maxWidth={maxWidth}>
        <MotionWrapper {...motionWrapperProps}>
          <Stack spacing={8}>
            {(title || subtitle) && (
              <MotionItem {...motionItemProps}>
                <Stack
                  spacing={2}
                  alignItems="center"
                  sx={{
                    textAlign,
                    width: "100%",
                  }}
                >
                  {title && (
                    <Typography
                      variant="display2"
                      sx={(theme) => ({
                        width: "100%",
                        color: theme.palette.text.primary,
                        textAlign,
                      })}
                    >
                      {title}
                    </Typography>
                  )}

                  {subtitle && (
                    <Typography
                      variant="h4"
                      sx={(theme) => ({
                        width: "100%",
                        color: theme.palette.text.secondary,
                        textAlign,
                      })}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </Stack>
              </MotionItem>
            )}

            {(backHref || actions.length > 0) && (
              <MotionItem {...motionItemProps}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "stretch", md: "center" }}
                  justifyContent="space-between"
                  sx={{ width: "100%" }}
                  spacing={2}
                >
                  {backHref && (
                    <Button
                      component={Link}
                      href={backHref}
                      startIcon={<ArrowBackIcon />}
                      color="inherit"
                      variant="text"
                      size="small"
                    >
                      {backLabel}
                    </Button>
                  )}

                  {actions.length > 0 && (
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
                      {actions.map((action) => (
                        <Button
                          key={action.label}
                          variant={action.variant || "contained"}
                          color={action.color || "primary"}
                          type={action.type || "button"}
                          loading={Boolean(action.loading)}
                          disabled={Boolean(action.disabled)}
                          onClick={action.onClick}
                          href={action.href}
                          component={action.href ? Link : "button"}
                          startIcon={action.startIcon}
                          size="small"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </MotionItem>
            )}

            <MotionItem {...motionItemProps}>{children}</MotionItem>
          </Stack>
        </MotionWrapper>
      </Container>
    </Box>
  );
};
