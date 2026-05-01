import { type Components, type Theme } from "@mui/material/styles";

export const MuiBadge: NonNullable<Components<Theme>["MuiBadge"]> = {
  styleOverrides: {
    standard: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(11),

      minWidth: 18,
      height: 18,
      padding: theme.spacing(0, 0.5),
    }),

    dot: {
      minWidth: 8,
      height: 8,
    },
  },
};
