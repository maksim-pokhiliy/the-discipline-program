"use client";

import { Box } from "@mui/material";

const FONT_SIZE_PX = 10;
const FONT_WEIGHT = 700;
const LETTER_SPACING = "0.06em";
const PX_FACTOR = 0.625;
const PY_FACTOR = 0.125;
const BORDER_RADIUS_FACTOR = 0.5;

type MinutePillProps = { label: string };

export const MinutePill: React.FC<MinutePillProps> = ({ label }) => (
  <Box
    component="span"
    sx={(theme) => ({
      bgcolor: "action.selected",
      color: "text.secondary",
      px: theme.spacing(PX_FACTOR),
      py: theme.spacing(PY_FACTOR),
      borderRadius: theme.spacing(BORDER_RADIUS_FACTOR),
      fontSize: `${FONT_SIZE_PX}px`,
      fontWeight: FONT_WEIGHT,
      letterSpacing: LETTER_SPACING,
      flexShrink: 0,
      fontVariantNumeric: "tabular-nums",
    })}
  >
    {label}
  </Box>
);
