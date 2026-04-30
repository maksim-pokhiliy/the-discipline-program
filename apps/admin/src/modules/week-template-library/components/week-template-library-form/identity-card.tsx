"use client";

import { Stack, TextField } from "@mui/material";
import dynamic from "next/dynamic";
import { Controller, useFormContext } from "react-hook-form";

import {
  WEEK_TEMPLATE_CONSTANTS,
  type CreateWeekTemplateInput,
  type UpdateWeekTemplateInput,
} from "@repo/contracts/lms/week-template";
import { FormCard } from "@repo/ui";

const MarkdownEditor = dynamic(
  () => import("@repo/ui").then((m) => ({ default: m.MarkdownEditor })),
  { ssr: false },
);

type FormValues = CreateWeekTemplateInput & UpdateWeekTemplateInput;

type IdentityCardProps = {
  isLoading: boolean;
};

export const IdentityCard = ({ isLoading }: IdentityCardProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <FormCard title="Identity">
      <Stack spacing={3}>
        <TextField
          label="Name"
          placeholder="e.g. Strength Week 1"
          variant="outlined"
          fullWidth
          disabled={isLoading}
          error={!!errors.name}
          helperText={errors.name?.message}
          inputProps={{ maxLength: WEEK_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH }}
          {...register("name")}
        />

        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <MarkdownEditor
              label="Description"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="What this week template captures, when to use..."
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              minRows={4}
            />
          )}
        />
      </Stack>
    </FormCard>
  );
};
