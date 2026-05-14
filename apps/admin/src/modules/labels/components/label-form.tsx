"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type CreateLabelData } from "@repo/contracts/cms/label";
import { FormCard } from "@repo/ui";

import { ApplicableLevelsField } from "./applicable-levels-field";

type LabelFormProps = {
  isLoading: boolean;
};

export const LabelForm = ({ isLoading }: LabelFormProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateLabelData>();

  return (
    <FormCard title="Basic info">
      <Stack spacing={3}>
        <TextField
          label="Name"
          placeholder="e.g. Push Day"
          variant="outlined"
          fullWidth
          size="small"
          disabled={isLoading}
          error={!!errors.name}
          helperText={errors.name?.message ?? "Will be uniquely matched case-insensitively"}
          {...register("name")}
        />

        <ApplicableLevelsField isLoading={isLoading} />

        <TextField
          label="Notes"
          placeholder="Coaching notes, usage guidance..."
          multiline
          rows={4}
          variant="outlined"
          fullWidth
          size="small"
          disabled={isLoading}
          error={!!errors.notes}
          helperText={errors.notes?.message}
          {...register("notes")}
        />
      </Stack>
    </FormCard>
  );
};
