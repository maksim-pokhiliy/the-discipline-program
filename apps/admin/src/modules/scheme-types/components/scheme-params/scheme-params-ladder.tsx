"use client";

import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Controller, type FieldValues, useFieldArray, useFormContext } from "react-hook-form";

import { LadderStepRow } from "./ladder-step-row";
import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./scheme-params-shared-styles";

const MIN_LADDER_SEQUENCE = 2;

type UntypedFormValues = FieldValues;

type SchemeParamsLadderFormProps = {
  basePath: "defaultParams";
  isLoading: boolean;
};

const DIRECTION_OPTIONS = [
  { value: "ASC", label: "Ascending" },
  { value: "DESC", label: "Descending" },
  { value: "PYRAMID", label: "Pyramid" },
] as const;

export const SchemeParamsLadderForm = ({ basePath, isLoading }: SchemeParamsLadderFormProps) => {
  const { control } = useFormContext<UntypedFormValues>();

  const directionName = `${basePath}.direction`;
  const sequenceName = `${basePath}.sequence`;

  const {
    fields: sequenceFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control, name: sequenceName });

  const canRemove = sequenceFields.length > MIN_LADDER_SEQUENCE;

  return (
    <Stack spacing={3}>
      <Controller
        name={directionName}
        control={control}
        render={({ field, fieldState }) => (
          <FormControl fullWidth size="small" error={!!fieldState.error}>
            <InputLabel id={`${basePath}-ladder-direction-label`}>Direction</InputLabel>
            <Select
              labelId={`${basePath}-ladder-direction-label`}
              label="Direction"
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isLoading}
            >
              {DIRECTION_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {fieldState.error?.message !== undefined && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      <Divider>
        <Typography variant="overline" color="text.secondary">
          Sequence ({sequenceFields.length})
        </Typography>
      </Divider>

      <Stack spacing={3} sx={ITEMS_STACK_SX}>
        {sequenceFields.map((field, index) => (
          <LadderStepRow
            key={field.id}
            basePath={basePath}
            index={index}
            isLoading={isLoading}
            canRemove={canRemove}
            onRemove={() => removeStep(index)}
          />
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => appendStep(1)}
          sx={ADD_BUTTON_SX}
          disabled={isLoading}
        >
          Add Step
        </Button>
      </Stack>
    </Stack>
  );
};
