import { Box, Container, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  backgroundColor?: "light" | "dark";
  maxWidth?: "sm" | "md" | "lg" | "xl";
  children?: ReactNode;
}

export const ContentSection = ({
  title,
  subtitle,
  backgroundColor = "light",
  maxWidth = "lg",
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
        <Stack spacing={children ? 8 : 0}>
          {(title || subtitle) && (
            <Stack spacing={2} textAlign="center" alignItems="center">
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
          )}

          {children}
        </Stack>
      </Container>
    </Box>
  );
};
