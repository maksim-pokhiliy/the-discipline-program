import { type Components, type Theme } from "@mui/material/styles";

export const MuiTooltip: Components<Theme>["MuiTooltip"] = {
  styleOverrides: {
    tooltip: ({ theme }) => ({
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.divider}`,
      fontSize: theme.typography.pxToRem(13),
      padding: theme.spacing(0.5, 1.25),
      borderRadius: theme.shape.borderRadius,
    }),

    arrow: ({ theme }) => ({
      color: theme.palette.background.paper,
      "&::before": {
        border: `1px solid ${theme.palette.divider}`,
      },
    }),
  },
};
