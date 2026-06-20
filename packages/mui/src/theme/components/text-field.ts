import { alpha, type Components, type Theme } from "@mui/material/styles";

import { focusRing, focusRingError } from "../focus";

export const MuiTextField: NonNullable<Components<Theme>["MuiTextField"]> = {
  defaultProps: {
    fullWidth: true,
    variant: "outlined",
  },
};

export const MuiOutlinedInput: NonNullable<Components<Theme>["MuiOutlinedInput"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.common.white, 0.02),
      transition: theme.transitions.create(["background-color", "box-shadow"], {
        duration: theme.transitions.duration.shortest,
      }),

      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.divider,
        transition: theme.transitions.create("border-color"),
      },

      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.dividerStrong,
      },

      "&.Mui-focused": {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        boxShadow: focusRing(theme),
      },

      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderWidth: 1,
        borderColor: theme.palette.primary.main,
      },

      "&.Mui-focused .MuiSelect-icon": {
        color: theme.palette.primary.main,
      },

      "&.Mui-error.Mui-focused": {
        boxShadow: focusRingError(theme),
      },

      "&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.error.main,
      },
    }),
  },
};

export const MuiFilledInput: NonNullable<Components<Theme>["MuiFilledInput"]> = {
  styleOverrides: {
    root: {
      "&::before, &::after": { display: "none" },
    },
  },
};

export const MuiInput: NonNullable<Components<Theme>["MuiInput"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      "&::before": {
        borderBottomColor: theme.palette.divider,
        transition: theme.transitions.create("border-color"),
      },

      "&:hover:not(.Mui-disabled, .Mui-error)::before": {
        borderBottomColor: alpha(theme.palette.common.white, 0.2),
      },
    }),
  },
};

export const MuiInputLabel: NonNullable<Components<Theme>["MuiInputLabel"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap",
    }),
  },
};

export const MuiFormHelperText: NonNullable<Components<Theme>["MuiFormHelperText"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.caption.fontSize,
      marginTop: theme.spacing(0.5),
      marginLeft: theme.spacing(0.5),
    }),
  },
};
