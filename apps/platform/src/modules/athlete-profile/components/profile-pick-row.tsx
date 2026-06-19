import { type ReactElement } from "react";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import { Chip, Stack, Typography } from "@mui/material";

import {
  FONT_WEIGHT_SEMI_BOLD,
  PICK_ROW_TITLE_PX,
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
    spacing={1}
    sx={(theme) => ({
      pt: 1.5,
      borderTop: `1px solid ${theme.palette.divider}`,
    })}
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

    <Stack direction="row">
      <Chip label={value} color="primary" variant="filled" disabled={isSaving} onDelete={onClear} />
    </Stack>
  </Stack>
);
