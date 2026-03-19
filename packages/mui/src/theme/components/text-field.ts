import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiTextField: Components<Theme>["MuiTextField"] = {
  defaultProps: {
    fullWidth: true,
  },
};

export const MuiOutlinedInput: Components<Theme>["MuiOutlinedInput"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
      backgroundColor: alpha(theme.palette.common.white, 0.02),
      transition: theme.transitions.create(["border-color", "background-color"], {
        duration: theme.transitions.duration.short,
      }),

      "& .MuiOutlinedInput-notchedOutline": {
        borderWidth: 1,
        borderColor: theme.palette.divider,
        transition: theme.transitions.create("border-color", {
          duration: theme.transitions.duration.short,
        }),
      },

      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(theme.palette.common.white, 0.2),
      },

      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderWidth: 1,
        borderColor: theme.palette.primary.main,
      },

      "&.Mui-error .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.error.main,
      },

      "&.Mui-disabled": {
        backgroundColor: alpha(theme.palette.common.white, 0.01),
      },
    }),

    sizeSmall: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(13),

      "& .MuiOutlinedInput-input": {
        padding: theme.spacing(0.75, 1.5),
      },
    }),

    input: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(14),
      padding: theme.spacing(1.25, 1.75),
    }),
  },
};

export const MuiInputLabel: Components<Theme>["MuiInputLabel"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(14),
      color: theme.palette.text.secondary,

      "&.Mui-focused": {
        color: theme.palette.primary.main,
      },

      "&.Mui-error": {
        color: theme.palette.error.main,
      },
    }),

    sizeSmall: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(13),
    }),
  },
};

export const MuiFormHelperText: Components<Theme>["MuiFormHelperText"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(12),
      marginTop: theme.spacing(0.5),
      marginLeft: theme.spacing(0.5),
    }),
  },
};

export const MuiSelect: Components<Theme>["MuiSelect"] = {
  styleOverrides: {
    icon: ({ theme }) => ({
      color: theme.palette.text.secondary,
    }),
  },
};
