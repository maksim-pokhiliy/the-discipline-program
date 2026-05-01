import { type Components, type Theme } from "@mui/material/styles";

export const MuiAccordion: NonNullable<Components<Theme>["MuiAccordion"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2, 1),
      borderBottom: "none !important",
      border: "none !important",

      "&:before": {
        display: "none",
      },
    }),
  },
};
