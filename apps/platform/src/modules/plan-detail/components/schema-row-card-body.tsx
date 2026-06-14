"use client";

import { Stack, Typography } from "@mui/material";

import { FormPill } from "@repo/ui";

import { type RowSummary } from "../lib/format-row";

import { MinutePill } from "./minute-pill";
import { RowSummaryChips } from "./row-summary-chips";

const BODY_GAP_FACTOR = 0.5;
const BODY_MAIN_GAP_FACTOR = 0.75;

type SchemaRowCardBodyProps = {
  mainText: string;
  formPillText: string | null;
  summary: RowSummary;
  minuteLabel?: string | null;
};

export const SchemaRowCardBody: React.FC<SchemaRowCardBodyProps> = ({
  mainText,
  formPillText,
  summary,
  minuteLabel = null,
}) => (
  <Stack direction="column" spacing={BODY_GAP_FACTOR} sx={{ minWidth: 0 }}>
    <Stack
      direction="row"
      alignItems="center"
      spacing={BODY_MAIN_GAP_FACTOR}
      useFlexGap
      flexWrap="wrap"
    >
      {minuteLabel !== null ? <MinutePill label={minuteLabel} /> : null}

      <Typography variant="body2" fontWeight={600} component="span" sx={{ minWidth: 0 }}>
        {mainText}
      </Typography>
      {formPillText !== null ? <FormPill text={formPillText} /> : null}
    </Stack>

    <RowSummaryChips summary={summary} />
  </Stack>
);
