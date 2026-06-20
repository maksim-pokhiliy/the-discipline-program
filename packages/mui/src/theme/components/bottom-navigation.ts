import { alpha, type Components, type Theme } from "@mui/material/styles";

const SELECTED_TINT = 0.06;
const SELECTED_TINT_HOVER = 0.12;

export const MuiBottomNavigation: NonNullable<Components<Theme>["MuiBottomNavigation"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      height: `calc(${theme.layout.platformBottomNavHeight}px + env(safe-area-inset-bottom))`,
      borderTop: `1px solid ${theme.palette.divider}`,
      backgroundColor: theme.palette.background.default,
      paddingTop: theme.spacing(1.5),
      paddingRight: `calc(${theme.spacing(1.5)} + env(safe-area-inset-right))`,
      paddingBottom: `calc(${theme.spacing(1.5)} + env(safe-area-inset-bottom))`,
      paddingLeft: `calc(${theme.spacing(1.5)} + env(safe-area-inset-left))`,
      gap: theme.spacing(1.5),
    }),
  },
};

export const MuiBottomNavigationAction: NonNullable<
  Components<Theme>["MuiBottomNavigationAction"]
> = {
  defaultProps: {
    showLabel: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
      transition: theme.transitions.create(["background-color", "color", "transform"], {
        duration: theme.transitions.duration.shortest,
      }),

      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },

      "&:active": {
        transform: "scale(0.92)",
      },

      "&.Mui-selected": {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, SELECTED_TINT),

        "&:hover": {
          backgroundColor: alpha(theme.palette.primary.main, SELECTED_TINT_HOVER),
        },
      },

      "&.Mui-focusVisible": {
        backgroundColor: "transparent",
      },
    }),

    label: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(11),
      fontWeight: 500,

      "&.Mui-selected": {
        fontSize: theme.typography.pxToRem(11),
      },
    }),
  },
};
