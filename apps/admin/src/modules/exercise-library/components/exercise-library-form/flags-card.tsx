"use client";

import { FormControlLabel, Stack, Switch } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import {
  type CreateExerciseLibraryItemInput,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { FormCard } from "@repo/ui";

type FormValues = CreateExerciseLibraryItemInput & UpdateExerciseLibraryItemInput;

type FlagsCardProps = {
  isEdit: boolean;
  isLoading: boolean;
};

export const FlagsCard = ({ isEdit, isLoading }: FlagsCardProps) => {
  const { control } = useFormContext<FormValues>();

  return (
    <FormCard title="Flags">
      <Stack>
        <Controller
          name="isBenchmark"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isLoading}
                />
              }
              label="Benchmark"
            />
          )}
        />

        {isEdit && (
          <Controller
            name="isDeprecated"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label="Deprecated"
              />
            )}
          />
        )}
      </Stack>
    </FormCard>
  );
};
