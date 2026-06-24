import { type ReactElement } from "react";

import { Stack, Typography } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";

import {
  AXIS_AND_SEPARATOR,
  FONT_WEIGHT_DISPLAY,
  INLINE_EDITOR_TITLE_LETTER_SPACING,
  INLINE_EDITOR_TITLE_PX,
  PROFILE_AXIS_PREFIX,
} from "../utils/athlete-session.constants";

import { ProfileOptionButton } from "./profile-option-button";

export type InlineProfilePickerProps = {
  load: Load;
  selections: Record<string, string>;
  isSubmitting: boolean;
  onPick: (pickableAxisIds: string[], axisId: string, value: string) => void;
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

  const pickableAxes = load.axes.filter((axis) => axis.binding === null);

  if (pickableAxes.length === 0) {
    return null;
  }

  const axisLabels = pickableAxes.map((axis) => axis.label);
  const pickableAxisIds = pickableAxes.map((axis) => axis.axisId);

  return (
    <Stack spacing={1.25}>
      <Typography
        component="div"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(INLINE_EDITOR_TITLE_PX),
          fontWeight: FONT_WEIGHT_DISPLAY,
          letterSpacing: INLINE_EDITOR_TITLE_LETTER_SPACING,
          textTransform: "uppercase",
          color: theme.palette.primary.main,
        })}
      >
        {`${PROFILE_AXIS_PREFIX}${axisLabels.join(AXIS_AND_SEPARATOR)}`}
      </Typography>

      {pickableAxes.map((axis) => (
        <Stack key={axis.axisId} spacing={0.75}>
          {axis.values.map((value) => (
            <ProfileOptionButton
              key={`${axis.axisId}:${value}`}
              label={value}
              isActive={selections[axis.axisId] === value}
              disabled={isSubmitting}
              onClick={() => onPick(pickableAxisIds, axis.axisId, value)}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
};
