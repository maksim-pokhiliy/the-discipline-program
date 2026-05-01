"use client";

import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";

import { buildDefaultEntry } from "./defaults";
import { EntryRow } from "./entry-row";
import { type BlockTemplateFormValues } from "./types";

type SetGroupRowProps = {
  segmentIndex: number;
  setGroupIndex: number;
  totalSetGroups: number;
  exercises: ExerciseLibraryItem[];
  isLoading: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export const SetGroupRow = ({
  segmentIndex,
  setGroupIndex,
  totalSetGroups,
  exercises,
  isLoading,
  onMoveUp,
  onMoveDown,
  onRemove,
}: SetGroupRowProps) => {
  const { control, register, setValue, getValues } = useFormContext<BlockTemplateFormValues>();
  const basePath = `payload.segments.${segmentIndex}.setGroups.${setGroupIndex}` as const;

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${basePath}.entries`,
  });

  const handleAddEntry = () => {
    if (exercises.length === 0) {
      return;
    }

    const first = exercises[0];

    if (!first) {
      return;
    }

    append(buildDefaultEntry(first, fields.length));
  };

  const handleMoveEntry = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) {
      return;
    }

    move(from, to);

    const updated = getValues(`${basePath}.entries`) ?? [];

    updated.forEach((_entry, idx) => {
      setValue(`${basePath}.entries.${idx}.order`, idx, {
        shouldDirty: true,
        shouldValidate: false,
      });
    });
  };

  const handleRemoveEntry = (index: number) => {
    remove(index);

    const updated = getValues(`${basePath}.entries`) ?? [];

    updated.forEach((_entry, idx) => {
      setValue(`${basePath}.entries.${idx}.order`, idx, {
        shouldDirty: true,
        shouldValidate: false,
      });
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2">Set group {(setGroupIndex + 1).toString()}</Typography>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  onClick={onMoveUp}
                  disabled={isLoading || setGroupIndex === 0}
                  aria-label="Move set group up"
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  onClick={onMoveDown}
                  disabled={isLoading || setGroupIndex === totalSetGroups - 1}
                  aria-label="Move set group down"
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove set group">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={onRemove}
                  disabled={isLoading || totalSetGroups <= 1}
                  aria-label="Remove set group"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <TextField
          label="Label"
          size="small"
          {...register(`${basePath}.label`, {
            setValueAs: (raw: string | null) =>
              raw === null ? null : raw.trim() === "" ? null : raw,
          })}
          disabled={isLoading}
          helperText="Optional set-group label (e.g. 'Working sets', 'Warm-up')"
        />

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Entries ({fields.length.toString()})
          </Typography>

          {fields.length === 0 ? (
            <Alert severity="info" sx={{ mb: 1 }}>
              No entries yet. Add at least one to make this set group meaningful.
            </Alert>
          ) : null}

          <Stack spacing={2}>
            {fields.map((field, index) => (
              <EntryRow
                key={field.id}
                segmentIndex={segmentIndex}
                setGroupIndex={setGroupIndex}
                entryIndex={index}
                totalEntries={fields.length}
                exercises={exercises}
                isLoading={isLoading}
                onMoveUp={() => handleMoveEntry(index, index - 1)}
                onMoveDown={() => handleMoveEntry(index, index + 1)}
                onRemove={() => handleRemoveEntry(index)}
              />
            ))}
          </Stack>

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddEntry}
            disabled={isLoading || exercises.length === 0}
            sx={{ mt: 2 }}
            size="small"
          >
            Add entry
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};
