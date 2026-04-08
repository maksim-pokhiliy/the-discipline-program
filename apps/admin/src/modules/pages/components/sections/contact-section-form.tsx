"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type homePageContactSchema } from "@repo/contracts/pages";
import { FormCard } from "@repo/ui";

type ContactSectionData = z.infer<typeof homePageContactSchema>;

export const ContactSectionForm = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContactSectionData>();

  return (
    <FormCard title="Final CTA Settings">
      <Stack spacing={3}>
        <TextField
          label="Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register("title")}
        />

        <TextField
          label="Subtitle"
          fullWidth
          multiline
          minRows={2}
          error={!!errors.subtitle}
          helperText={errors.subtitle?.message}
          {...register("subtitle")}
        />

        <TextField
          label="Button Text"
          fullWidth
          error={!!errors.buttonText}
          helperText={errors.buttonText?.message}
          {...register("buttonText")}
        />

        <TextField
          label="Button Link"
          fullWidth
          error={!!errors.buttonHref}
          helperText={errors.buttonHref?.message}
          {...register("buttonHref")}
        />
      </Stack>
    </FormCard>
  );
};
