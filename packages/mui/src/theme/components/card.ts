import { alpha, type Components, type Theme } from "@mui/material/styles";

declare module "@mui/material/Paper" {
  interface PaperPropsVariantOverrides {
    "accent-dashed": true;
  }
}

export const MuiCard: NonNullable<Components<Theme>["MuiCard"]> = {
  defaultProps: {
    variant: "outlined",
    elevation: 0,
  },

  styleOverrides: {
    root: ({ ownerState, theme }) => ({
      display: "flex",
      flexDirection: "column",
      height: "100%",
      border: `1px solid ${theme.palette.divider}`,
      transition: theme.transitions.create(["border-color", "background-color", "transform"], {
        duration: theme.transitions.duration.shortest,
      }),

      "&:has(.MuiCardActionArea-root:active)": {
        transform: "translateY(1px)",
      },

      ...(ownerState.variant === "elevation" && {
        backgroundColor: theme.palette.background.default,
      }),

      ...(ownerState.variant === "outlined" && {
        backgroundColor: theme.palette.background.paper,

        "&:has(.MuiCardActionArea-root:hover)": {
          borderColor: theme.palette.dividerStrong,
          backgroundColor: theme.palette.background.recessed,
        },
      }),

      ...(ownerState.variant === "accent-dashed" && {
        border: "1px dashed",
        borderColor: alpha(theme.palette.primary.main, 0.4),
        backgroundColor: alpha(theme.palette.primary.main, 0.025),
        height: "auto",

        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.6),
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
        },
      }),
    }),
  },
};

export const MuiCardContent: NonNullable<Components<Theme>["MuiCardContent"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
      padding: theme.spacing(2),

      "&:last-of-type": {
        padding: theme.spacing(2),
      },
    }),
  },
};

export const MuiCardActionArea: NonNullable<Components<Theme>["MuiCardActionArea"]> = {
  styleOverrides: {
    root: {
      "&:hover .MuiCardActionArea-focusHighlight": {
        opacity: 0.025,
      },
    },
  },
};

export const MuiCardActions: NonNullable<Components<Theme>["MuiCardActions"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2),
    }),
  },
};
