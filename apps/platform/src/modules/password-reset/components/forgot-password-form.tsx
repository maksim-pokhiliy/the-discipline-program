"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Stack, TextField } from "@mui/material";
import { useForm } from "react-hook-form";

import {
  type RequestPasswordResetRequest,
  requestPasswordResetRequestSchema,
} from "@repo/contracts/iam/password-reset";

type ForgotPasswordFormProps = {
  onSubmit: (data: RequestPasswordResetRequest) => void;
  isLoading?: boolean;
};

export const ForgotPasswordForm = ({ onSubmit, isLoading = false }: ForgotPasswordFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetRequest>({
    resolver: zodResolver(requestPasswordResetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        fullWidth
        disabled={isLoading}
        error={!!errors.email}
        helperText={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading}>
        {isLoading ? "Sending..." : "Send reset link"}
      </Button>
    </Stack>
  );
};
