"use client";

import { Alert, Card, CardContent, Stack, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Logo } from "@app/shared/components/ui";

import { LoginForm } from "./components";
import { LoginFormData } from "./shared";

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
        router.replace(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={4}>
          <Stack alignItems="center">
            <Logo width={100} height={100} />
          </Stack>

          <Stack spacing={1} textAlign="center">
            <Typography variant="h4" component="h1">
              Welcome Back
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Sign in to your admin account
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />
        </Stack>
      </CardContent>
    </Card>
  );
};
