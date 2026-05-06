"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import { type FieldValues, useFieldArray, useFormContext } from "react-hook-form";

import { DynamicListItem } from "@repo/ui";

import { EmomSlotActionField } from "./emom-slot-action-field";
import { type SchemeParamsBasePath } from "./scheme-params-field";

const MIN_EMOM_SLOT_MINUTES = 1;

type UntypedFormValues = FieldValues;

type EmomSlotRowProps = {
  basePath: SchemeParamsBasePath;
  index: number;
  onRemove: () => void;
  isLoading: boolean;
  canRemove: boolean;
};

export const EmomSlotRow = ({
  basePath,
  index,
  onRemove,
  isLoading,
  canRemove,
}: EmomSlotRowProps) => {
  const { register, control, getFieldState, formState } = useFormContext<UntypedFormValues>();

  const minutesArrayName = `${basePath}.slots.${index}.minutes`;

  const {
    fields: minuteFields,
    append: appendMinute,
    remove: removeMinute,
  } = useFieldArray({ control, name: minutesArrayName });

  const canRemoveMinute = minuteFields.length > MIN_EMOM_SLOT_MINUTES;

  return (
    <DynamicListItem
      onRemove={onRemove}
      disableRemove={!canRemove}
      removeAriaLabel={`Remove slot ${index + 1}`}
    >
      <Stack spacing={2}>
        <Typography variant="overline" color="text.secondary">
          Minutes ({minuteFields.length})
        </Typography>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          {minuteFields.map((minuteField, minuteIndex) => {
            const minuteName = `${basePath}.slots.${index}.minutes.${minuteIndex}`;
            const minuteError = getFieldState(minuteName, formState).error;

            return (
              <Stack key={minuteField.id} direction="row" spacing={0.5} alignItems="center">
                <TextField
                  label={`Minute ${minuteIndex + 1}`}
                  type="number"
                  variant="outlined"
                  size="small"
                  disabled={isLoading}
                  error={!!minuteError}
                  helperText={minuteError?.message}
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ width: 110 }}
                  {...register(minuteName, { valueAsNumber: true })}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeMinute(minuteIndex)}
                  disabled={isLoading || !canRemoveMinute}
                  aria-label={`Remove minute ${minuteIndex + 1}`}
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
            onClick={() => appendMinute(0)}
            disabled={isLoading}
          >
            Add Minute
          </Button>
        </Stack>

        <EmomSlotActionField basePath={basePath} slotIndex={index} isLoading={isLoading} />
      </Stack>
    </DynamicListItem>
  );
};
