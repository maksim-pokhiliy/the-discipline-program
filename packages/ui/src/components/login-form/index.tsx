"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Button, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { useForm } from "react-hook-form";

import { type LoginFormData, loginFormSchema } from "@repo/contracts/iam/auth";

export type LoginFormProps = {
  onSubmit: (data: LoginFormData) => void;
  isLoading?: boolean;
};

export const LoginForm = ({ onSubmit, isLoading = false }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
      <TextField
        label="Email"
        type="email"
        fullWidth
        disabled={isLoading}
        error={!!errors.email}
        helperText={errors.email?.message}
        {...register("email")}
      />

      <TextField
        label="Password"
        type={showPassword ? "text" : "password"}
        fullWidth
        disabled={isLoading}
        error={!!errors.password}
        helperText={errors.password?.message}
        {...register("password")}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="large"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </Stack>
  );
};
