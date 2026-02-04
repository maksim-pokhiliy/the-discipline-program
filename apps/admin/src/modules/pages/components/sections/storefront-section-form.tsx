"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { FormCard } from "@repo/ui";

export const StorefrontSectionForm = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <FormCard title="Programs Preview Settings">
      <Stack spacing={3}>
        <TextField
          label="Section Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message?.toString()}
          {...register("title")}
        />

        <TextField
          label="Section Subtitle"
          fullWidth
          multiline
          minRows={2}
          error={!!errors.subtitle}
          helperText={errors.subtitle?.message?.toString()}
          {...register("subtitle")}
        />
      </Stack>
    </FormCard>
  );
};
