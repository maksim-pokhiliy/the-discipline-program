"use client";

import { Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { type InviteToken } from "@repo/contracts/iam/invite-token";
import { Logo } from "@repo/ui";

import { SetPasswordForm } from "../../components";

type InviteViewProps = {
  token: string;
  invite: InviteToken;
};

const formatExpiry = (expiresAt: Date): string => {
  const now = Date.now();
  const diffMs = expiresAt.getTime() - now;

  if (diffMs <= 0) {
    return "soon";
  }

  const hours = Math.ceil(diffMs / (60 * 60 * 1000));

  if (hours < 24) {
    return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.ceil(hours / 24);

  return `in ${days} day${days === 1 ? "" : "s"}`;
};

export const InviteView = ({ token, invite }: InviteViewProps) => {
  const greetingName = invite.recipientName ?? invite.email;

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
              Welcome, {greetingName}
            </Typography>

            <Typography variant="h4" color="text.secondary" textAlign="center">
              Set your password to activate your account.
            </Typography>

            <Divider
              sx={{
                width: (theme) => theme.spacing(8),
                borderColor: "primary.main",
              }}
            />

            <Typography variant="body2" color="text.secondary" textAlign="center">
              This invite expires {formatExpiry(invite.expiresAt)}.
            </Typography>
          </Stack>

          <Stack spacing={3} sx={{ width: "100%" }}>
            <SetPasswordForm token={token} email={invite.email} />
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );
};
