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

import { signIn } from "@repo/auth/client";
import {
  type ConsumeInviteResponse,
  consumeInviteRequestSchema,
  consumeInviteResponseSchema,
} from "@repo/contracts/iam/invite-token";

const setPasswordFormSchema = consumeInviteRequestSchema
  .extend({
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

const parseConsumeResponse = async (response: Response): Promise<ConsumeInviteResponse> => {
  const payload: unknown = await response.json();

  return consumeInviteResponseSchema.parse(payload);
};

export const SetPasswordForm = ({ token, email }: SetPasswordFormProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const response = await fetch(`/api/invite/${token}/consume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      });

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
        helperText={errors.password?.message ?? "At least 12 characters"}
        {...register("password")}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="medium"
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
        type={showPassword ? "text" : "password"}
        fullWidth
        autoComplete="new-password"
        disabled={isSubmitting}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" variant="contained" size="large" fullWidth disabled={isSubmitting}>
        {isSubmitting ? "Setting password..." : "Set password and continue"}
      </Button>
    </Stack>
  );
};
