import { type ReactElement } from "react";

import CloseRounded from "@mui/icons-material/CloseRounded";
import { IconButton, Stack, Typography } from "@mui/material";

import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import {
  CLEAR_PICK_ARIA_PREFIX,
  CLEAR_PICK_ARIA_SUFFIX,
  FONT_WEIGHT_SEMI_BOLD,
  PICK_CLEAR_ICON_PX,
  PICK_ROW_TITLE_PX,
} from "../utils/athlete-profile.constants";

import { ProfileOptionButton } from "./profile-option-button";

export type ProfilePickGroupProps = {
  axis: ProfileAxis;
  activeValue: string | undefined;
  isSaving: boolean;
  onPick: (value: string) => void;
  onClear: () => void;
};

export const ProfilePickGroup = ({
  axis,
  activeValue,
  isSaving,
  onPick,
  onClear,
}: ProfilePickGroupProps): ReactElement => (
  <Stack spacing={0.75}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Typography
        component="div"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(PICK_ROW_TITLE_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          color: theme.palette.text.primary,
        })}
      >
        {axis.label}
      </Typography>

      {activeValue !== undefined && (
        <IconButton
          aria-label={`${CLEAR_PICK_ARIA_PREFIX}${axis.label}${CLEAR_PICK_ARIA_SUFFIX}`}
          disabled={isSaving}
          onClick={onClear}
          sx={(theme) => ({ color: theme.palette.text.secondary })}
        >
          <CloseRounded sx={{ fontSize: PICK_CLEAR_ICON_PX }} />
        </IconButton>
      )}
    </Stack>

    {axis.values.map((value) => (
      <ProfileOptionButton
        key={`${axis.id}:${value}`}
        label={value}
        isActive={activeValue === value}
        disabled={isSaving}
        onClick={() => onPick(value)}
      />
    ))}
  </Stack>
);
