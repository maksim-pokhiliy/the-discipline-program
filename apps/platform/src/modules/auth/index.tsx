"use client";

import { Alert, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { validateCallbackUrl } from "@repo/auth";
import { signIn } from "@repo/auth/client";
import { type LoginFormData, UserRole } from "@repo/contracts/iam/auth";
import { LoginForm, Logo } from "@repo/ui";

const PLATFORM_ALLOWED_ROLES = [UserRole.ATHLETE, UserRole.COACH, UserRole.HEAD_COACH] as const;

export const PlatformLoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl =
    validateCallbackUrl(searchParams.get("callbackUrl"), {
      allowedRoles: PLATFORM_ALLOWED_ROLES,
    }) ?? "/";

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Welcome back");
      router.replace(callbackUrl);
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
            {loginMutation.error && (
              <Alert severity="error" onClose={() => loginMutation.reset()}>
                {loginMutation.error.message}
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
