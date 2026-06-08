"use client";

import { type ReactNode } from "react";

import { Stack, Typography } from "@mui/material";

const SECTION_GAP = 0.75;
const LABEL_FONT_SIZE_PX = 11;
const LABEL_FONT_WEIGHT = 600;
const LABEL_LETTER_SPACING = "0.06em";

type AxisFieldSectionProps = {
  label: string;
  children: ReactNode;
  hint?: string | undefined;
};

export const AxisFieldSection: React.FC<AxisFieldSectionProps> = ({ label, children, hint }) => (
  <Stack direction="column" spacing={SECTION_GAP}>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        fontSize: LABEL_FONT_SIZE_PX,
        fontWeight: LABEL_FONT_WEIGHT,
        letterSpacing: LABEL_LETTER_SPACING,
        textTransform: "uppercase",
      }}
    >
      {label}
    </Typography>

    {children}

    {hint !== undefined ? (
      <Typography variant="caption" color="text.faint">
        {hint}
      </Typography>
    ) : null}
  </Stack>
);
