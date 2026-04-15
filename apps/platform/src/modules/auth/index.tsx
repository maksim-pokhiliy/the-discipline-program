"use client";

import { useState } from "react";

import { Alert, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { signIn } from "@repo/auth/client";
import { type LoginFormData } from "@repo/contracts/iam/auth";
import { Logo } from "@repo/ui";

import { LoginForm } from "./components";

export const PlatformLoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      }),
    onSuccess: (result) => {
      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        toast.success("Welcome back");
        router.replace(callbackUrl);
        router.refresh();
      }
    },
    onError: () => {
      setError("An unexpected error occurred");
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
            <Logo />

            <Typography variant="display2" component="h1" textAlign="center">
              The Discipline Program
            </Typography>

            <Typography variant="h4" color="text.secondary" textAlign="center">
              Your Discipline dictates your success.
            </Typography>

            <Divider
              sx={{
                width: (theme) => theme.spacing(8),
                borderColor: "primary.main",
              }}
            />
          </Stack>

          <Stack spacing={3} sx={{ width: "100%" }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <LoginForm
              onSubmit={(data) => loginMutation.mutate(data)}
              isLoading={loginMutation.isPending}
            />
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );
};
