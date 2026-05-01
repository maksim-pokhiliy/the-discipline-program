"use client";

import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import {
  defaultSchemeParams,
  SCHEME_ARCHETYPE_KINDS,
  type SchemeArchetypeKind,
  type SchemeParams,
} from "@repo/contracts/lms/_domain";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import { SchemeForm } from "@repo/ui";

import { buildDefaultSetGroup } from "./defaults";
import { SetGroupRow } from "./set-group-row";
import { type BlockTemplateFormValues } from "./types";

type SegmentRowProps = {
  segmentIndex: number;
  totalSegments: number;
  exercises: ExerciseLibraryItem[];
  isLoading: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export const SegmentRow = ({
  segmentIndex,
  totalSegments,
  exercises,
  isLoading,
  onMoveUp,
  onMoveDown,
  onRemove,
}: SegmentRowProps) => {
  const { control, register, setValue, getValues } = useFormContext<BlockTemplateFormValues>();
  const basePath = `payload.segments.${segmentIndex}` as const;

  const {
    fields: setGroupFields,
    append: appendSetGroup,
    remove: removeSetGroup,
    move: moveSetGroup,
  } = useFieldArray({
    control,
    name: `${basePath}.setGroups`,
  });

  const handleAddSetGroup = () => {
    appendSetGroup(buildDefaultSetGroup(setGroupFields.length));
  };

  const reorderSetGroups = () => {
    const updated = getValues(`${basePath}.setGroups`) ?? [];

    updated.forEach((_group, idx) => {
      setValue(`${basePath}.setGroups.${idx}.order`, idx, {
        shouldDirty: true,
        shouldValidate: false,
      });
    });
  };

  const handleMoveSetGroup = (from: number, to: number) => {
    if (to < 0 || to >= setGroupFields.length) {
      return;
    }

    moveSetGroup(from, to);
    reorderSetGroups();
  };

  const handleRemoveSetGroup = (index: number) => {
    if (setGroupFields.length <= 1) {
      return;
    }

    removeSetGroup(index);
    reorderSetGroups();
  };

  const handleArchetypeChange = (next: SchemeArchetypeKind) => {
    setValue(`${basePath}.archetypeKind`, next, { shouldDirty: true, shouldValidate: false });
    setValue(`${basePath}.schemeParams`, defaultSchemeParams(next), {
      shouldDirty: true,
      shouldValidate: false,
    });
    setValue(`${basePath}.schemeTemplateId`, null, {
      shouldDirty: true,
      shouldValidate: false,
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, bgcolor: "action.hover" }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={600}>
            Segment {(segmentIndex + 1).toString()}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  onClick={onMoveUp}
                  disabled={isLoading || segmentIndex === 0}
                  aria-label="Move segment up"
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
                  disabled={isLoading || segmentIndex === totalSegments - 1}
                  aria-label="Move segment down"
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove segment">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={onRemove}
                  disabled={isLoading || totalSegments <= 1}
                  aria-label="Remove segment"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Label"
            size="small"
            fullWidth
            {...register(`${basePath}.label`, {
              setValueAs: (raw: string | null) =>
                raw === null ? null : raw.trim() === "" ? null : raw,
            })}
            disabled={isLoading}
            helperText="Optional segment label"
          />

          <Controller
            control={control}
            name={`${basePath}.archetypeKind`}
            render={({ field }) => (
              <TextField
                {...field}
                label="Archetype"
                select
                size="small"
                fullWidth
                disabled={isLoading}
                onChange={(event) =>
                  handleArchetypeChange(event.target.value as SchemeArchetypeKind)
                }
              >
                {SCHEME_ARCHETYPE_KINDS.map((kind) => (
                  <MenuItem key={kind} value={kind}>
                    {kind.replace(/_/gu, " ")}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Scheme params
          </Typography>
          <Controller
            control={control}
            name={`${basePath}.schemeParams`}
            render={({ field }) => {
              const archetypeKind = getValues(`${basePath}.archetypeKind`);

              if (!archetypeKind || !field.value) {
                return <></>;
              }

              return (
                <SchemeForm
                  archetypeKind={archetypeKind}
                  schemeParams={field.value as SchemeParams}
                  onChange={(next) => field.onChange(next)}
                  disabled={isLoading}
                />
              );
            }}
          />
        </Box>

        <Divider />

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Set groups ({setGroupFields.length.toString()})
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddSetGroup}
              disabled={isLoading}
              size="small"
            >
              Add set group
            </Button>
          </Stack>

          <Stack spacing={2}>
            {setGroupFields.map((field, index) => (
              <SetGroupRow
                key={field.id}
                segmentIndex={segmentIndex}
                setGroupIndex={index}
                totalSetGroups={setGroupFields.length}
                exercises={exercises}
                isLoading={isLoading}
                onMoveUp={() => handleMoveSetGroup(index, index - 1)}
                onMoveDown={() => handleMoveSetGroup(index, index + 1)}
                onRemove={() => handleRemoveSetGroup(index)}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};
