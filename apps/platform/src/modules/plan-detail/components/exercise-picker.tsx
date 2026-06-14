"use client";

import { Autocomplete, CircularProgress, Stack, TextField, Typography } from "@mui/material";

import { type Exercise } from "@repo/contracts/lms/exercise";

import { useExercises } from "@app/lib/hooks";

import { EQUIPMENT_LABELS, MOVEMENT_TYPE_LABELS } from "./exercise-label-maps";

const SEARCH_PLACEHOLDER = "search by name, family, or modality…";
const REQUIRED_EXERCISE_MESSAGE = "Pick an exercise";
const OPTION_NAME_FONT_WEIGHT = 600;
const FAMILY_PREFIX = " · family: ";
const META_SEPARATOR = " · ";
const LOADING_SPINNER_SIZE = 16;

const buildMetaLine = (exercise: Exercise): string => {
  const base = `${EQUIPMENT_LABELS[exercise.primaryEquipment]}${META_SEPARATOR}${MOVEMENT_TYPE_LABELS[exercise.movementTypeTagPrimary]}`;

  return exercise.movementFamily === null
    ? base
    : `${base}${FAMILY_PREFIX}${exercise.movementFamily}`;
};

const getOptionLabel = (option: Exercise): string => option.canonicalName;

type ExercisePickerProps = {
  value: string | null;
  onChange: (id: string | null) => void;
  error?: boolean;
  disabled?: boolean;
  placeholderOnly?: boolean;
  compact?: boolean;
  label?: string;
};

export const ExercisePicker = ({
  value,
  onChange,
  error = false,
  disabled = false,
  placeholderOnly = false,
  compact = false,
  label,
}: ExercisePickerProps) => {
  const { data: exercises = [], isLoading } = useExercises();
  const options = placeholderOnly ? exercises.filter((e) => e.placeholderFlag) : exercises;
  const selected = exercises.find((e) => e.id === value) ?? null;

  return (
    <Autocomplete<Exercise>
      options={options}
      value={selected}
      onChange={(_, next) => onChange(next?.id ?? null)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={disabled || isLoading}
      {...(compact && { size: "small" })}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: OPTION_NAME_FONT_WEIGHT }}>
              {option.canonicalName}
            </Typography>

            <Typography variant="caption" color="text.subtle">
              {buildMetaLine(option)}
            </Typography>
          </Stack>
        </li>
      )}
      renderInput={(params) => {
        const {
          size: paramsSize,
          disabled: paramsDisabled,
          fullWidth: paramsFullWidth,
          id: paramsId,
          InputLabelProps,
          inputProps,
          InputProps,
        } = params;

        return (
          <TextField
            {...(paramsSize !== undefined && { size: paramsSize })}
            {...(paramsDisabled !== undefined && { disabled: paramsDisabled })}
            {...(paramsFullWidth !== undefined && { fullWidth: paramsFullWidth })}
            {...(paramsId !== undefined && { id: paramsId })}
            inputProps={inputProps}
            {...(label !== undefined && { label })}
            placeholder={SEARCH_PLACEHOLDER}
            variant="outlined"
            error={error}
            {...(error && { helperText: REQUIRED_EXERCISE_MESSAGE })}
            slotProps={{
              inputLabel: InputLabelProps,
              input: {
                ...InputProps,
                endAdornment: (
                  <>
                    {isLoading ? (
                      <CircularProgress color="inherit" size={LOADING_SPINNER_SIZE} />
                    ) : null}
                    {InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        );
      }}
    />
  );
};
