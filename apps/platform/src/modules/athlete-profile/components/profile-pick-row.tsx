import { type ReactElement } from "react";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { alpha, Box, IconButton, Stack, Typography } from "@mui/material";

import {
  CARD_RADIUS_PX,
  CLEAR_PICK_ARIA_PREFIX,
  CLEAR_PICK_ARIA_SUFFIX,
  FONT_WEIGHT_SEMI_BOLD,
  PICK_ACTIVE_BG_ALPHA,
  PICK_CELL_HEIGHT_PX,
  PICK_CLEAR_ICON_PX,
  PICK_ROW_TITLE_PX,
  PICK_VALUE_LETTER_SPACING,
  PICK_VALUE_PX,
  RESOLVED_BADGE_ICON_PX,
  RESOLVED_BADGE_LABEL,
  RESOLVED_BADGE_LETTER_SPACING,
  RESOLVED_BADGE_PX,
} from "../utils/athlete-profile.constants";

export type ProfilePickRowProps = {
  axis: string;
  value: string;
  isSaving: boolean;
  onClear: () => void;
};

export const ProfilePickRow = ({
  axis,
  value,
  isSaving,
  onClear,
}: ProfilePickRowProps): ReactElement => (
  <Stack
    spacing={1.25}
    sx={(theme) => ({ pt: 1.75, borderTop: `1px solid ${theme.palette.divider}` })}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Typography
        component="div"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(PICK_ROW_TITLE_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          color: theme.palette.text.primary,
        })}
      >
        {axis}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={0.5}>
        <CheckCircleRounded
          sx={(theme) => ({ fontSize: RESOLVED_BADGE_ICON_PX, color: theme.palette.success.main })}
        />

        <Typography
          component="span"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(RESOLVED_BADGE_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            letterSpacing: RESOLVED_BADGE_LETTER_SPACING,
            textTransform: "uppercase",
            color: theme.palette.success.main,
          })}
        >
          {RESOLVED_BADGE_LABEL}
        </Typography>
      </Stack>
    </Stack>

    <Stack direction="row" spacing={1}>
      <Box
        sx={(theme) => ({
          flex: 1,
          minWidth: 0,
          height: PICK_CELL_HEIGHT_PX,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 1.25,
          borderRadius: `${CARD_RADIUS_PX}px`,
          border: `1px solid ${theme.palette.primary.main}`,
          bgcolor: alpha(theme.palette.primary.main, PICK_ACTIVE_BG_ALPHA),
          color: theme.palette.primary.main,
          fontSize: theme.typography.pxToRem(PICK_VALUE_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          letterSpacing: PICK_VALUE_LETTER_SPACING,
        })}
      >
        {value}
      </Box>

      <IconButton
        aria-label={`${CLEAR_PICK_ARIA_PREFIX}${axis}${CLEAR_PICK_ARIA_SUFFIX}`}
        disabled={isSaving}
        onClick={onClear}
        sx={(theme) => ({
          flex: "0 0 auto",
          width: PICK_CELL_HEIGHT_PX,
          height: PICK_CELL_HEIGHT_PX,
          borderRadius: `${CARD_RADIUS_PX}px`,
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.secondary,
        })}
      >
        <CloseRounded sx={{ fontSize: PICK_CLEAR_ICON_PX }} />
      </IconButton>
    </Stack>
  </Stack>
);
