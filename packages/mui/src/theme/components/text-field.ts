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
        borderColor: alpha(theme.palette.common.white, 0.2),
      },

      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderWidth: 1,
      },
    }),

    input: ({ theme }) => ({
      fontSize: theme.typography.body1.fontSize,

      "&:not(.MuiInputBase-inputMultiline)": {
        paddingTop: theme.spacing(1.25),
        paddingBottom: theme.spacing(1.25),
      },

      "&:not(.MuiInputBase-inputMultiline, .MuiInputBase-inputAdornedStart)": {
        paddingLeft: theme.spacing(1.5),
      },

      "&:not(.MuiInputBase-inputMultiline, .MuiInputBase-inputAdornedEnd)": {
        paddingRight: theme.spacing(1.5),
      },
    }),

    sizeSmall: ({ theme }) => ({
      "& .MuiOutlinedInput-input": { fontSize: theme.typography.body2.fontSize },
    }),
  },
};

export const MuiFilledInput: NonNullable<Components<Theme>["MuiFilledInput"]> = {
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

    input: ({ theme }) => ({ fontSize: theme.typography.body1.fontSize }),

    sizeSmall: ({ theme }) => ({
      "& .MuiInput-input": { fontSize: theme.typography.body2.fontSize },
    }),
  },
};

export const MuiInputLabel: NonNullable<Components<Theme>["MuiInputLabel"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.body1.fontSize,
      color: theme.palette.text.secondary,
    }),

    sizeSmall: ({ theme }) => ({ fontSize: theme.typography.body2.fontSize }),

    outlined: {
      transform: "translate(12px, 10px) scale(1)",

      "&.MuiInputLabel-shrink": {
        transform: "translate(12px, -9px) scale(0.75)",
      },
    },
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
    select: ({ theme }) => ({
      "&.MuiInputBase-inputSizeSmall": {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
      },
    }),
    icon: ({ theme }) => ({ color: theme.palette.text.secondary }),
  },
};
