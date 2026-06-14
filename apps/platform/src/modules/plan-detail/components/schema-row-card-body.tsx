"use client";

import { Stack, Typography } from "@mui/material";

import { FormPill } from "@repo/ui";

import { type FormatRowResult } from "../lib/format-row";

import { MinutePill } from "./minute-pill";

const BODY_GAP_FACTOR = 0.125;
const BODY_MAIN_GAP_FACTOR = 0.75;
const SUB_PART_SEPARATOR = " ";

type SchemaRowCardBodyProps = {
  mainText: string;
  formPillText: string | null;
  subParts: FormatRowResult["subParts"];
  minuteLabel?: string | null;
};

export const SchemaRowCardBody: React.FC<SchemaRowCardBodyProps> = ({
  mainText,
  formPillText,
  subParts,
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

    {subParts.length > 0 ? (
      <Typography variant="caption" color="text.subtle" component="span">
        {subParts.join(SUB_PART_SEPARATOR)}
      </Typography>
    ) : null}
  </Stack>
);
