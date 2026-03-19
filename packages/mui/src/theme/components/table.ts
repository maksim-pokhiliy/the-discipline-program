import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiTableCell: Components<Theme>["MuiTableCell"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(13),
      padding: theme.spacing(1.5, 2),
      borderColor: theme.palette.divider,
    }),

    head: ({ theme }) => ({
      fontWeight: 600,
      fontSize: theme.typography.pxToRem(12),
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      color: theme.palette.text.secondary,
    }),
  },
};

export const MuiTableRow: Components<Theme>["MuiTableRow"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      "&.MuiTableRow-hover:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.03),
      },
    }),
  },
};
