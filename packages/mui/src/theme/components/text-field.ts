import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiTextField: Components<Theme>["MuiTextField"] = {
  defaultProps: {
    fullWidth: true,
    variant: "outlined",
  },
};

export const MuiOutlinedInput: Components<Theme>["MuiOutlinedInput"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.common.white, 0.02),

      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.divider,
        transition: theme.transitions.create("border-color"),
      },

      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(theme.palette.common.white, 0.2),
      },

      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderWidth: 1,
      },
    }),

    input: ({ theme }) => ({ fontSize: theme.typography.body1.fontSize }),

    sizeSmall: ({ theme }) => ({
      "& .MuiOutlinedInput-input": { fontSize: theme.typography.body2.fontSize },
    }),
  },
};

export const MuiFilledInput: Components<Theme>["MuiFilledInput"] = {
  styleOverrides: {
    root: {
      "&::before, &::after": { display: "none" },
    },

    input: ({ theme }) => ({ fontSize: theme.typography.body1.fontSize }),

    sizeSmall: ({ theme }) => ({
      "& .MuiFilledInput-input": { fontSize: theme.typography.body2.fontSize },
    }),
  },
};

export const MuiInput: Components<Theme>["MuiInput"] = {
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

    input: ({ theme }) => ({ fontSize: theme.typography.body1.fontSize }),

    sizeSmall: ({ theme }) => ({
      "& .MuiInput-input": { fontSize: theme.typography.body2.fontSize },
    }),
  },
};

export const MuiInputLabel: Components<Theme>["MuiInputLabel"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.body1.fontSize,
      color: theme.palette.text.secondary,
    }),

    sizeSmall: ({ theme }) => ({ fontSize: theme.typography.body2.fontSize }),
  },
};

export const MuiFormHelperText: Components<Theme>["MuiFormHelperText"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.caption.fontSize,
      marginTop: theme.spacing(0.5),
      marginLeft: theme.spacing(0.5),
    }),
  },
};

export const MuiSelect: Components<Theme>["MuiSelect"] = {
  styleOverrides: {
    icon: ({ theme }) => ({ color: theme.palette.text.secondary }),
  },
};
