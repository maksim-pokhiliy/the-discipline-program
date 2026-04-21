"use client";

import { Grid, MenuItem, Stack, TextField } from "@mui/material";
import {
  Controller,
  useFormContext,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CoachListItem,
  type CreateUserData,
  type UpdateUserData,
} from "@repo/contracts/iam/user";
import { FormCard, MultiSelect } from "@repo/ui";

import { useCoachesList } from "@app/lib/hooks";

import { ROLE_CONFIG } from "../constants";

import { TimezoneAutocomplete } from "./timezone-autocomplete";

type UserFormProps = {
  isEdit?: boolean;
  isLoading?: boolean;
};

type UserFormValues = CreateUserData & UpdateUserData;

const CREATE_ROLE_OPTIONS: readonly UserRole[] = [UserRole.ATHLETE, UserRole.COACH];

const AthleteCoachPicker = ({
  control,
  errors,
  isFormLoading,
}: {
  control: Control<UserFormValues>;
  errors: FieldErrors<UserFormValues>;
  isFormLoading: boolean;
}) => {
  const { data: coaches = [], isLoading: isCoachesLoading } = useCoachesList();

  return (
    <Controller
      name="coachIds"
      control={control}
      render={({ field }) => (
        <MultiSelect<CoachListItem>
          options={coaches}
          value={field.value ?? []}
          onChange={field.onChange}
          getOptionId={(c) => c.id}
          getOptionLabel={(c) => c.name ?? c.email}
          getOptionSubLabel={(c) => (c.name ? c.email : null)}
          label="Coaches"
          placeholder="Select coaches"
          emptyLabel="No coaches available"
          isLoading={isCoachesLoading}
          disabled={isFormLoading}
          errorText={errors.coachIds?.message}
        />
      )}
    />
  );
};

export const UserForm = ({ isEdit = false, isLoading = false }: UserFormProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<UserFormValues>();
  const currentRole = useWatch({ control, name: "role" });

  const roleOptions = isEdit ? Object.values(UserRole) : CREATE_ROLE_OPTIONS;

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
                {...register("name", {
                  setValueAs: (value: unknown) => {
                    if (typeof value !== "string") {
                      return value;
                    }

                    const trimmed = value.trim();

                    return trimmed === "" ? null : trimmed;
                  },
                })}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Access">
            <Stack spacing={3}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Role"
                    select
                    variant="outlined"
                    fullWidth
                    disabled={isLoading}
                    error={!!errors.role}
                    helperText={errors.role?.message}
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role} value={role}>
                        {ROLE_CONFIG[role].label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              {isEdit && (
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <TimezoneAutocomplete
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isLoading}
                      error={!!errors.timezone}
                      helperText={errors.timezone?.message}
                    />
                  )}
                />
              )}

              {currentRole === UserRole.ATHLETE && (
                <AthleteCoachPicker control={control} errors={errors} isFormLoading={isLoading} />
              )}
            </Stack>
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};
