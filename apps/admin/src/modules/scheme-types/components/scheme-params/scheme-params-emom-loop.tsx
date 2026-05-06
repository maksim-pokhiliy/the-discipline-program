"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { EmomSlotRow } from "./emom-slot-row";
import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./scheme-params-shared-styles";
import { type SchemeParamsBasePath, type SchemeTypeFormValues } from "./scheme-params.types";

const MIN_EMOM_SLOTS = 1;

type SchemeParamsEmomLoopFormProps = {
  basePath: SchemeParamsBasePath;
  isLoading: boolean;
};

export const SchemeParamsEmomLoopForm = ({
  basePath,
  isLoading,
}: SchemeParamsEmomLoopFormProps) => {
  const { register, control, getFieldState, formState } = useFormContext<SchemeTypeFormValues>();

  const totalMinutesName = `${basePath}.totalMinutes` as const;
  const cycleLengthName = `${basePath}.cycleLength` as const;
  const slotsName = `${basePath}.slots` as const;

  const totalMinutesError = getFieldState(totalMinutesName, formState).error;
  const cycleLengthError = getFieldState(cycleLengthName, formState).error;

  const {
    fields: slotFields,
    append: appendSlot,
    remove: removeSlot,
  } = useFieldArray({ control, name: slotsName });

  const canRemove = slotFields.length > MIN_EMOM_SLOTS;

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Total Minutes"
            type="number"
            variant="outlined"
            fullWidth
            size="small"
            disabled={isLoading}
            error={!!totalMinutesError}
            helperText={totalMinutesError?.message}
            inputProps={{ min: 1, step: 1 }}
            {...register(totalMinutesName, { valueAsNumber: true })}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Cycle Length (optional)"
            type="number"
            variant="outlined"
            fullWidth
            size="small"
            disabled={isLoading}
            error={!!cycleLengthError}
            helperText={cycleLengthError?.message}
            inputProps={{ min: 1, step: 1 }}
            {...register(cycleLengthName, { valueAsNumber: true })}
          />
        </Grid>
      </Grid>

      <Divider>
        <Typography variant="overline" color="text.secondary">
          Slots ({slotFields.length})
        </Typography>
      </Divider>

      <Stack spacing={3} sx={ITEMS_STACK_SX}>
        {slotFields.map((field, index) => (
          <EmomSlotRow
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
          onClick={() => appendSlot({ minutes: [0], action: { kind: "REST" } })}
          sx={ADD_BUTTON_SX}
          disabled={isLoading}
        >
          Add Slot
        </Button>
      </Stack>
    </Stack>
  );
};
