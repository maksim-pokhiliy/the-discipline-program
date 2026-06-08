"use client";

import { type MouseEvent } from "react";

import { Stack, TextField, ToggleButton } from "@mui/material";

import { LabeledToggleGroup } from "@repo/ui";

import type { ScoringDirective } from "./axis-draft.types";

const LABEL = "scoring";
const SEED_LABEL = "Progressive seed";
const SEED_WIDTH = 220;
const EMPTY_SEED = "";

const SCORING_OPTIONS: { kind: ScoringDirective["kind"]; label: string }[] = [
  { kind: "prescribed", label: "prescribed" },
  { kind: "amrap", label: "AMRAP" },
  { kind: "for_time", label: "for time" },
  { kind: "max_in_remaining", label: "max-in-remaining" },
  { kind: "total", label: "total" },
  { kind: "progressive", label: "progressive" },
];

const toDirective = (kind: ScoringDirective["kind"], seed: string): ScoringDirective =>
  kind === "progressive" ? { kind, seed } : { kind };

type ScoringAxisFieldProps = {
  value: ScoringDirective;
  onChange: (next: ScoringDirective) => void;
  disabled?: boolean;
};

export const ScoringAxisField: React.FC<ScoringAxisFieldProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const seed = value.kind === "progressive" ? value.seed : EMPTY_SEED;

  const handleKindChange = (_: MouseEvent<HTMLElement>, next: ScoringDirective["kind"] | null) => {
    if (next === null) {
      return;
    }

    onChange(toDirective(next, seed));
  };

  return (
    <Stack direction="column" spacing={1}>
      <LabeledToggleGroup
        label={LABEL}
        value={value.kind}
        onChange={handleKindChange}
        disabled={disabled}
      >
        {SCORING_OPTIONS.map((option) => (
          <ToggleButton key={option.kind} value={option.kind}>
            {option.label}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

      {value.kind === "progressive" ? (
        <TextField
          label={SEED_LABEL}
          size="small"
          value={value.seed}
          onChange={(event) => onChange({ kind: "progressive", seed: event.target.value })}
          disabled={disabled}
          sx={{ maxWidth: SEED_WIDTH }}
        />
      ) : null}
    </Stack>
  );
};
