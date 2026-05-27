import { type ReactElement } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Box, Button, alpha } from "@mui/material";

const PLUS_ROW_FONT_SIZE_PX = 11;
const PLUS_ROW_FONT_WEIGHT = 700;
const PLUS_ROW_LETTER_SPACING = "0.08em";
const PLUS_ROW_FONT_FAMILY = "var(--font-base), Barlow, sans-serif";
const PLUS_ROW_PADDING_X_FACTOR = 1.75;
const PLUS_ROW_PADDING_Y_FACTOR = 0.875;
const PLUS_ROW_GAP_FACTOR = 1;
const PLUS_ROW_BORDER_RADIUS_FACTOR = 0.5;
const PLUS_ROW_ICON_CIRCLE_PX = 18;
const PLUS_ROW_ICON_SVG_PX = 13;
const PLUS_ROW_ICON_BORDER_RADIUS = "50%";
const PLUS_ROW_HOVER_BG_ALPHA = 0.08;

export type PlusRowButtonProps = {
  onClick: () => void;
  label: string;
  disabled?: boolean | undefined;
  accent?: boolean | undefined;
};

export const PlusRowButton: React.FC<PlusRowButtonProps> = ({
  onClick,
  label,
  disabled = false,
  accent = false,
}): ReactElement => (
  <Button
    variant="outlined"
    color="inherit"
    onClick={onClick}
    disabled={disabled}
    sx={(theme) => ({
      alignSelf: "flex-start",
      borderStyle: "dashed",
      borderColor: accent ? theme.palette.primary.main : theme.palette.dividerStrong,
      borderRadius: theme.spacing(PLUS_ROW_BORDER_RADIUS_FACTOR),
      padding: theme.spacing(PLUS_ROW_PADDING_Y_FACTOR, PLUS_ROW_PADDING_X_FACTOR),
      gap: theme.spacing(PLUS_ROW_GAP_FACTOR),
      color: accent ? theme.palette.primary.main : theme.palette.text.secondary,
      fontFamily: PLUS_ROW_FONT_FAMILY,
      fontSize: `${PLUS_ROW_FONT_SIZE_PX}px`,
      fontWeight: PLUS_ROW_FONT_WEIGHT,
      letterSpacing: PLUS_ROW_LETTER_SPACING,
      textTransform: "uppercase",
      minHeight: 0,
      minWidth: 0,
      lineHeight: 1,
      transition: theme.transitions.create(["color", "border-color", "background-color"], {
        duration: theme.transitions.duration.shortest,
      }),
      "&:hover": {
        color: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, PLUS_ROW_HOVER_BG_ALPHA),
      },
    })}
  >
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        width: PLUS_ROW_ICON_CIRCLE_PX,
        height: PLUS_ROW_ICON_CIRCLE_PX,
        border: "1px solid currentColor",
        borderRadius: PLUS_ROW_ICON_BORDER_RADIUS,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <AddIcon sx={{ fontSize: PLUS_ROW_ICON_SVG_PX }} />
    </Box>
    {label}
  </Button>
);
