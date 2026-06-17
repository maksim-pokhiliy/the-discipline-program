import { type ReactElement } from "react";

import { Chip, type ChipProps } from "@mui/material";

const COMPOSITION_TAG_FONT_SIZE_PX = 9.5;
const COMPOSITION_TAG_FONT_WEIGHT = 700;
const COMPOSITION_TAG_LETTER_SPACING = "0.08em";
const COMPOSITION_TAG_LABEL_PX = 0.75;
const COMPOSITION_TAG_LABEL_PY = 0.25;
const COMPOSITION_TAG_BORDER_RADIUS_FACTOR = 0.375;

export type SchemaCompositionTagProps = {
  label: string;
  color?: ChipProps["color"];
};

export const SchemaCompositionTag: React.FC<SchemaCompositionTagProps> = ({
  label,
  color,
}): ReactElement => (
  <Chip
    size="small"
    variant="filled"
    color={color ?? "default"}
    label={label}
    sx={(theme) => ({
      height: "auto",
      ...(color === undefined && { bgcolor: "action.selected", color: "text.subtle" }),
      fontFamily: theme.typography.body1.fontFamily,
      fontSize: COMPOSITION_TAG_FONT_SIZE_PX,
      fontWeight: COMPOSITION_TAG_FONT_WEIGHT,
      letterSpacing: COMPOSITION_TAG_LETTER_SPACING,
      textTransform: "uppercase",
      borderRadius: theme.spacing(COMPOSITION_TAG_BORDER_RADIUS_FACTOR),
      "& .MuiChip-label": {
        px: COMPOSITION_TAG_LABEL_PX,
        py: COMPOSITION_TAG_LABEL_PY,
        overflow: "visible",
      },
    })}
  />
);
