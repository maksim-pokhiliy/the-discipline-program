"use client";

import { type MouseEvent } from "react";

import { Stack, TextField, ToggleButton } from "@mui/material";

import { LabeledToggleGroup } from "@repo/ui";

import type { ScoringCondition, ScoringDirective } from "./axis-draft.types";

const LABEL = "scoring";
const SEED_LABEL = "Progressive seed";
const SEED_WIDTH = 220;
const EMPTY_VALUE = "";
const CONDITION_LABEL = "Applies to rounds (optional condition)";
const CONDITION_PLACEHOLDER = "e.g. 2, 3 — leave empty for all rounds";
const CONDITION_WIDTH = 320;
const ROUND_SEPARATOR = /[\s,]+/;
const ROUND_JOINER = ", ";
const RADIX = 10;

const SCORING_OPTIONS: { kind: ScoringDirective["kind"]; label: string }[] = [
  { kind: "prescribed", label: "prescribed" },
  { kind: "amrap", label: "AMRAP" },
  { kind: "for_time", label: "for time" },
  { kind: "max_in_remaining", label: "max-in-remaining" },
  { kind: "total", label: "total" },
  { kind: "progressive", label: "progressive" },
];

const conditionOf = (value: ScoringDirective): ScoringCondition | undefined =>
  value.kind === "prescribed" ? undefined : value.condition;

const parseRounds = (raw: string): number[] =>
  raw
    .split(ROUND_SEPARATOR)
    .map((token) => parseInt(token, RADIX))
    .filter((round) => !Number.isNaN(round));

const conditionFromRounds = (rounds: number[]): ScoringCondition | undefined =>
  rounds.length > 0 ? { appliesToRounds: rounds } : undefined;

const toDirective = (
  kind: ScoringDirective["kind"],
  seed: string,
  condition: ScoringCondition | undefined,
): ScoringDirective => {
  if (kind === "prescribed") {
    return { kind };
  }

  const carried = condition !== undefined ? { condition } : {};

  return kind === "progressive" ? { kind, seed, ...carried } : { kind, ...carried };
};

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
  const seed = value.kind === "progressive" ? value.seed : EMPTY_VALUE;
  const condition = conditionOf(value);

  const handleKindChange = (_: MouseEvent<HTMLElement>, next: ScoringDirective["kind"] | null) => {
    if (next === null) {
      return;
    }

    onChange(toDirective(next, seed, condition));
  };

  const handleSeedChange = (next: string): void =>
    onChange(toDirective("progressive", next, condition));

  const handleRoundsChange = (raw: string): void =>
    onChange(toDirective(value.kind, seed, conditionFromRounds(parseRounds(raw))));

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
          onChange={(event) => handleSeedChange(event.target.value)}
          disabled={disabled}
          sx={{ maxWidth: SEED_WIDTH }}
        />
      ) : null}

      {value.kind !== "prescribed" ? (
        <TextField
          label={CONDITION_LABEL}
          size="small"
          value={condition?.appliesToRounds.join(ROUND_JOINER) ?? EMPTY_VALUE}
          onChange={(event) => handleRoundsChange(event.target.value)}
          disabled={disabled}
          placeholder={CONDITION_PLACEHOLDER}
          sx={{ maxWidth: CONDITION_WIDTH }}
        />
      ) : null}
    </Stack>
  );
};
