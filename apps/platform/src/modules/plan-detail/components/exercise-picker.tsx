"use client";

import { Autocomplete, Box, CircularProgress, Stack, TextField, Typography } from "@mui/material";

import { type Exercise } from "@repo/contracts/lms/exercise";

import { useExercises } from "@app/lib/hooks";

const SEARCH_PLACEHOLDER = "search by name, family, or modality…";
const REQUIRED_EXERCISE_MESSAGE = "Pick an exercise";
const OPTION_NAME_FONT_WEIGHT = 600;
const FAMILY_PREFIX = "family: ";
const EQUIPMENT_SEPARATOR = ", ";
const META_SEPARATOR = " · ";
const LOADING_SPINNER_SIZE = 16;

const buildMetaLine = (exercise: Exercise): string => {
  const equipmentPart = exercise.equipment.map((item) => item.name).join(EQUIPMENT_SEPARATOR);
  const familyPart =
    exercise.movementFamily === null ? null : `${FAMILY_PREFIX}${exercise.movementFamily}`;

  return [equipmentPart, familyPart].filter(Boolean).join(META_SEPARATOR);
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
  const options = placeholderOnly ? exercises.filter((e) => e.nature === "PLACEHOLDER") : exercises;
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
        <Box component="li" {...props} key={option.id}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: OPTION_NAME_FONT_WEIGHT }}>
              {option.canonicalName}
            </Typography>

            <Typography variant="caption" color="text.subtle">
              {buildMetaLine(option)}
            </Typography>
          </Stack>
        </Box>
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
