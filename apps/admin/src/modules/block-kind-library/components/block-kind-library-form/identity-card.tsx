"use client";

import { Stack, TextField } from "@mui/material";
import dynamic from "next/dynamic";
import { Controller, useFormContext } from "react-hook-form";

import {
  BLOCK_KIND_CONSTANTS,
  type CreateBlockKindInput,
  type UpdateBlockKindInput,
} from "@repo/contracts/lms/block-kind";
import { FormCard } from "@repo/ui";

const RichTextEditor = dynamic(
  () => import("@repo/ui").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false },
);

type FormValues = CreateBlockKindInput & UpdateBlockKindInput;

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
          placeholder="e.g. Strength"
          variant="outlined"
          fullWidth
          disabled={isLoading}
          error={!!errors.name}
          helperText={errors.name?.message}
          inputProps={{ maxLength: BLOCK_KIND_CONSTANTS.MAX_NAME_LENGTH }}
          {...register("name")}
        />

        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <RichTextEditor
              label="Description"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="What this block is for, defaults, hints..."
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
