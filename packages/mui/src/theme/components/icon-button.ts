import { type Components, type Theme } from "@mui/material/styles";

const MIN_TOUCH_TARGET_PX = 44;

export const MuiIconButton: Components<Theme>["MuiIconButton"] = {
  defaultProps: {
    color: "inherit",
  },
  styleOverrides: {
    sizeSmall: {
      minWidth: MIN_TOUCH_TARGET_PX,
      minHeight: MIN_TOUCH_TARGET_PX,
    },
  },
};
