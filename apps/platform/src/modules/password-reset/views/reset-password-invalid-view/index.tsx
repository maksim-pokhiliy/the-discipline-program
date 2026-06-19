"use client";

import { Button, Container, Divider, Link, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import NextLink from "next/link";

import { Logo } from "@repo/ui";

export const ResetPasswordInvalidView = () => {
  return (
    <Stack
      justifyContent="center"
      sx={{
        minHeight: "100dvh",
        background: (theme) =>
          `radial-gradient(ellipse at 50% 20%, ${alpha(theme.palette.primary.main, 0.08)}, transparent 70%)`,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={5} alignItems="center">
          <Stack spacing={3} alignItems="center">
            <Logo priority />

            <Typography variant="h2" component="h1" textAlign="center">
              Reset link no longer valid
            </Typography>

            <Typography variant="h4" color="text.secondary" textAlign="center">
              This password reset link may have expired or already been used.
            </Typography>

            <Divider
              sx={{
                width: (theme) => theme.spacing(8),
                borderColor: "primary.main",
              }}
            />

            <Typography variant="body1" color="text.secondary" textAlign="center">
              Request a new link from the forgot-password page.
            </Typography>
          </Stack>

          <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
            <Button
              component={NextLink}
              href="/forgot-password"
              variant="contained"
              size="large"
              fullWidth
              sx={{ maxWidth: (theme) => theme.spacing(48) }}
            >
              Request a new link
            </Button>

            <Link
              component={NextLink}
              href="/login"
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Back to login
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );
};
