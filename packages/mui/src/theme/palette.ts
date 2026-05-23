import { type PaletteOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypeText {
    muted: string;
  }
}

export const palette: PaletteOptions = {
  mode: "dark",
  primary: {
    main: "#E07B35",
    dark: "#c96b2c",
    contrastText: "#1F1F1F",
  },
  secondary: {
    main: "#7A8FA6",
    dark: "#69819b",
    contrastText: "#1F1F1F",
  },
  background: {
    default: "#191919",
    paper: "#1F1F1F",
  },
  text: {
    primary: "rgba(255, 255, 255, 0.87)",
    secondary: "rgba(255, 255, 255, 0.60)",
    muted: "rgba(255, 255, 255, 0.50)",
    disabled: "rgba(255, 255, 255, 0.38)",
  },
  action: {
    hover: "rgba(255, 255, 255, 0.04)",
    selected: "rgba(255, 255, 255, 0.08)",
    selectedOpacity: 0.08,
  },
  divider: "rgba(255, 255, 255, 0.12)",
  error: {
    main: "#E85454",
    contrastText: "#1F1F1F",
  },
  warning: {
    main: "#E8C844",
    contrastText: "#1F1F1F",
  },
  success: {
    main: "#4DB76A",
    contrastText: "#1F1F1F",
  },
  info: {
    main: "#6CB4EE",
    contrastText: "#1F1F1F",
  },
};
