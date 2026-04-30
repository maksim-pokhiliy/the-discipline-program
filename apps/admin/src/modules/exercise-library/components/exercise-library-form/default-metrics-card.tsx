"use client";

import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import {
  type CreateExerciseLibraryItemInput,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { FormCard } from "@repo/ui";

type FormValues = CreateExerciseLibraryItemInput & UpdateExerciseLibraryItemInput;

const METRIC_FIELDS = [
  { name: "canMeasureLoad", label: "Load" },
  { name: "canMeasureReps", label: "Reps" },
  { name: "canMeasureDuration", label: "Duration" },
  { name: "canMeasureDistance", label: "Distance" },
  { name: "canMeasureCalories", label: "Calories" },
] as const;

type DefaultMetricsCardProps = {
  isLoading: boolean;
};

export const DefaultMetricsCard = ({ isLoading }: DefaultMetricsCardProps) => {
  const { control } = useFormContext<FormValues>();

  return (
    <FormCard title="Default metrics">
      <Stack>
        {METRIC_FIELDS.map((m) => (
          <Controller
            key={m.name}
            name={`defaultMetrics.${m.name}`}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isLoading}
                    size="small"
                  />
                }
                label={m.label}
              />
            )}
          />
        ))}
      </Stack>
    </FormCard>
  );
};
