"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { optionalNumberSetValueAs } from "./optional-number-register";
import { ProgressionStepRow } from "./progression-step-row";
import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./scheme-params-shared-styles";
import { type SchemeParamsBasePath, type SchemeTypeFormValues } from "./scheme-params.types";

type SchemeParamsCountUpFormProps = {
  basePath: SchemeParamsBasePath;
  isLoading: boolean;
};

export const SchemeParamsCountUpForm = ({ basePath, isLoading }: SchemeParamsCountUpFormProps) => {
  const { register, control, getFieldState, formState } = useFormContext<SchemeTypeFormValues>();

  const capName = `${basePath}.cap` as const;
  const roundsName = `${basePath}.rounds` as const;
  const progressionName = `${basePath}.progression` as const;

  const capError = getFieldState(capName, formState).error;
  const roundsError = getFieldState(roundsName, formState).error;

  const {
    fields: progressionFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control, name: progressionName });

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Cap (rounds, optional)"
            type="number"
            variant="outlined"
            fullWidth
            size="small"
            disabled={isLoading}
            error={!!capError}
            helperText={capError?.message}
            inputProps={{ min: 1, step: 1 }}
            {...register(capName, { setValueAs: optionalNumberSetValueAs })}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Rounds (optional)"
            type="number"
            variant="outlined"
            fullWidth
            size="small"
            disabled={isLoading}
            error={!!roundsError}
            helperText={roundsError?.message}
            inputProps={{ min: 1, step: 1 }}
            {...register(roundsName, { setValueAs: optionalNumberSetValueAs })}
          />
        </Grid>
      </Grid>

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
