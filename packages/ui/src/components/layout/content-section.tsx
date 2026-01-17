"use client";

import { type ReactNode } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Container, Stack, Typography, type ButtonProps } from "@mui/material";
import Link from "next/link";

export type ContentAction = ButtonProps & {
  label: string;
  startIcon?: ReactNode;
};

type ContentSectionProps = {
  title?: string;
  subtitle?: string;
  backgroundColor?: "light" | "dark";
  maxWidth?: "sm" | "md" | "lg" | "xl";
  backHref?: string;
  backLabel?: string;
  actions?: ContentAction[];
  children?: ReactNode;
};

export const ContentSection = ({
  title,
  subtitle,
  backgroundColor = "light",
  maxWidth = "xl",
  backHref,
  backLabel = "Back",
  actions = [],
  children,
}: ContentSectionProps) => {
  const isDark = backgroundColor === "dark";

  return (
    <Box
      sx={(theme) => ({
        py: 8,
        backgroundColor: isDark ? theme.palette.background.default : theme.palette.background.paper,
        color: theme.palette.text.primary,
      })}
    >
      <Container maxWidth={maxWidth}>
        <Stack spacing={4}>

          {(title || subtitle) && (
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
                  variant="h2"
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
                  variant="h5"
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
          )}

          {(backHref || actions.length > 0) && (
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              {backHref && (
                <Button
                  component={Link}
                  href={backHref}
                  startIcon={<ArrowBackIcon />}
                  color="inherit"
                  variant="text"
                  fullWidth
                  sx={{
                    width: { md: "auto" },
                    justifyContent: { xs: "center", md: "flex-start" }
                  }}
                >
                  {backLabel}
                </Button>
              )}

              {actions.length > 0 && (
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems="stretch"
                >
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
                      fullWidth
                      sx={{ width: { md: "auto" } }}
                    >
                      {action.loading ? "Loading..." : action.label}
                    </Button>
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          <Box>{children}</Box>
        </Stack>
      </Container>
    </Box>
  );
};
