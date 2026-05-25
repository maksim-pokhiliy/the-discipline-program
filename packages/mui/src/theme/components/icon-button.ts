import { type Components, type Theme } from "@mui/material/styles";

const ICON_BUTTON_SIZE_SM = 24;
const ICON_BUTTON_SIZE_MD = 32;
const ICON_BUTTON_SIZE_LG = 40;
const ICON_BUTTON_ICON_SM_PX = 18;

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
      width: ICON_BUTTON_SIZE_SM,
      height: ICON_BUTTON_SIZE_SM,
      padding: theme.spacing(0.25),
      borderRadius: theme.shape.borderRadius,

      "& .MuiSvgIcon-root": {
        fontSize: theme.typography.pxToRem(ICON_BUTTON_ICON_SM_PX),
      },
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
