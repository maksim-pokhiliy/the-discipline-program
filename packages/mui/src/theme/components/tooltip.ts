import { type Components, type Theme } from "@mui/material/styles";

export const MuiTooltip: NonNullable<Components<Theme>["MuiTooltip"]> = {
  styleOverrides: {
    tooltip: ({ theme }) => ({
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.divider}`,
    }),

    arrow: ({ theme }) => ({
      color: theme.palette.background.paper,

      "&::before": {
        border: `1px solid ${theme.palette.divider}`,
      },
    }),
  },
};
