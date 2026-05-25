"use client";

import { FormControlLabel, Switch, Tooltip } from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { type CreateLabelData } from "@repo/contracts/lms/label";

const REST_DISABLED_HINT = "Rest days must be DAY-level only";

type RestSwitchFieldProps = {
  isLoading: boolean;
};

export const RestSwitchField = ({ isLoading }: RestSwitchFieldProps) => {
  const { control } = useFormContext<CreateLabelData>();
  const applicableLevels = useWatch({ control, name: "applicableLevels" });
  const isDisabledByLevels = !(applicableLevels.length === 1 && applicableLevels[0] === "DAY");

  return (
    <Controller
      name="rest"
      control={control}
      render={({ field }) => (
        <Tooltip title={isDisabledByLevels ? REST_DISABLED_HINT : ""} placement="top">
          <FormControlLabel
            control={
              <Switch
                checked={field.value === true}
                onChange={(_, next) => field.onChange(next)}
                disabled={isLoading || isDisabledByLevels}
              />
            }
            label="Rest day"
          />
        </Tooltip>
      )}
    />
  );
};
