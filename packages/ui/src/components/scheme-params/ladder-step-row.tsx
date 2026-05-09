"use client";

import { TextField } from "@mui/material";
import { type FieldValues, useFormContext } from "react-hook-form";

import { DynamicListItem } from "../dynamic-list-item";

import { type SchemeParamsBasePath } from "./scheme-params.types";

type LadderStepRowProps = {
  basePath: SchemeParamsBasePath;
  index: number;
  onRemove: () => void;
  isLoading: boolean;
  canRemove: boolean;
};

export const LadderStepRow = ({
  basePath,
  index,
  onRemove,
  isLoading,
  canRemove,
}: LadderStepRowProps) => {
  const { register, getFieldState, formState } = useFormContext<FieldValues>();

  const stepName = `${basePath}.sequence.${index}`;
  const stepError = getFieldState(stepName, formState).error;

  return (
    <DynamicListItem
      onRemove={onRemove}
      disableRemove={!canRemove}
      removeAriaLabel={`Remove sequence step ${index + 1}`}
    >
      <TextField
        label={`Step ${index + 1}`}
        type="number"
        variant="outlined"
        fullWidth
        size="small"
        disabled={isLoading}
        error={!!stepError}
        helperText={stepError?.message}
        inputProps={{ min: 1, step: 1 }}
        {...register(stepName, { valueAsNumber: true })}
      />
    </DynamicListItem>
  );
};
