import { type Components, type Theme } from "@mui/material/styles";

const MIN_TOUCH_TARGET_PX = 44;

export const MuiIconButton: NonNullable<Components<Theme>["MuiIconButton"]> = {
  defaultProps: {
    color: "inherit",
  },
  styleOverrides: {
    root: {
      minWidth: MIN_TOUCH_TARGET_PX,
      minHeight: MIN_TOUCH_TARGET_PX,
    },
  },
};
