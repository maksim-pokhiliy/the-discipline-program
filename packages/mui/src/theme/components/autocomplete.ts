import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiAutocomplete: Components<Theme>["MuiAutocomplete"] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: Number(theme.shape.borderRadius) + 2,
      marginTop: theme.spacing(0.5),
    }),

    listbox: ({ theme }) => ({
      padding: theme.spacing(0.5),
    }),

    option: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(14),
      padding: theme.spacing(0.75, 1.5),
      borderRadius: Number(theme.shape.borderRadius) - 2,
      margin: theme.spacing(0, 0.5),
      minHeight: "unset",
      transition: theme.transitions.create("background-color", {
        duration: theme.transitions.duration.short,
      }),

      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.04),
      },

      '&[aria-selected="true"]': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        "&:hover": {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
        },
      },
    }),

    tag: ({ theme }) => ({
      margin: theme.spacing(0.25),
    }),
  },
};
