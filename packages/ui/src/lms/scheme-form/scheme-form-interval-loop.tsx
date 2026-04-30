"use client";

import { useId } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Button, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";

import { type SchemeFormIntervalLoopProps } from "./scheme-form.types";

type SlotAction = "WORK" | "REST";

const DEFAULT_SLOT = { durationSec: 30, action: "WORK" as const };

const parsePositiveInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

export const SchemeFormIntervalLoop = ({
  value,
  onChange,
  disabled = false,
}: SchemeFormIntervalLoopProps) => {
  const headingId = useId();

  const handleSetsChange = (raw: string) => {
    const next = parsePositiveInt(raw, value.sets);

    onChange({ ...value, sets: next });
  };

  const handleSlotChange = (
    index: number,
    update: { durationSec?: number; action?: SlotAction },
  ) => {
    const slots = value.slots.map((slot, i) => (i === index ? { ...slot, ...update } : slot));

    onChange({ ...value, slots });
  };

  const handleAddSlot = () => {
    onChange({ ...value, slots: [...value.slots, DEFAULT_SLOT] });
  };

  const handleRemoveSlot = (index: number) => {
    if (value.slots.length <= 1) {
      return;
    }

    onChange({ ...value, slots: value.slots.filter((_, i) => i !== index) });
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Sets"
        type="number"
        size="small"
        value={value.sets}
        onChange={(event) => handleSetsChange(event.target.value)}
        disabled={disabled}
        helperText="How many times the slot loop repeats"
        inputProps={{ min: 1 }}
        required
      />

      <Stack spacing={1}>
        <Typography id={headingId} variant="overline" color="text.secondary">
          Slots
        </Typography>

        {value.slots.map((slot, index) => (
          <Stack
            key={`${index.toString()}-${slot.action}`}
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <TextField
              label="Seconds"
              type="number"
              size="small"
              value={slot.durationSec}
              onChange={(event) =>
                handleSlotChange(index, {
                  durationSec: parsePositiveInt(event.target.value, slot.durationSec),
                })
              }
              disabled={disabled}
              inputProps={{ min: 1 }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Action"
              select
              size="small"
              value={slot.action}
              onChange={(event) =>
                handleSlotChange(index, { action: event.target.value as SlotAction })
              }
              disabled={disabled}
              sx={{ width: 120 }}
            >
              <MenuItem value="WORK">Work</MenuItem>
              <MenuItem value="REST">Rest</MenuItem>
            </TextField>
            <Tooltip title={value.slots.length <= 1 ? "At least one slot is required" : "Remove"}>
              <span>
                <IconButton
                  aria-label={`Remove slot ${(index + 1).toString()}`}
                  size="small"
                  onClick={() => handleRemoveSlot(index)}
                  disabled={disabled || value.slots.length <= 1}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ))}

        <Button
          startIcon={<AddIcon />}
          size="small"
          onClick={handleAddSlot}
          disabled={disabled}
          sx={{ alignSelf: "flex-start" }}
        >
          Add slot
        </Button>
      </Stack>
    </Stack>
  );
};
