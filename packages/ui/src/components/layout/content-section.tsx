"use client";

import { type ReactNode } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Container, Stack, Typography, type ButtonProps } from "@mui/material";
import { type Variants, motion } from "framer-motion";
import Link from "next/link";

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
  startIcon?: ReactNode;
};

type ContentSectionProps = {
  title?: string;
  subtitle?: string;
  surface?: "base" | "raised";
  maxWidth?: "sm" | "md" | "lg" | "xl";
  backHref?: string;
  backLabel?: string;
  actions?: ContentAction[];
  stickyToolbar?: boolean;
  offset?: number;
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
  stickyToolbar = false,
  offset = 0,
  children,
}: ContentSectionProps) => {
  return (
    <Box
      sx={(theme) => ({
        py: 8,
        backgroundColor:
          surface === "raised" ? theme.palette.background.paper : theme.palette.background.default,
      })}
    >
      {Array.from({ length: offset }, (_, i) => (
        <Box key={i} sx={(theme) => ({ ...theme.mixins.toolbar })} />
      ))}

      <Container maxWidth={maxWidth}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <Stack spacing={8}>
            {(title || subtitle) && (
              <motion.div variants={fadeSlideUp}>
                <Stack
                  spacing={2}
                  sx={{
                    textAlign: "center",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  {title && (
                    <Typography
                      variant="display2"
                      sx={(theme) => ({
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                      })}
                    >
                      {title}
                    </Typography>
                  )}

                  {subtitle && (
                    <Typography
                      variant="h4"
                      sx={(theme) => ({
                        color: theme.palette.text.secondary,
                        fontWeight: 400,
                        lineHeight: 1.4,
                      })}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </Stack>
              </motion.div>
            )}

            {(backHref || actions.length > 0) && (
              <motion.div variants={fadeSlideUp}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "stretch", md: "center" }}
                  justifyContent="space-between"
                  spacing={2}
                  sx={
                    stickyToolbar
                      ? (theme) => ({
                          position: "sticky",
                          top: 0,
                          zIndex: theme.zIndex.appBar - 1,
                          backgroundColor: theme.palette.background.default,
                          py: 2,
                          mx: -2,
                          px: 2,
                        })
                      : undefined
                  }
                >
                  {backHref && (
                    <Button
                      component={Link}
                      href={backHref}
                      startIcon={<ArrowBackIcon />}
                      color="inherit"
                      variant="text"
                      size="small"
                      fullWidth
                      sx={{
                        width: { md: "auto" },
                        justifyContent: { xs: "center", md: "flex-start" },
                      }}
                    >
                      {backLabel}
                    </Button>
                  )}

                  {actions.length > 0 && (
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
                      {actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || "contained"}
                          color={action.color || "primary"}
                          type={action.type || "button"}
                          disabled={Boolean(action.disabled || action.loading)}
                          onClick={action.onClick}
                          href={action.href}
                          component={action.href ? Link : "button"}
                          startIcon={action.startIcon}
                          size="small"
                          fullWidth
                          sx={{ width: { md: "auto" } }}
                        >
                          {action.loading ? "Loading..." : action.label}
                        </Button>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </motion.div>
            )}

            <motion.div variants={fadeSlideUp}>{children}</motion.div>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
};
