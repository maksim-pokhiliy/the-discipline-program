"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button, IconButton, Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { DynamicListItem } from "@repo/ui";

import { type SchemeParamsBasePath, type SchemeTypeFormValues } from "./scheme-params.types";
import { usePrimitiveFieldArray } from "./use-primitive-field-array";

type ProgressionStepRowProps = {
  basePath: SchemeParamsBasePath;
  index: number;
  onRemove: () => void;
  isLoading: boolean;
};

export const ProgressionStepRow = ({
  basePath,
  index,
  onRemove,
  isLoading,
}: ProgressionStepRowProps) => {
  const { register, control, getFieldState, formState } = useFormContext<SchemeTypeFormValues>();

  const roundName = `${basePath}.progression.${index}.round` as const;
  const modifierName = `${basePath}.progression.${index}.modifier` as const;
  const repsArrayName = `${basePath}.progression.${index}.reps` as const;

  const roundError = getFieldState(roundName, formState).error;
  const modifierError = getFieldState(modifierName, formState).error;

  const {
    fields: repsFields,
    append: appendRep,
    remove: removeRep,
  } = usePrimitiveFieldArray<SchemeTypeFormValues>({ control, name: repsArrayName });

  return (
    <DynamicListItem onRemove={onRemove}>
      <Stack spacing={2}>
        <TextField
          label="Round"
          type="number"
          variant="outlined"
          fullWidth
          size="small"
          disabled={isLoading}
          error={!!roundError}
          helperText={roundError?.message}
          inputProps={{ min: 1, step: 1 }}
          {...register(roundName, { valueAsNumber: true })}
        />

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          {repsFields.map((repField, repIndex) => {
            const repName = `${basePath}.progression.${index}.reps.${repIndex}` as const;
            const repError = getFieldState(repName, formState).error;

            return (
              <Stack key={repField.id} direction="row" spacing={0.5} alignItems="center">
                <TextField
                  label={`Rep ${repIndex + 1}`}
                  type="number"
                  variant="outlined"
                  size="small"
                  disabled={isLoading}
                  error={!!repError}
                  helperText={repError?.message}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ width: 100 }}
                  {...register(repName, { valueAsNumber: true })}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeRep(repIndex)}
                  disabled={isLoading}
                  aria-label={`Remove rep ${repIndex + 1}`}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            );
          })}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => appendRep(1)}
            disabled={isLoading}
          >
            Add Rep
          </Button>
        </Stack>

        <TextField
          label="Modifier (optional)"
          variant="outlined"
          fullWidth
          size="small"
          disabled={isLoading}
          error={!!modifierError}
          helperText={modifierError?.message}
          {...register(modifierName)}
        />
      </Stack>
    </DynamicListItem>
  );
};
