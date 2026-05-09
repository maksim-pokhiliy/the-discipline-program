"use client";

import { Alert, Stack, TextField } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";

import { type BlockFormValues } from "../../lib/use-block-edit-form";

const FIXED_REPS_MIN = 1;
const FIXED_REPS_STEP = 1;
const NON_FIXED_HELPER_TEXT = "Configure later via dedicated editor";

const setRepsValueAs = (value: unknown): number | undefined => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? undefined : parsed;
};

type PrescriptionEditorProps = {
  basePath: `items.${number}.prescription`;
  isLoading?: boolean;
};

export const PrescriptionEditor: React.FC<PrescriptionEditorProps> = ({
  basePath,
  isLoading = false,
}) => {
  const { register, control, getFieldState, formState } = useFormContext<BlockFormValues>();

  const repsKindPath = `${basePath}.reps.kind` as const;
  const repsValuePath = `${basePath}.reps.value` as const;
  const repsKind = useWatch({ control, name: repsKindPath });

  if (repsKind !== "FIXED") {
    return <Alert severity="info">{NON_FIXED_HELPER_TEXT}</Alert>;
  }

  const repsValueError = getFieldState(repsValuePath, formState).error;

  return (
    <Stack spacing={1}>
      <TextField
        label="Reps"
        type="number"
        size="small"
        fullWidth
        disabled={isLoading}
        error={Boolean(repsValueError)}
        helperText={repsValueError?.message}
        inputProps={{ min: FIXED_REPS_MIN, step: FIXED_REPS_STEP }}
        {...register(repsValuePath, { setValueAs: setRepsValueAs })}
      />
    </Stack>
  );
};
