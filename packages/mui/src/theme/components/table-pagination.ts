import { type Components, type Theme } from "@mui/material/styles";

export const MuiTablePagination: Components<Theme>["MuiTablePagination"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderTop: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.secondary,
    }),

    selectIcon: ({ theme }) => ({
      color: theme.palette.text.secondary,
    }),

    actions: ({ theme }) => ({
      color: theme.palette.text.secondary,

      "& .MuiIconButton-root.Mui-disabled": {
        color: theme.palette.text.disabled,
      },
    }),
  },
};
