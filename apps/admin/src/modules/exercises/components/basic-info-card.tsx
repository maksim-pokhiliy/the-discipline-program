"use client";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useFormContext, type FieldError, type FieldPath } from "react-hook-form";

import {
  EXERCISE_MOVEMENT_TYPE,
  type CreateExerciseData,
  type ExerciseMovementType,
} from "@repo/contracts/cms/exercise";
import { FormCard } from "@repo/ui";

import { EQUIPMENT_LABELS, MOVEMENT_TYPE_LABELS } from "../constants";

type BasicInfoCardProps = {
  isLoading: boolean;
};

const SECONDARY_NONE = "__none__";

const MOVEMENT_TYPE_SET = new Set<string>(EXERCISE_MOVEMENT_TYPE);

const isMovementType = (value: unknown): value is ExerciseMovementType =>
  typeof value === "string" && MOVEMENT_TYPE_SET.has(value);

type EnumSelectFieldProps = {
  name: Extract<FieldPath<CreateExerciseData>, "primaryEquipment" | "movementTypeTagPrimary">;
  label: string;
  labels: Record<string, string>;
  error: FieldError | undefined;
  isLoading: boolean;
};

const EnumSelectField = ({ name, label, labels, error, isLoading }: EnumSelectFieldProps) => {
  const { control } = useFormContext<CreateExerciseData>();

  return (
    <FormControl fullWidth size="small" error={!!error}>
      <InputLabel>{label}</InputLabel>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select {...field} label={label} disabled={isLoading}>
            {Object.entries(labels).map(([value, optionLabel]) => (
              <MenuItem key={value} value={value}>
                {optionLabel}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
};

type SecondaryMovementSelectProps = {
  error: FieldError | undefined;
  isLoading: boolean;
};

const SecondaryMovementSelect = ({ error, isLoading }: SecondaryMovementSelectProps) => {
  const { control } = useFormContext<CreateExerciseData>();

  return (
    <FormControl fullWidth size="small" error={!!error}>
      <InputLabel>Secondary Movement Type</InputLabel>

      <Controller
        name="movementTypeTagSecondary"
        control={control}
        render={({ field }) => (
          <Select
            label="Secondary Movement Type"
            disabled={isLoading}
            value={field.value ?? SECONDARY_NONE}
            onChange={(event) => {
              const next = event.target.value;

              if (next === SECONDARY_NONE) {
                field.onChange(null);

                return;
              }

              if (isMovementType(next)) {
                field.onChange(next);
              }
            }}
          >
            <MenuItem value={SECONDARY_NONE}>None</MenuItem>

            {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
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
