"use client";

import { Box, Container, Stack, Typography } from "@mui/material";

type ContentSectionProps = {
  title?: string;
  subtitle?: string;
  backgroundColor?: "light" | "dark";
  maxWidth?: "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
};

export const ContentSection = ({
  title,
  subtitle,
  backgroundColor = "light",
  maxWidth = "xl",
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
        <Stack spacing={title || subtitle ? 8 : 0}>
          {title || subtitle ? (
            <Stack spacing={2} sx={{ textAlign: "center", alignItems: "center" }}>
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
                <Container maxWidth="md">
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
                </Container>
              )}
            </Stack>
          ) : null}

          <Stack spacing={4}>{children}</Stack>
        </Stack>
      </Container>
    </Box>
  );
};
