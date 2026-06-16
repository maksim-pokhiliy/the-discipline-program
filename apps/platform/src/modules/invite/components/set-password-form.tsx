"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Button, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { signIn } from "@repo/auth/client";
import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";
import {
  type ConsumeInviteResponse,
  consumeInviteResponseSchema,
} from "@repo/contracts/iam/invite-token";
import { detectBrowserTimezone } from "@repo/shared";

const setPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH)
      .max(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SetPasswordFormData = z.infer<typeof setPasswordFormSchema>;

type SetPasswordFormProps = {
  token: string;
  email: string;
};

const CONSUME_TIMEOUT_MS = 10_000;

const parseConsumeResponse = async (response: Response): Promise<ConsumeInviteResponse> => {
  const payload: unknown = await response.json();

  return consumeInviteResponseSchema.parse(payload);
};

export const SetPasswordForm = ({ token, email }: SetPasswordFormProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timezone, setTimezone] = useState<string | null>(null);

  useEffect(() => {
    setTimezone(detectBrowserTimezone());
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SetPasswordFormData) => {
    setIsSubmitting(true);

    try {
      const requestBody: { password: string; timezone?: string } = {
        password: data.password,
      };

      if (timezone !== null) {
        requestBody.timezone = timezone;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONSUME_TIMEOUT_MS);

      let response: Response;

      try {
        response = await fetch(`/api/invite/${token}/consume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 410) {
        toast.error("This invite link is no longer valid");
        router.refresh();

        return;
      }

      if (!response.ok) {
        toast.error("Could not complete your invite. Please try again.");

        return;
      }

      const result = await parseConsumeResponse(response);
      const redirectTo = result.redirectTo;

      const signInResult = await signIn("credentials", {
        email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        toast.success("Welcome to The Discipline Program");
        router.replace(redirectTo);
        router.refresh();

        return;
      }

      toast.success("Password set. Please sign in to continue.");
      router.replace(`/login?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const timezoneHelper = timezone
    ? `Timezone: ${timezone} — you can change it later in settings`
    : undefined;

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
      <TextField
        label="Email"
        value={email}
        fullWidth
        disabled
        type="email"
        helperText={timezoneHelper}
      />

      <TextField
        label="Password"
        type={showPassword ? "text" : "password"}
        fullWidth
        autoComplete="new-password"
        disabled={isSubmitting}
        error={!!errors.password}
        helperText={
          errors.password?.message ?? `At least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`
        }
        {...register("password")}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="large"
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        label="Confirm password"
        type={showConfirmPassword ? "text" : "password"}
        fullWidth
        autoComplete="new-password"
        disabled={isSubmitting}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        {...register("confirmPassword")}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="large"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  edge="end"
                  disabled={isSubmitting}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button type="submit" variant="contained" size="large" fullWidth disabled={isSubmitting}>
        {isSubmitting ? "Setting password..." : "Set password and continue"}
      </Button>
    </Stack>
  );
};
