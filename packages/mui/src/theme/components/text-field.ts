import { alpha, type Components, type Theme } from "@mui/material/styles";

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

      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.divider,
        transition: theme.transitions.create("border-color"),
      },

      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.dividerStrong,
      },

      "&.Mui-focused": {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
      },

      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderWidth: 1,
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

export const MuiSelect: NonNullable<Components<Theme>["MuiSelect"]> = {
  styleOverrides: {
    icon: ({ theme }) => ({ color: theme.palette.text.secondary }),
  },
};
