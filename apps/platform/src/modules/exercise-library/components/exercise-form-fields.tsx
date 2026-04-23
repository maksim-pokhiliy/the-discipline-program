"use client";

import { FormControlLabel, Stack, Switch, TextField } from "@mui/material";

import { MEASUREMENT_UNIT_LABELS, MeasurementUnit } from "@repo/contracts/library/exercise";
import { MultiSelect } from "@repo/ui";

type MeasurementUnitOption = {
  id: MeasurementUnit;
  label: string;
};

const MEASUREMENT_UNIT_OPTIONS: MeasurementUnitOption[] = Object.values(MeasurementUnit).map(
  (unit) => ({
    id: unit,
    label: MEASUREMENT_UNIT_LABELS[unit],
  }),
);

export type ExerciseFormValues = {
  canonicalName: string;
  description: string;
  videoUrl: string;
  measurementUnits: MeasurementUnit[];
  hasLoad: boolean;
};

export const INITIAL_EXERCISE_FORM: ExerciseFormValues = {
  canonicalName: "",
  description: "",
  videoUrl: "",
  measurementUnits: [MeasurementUnit.REPS],
  hasLoad: false,
};

type ExerciseFormFieldsProps = {
  values: ExerciseFormValues;
  onChange: (next: ExerciseFormValues) => void;
  disabled?: boolean;
  nameError?: string | null;
  unitsError?: string | null;
};

export const ExerciseFormFields = ({
  values,
  onChange,
  disabled = false,
  nameError,
  unitsError,
}: ExerciseFormFieldsProps) => {
  const handleUnitsChange = (next: string[]) => {
    onChange({
      ...values,
      measurementUnits: next.filter((id): id is MeasurementUnit =>
        (Object.values(MeasurementUnit) as string[]).includes(id),
      ),
    });
  };

  return (
    <Stack spacing={2.5}>
      <TextField
        label="Name"
        value={values.canonicalName}
        onChange={(e) => onChange({ ...values, canonicalName: e.target.value })}
        required
        autoFocus
        fullWidth
        disabled={disabled}
        error={!!nameError}
        helperText={nameError ?? undefined}
      />

      <TextField
        label="Description (optional)"
        value={values.description}
        onChange={(e) => onChange({ ...values, description: e.target.value })}
        multiline
        minRows={2}
        maxRows={6}
        fullWidth
        disabled={disabled}
      />

      <TextField
        label="Video URL (optional)"
        value={values.videoUrl}
        onChange={(e) => onChange({ ...values, videoUrl: e.target.value })}
        placeholder="https://..."
        fullWidth
        disabled={disabled}
      />

      <MultiSelect<MeasurementUnitOption>
        options={MEASUREMENT_UNIT_OPTIONS}
        value={values.measurementUnits}
        onChange={handleUnitsChange}
        getOptionId={(o) => o.id}
        getOptionLabel={(o) => o.label}
        label="Measurement units"
        placeholder="Select units"
        disabled={disabled}
        errorText={unitsError ?? undefined}
        disableSelectAll
      />

      <FormControlLabel
        control={
          <Switch
            checked={values.hasLoad}
            onChange={(e) => onChange({ ...values, hasLoad: e.target.checked })}
            disabled={disabled}
          />
        }
        label="Has load (weight)"
      />
    </Stack>
  );
};
