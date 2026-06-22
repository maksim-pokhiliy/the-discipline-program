"use client";

import { Grid, Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type CreateProfileAxisData } from "@repo/contracts/coaching/profile-axis";
import { TagsInput } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";

type ProfileAxisFormProps = {
  isLoading: boolean;
};

export const ProfileAxisForm = ({ isLoading }: ProfileAxisFormProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CreateProfileAxisData>();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <FormCard title="Basic info">
          <Stack spacing={3}>
            <TextField
              label="Key"
              placeholder="e.g. level"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={errors.key !== undefined}
              helperText={errors.key?.message ?? "Unique identifier"}
              {...register("key")}
            />

            <TextField
              label="Label"
              placeholder="e.g. Level"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={errors.label !== undefined}
              helperText={errors.label?.message ?? "Display name"}
              {...register("label")}
            />

            <Controller
              name="values"
              control={control}
              render={({ field, fieldState }) => (
                <TagsInput
                  label="Values"
                  placeholder="e.g. RX"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                  error={fieldState.error !== undefined}
                  helperText={
                    fieldState.error?.message ??
                    "Press Enter to add a value. At least one required."
                  }
                />
              )}
            />
          </Stack>
        </FormCard>
      </Grid>
    </Grid>
  );
};
