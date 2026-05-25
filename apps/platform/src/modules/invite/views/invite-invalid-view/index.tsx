"use client";

import { Button, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";

import { Logo } from "@repo/ui";

export const InviteInvalidView = () => {
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
              Invite no longer valid
            </Typography>

            <Typography variant="h4" color="text.secondary" textAlign="center">
              This invite link may have expired or already been used.
            </Typography>

            <Divider
              sx={{
                width: (theme) => theme.spacing(8),
                borderColor: "primary.main",
              }}
            />

            <Typography variant="body1" color="text.secondary" textAlign="center">
              Please contact your coach to request a new invite.
            </Typography>
          </Stack>

          <Button
            component={Link}
            href="/login"
            variant="contained"
            size="large"
            fullWidth
            sx={{ maxWidth: (theme) => theme.spacing(48) }}
          >
            Go to login
          </Button>
        </Stack>
      </Container>
    </Stack>
  );
};
