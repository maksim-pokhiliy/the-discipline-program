"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/lms/exercise";
import { FormCard } from "@repo/ui";

import { EQUIPMENT_LABELS, MOVEMENT_TYPE_LABELS } from "../constants";

import { EnumSelectField } from "./enum-select-field";
import { SecondaryMovementSelect } from "./secondary-movement-select";

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

        <EnumSelectField
          name="primaryEquipment"
          label="Primary Equipment"
          labels={EQUIPMENT_LABELS}
          error={errors.primaryEquipment}
          isLoading={isLoading}
        />

        <EnumSelectField
          name="movementTypeTagPrimary"
          label="Primary Movement Type"
          labels={MOVEMENT_TYPE_LABELS}
          error={errors.movementTypeTagPrimary}
          isLoading={isLoading}
        />

        <SecondaryMovementSelect error={errors.movementTypeTagSecondary} isLoading={isLoading} />
      </Stack>
    </FormCard>
  );
};
