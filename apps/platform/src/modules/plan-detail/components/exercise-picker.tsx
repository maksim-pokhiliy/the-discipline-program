"use client";

import { Autocomplete, CircularProgress, Stack, TextField, Typography } from "@mui/material";

import { type Exercise } from "@repo/contracts/lms/exercise";

import { useExercises } from "@app/lib/hooks";

import { buildMetaLine } from "./exercise-meta-line";
import { ExercisePickerCompact } from "./exercise-picker-compact";

export { buildMetaLine };

const SEARCH_PLACEHOLDER = "search by name, family, or modality…";
const REQUIRED_EXERCISE_MESSAGE = "Pick an exercise";
const OPTION_NAME_FONT_WEIGHT = 600;
const LOADING_SPINNER_SIZE = 16;

const getOptionLabel = (option: Exercise): string => option.canonicalName;

type ExercisePickerProps = {
  value: string | null;
  onChange: (id: string | null) => void;
  error?: boolean;
  disabled?: boolean;
  placeholderOnly?: boolean;
  compact?: boolean;
};

export const ExercisePicker = ({
  value,
  onChange,
  error = false,
  disabled = false,
  placeholderOnly = false,
  compact = false,
}: ExercisePickerProps) => {
  const { data: exercises = [], isLoading } = useExercises();
  const options = placeholderOnly ? exercises.filter((e) => e.placeholderFlag) : exercises;
  const selected = exercises.find((e) => e.id === value) ?? null;

  if (compact) {
    return (
      <ExercisePickerCompact
        value={value}
        onChange={onChange}
        selected={selected}
        options={options}
        isLoading={isLoading}
        error={error}
        disabled={disabled}
      />
    );
  }

  return (
    <Autocomplete<Exercise>
      options={options}
      value={selected}
      onChange={(_, next) => onChange(next?.id ?? null)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={disabled || isLoading}
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
