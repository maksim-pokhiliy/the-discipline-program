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
        {`${PROFILE_AXIS_PREFIX}${axisNames.join(AXIS_AND_SEPARATOR)}`}
      </Typography>

      {load.axes.map((axis) => (
        <Stack key={axis.name} spacing={0.75}>
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
      ))}
    </Stack>
  );
};
