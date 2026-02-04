"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { FormCard } from "@repo/ui";

export const ContactSectionForm = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <FormCard title="Final CTA Settings">
      <Stack spacing={3}>
        <TextField
          label="Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message?.toString()}
          {...register("title")}
        />

        <TextField
          label="Subtitle"
          fullWidth
          multiline
          minRows={2}
          error={!!errors.subtitle}
          helperText={errors.subtitle?.message?.toString()}
          {...register("subtitle")}
        />

        <TextField
          label="Button Text"
          fullWidth
          error={!!errors.buttonText}
          helperText={errors.buttonText?.message?.toString()}
          {...register("buttonText")}
        />

        <TextField
          label="Button Link"
          fullWidth
          error={!!errors.buttonHref}
          helperText={errors.buttonHref?.message?.toString()}
          {...register("buttonHref")}
        />
      </Stack>
    </FormCard>
  );
};
