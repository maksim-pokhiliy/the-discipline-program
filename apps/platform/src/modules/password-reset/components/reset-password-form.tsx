"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Button, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";
import {
  type ConsumePasswordResetResponse,
  consumePasswordResetResponseSchema,
} from "@repo/contracts/iam/password-reset";

const resetPasswordFormSchema = z
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

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

type ResetPasswordFormProps = {
  token: string;
  email: string;
};

const CONSUME_TIMEOUT_MS = 10_000;

const parseConsumeResponse = async (response: Response): Promise<ConsumePasswordResetResponse> => {
  const payload: unknown = await response.json();

  return consumePasswordResetResponseSchema.parse(payload);
};

export const ResetPasswordForm = ({ token, email }: ResetPasswordFormProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONSUME_TIMEOUT_MS);

      let response: Response;

      try {
        response = await fetch(`/api/auth/password-reset/${token}/consume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: data.password }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 410) {
        toast.error("This password reset link is no longer valid");
        router.refresh();

        return;
      }

      if (!response.ok) {
        toast.error("Could not reset your password. Please try again.");

        return;
      }

      await parseConsumeResponse(response);

      toast.success("Password updated. Please sign in with your new password.");
      router.replace(`/login?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
      <TextField label="Email" value={email} fullWidth disabled type="email" />

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
        {isSubmitting ? "Updating password..." : "Update password"}
      </Button>
    </Stack>
  );
};
