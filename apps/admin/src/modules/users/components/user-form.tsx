"use client";

import { Grid, MenuItem, Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { UserRole } from "@repo/contracts/iam/auth";
import { type CreateUserData, type UpdateUserData } from "@repo/contracts/iam/user";
import { FormCard } from "@repo/ui";

import { ROLE_CONFIG } from "../constants";

type UserFormProps = {
  isEdit?: boolean;
  isLoading?: boolean;
};

type UserFormValues = CreateUserData & UpdateUserData;

const CREATE_ROLE_OPTIONS: readonly UserRole[] = [UserRole.USER, UserRole.COACH];

export const UserForm = ({ isEdit = false, isLoading = false }: UserFormProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<UserFormValues>();

  const roleOptions = isEdit ? (Object.values(UserRole) as UserRole[]) : CREATE_ROLE_OPTIONS;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Account">
            <Stack spacing={3}>
              <TextField
                label="Email"
                placeholder="user@example.com"
                variant="outlined"
                fullWidth
                disabled={isLoading || isEdit}
                error={!!errors.email}
                helperText={
                  isEdit ? "Email cannot be changed after creation" : errors.email?.message
                }
                {...register("email")}
              />

              <TextField
                label="Name"
                placeholder="e.g. Jane Doe"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register("name")}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Access">
            <Stack spacing={3}>
              <TextField
                label="Role"
                select
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.role}
                helperText={errors.role?.message}
                {...register("role")}
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role} value={role}>
                    {ROLE_CONFIG[role].label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Timezone"
                placeholder="e.g. UTC or Europe/Berlin"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.timezone}
                helperText={errors.timezone?.message}
                {...register("timezone")}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};
