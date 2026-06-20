"use client";

import { Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { Logo } from "@repo/ui";

import { ResetPasswordForm } from "../../components";

type ResetPasswordViewProps = {
  token: string;
  email: string;
};

export const ResetPasswordView = ({ token, email }: ResetPasswordViewProps) => {
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
              Reset your password
            </Typography>

            <Typography variant="h4" color="text.secondary" textAlign="center">
              Choose a new password for your account.
            </Typography>

            <Divider
              sx={{
                width: (theme) => theme.spacing(8),
                borderColor: "primary.main",
              }}
            />
          </Stack>

          <Stack spacing={3} sx={{ width: "100%" }}>
            <ResetPasswordForm token={token} email={email} />
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );
};
