"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { DynamicListItem } from "@repo/ui";

import { EmomSlotActionField } from "./emom-slot-action-field";
import { type SchemeParamsBasePath, type SchemeTypeFormValues } from "./scheme-params.types";
import { usePrimitiveFieldArray } from "./use-primitive-field-array";

const MIN_EMOM_SLOT_MINUTES = 1;

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
  const { register, control, getFieldState, formState } = useFormContext<SchemeTypeFormValues>();

  const minutesArrayName = `${basePath}.slots.${index}.minutes` as const;

  const {
    fields: minuteFields,
    append: appendMinute,
    remove: removeMinute,
  } = usePrimitiveFieldArray<SchemeTypeFormValues>({ control, name: minutesArrayName });

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
            const minuteName = `${basePath}.slots.${index}.minutes.${minuteIndex}` as const;
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
