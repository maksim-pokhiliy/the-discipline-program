"use client";

import { Chip, Stack, Typography } from "@mui/material";

import { type RowSummary } from "../lib/format-row";

const CHIP_ROW_GAP_FACTOR = 0.5;
const STACK_GAP_FACTOR = 0.5;
const NOTES_SEPARATOR = " · ";

type RowSummaryChipsProps = {
  summary: RowSummary;
};

const hasContent = (summary: RowSummary): boolean =>
  summary.volume !== null ||
  summary.load !== null ||
  summary.side !== null ||
  summary.tempo !== null ||
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
        {summary.modifiers.map((name) => (
          <Chip key={name} size="small" variant="tag" label={name} />
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
