"use client";

import { useId } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Button, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";

import { type SchemeParamsEmomLoop } from "@repo/contracts/lms/_domain";

import { type SchemeFormEmomLoopProps } from "./scheme-form.types";

type SlotAction = SchemeParamsEmomLoop["slots"][number]["action"];

type SlotActionKind = SlotAction["kind"];

const ACTION_KINDS: readonly SlotActionKind[] = ["ENTRY", "REST", "MAX_OF_ENTRY"] as const;

const DEFAULT_SLOT: SchemeParamsEmomLoop["slots"][number] = {
  minutes: [0],
  action: { kind: "REST" },
};

const parsePositiveInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const parseNonNegativeInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
};

const parseMinutesList = (raw: string): number[] => {
  const out: number[] = [];

  raw.split(",").forEach((chunk) => {
    const trimmed = chunk.trim();

    if (trimmed === "") {
      return;
    }

    const parsed = Number.parseInt(trimmed, 10);

    if (Number.isFinite(parsed) && parsed >= 0) {
      out.push(parsed);
    }
  });

  return out;
};

const buildAction = (kind: SlotActionKind, previous: SlotAction): SlotAction => {
  if (kind === "REST") {
    return { kind: "REST" };
  }

  const fallbackEntryRefIndex =
    "entryRefIndex" in previous && typeof previous.entryRefIndex === "number"
      ? previous.entryRefIndex
      : 0;

  if (kind === "ENTRY") {
    return { kind: "ENTRY", entryRefIndex: fallbackEntryRefIndex };
  }

  return { kind: "MAX_OF_ENTRY", entryRefIndex: fallbackEntryRefIndex };
};

export const SchemeFormEmomLoop = ({
  value,
  onChange,
  disabled = false,
}: SchemeFormEmomLoopProps) => {
  const headingId = useId();

  const handleTotalMinutesChange = (raw: string) => {
    onChange({ ...value, totalMinutes: parsePositiveInt(raw, value.totalMinutes) });
  };

  const handleCycleLengthChange = (raw: string) => {
    if (raw.trim() === "") {
      const next = { ...value };

      delete next.cycleLength;
      onChange(next);

      return;
    }

    onChange({ ...value, cycleLength: parsePositiveInt(raw, value.cycleLength ?? 1) });
  };

  const handleSlotMinutesChange = (slotIndex: number, raw: string) => {
    const slots = value.slots.map((slot, i) =>
      i === slotIndex ? { ...slot, minutes: parseMinutesList(raw) } : slot,
    );

    onChange({ ...value, slots });
  };

  const handleSlotActionKindChange = (slotIndex: number, kind: SlotActionKind) => {
    const slots = value.slots.map((slot, i) =>
      i === slotIndex ? { ...slot, action: buildAction(kind, slot.action) } : slot,
    );

    onChange({ ...value, slots });
  };

  const handleSlotEntryRefChange = (slotIndex: number, raw: string) => {
    const slots = value.slots.map((slot, i) => {
      if (i !== slotIndex || slot.action.kind === "REST") {
        return slot;
      }

      const entryRefIndex = parseNonNegativeInt(raw, slot.action.entryRefIndex);

      return { ...slot, action: { ...slot.action, entryRefIndex } };
    });

    onChange({ ...value, slots });
  };

  const handleAddSlot = () => {
    onChange({ ...value, slots: [...value.slots, DEFAULT_SLOT] });
  };

  const handleRemoveSlot = (slotIndex: number) => {
    if (value.slots.length <= 1) {
      return;
    }

    onChange({ ...value, slots: value.slots.filter((_, i) => i !== slotIndex) });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Total minutes"
          type="number"
          size="small"
          value={value.totalMinutes}
          onChange={(event) => handleTotalMinutesChange(event.target.value)}
          disabled={disabled}
          inputProps={{ min: 1 }}
          required
          sx={{ flex: 1 }}
        />
        <TextField
          label="Cycle length"
          type="number"
          size="small"
          value={value.cycleLength ?? ""}
          onChange={(event) => handleCycleLengthChange(event.target.value)}
          disabled={disabled}
          helperText="Optional minutes per cycle"
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
        />
      </Stack>

      <Stack spacing={1}>
        <Typography id={headingId} variant="overline" color="text.secondary">
          Slots
        </Typography>

        {value.slots.map((slot, slotIndex) => (
          <Stack
            key={`emom-${slotIndex.toString()}`}
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <TextField
              label="Minutes (csv)"
              size="small"
              value={slot.minutes.join(", ")}
              onChange={(event) => handleSlotMinutesChange(slotIndex, event.target.value)}
              disabled={disabled}
              helperText="0-indexed minute marks"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Action"
              select
              size="small"
              value={slot.action.kind}
              onChange={(event) =>
                handleSlotActionKindChange(slotIndex, event.target.value as SlotActionKind)
              }
              disabled={disabled}
              sx={{ width: 160 }}
            >
              {ACTION_KINDS.map((k) => (
                <MenuItem key={k} value={k}>
                  {k.replace(/_/gu, " ")}
                </MenuItem>
              ))}
            </TextField>

            {slot.action.kind !== "REST" ? (
              <TextField
                label="Entry #"
                type="number"
                size="small"
                value={slot.action.entryRefIndex}
                onChange={(event) => handleSlotEntryRefChange(slotIndex, event.target.value)}
                disabled={disabled}
                inputProps={{ min: 0 }}
                sx={{ width: 96 }}
              />
            ) : null}

            <Tooltip title={value.slots.length <= 1 ? "At least one slot required" : "Remove"}>
              <span>
                <IconButton
                  aria-label={`Remove EMOM slot ${(slotIndex + 1).toString()}`}
                  size="small"
                  onClick={() => handleRemoveSlot(slotIndex)}
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
