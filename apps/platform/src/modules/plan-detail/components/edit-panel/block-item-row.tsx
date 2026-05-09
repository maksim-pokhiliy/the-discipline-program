"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Autocomplete,
  type AutocompleteRenderInputParams,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type Exercise } from "@repo/contracts/lms/exercise";

import { type BlockFormValues } from "../../lib/use-block-edit-form";

import { PrescriptionEditor } from "./prescription-editor";

const ITEM_PAPER_SX = { p: 2 } as const;
const ALTERNATIVES_HELPER_TEXT = "Edit alternatives later";

type BlockItemRowLookups = {
  readonly exercises: ReadonlyMap<string, Exercise>;
};

type BlockItemRowProps = {
  basePath: `items.${number}`;
  index: number;
  lookups: BlockItemRowLookups;
  onRemove: () => void;
  canRemove: boolean;
  isLoading?: boolean;
};

const getExerciseLabel = (option: Exercise): string => option.name;

const isOptionEqual = (option: Exercise, value: Exercise): boolean => option.id === value.id;

const renderExerciseInput = (
  params: AutocompleteRenderInputParams,
  errorMessage: string | undefined,
) => {
  const { size, disabled, fullWidth, id, InputLabelProps, inputProps, InputProps } = params;

  return (
    <TextField
      {...(size !== undefined && { size })}
      {...(disabled !== undefined && { disabled })}
      {...(fullWidth !== undefined && { fullWidth })}
      {...(id !== undefined && { id })}
      inputProps={inputProps}
      label="Exercise"
      variant="outlined"
      error={errorMessage !== undefined}
      {...(errorMessage !== undefined ? { helperText: errorMessage } : {})}
      slotProps={{ inputLabel: InputLabelProps, input: InputProps }}
    />
  );
};

export const BlockItemRow: React.FC<BlockItemRowProps> = ({
  basePath,
  index,
  lookups,
  onRemove,
  canRemove,
  isLoading = false,
}) => {
  const { control, register, getFieldState, formState, getValues } =
    useFormContext<BlockFormValues>();

  const exerciseIdPath = `${basePath}.exerciseId` as const;
  const notesPath = `${basePath}.notes` as const;
  const prescriptionPath = `${basePath}.prescription` as const;

  const exerciseOptions = Array.from(lookups.exercises.values());
  const notesError = getFieldState(notesPath, formState).error;
  const alternatives = getValues("items")[index]?.alternatives;
  const hasAlternatives = alternatives !== undefined && alternatives.length > 0;

  return (
    <Paper variant="outlined" sx={ITEM_PAPER_SX}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Controller
            name={exerciseIdPath}
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete<Exercise>
                fullWidth
                options={exerciseOptions}
                value={lookups.exercises.get(field.value) ?? null}
                onChange={(_event, next) => field.onChange(next?.id ?? "")}
                onBlur={field.onBlur}
                disabled={isLoading}
                getOptionLabel={getExerciseLabel}
                isOptionEqualToValue={isOptionEqual}
                renderInput={(params) => renderExerciseInput(params, fieldState.error?.message)}
              />
            )}
          />

          <Tooltip title={canRemove ? "Remove item" : "At least one item required"}>
            <span>
              <IconButton
                aria-label="Remove item"
                onClick={onRemove}
                disabled={!canRemove || isLoading}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <PrescriptionEditor basePath={prescriptionPath} isLoading={isLoading} />

        <TextField
          label="Notes"
          placeholder="Optional notes"
          multiline
          minRows={1}
          size="small"
          fullWidth
          disabled={isLoading}
          error={Boolean(notesError)}
          helperText={notesError?.message}
          {...register(notesPath)}
        />

        {hasAlternatives ? (
          <Typography variant="caption" color="text.secondary">
            {ALTERNATIVES_HELPER_TEXT}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
};
