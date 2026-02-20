"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import type { CreateTrainingPlanData } from "@repo/contracts/training-plan";
import { FormCard } from "@repo/ui";

export const PlanForm = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateTrainingPlanData>();

  return (
    <FormCard title="Plan Details">
      <Stack spacing={3}>
        <TextField
          label="Name"
          fullWidth
          error={!!errors.name}
          helperText={errors.name?.message}
          {...register("name")}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={4}
          error={!!errors.description}
          helperText={errors.description?.message}
          {...register("description")}
        />
      </Stack>
    </FormCard>
  );
};
