"use client";

import { Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { APP_LEVELS, type AppLevelValue, type CreateLabelData } from "@repo/contracts/lms/label";

import { APP_LEVEL_LABELS } from "../constants";

const toggleLevel = (current: AppLevelValue[], level: AppLevelValue): AppLevelValue[] =>
  current.includes(level) ? current.filter((l) => l !== level) : [...current, level];

type ApplicableLevelsFieldProps = {
  isLoading: boolean;
};

export const ApplicableLevelsField = ({ isLoading }: ApplicableLevelsFieldProps) => {
  const { control } = useFormContext<CreateLabelData>();

  return (
    <Controller
      name="applicableLevels"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} component="fieldset" variant="standard">
          <FormGroup>
            {APP_LEVELS.map((level) => (
              <FormControlLabel
                key={level}
                control={
                  <Checkbox
                    checked={field.value.includes(level)}
                    onChange={() => field.onChange(toggleLevel(field.value, level))}
                    disabled={isLoading}
                  />
                }
                label={APP_LEVEL_LABELS[level]}
              />
            ))}
          </FormGroup>

          <FormHelperText>
            {fieldState.error?.message ?? "Select at least one level"}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
};
