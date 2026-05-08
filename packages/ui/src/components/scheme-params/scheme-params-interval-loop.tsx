"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { type FieldValues, useFieldArray, useFormContext } from "react-hook-form";

import { IntervalSlotRow } from "./interval-slot-row";
import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./scheme-params-shared-styles";
import { type SchemeParamsBasePath } from "./scheme-params.types";

const MIN_INTERVAL_SLOTS = 1;

type SchemeParamsIntervalLoopFormProps = {
  basePath: SchemeParamsBasePath;
  isLoading: boolean;
};

export const SchemeParamsIntervalLoopForm = ({
  basePath,
  isLoading,
}: SchemeParamsIntervalLoopFormProps) => {
  const { register, control, getFieldState, formState } = useFormContext<FieldValues>();

  const setsName = `${basePath}.sets`;
  const slotsName = `${basePath}.slots`;

  const setsError = getFieldState(setsName, formState).error;

  const {
    fields: slotFields,
    append: appendSlot,
    remove: removeSlot,
  } = useFieldArray({ control, name: slotsName });

  const canRemove = slotFields.length > MIN_INTERVAL_SLOTS;

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
          Slots ({slotFields.length})
        </Typography>
      </Divider>

      <Stack spacing={3} sx={ITEMS_STACK_SX}>
        {slotFields.map((field, index) => (
          <IntervalSlotRow
            key={field.id}
            basePath={basePath}
            index={index}
            isLoading={isLoading}
            canRemove={canRemove}
            onRemove={() => removeSlot(index)}
          />
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => appendSlot({ durationSec: 30, action: "WORK" })}
          sx={ADD_BUTTON_SX}
          disabled={isLoading}
        >
          Add Slot
        </Button>
      </Stack>
    </Stack>
  );
};
