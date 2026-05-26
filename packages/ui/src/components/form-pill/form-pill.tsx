import { type ReactElement } from "react";

import { Chip, alpha } from "@mui/material";

const FORM_PILL_HEIGHT_PX = 16;
const FORM_PILL_LABEL_PX = 0.75;
const FORM_PILL_FONT_SIZE_PT = 9.5;
const FORM_PILL_FONT_WEIGHT = 700;
const FORM_PILL_LETTER_SPACING = "0.06em";
const FORM_PILL_BORDER_RADIUS_PX = 9999;
const FORM_PILL_BG_ALPHA = 0.18;
const FORM_PILL_FONT_FAMILY = "var(--font-base), Barlow, sans-serif";

export type FormPillProps = {
  text: string;
};

export const FormPill: React.FC<FormPillProps> = ({ text }): ReactElement => (
  <Chip
    size="small"
    variant="filled"
    color="default"
    label={text}
    sx={(theme) => ({
      height: FORM_PILL_HEIGHT_PX,
      borderRadius: `${FORM_PILL_BORDER_RADIUS_PX}px`,
      bgcolor: alpha(theme.palette.kind.load, FORM_PILL_BG_ALPHA),
      color: theme.palette.kind.load,
      fontFamily: FORM_PILL_FONT_FAMILY,
      fontSize: `${FORM_PILL_FONT_SIZE_PT}pt`,
      fontWeight: FORM_PILL_FONT_WEIGHT,
      letterSpacing: FORM_PILL_LETTER_SPACING,
      textTransform: "uppercase",
      "& .MuiChip-label": {
        px: FORM_PILL_LABEL_PX,
        overflow: "visible",
      },
    })}
  />
);
