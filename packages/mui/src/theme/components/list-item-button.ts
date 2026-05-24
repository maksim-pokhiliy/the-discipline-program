import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiListItemButton: NonNullable<Components<Theme>["MuiListItemButton"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(0.75, 1.5),

      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },

      "&.Mui-selected": {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),

        "&:hover": {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
        },
      },

      "&.Mui-focusVisible": {
        backgroundColor: "transparent",
      },
    }),
  },
};
