"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/lms/exercise";

import { FormCard } from "@app/lib/components/form-card";

import { EquipmentMultiSelect } from "./equipment-multi-select";

type BasicInfoCardProps = {
  isLoading: boolean;
};

export const BasicInfoCard = ({ isLoading }: BasicInfoCardProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateExerciseData>();

  return (
    <FormCard title="Basic info">
      <Stack spacing={3}>
        <TextField
          label="Canonical Name"
          placeholder="e.g. Back Squat"
          variant="outlined"
          fullWidth
          size="small"
          disabled={isLoading}
          error={!!errors.canonicalName}
          helperText={
            errors.canonicalName?.message ?? "Will be uniquely matched case-insensitively"
          }
          {...register("canonicalName")}
        />

        <EquipmentMultiSelect isLoading={isLoading} />
      </Stack>
    </FormCard>
  );
};
