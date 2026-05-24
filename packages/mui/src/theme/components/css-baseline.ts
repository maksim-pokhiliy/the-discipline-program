import { type Components, type Theme } from "@mui/material/styles";

export const MuiCssBaseline: NonNullable<Components<Theme>["MuiCssBaseline"]> = {
  styleOverrides: (theme) => ({
    html: {
      scrollBehavior: "smooth",
    },
    "*:focus-visible": {
      outline: "2px solid",
      outlineColor: theme.palette.primary.main,
      outlineOffset: "2px",
    },
    "input:focus-visible, textarea:focus-visible, select:focus-visible, [contenteditable]:focus-visible, .MuiInputBase-input:focus-visible":
      {
        outline: "none",
      },
    ".MuiButtonBase-root.Mui-focusVisible": {
      backgroundColor: "transparent",
    },
    "::-webkit-scrollbar": {
      width: 8,
      height: 8,
    },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: theme.palette.divider,
      borderRadius: 9999,
    },
    "::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
  }),
};
