import { alpha, type Components, type Theme } from "@mui/material/styles";

const SELECTED_TINT = 0.18;
const SELECTED_TINT_HOVER = 0.26;

export const MuiMenu: NonNullable<Components<Theme>["MuiMenu"]> = {
  styleOverrides: {
    paper: ({ theme }) => ({
      marginTop: theme.spacing(1),
    }),

    list: ({ theme }) => ({
      padding: theme.spacing(0.5),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(0.5),
    }),
  },
};

export const MuiMenuItem: NonNullable<Components<Theme>["MuiMenuItem"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(1, 1.25),
      minHeight: "unset",
      borderRadius: theme.shape.borderRadius,
      transition: theme.transitions.create(["background-color", "color", "transform"], {
        duration: theme.transitions.duration.shortest,
      }),

      "&:active": {
        transform: "scale(0.98)",
      },

      "&.Mui-selected": {
        backgroundColor: alpha(theme.palette.primary.main, SELECTED_TINT),
        color: theme.palette.primary.main,

        "&:hover": {
          backgroundColor: alpha(theme.palette.primary.main, SELECTED_TINT_HOVER),
        },
      },

      "&.Mui-focusVisible": {
        backgroundColor: "transparent",
      },
    }),
  },
};
