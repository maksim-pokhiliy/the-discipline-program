import { type ReactElement } from "react";

import { Stack, Typography } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";

import {
  FONT_WEIGHT_DISPLAY,
  INLINE_EDITOR_TITLE_LETTER_SPACING,
  INLINE_EDITOR_TITLE_PX,
  PROFILE_AXIS_PREFIX,
} from "../utils/athlete-session.constants";

import { ProfileOptionButton } from "./profile-option-button";

export type InlineGenderPickerProps = {
  load: Load;
  isSubmitting: boolean;
  onPick: (value: string) => void;
};

export const InlineGenderPicker = ({
  load,
  isSubmitting,
  onPick,
}: InlineGenderPickerProps): ReactElement | null => {
  if (load.kind !== "byProfile") {
    return null;
  }

  const axis = load.axes.find((entry) => entry.binding === "GENDER");

  if (axis === undefined) {
    return null;
  }

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
        {`${PROFILE_AXIS_PREFIX}${axis.label}`}
      </Typography>

      <Stack spacing={0.75}>
        {axis.values.map((value) => (
          <ProfileOptionButton
            key={value}
            label={value}
            isActive={false}
            disabled={isSubmitting}
            onClick={() => onPick(value)}
          />
        ))}
      </Stack>
    </Stack>
  );
};
