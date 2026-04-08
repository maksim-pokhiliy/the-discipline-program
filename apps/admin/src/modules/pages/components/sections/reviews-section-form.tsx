"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type homePageReviewsSchema } from "@repo/contracts/pages";
import { FormCard } from "@repo/ui";

type ReviewsSectionData = z.infer<typeof homePageReviewsSchema>;

export const ReviewsSectionForm = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<ReviewsSectionData>();

  return (
    <FormCard title="Reviews Section Settings">
      <Stack spacing={3}>
        <TextField
          label="Section Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register("title")}
        />

        <TextField
          label="Section Subtitle"
          fullWidth
          multiline
          minRows={2}
          error={!!errors.subtitle}
          helperText={errors.subtitle?.message}
          {...register("subtitle")}
        />
      </Stack>
    </FormCard>
  );
};
