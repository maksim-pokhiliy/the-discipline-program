"use client";

import { useId } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Button, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";

import { type SchemeParamsTimeBoxed } from "@repo/contracts/lms/_domain";

import { type SchemeFormTimeBoxedProps } from "./scheme-form.types";

type TimeBoxedSegment = SchemeParamsTimeBoxed["segments"][number];

type InnerKind = TimeBoxedSegment["innerArchetypeKind"];

const INNER_KINDS: readonly InnerKind[] = [
  "NONE",
  "COUNT_UP",
  "COUNT_DOWN",
  "INTERVAL_LOOP",
  "EMOM_LOOP",
] as const;

const DEFAULT_SEGMENT: TimeBoxedSegment = {
  startSec: 0,
  endSec: 600,
  innerArchetypeKind: "NONE",
  innerParams: { kind: "NONE" },
};

const parseNonNegativeInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
};

const parsePositiveInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const stringifyInnerParams = (innerParams: unknown): string => {
  try {
    return JSON.stringify(innerParams ?? {}, null, 2);
  } catch {
    return "{}";
  }
};

const parseInnerParams = (raw: string): { ok: true; value: unknown } | { ok: false } => {
  try {
    const parsed = JSON.parse(raw) as unknown;

    return { ok: true, value: parsed };
  } catch {
    return { ok: false };
  }
};

export const SchemeFormTimeBoxed = ({
  value,
  onChange,
  disabled = false,
}: SchemeFormTimeBoxedProps) => {
  const headingId = useId();

  const handleSegmentChange = (segmentIndex: number, update: Partial<TimeBoxedSegment>) => {
    const segments = value.segments.map((segment, i) =>
      i === segmentIndex ? { ...segment, ...update } : segment,
    );

    onChange({ ...value, segments });
  };

  const handleInnerParamsChange = (segmentIndex: number, raw: string) => {
    const parsed = parseInnerParams(raw);

    if (!parsed.ok) {
      handleSegmentChange(segmentIndex, { innerParams: { __invalid: raw } });

      return;
    }

    handleSegmentChange(segmentIndex, { innerParams: parsed.value });
  };

  const handleAddSegment = () => {
    onChange({ ...value, segments: [...value.segments, DEFAULT_SEGMENT] });
  };

  const handleRemoveSegment = (segmentIndex: number) => {
    if (value.segments.length <= 1) {
      return;
    }

    onChange({ ...value, segments: value.segments.filter((_, i) => i !== segmentIndex) });
  };

  return (
    <Stack spacing={2}>
      <Typography id={headingId} variant="overline" color="text.secondary">
        Inner segments
      </Typography>

      {value.segments.map((segment, segmentIndex) => (
        <Stack
          key={`tb-${segmentIndex.toString()}`}
          spacing={1}
          sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Start (sec)"
              type="number"
              size="small"
              value={segment.startSec}
              onChange={(event) =>
                handleSegmentChange(segmentIndex, {
                  startSec: parseNonNegativeInt(event.target.value, segment.startSec),
                })
              }
              disabled={disabled}
              inputProps={{ min: 0 }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="End (sec)"
              type="number"
              size="small"
              value={segment.endSec}
              onChange={(event) =>
                handleSegmentChange(segmentIndex, {
                  endSec: parsePositiveInt(event.target.value, segment.endSec),
                })
              }
              disabled={disabled}
              inputProps={{ min: 1 }}
              sx={{ flex: 1 }}
            />
            <Tooltip
              title={value.segments.length <= 1 ? "At least one segment required" : "Remove"}
            >
              <span>
                <IconButton
                  aria-label={`Remove inner segment ${(segmentIndex + 1).toString()}`}
                  size="small"
                  onClick={() => handleRemoveSegment(segmentIndex)}
                  disabled={disabled || value.segments.length <= 1}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <TextField
            label="Label"
            size="small"
            value={segment.label ?? ""}
            onChange={(event) => handleSegmentChange(segmentIndex, { label: event.target.value })}
            disabled={disabled}
          />

          <TextField
            label="Inner archetype"
            select
            size="small"
            value={segment.innerArchetypeKind}
            onChange={(event) =>
              handleSegmentChange(segmentIndex, {
                innerArchetypeKind: event.target.value as InnerKind,
              })
            }
            disabled={disabled}
          >
            {INNER_KINDS.map((k) => (
              <MenuItem key={k} value={k}>
                {k}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Inner params (JSON)"
            multiline
            minRows={3}
            size="small"
            value={stringifyInnerParams(segment.innerParams)}
            onChange={(event) => handleInnerParamsChange(segmentIndex, event.target.value)}
            disabled={disabled}
            helperText="Free-form for M1; full nested editor lands in M3"
          />
        </Stack>
      ))}

      <Button
        startIcon={<AddIcon />}
        size="small"
        onClick={handleAddSegment}
        disabled={disabled}
        sx={{ alignSelf: "flex-start" }}
      >
        Add inner segment
      </Button>
    </Stack>
  );
};
