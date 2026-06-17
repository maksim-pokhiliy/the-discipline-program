"use client";

import { Chip, Stack, Typography } from "@mui/material";

import { IndicatorChip, TagChip } from "@repo/ui";

import { type RowSummary } from "../lib/format-row";

import { EmphasizedIntensityChip } from "./emphasized-intensity-chip";

const CHIP_ROW_GAP_FACTOR = 0.5;
const STACK_GAP_FACTOR = 0.5;
const NOTES_SEPARATOR = " · ";
const REST_CHIP_TONE = "default" as const;

type RowSummaryChipsProps = {
  summary: RowSummary;
};

const hasContent = (summary: RowSummary): boolean =>
  summary.volume !== null ||
  summary.load !== null ||
  summary.side !== null ||
  summary.tempo !== null ||
  summary.intensityChips.length > 0 ||
  summary.rest !== null ||
  summary.modifiers.length > 0 ||
  summary.notes.length > 0;

export const RowSummaryChips: React.FC<RowSummaryChipsProps> = ({ summary }) => {
  if (!hasContent(summary)) {
    return null;
  }

  return (
    <Stack direction="column" spacing={STACK_GAP_FACTOR} sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={CHIP_ROW_GAP_FACTOR} useFlexGap flexWrap="wrap">
        {summary.volume !== null ? (
          <Chip size="small" variant="filled" color="default" label={summary.volume} />
        ) : null}
        {summary.load !== null ? (
          <Chip size="small" variant="filled" color="primary" label={summary.load} />
        ) : null}
        {summary.side !== null ? (
          <Chip size="small" variant="filled" color="info" label={summary.side} />
        ) : null}
        {summary.tempo !== null ? (
          <Chip size="small" variant="filled" color="secondary" label={summary.tempo} />
        ) : null}
        {summary.intensityChips.map((chip, index) => (
          <EmphasizedIntensityChip key={`${chip.dimension}-${String(index)}`} chip={chip} />
        ))}
        {summary.rest !== null ? (
          <IndicatorChip tone={REST_CHIP_TONE} label={summary.rest} dot={false} />
        ) : null}
        {summary.modifiers.map((name) => (
          <TagChip key={name} label={name} size="small" preserveCase />
        ))}
      </Stack>

      {summary.notes.length > 0 ? (
        <Typography variant="caption" color="text.subtle" component="span">
          {summary.notes.join(NOTES_SEPARATOR)}
        </Typography>
      ) : null}
    </Stack>
  );
};
