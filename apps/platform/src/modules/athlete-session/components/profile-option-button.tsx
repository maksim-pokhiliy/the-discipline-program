import { type ReactElement } from "react";

import { alpha, Button } from "@mui/material";

import {
  INLINE_AXIS_OPTION_HEIGHT_PX,
  INLINE_OPTION_INACTIVE_BG_ALPHA,
  INLINE_OPTION_INACTIVE_BORDER_ALPHA,
} from "../utils/athlete-session.constants";

export type ProfileOptionButtonProps = {
  label: string;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
};

export const ProfileOptionButton = ({
  label,
  isActive,
  disabled,
  onClick,
}: ProfileOptionButtonProps): ReactElement => (
  <Button
    fullWidth
    disabled={disabled}
    onClick={onClick}
    variant={isActive ? "contained" : "outlined"}
    color={isActive ? "primary" : "inherit"}
    sx={(theme) => ({
      height: INLINE_AXIS_OPTION_HEIGHT_PX,
      ...(isActive
        ? {}
        : {
            bgcolor: alpha(theme.palette.common.white, INLINE_OPTION_INACTIVE_BG_ALPHA),
            borderColor: alpha(theme.palette.common.white, INLINE_OPTION_INACTIVE_BORDER_ALPHA),
            color: theme.palette.text.secondary,
          }),
    })}
  >
    {label}
  </Button>
);
