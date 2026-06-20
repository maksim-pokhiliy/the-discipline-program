import { type Components, type Theme } from "@mui/material/styles";

export const MuiSelect: NonNullable<Components<Theme>["MuiSelect"]> = {
  styleOverrides: {
    icon: ({ theme }) => ({
      color: theme.palette.text.secondary,
      transition: theme.transitions.create("color", {
        duration: theme.transitions.duration.shortest,
      }),
    }),
  },
};
