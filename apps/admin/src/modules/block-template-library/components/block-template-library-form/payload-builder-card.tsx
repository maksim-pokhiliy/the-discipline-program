"use client";

import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { type BlockStatus } from "@repo/contracts/lms/_domain";
import { BLOCK_CONSTANTS } from "@repo/contracts/lms/block";
import { FormCard } from "@repo/ui";

import { useBlockKindsPageData, useExercisesPageData } from "@app/lib/hooks";

import { buildDefaultSegment } from "./payload-builder/defaults";
import { SegmentRow } from "./payload-builder/segment-row";
import { type BlockTemplateFormValues } from "./payload-builder/types";

const STATUS_OPTIONS: readonly { value: BlockStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

type PayloadBuilderCardProps = {
  isLoading: boolean;
};

export const PayloadBuilderCard = ({ isLoading }: PayloadBuilderCardProps) => {
  const { control, register, setValue, getValues } = useFormContext<BlockTemplateFormValues>();
  const { data: blockKindsResponse, isLoading: isLoadingBlockKinds } = useBlockKindsPageData();
  const { data: exercisesResponse, isLoading: isLoadingExercises } = useExercisesPageData();

  const blockKinds = blockKindsResponse?.items ?? [];
  const exercises = exercisesResponse?.items ?? [];

  const {
    fields: segmentFields,
    append: appendSegment,
    remove: removeSegment,
    move: moveSegment,
  } = useFieldArray({
    control,
    name: "payload.segments",
  });

  const handleAddSegment = () => {
    appendSegment(buildDefaultSegment(segmentFields.length));
  };

  const reorderSegments = () => {
    const updated = getValues("payload.segments") ?? [];

    updated.forEach((_segment, idx) => {
      setValue(`payload.segments.${idx}.order`, idx, {
        shouldDirty: true,
        shouldValidate: false,
      });
    });
  };

  const handleMoveSegment = (from: number, to: number) => {
    if (to < 0 || to >= segmentFields.length) {
      return;
    }

    moveSegment(from, to);
    reorderSegments();
  };

  const handleRemoveSegment = (index: number) => {
    if (segmentFields.length <= 1) {
      return;
    }

    removeSegment(index);
    reorderSegments();
  };

  if (isLoadingBlockKinds || isLoadingExercises) {
    return (
      <FormCard title="Block payload">
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      </FormCard>
    );
  }

  if (blockKinds.length === 0) {
    return (
      <FormCard title="Block payload">
        <Alert severity="warning">
          No block kinds found in the library. Create at least one block kind before authoring a
          template.
        </Alert>
      </FormCard>
    );
  }

  return (
    <FormCard title="Block payload">
      <Stack spacing={4}>
        <Alert severity="info">
          Compose the block tree from scratch. For most coaches, the recommended path is to author
          on the platform plan editor and press <strong>Cmd+Shift+S</strong>; admins use this form
          for SYSTEM-curated templates.
        </Alert>

        <Stack spacing={3}>
          <Typography variant="overline" color="text.secondary">
            Block-level fields
          </Typography>

          <TextField
            label="Title"
            size="small"
            {...register("payload.block.title", {
              setValueAs: (raw: string | null) =>
                raw === null ? null : raw.trim() === "" ? null : raw,
            })}
            disabled={isLoading}
            helperText="Optional block title shown on the canvas"
            inputProps={{ maxLength: BLOCK_CONSTANTS.MAX_TITLE_LENGTH }}
          />

          <Controller
            control={control}
            name="payload.block.kindId"
            render={({ field }) => (
              <TextField
                {...field}
                label="Block kind"
                select
                size="small"
                disabled={isLoading}
                required
                helperText="Block kind drives default rendering on the canvas"
              >
                {blockKinds.map((kind) => (
                  <MenuItem key={kind.id} value={kind.id}>
                    {kind.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            control={control}
            name="payload.block.status"
            render={({ field }) => (
              <TextField {...field} label="Status" select size="small" disabled={isLoading}>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            control={control}
            name="payload.block.weight"
            render={({ field }) => (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Weight ({(field.value ?? 5).toString()})
                </Typography>
                <Slider
                  value={field.value ?? 5}
                  onChange={(_event, raw) => {
                    const next = Array.isArray(raw) ? (raw[0] ?? 5) : raw;

                    field.onChange(next);
                  }}
                  min={BLOCK_CONSTANTS.MIN_WEIGHT}
                  max={BLOCK_CONSTANTS.MAX_WEIGHT}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  disabled={isLoading}
                />
              </Box>
            )}
          />

          <TextField
            label="Notes"
            size="small"
            multiline
            minRows={3}
            {...register("payload.block.notes", {
              setValueAs: (raw: string | null) =>
                raw === null ? null : raw.trim() === "" ? null : raw,
            })}
            disabled={isLoading}
            inputProps={{ maxLength: BLOCK_CONSTANTS.MAX_NOTES_LENGTH }}
          />
        </Stack>

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Segments ({segmentFields.length.toString()})
            </Typography>
            <Button startIcon={<AddIcon />} onClick={handleAddSegment} disabled={isLoading}>
              Add segment
            </Button>
          </Stack>

          <Stack spacing={3}>
            {segmentFields.map((field, index) => (
              <SegmentRow
                key={field.id}
                segmentIndex={index}
                totalSegments={segmentFields.length}
                exercises={exercises}
                isLoading={isLoading}
                onMoveUp={() => handleMoveSegment(index, index - 1)}
                onMoveDown={() => handleMoveSegment(index, index + 1)}
                onRemove={() => handleRemoveSegment(index)}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </FormCard>
  );
};
