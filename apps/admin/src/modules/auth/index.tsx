"use client";

import { useState } from "react";

import { Alert, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { signIn } from "@repo/auth";
import { type LoginFormData } from "@repo/contracts/auth";
import { Logo } from "@repo/ui";

import { LoginForm } from "./components";

export const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        toast.success("Welcome back");
        router.replace(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack
      sx={{
        minHeight: "100vh",
        justifyContent: "center",
        background: (theme) =>
          `radial-gradient(ellipse at 50% 20%, ${alpha(theme.palette.primary.main, 0.08)}, transparent 70%)`,
      }}
    >
      <Container maxWidth="xs">
        <Stack spacing={5} alignItems="center">
          <Stack spacing={3} alignItems="center">
            <Logo />

            <Typography
              variant="h3"
              component="h1"
              textAlign="center"
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              The Discipline Program
            </Typography>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Admin Panel
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

            <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );
};
