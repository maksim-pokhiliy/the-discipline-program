import { type ReactElement } from "react";

import { alpha, Box, Stack, Typography } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";

import {
  FONT_WEIGHT_DISPLAY,
  INLINE_AXIS_GAP_PX,
  INLINE_AXIS_LABEL_ALPHA,
  INLINE_AXIS_LABEL_PX,
  INLINE_EDITOR_BG_ALPHA,
  INLINE_EDITOR_BORDER_ALPHA,
  INLINE_EDITOR_MARGIN_BOTTOM_PX,
  INLINE_EDITOR_MARGIN_X_PX,
  INLINE_EDITOR_PADDING_PX,
  INLINE_EDITOR_TITLE_LETTER_SPACING,
  INLINE_EDITOR_TITLE_PX,
  PROFILE_EDITOR_TITLE,
} from "../utils/athlete-session.constants";

import { ProfileOptionButton } from "./profile-option-button";

export type InlineProfilePickerProps = {
  load: Load;
  selections: Record<string, string>;
  isSubmitting: boolean;
  onPick: (axisNames: string[], axisName: string, value: string) => void;
};

export const InlineProfilePicker = ({
  load,
  selections,
  isSubmitting,
  onPick,
}: InlineProfilePickerProps): ReactElement | null => {
  if (load.kind !== "byProfile") {
    return null;
  }

  const axisNames = load.axes.map((axis) => axis.name);

  return (
    <Box
      sx={(theme) => ({
        mx: `${INLINE_EDITOR_MARGIN_X_PX}px`,
        mb: `${INLINE_EDITOR_MARGIN_BOTTOM_PX}px`,
        p: `${INLINE_EDITOR_PADDING_PX}px`,
        borderRadius: theme.shape.borderRadius,
        bgcolor: alpha(theme.palette.primary.main, INLINE_EDITOR_BG_ALPHA),
        border: `1px solid ${alpha(theme.palette.primary.main, INLINE_EDITOR_BORDER_ALPHA)}`,
      })}
    >
      <Typography
        component="div"
        sx={(theme) => ({
          mb: 1.25,
          fontSize: theme.typography.pxToRem(INLINE_EDITOR_TITLE_PX),
          fontWeight: FONT_WEIGHT_DISPLAY,
          letterSpacing: INLINE_EDITOR_TITLE_LETTER_SPACING,
          textTransform: "uppercase",
          color: theme.palette.primary.main,
        })}
      >
        {PROFILE_EDITOR_TITLE}
      </Typography>

      <Stack spacing={1.25}>
        {load.axes.map((axis) => (
          <Box key={axis.name}>
            <Typography
              component="div"
              sx={(theme) => ({
                mb: 0.625,
                fontSize: theme.typography.pxToRem(INLINE_AXIS_LABEL_PX),
                color: alpha(theme.palette.common.white, INLINE_AXIS_LABEL_ALPHA),
              })}
            >
              {axis.name}
            </Typography>
            <Stack direction="row" spacing={`${INLINE_AXIS_GAP_PX}px`}>
              {axis.values.map((value) => (
                <ProfileOptionButton
                  key={value}
                  label={value}
                  isActive={selections[axis.name] === value}
                  disabled={isSubmitting}
                  onClick={() => onPick(axisNames, axis.name, value)}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
