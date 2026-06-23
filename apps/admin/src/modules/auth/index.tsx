"use client";

import { Alert, Divider, Stack, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { validateCallbackUrl } from "@repo/auth";
import { getSession, signIn } from "@repo/auth/client";
import {
  FALLBACK_ROLE_HOME,
  ROLE_HOMES,
  type LoginFormData,
  UserRole,
} from "@repo/contracts/iam/auth";
import { LoginForm, Logo } from "@repo/ui";

const ADMIN_ALLOWED_ROLES = [UserRole.ADMIN, UserRole.HEAD_COACH] as const;

export const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = validateCallbackUrl(searchParams.get("callbackUrl"), {
    allowedRoles: ADMIN_ALLOWED_ROLES,
  });

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

      const session = await getSession();

      return session;
    },

    onSuccess: (session) => {
      toast.success("Welcome back");

      const role = session?.user?.role;
      const home = role ? ROLE_HOMES[role] : FALLBACK_ROLE_HOME;

      router.replace(callbackUrl ?? home);
    },
  });

  return (
    <Stack spacing={5} alignItems="center">
      <Stack spacing={3} alignItems="center">
        <Logo priority />

        <Typography variant="h2" component="h1" textAlign="center">
          The Discipline Program
        </Typography>

        <Typography variant="h4" color="text.secondary" textAlign="center">
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
  );
};
