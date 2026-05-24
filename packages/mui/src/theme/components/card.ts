import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiCard: NonNullable<Components<Theme>["MuiCard"]> = {
  defaultProps: {
    variant: "outlined",
    elevation: 0,
  },

  styleOverrides: {
    root: ({ ownerState, theme }) => {
      const variant: string | undefined = ownerState.variant;

      return {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: `1px solid ${theme.palette.divider}`,

        ...(variant === "elevation" && {
          backgroundColor: theme.palette.background.default,
        }),

        ...(variant === "outlined" && {
          backgroundColor: theme.palette.background.paper,
        }),

        ...(variant === "accent-dashed" && {
          border: "1px dashed",
          borderColor: alpha(theme.palette.primary.main, 0.4),
          backgroundColor: alpha(theme.palette.primary.main, 0.025),
        }),
      };
    },
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
