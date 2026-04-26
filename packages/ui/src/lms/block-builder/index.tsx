"use client";

import { MenuItem, Slider, Stack, TextField, Typography } from "@mui/material";

import { type BlockStatus } from "@repo/contracts/lms/_domain";

import { type BlockBuilderProps, type BlockStatusOption } from "./block-builder.types";

const STATUS_OPTIONS: readonly BlockStatusOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

const MIN_WEIGHT = 1;
const MAX_WEIGHT = 10;

export const BlockBuilder = ({
  block,
  blockKinds = [],
  onChange,
  disabled = false,
}: BlockBuilderProps) => {
  const handleTitleChange = (raw: string) => {
    const title = raw.trim() === "" ? null : raw;

    onChange((prev) => ({ ...prev, title }));
  };

  const handleNotesChange = (raw: string) => {
    const notes = raw.trim() === "" ? null : raw;

    onChange((prev) => ({ ...prev, notes }));
  };

  const handleStatusChange = (next: BlockStatus) => {
    onChange((prev) => ({ ...prev, status: next }));
  };

  const handleWeightChange = (next: number) => {
    onChange((prev) => ({ ...prev, weight: next }));
  };

  const handleKindChange = (next: string) => {
    onChange((prev) => ({ ...prev, kindId: next }));
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Title"
        size="small"
        value={block.title ?? ""}
        onChange={(event) => handleTitleChange(event.target.value)}
        disabled={disabled}
      />

      {blockKinds.length > 0 ? (
        <TextField
          label="Block kind"
          select
          size="small"
          value={block.kindId}
          onChange={(event) => handleKindChange(event.target.value)}
          disabled={disabled}
        >
          {blockKinds.map((kind) => (
            <MenuItem key={kind.id} value={kind.id}>
              {kind.name}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <TextField
          label="Block kind id"
          size="small"
          value={block.kindId}
          onChange={(event) => handleKindChange(event.target.value)}
          disabled={disabled}
          helperText="No block-kind library data provided"
        />
      )}

      <TextField
        label="Status"
        select
        size="small"
        value={block.status}
        onChange={(event) => handleStatusChange(event.target.value as BlockStatus)}
        disabled={disabled}
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          Weight ({block.weight.toString()})
        </Typography>
        <Slider
          value={block.weight}
          onChange={(_event, raw) => {
            const next = Array.isArray(raw) ? (raw[0] ?? MIN_WEIGHT) : raw;

            handleWeightChange(next);
          }}
          min={MIN_WEIGHT}
          max={MAX_WEIGHT}
          step={1}
          marks
          valueLabelDisplay="auto"
          disabled={disabled}
        />
      </Stack>

      <TextField
        label="Notes"
        size="small"
        multiline
        minRows={3}
        value={block.notes ?? ""}
        onChange={(event) => handleNotesChange(event.target.value)}
        disabled={disabled}
      />
    </Stack>
  );
};

export type { BlockBuilderProps } from "./block-builder.types";
