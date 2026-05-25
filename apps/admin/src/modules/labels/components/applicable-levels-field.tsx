"use client";

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Tooltip,
} from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { APP_LEVELS, type AppLevelValue, type CreateLabelData } from "@repo/contracts/lms/label";

import { APP_LEVEL_LABELS } from "../constants";

const toggleLevel = (current: AppLevelValue[], level: AppLevelValue): AppLevelValue[] =>
  current.includes(level) ? current.filter((l) => l !== level) : [...current, level];

type ApplicableLevelsFieldProps = {
  isLoading: boolean;
};

export const ApplicableLevelsField = ({ isLoading }: ApplicableLevelsFieldProps) => {
  const { control, setValue } = useFormContext<CreateLabelData>();
  const isRest = useWatch({ control, name: "rest" }) === true;

  const isLevelDisabled = (level: AppLevelValue) => isLoading || (isRest && level !== "DAY");

  const handleToggle = (current: AppLevelValue[], level: AppLevelValue): AppLevelValue[] => {
    const next = toggleLevel(current, level);

    if (level === "DAY" && !next.includes("DAY") && isRest) {
      setValue("rest", false, { shouldDirty: true, shouldValidate: true });
    }

    return next;
  };

  return (
    <Controller
      name="applicableLevels"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} component="fieldset" variant="standard">
          <FormGroup>
            {APP_LEVELS.map((level) => (
              <Tooltip
                key={level}
                title={isRest && level !== "DAY" ? "Disabled — rest days are DAY-only" : ""}
                placement="top"
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value.includes(level)}
                      onChange={() => field.onChange(handleToggle(field.value, level))}
                      disabled={isLevelDisabled(level)}
                    />
                  }
                  label={APP_LEVEL_LABELS[level]}
                />
              </Tooltip>
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
