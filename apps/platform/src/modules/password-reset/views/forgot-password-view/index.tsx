"use client";

import { useState } from "react";

import { Button, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import NextLink from "next/link";
import { toast } from "sonner";

import { type RequestPasswordResetRequest } from "@repo/contracts/iam/password-reset";
import { Logo } from "@repo/ui";

import { ForgotPasswordForm } from "../../components";

export const ForgotPasswordView = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const requestMutation = useMutation({
    mutationFn: async (data: RequestPasswordResetRequest) => {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

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
              Forgot your password?
            </Typography>

            <Typography variant="h4" color="text.secondary" textAlign="center">
              Enter your email and we&apos;ll send you a reset link.
            </Typography>

            <Divider
              sx={{
                width: (theme) => theme.spacing(8),
                borderColor: "primary.main",
              }}
            />
          </Stack>

          <Stack spacing={3} sx={{ width: "100%" }}>
            {isSubmitted ? (
              <Stack spacing={3} alignItems="center">
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  If an account exists for that email, we&apos;ve sent a password reset link. Check
                  your inbox.
                </Typography>

                <Button
                  component={NextLink}
                  href="/login"
                  variant="contained"
                  size="large"
                  fullWidth
                >
                  Back to login
                </Button>
              </Stack>
            ) : (
              <ForgotPasswordForm
                onSubmit={(data) => requestMutation.mutate(data)}
                isLoading={requestMutation.isPending}
              />
            )}
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );
};
