import { type Components, type Theme } from "@mui/material/styles";

const ICON_BUTTON_SIZE_SM = 28;
const ICON_BUTTON_SIZE_MD = 32;
const ICON_BUTTON_SIZE_LG = 40;

export const MuiIconButton: NonNullable<Components<Theme>["MuiIconButton"]> = {
  defaultProps: {
    color: "inherit",
  },
  styleOverrides: {
    root: {
      "&.Mui-focusVisible": {
        backgroundColor: "transparent",
      },
    },
    sizeSmall: ({ theme }) => ({
      minWidth: ICON_BUTTON_SIZE_SM,
      minHeight: ICON_BUTTON_SIZE_SM,
      padding: theme.spacing(0.5),
      borderRadius: theme.shape.borderRadius,
    }),
    sizeMedium: ({ theme }) => ({
      minWidth: ICON_BUTTON_SIZE_MD,
      minHeight: ICON_BUTTON_SIZE_MD,
      padding: theme.spacing(0.75),
      borderRadius: theme.shape.borderRadius,
    }),
    sizeLarge: ({ theme }) => ({
      minWidth: ICON_BUTTON_SIZE_LG,
      minHeight: ICON_BUTTON_SIZE_LG,
      padding: theme.spacing(1),
      borderRadius: theme.shape.borderRadius,
    }),
  },
};
