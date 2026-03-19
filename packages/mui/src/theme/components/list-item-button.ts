import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiListItemButton: Components<Theme>["MuiListItemButton"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
      padding: theme.spacing(0.75, 1.5),
      transition: theme.transitions.create(["background-color"], {
        duration: theme.transitions.duration.short,
      }),

      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.04),
      },

      "&.Mui-selected": {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),

        "&:hover": {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
        },
      },
    }),
  },
};
