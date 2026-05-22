import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiTableCell: NonNullable<Components<Theme>["MuiTableCell"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderColor: theme.palette.divider,
      color: theme.palette.text.secondary,
    }),

    head: ({ theme }) => ({
      textTransform: "uppercase",
      color: alpha(theme.palette.text.primary, 0.7),
    }),
  },
};

export const MuiTableRow: NonNullable<Components<Theme>["MuiTableRow"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      "&.MuiTableRow-hover:hover": {
        backgroundColor: theme.palette.action.hover,
      },
    }),
  },
};
