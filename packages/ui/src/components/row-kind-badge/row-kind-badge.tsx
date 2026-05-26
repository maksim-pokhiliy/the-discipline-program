import { type ReactElement } from "react";

import { Chip } from "@mui/material";

const ROW_KIND_BADGE_MIN_WIDTH_PX = 26;
const ROW_KIND_BADGE_HEIGHT_PX = 22;
const ROW_KIND_BADGE_FONT_SIZE_PX = 10;
const ROW_KIND_BADGE_FONT_WEIGHT = 700;
const ROW_KIND_BADGE_LETTER_SPACING = "0.04em";
const ROW_KIND_BADGE_BORDER_RADIUS_FACTOR = 0.375;
const ROW_KIND_BADGE_LABEL_PX = 0.5;
const ROW_KIND_BADGE_LABEL_LENGTH = 2;

export type RowKind = "ex" | "rest" | "foot" | "load" | "url" | "placeholder" | "ladder";

export type RowKindBadgeProps = {
  kind: RowKind;
  label?: string | undefined;
  dashed?: boolean | undefined;
};

export const RowKindBadge: React.FC<RowKindBadgeProps> = ({
  kind,
  label,
  dashed = false,
}): ReactElement => (
  <Chip
    variant="outlined"
    size="small"
    label={label ?? kind.slice(0, ROW_KIND_BADGE_LABEL_LENGTH).toUpperCase()}
    sx={(theme) => ({
      borderStyle: dashed ? "dashed" : "solid",
      borderWidth: 1,
      borderColor: theme.palette.kind[kind],
      borderRadius: theme.spacing(ROW_KIND_BADGE_BORDER_RADIUS_FACTOR),
      color: theme.palette.kind[kind],
      minWidth: ROW_KIND_BADGE_MIN_WIDTH_PX,
      height: ROW_KIND_BADGE_HEIGHT_PX,
      fontFamily: "var(--font-display)",
      fontWeight: ROW_KIND_BADGE_FONT_WEIGHT,
      fontSize: ROW_KIND_BADGE_FONT_SIZE_PX,
      letterSpacing: ROW_KIND_BADGE_LETTER_SPACING,
      "& .MuiChip-label": { px: ROW_KIND_BADGE_LABEL_PX, overflow: "visible" },
    })}
  />
);
