import { type ReactElement } from "react";

import { Chip } from "@mui/material";

const ARCHETYPE_TAG_FONT_SIZE_PX = 9.5;
const ARCHETYPE_TAG_FONT_WEIGHT = 700;
const ARCHETYPE_TAG_LETTER_SPACING = "0.08em";
const ARCHETYPE_TAG_LABEL_PX = 0.75;
const ARCHETYPE_TAG_LABEL_PY = 0.25;
const ARCHETYPE_TAG_BORDER_RADIUS_FACTOR = 0.375;

export type SchemaArchetypeTagProps = {
  label: string;
};

export const SchemaArchetypeTag: React.FC<SchemaArchetypeTagProps> = ({ label }): ReactElement => (
  <Chip
    size="small"
    variant="filled"
    color="default"
    label={label}
    sx={(theme) => ({
      height: "auto",
      bgcolor: "action.selected",
      color: "text.subtle",
      fontFamily: theme.typography.body1.fontFamily,
      fontSize: ARCHETYPE_TAG_FONT_SIZE_PX,
      fontWeight: ARCHETYPE_TAG_FONT_WEIGHT,
      letterSpacing: ARCHETYPE_TAG_LETTER_SPACING,
      textTransform: "uppercase",
      borderRadius: theme.spacing(ARCHETYPE_TAG_BORDER_RADIUS_FACTOR),
      "& .MuiChip-label": {
        px: ARCHETYPE_TAG_LABEL_PX,
        py: ARCHETYPE_TAG_LABEL_PY,
        overflow: "visible",
      },
    })}
  />
);
