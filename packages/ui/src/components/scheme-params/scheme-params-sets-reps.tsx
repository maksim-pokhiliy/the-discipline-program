"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { type FieldValues, useFieldArray, useFormContext } from "react-hook-form";

import { ProgressionStepRow } from "./progression-step-row";
import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./scheme-params-shared-styles";
import { type SchemeParamsBasePath } from "./scheme-params.types";

type SchemeParamsSetsRepsFormProps = {
  basePath: SchemeParamsBasePath;
  isLoading: boolean;
};

export const SchemeParamsSetsRepsForm = ({
  basePath,
  isLoading,
}: SchemeParamsSetsRepsFormProps) => {
  const { register, control, getFieldState, formState } = useFormContext<FieldValues>();

  const setsName = `${basePath}.sets`;
  const progressionName = `${basePath}.progression`;

  const setsError = getFieldState(setsName, formState).error;

  const {
    fields: progressionFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control, name: progressionName });

  return (
    <Stack spacing={3}>
      <TextField
        label="Sets"
        type="number"
        variant="outlined"
        fullWidth
        size="small"
        disabled={isLoading}
        error={!!setsError}
        helperText={setsError?.message}
        inputProps={{ min: 1, step: 1 }}
        {...register(setsName, { valueAsNumber: true })}
      />

      <Divider>
        <Typography variant="overline" color="text.secondary">
          Progression ({progressionFields.length})
        </Typography>
      </Divider>

      <Stack spacing={3} sx={ITEMS_STACK_SX}>
        {progressionFields.map((field, index) => (
          <ProgressionStepRow
            key={field.id}
            basePath={basePath}
            index={index}
            isLoading={isLoading}
            onRemove={() => removeStep(index)}
          />
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => appendStep({ round: progressionFields.length + 1 })}
          sx={ADD_BUTTON_SX}
          disabled={isLoading}
        >
          Add Step
        </Button>
      </Stack>
    </Stack>
  );
};
