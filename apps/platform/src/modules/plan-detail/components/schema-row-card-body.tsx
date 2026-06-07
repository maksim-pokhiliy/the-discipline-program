"use client";

import { Box, Stack, Typography } from "@mui/material";

import { FormPill } from "@repo/ui";

import { type FormatRowResult } from "../lib/format-row";

import { MinutePill } from "./minute-pill";

const BODY_GAP_FACTOR = 0.125;
const BODY_MAIN_GAP_FACTOR = 0.75;
const SUB_GAP_FACTOR = 1;
const SEPARATOR_MR_FACTOR = 0.75;
const SUPERSET_LABEL_FONT_SIZE_PX = 10;
const SUPERSET_LABEL_FONT_WEIGHT = 700;
const SUPERSET_LABEL_LETTER_SPACING = "0.06em";
const SUPERSET_LABEL_PX_FACTOR = 0.625;
const SUPERSET_LABEL_PY_FACTOR = 0.125;
const SUPERSET_LABEL_BORDER_RADIUS_FACTOR = 0.5;
const SEPARATOR_CONTENT = "'\\00b7\\00a0'";
const SEPARATOR_SX = {
  "&::before": {
    content: SEPARATOR_CONTENT,
    color: "text.disabled",
    mr: SEPARATOR_MR_FACTOR,
  },
};

type SchemaRowCardBodyProps = {
  mainText: string;
  formPillText: string | null;
  subParts: FormatRowResult["subParts"];
  minuteLabel?: string | null;
  supersetLabel?: string | null;
};

export const SchemaRowCardBody: React.FC<SchemaRowCardBodyProps> = ({
  mainText,
  formPillText,
  subParts,
  minuteLabel = null,
  supersetLabel = null,
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

      {supersetLabel !== null ? (
        <Box
          component="span"
          sx={(theme) => ({
            border: 1,
            borderColor: "divider",
            bgcolor: "transparent",
            color: "text.secondary",
            px: theme.spacing(SUPERSET_LABEL_PX_FACTOR),
            py: theme.spacing(SUPERSET_LABEL_PY_FACTOR),
            borderRadius: theme.spacing(SUPERSET_LABEL_BORDER_RADIUS_FACTOR),
            fontSize: `${SUPERSET_LABEL_FONT_SIZE_PX}px`,
            fontWeight: SUPERSET_LABEL_FONT_WEIGHT,
            letterSpacing: SUPERSET_LABEL_LETTER_SPACING,
            flexShrink: 0,
          })}
        >
          {supersetLabel}
        </Box>
      ) : null}

      <Typography variant="body2" fontWeight={600} component="span" sx={{ minWidth: 0 }}>
        {mainText}
      </Typography>
      {formPillText !== null ? <FormPill text={formPillText} /> : null}
    </Stack>

    {subParts.length > 0 ? (
      <Stack direction="row" spacing={SUB_GAP_FACTOR} useFlexGap flexWrap="wrap">
        {subParts.map((part, i) => (
          <Typography
            key={`${String(i)}-${part}`}
            variant="caption"
            color="text.subtle"
            component="span"
            {...(i > 0 ? { sx: SEPARATOR_SX } : {})}
          >
            {part}
          </Typography>
        ))}
      </Stack>
    ) : null}
  </Stack>
);
