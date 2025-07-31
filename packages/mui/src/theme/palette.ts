import { PaletteOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    appBar: Palette["primary"];
    drawer: Palette["primary"];
  }

  interface PaletteOptions {
    appBar?: PaletteOptions["primary"];
    drawer?: PaletteOptions["primary"];
  }
}

export const palette: PaletteOptions = {
  mode: "dark",
  primary: {
    main: "#FF4B4B",
    dark: "#E63946",
    light: "#FF6B6B",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#FF6B35",
    dark: "#E55A2B",
    light: "#FF8A65",
    contrastText: "#FFFFFF",
  },
  background: {
    default: "#1A1A1A",
    paper: "#2D2D2D",
  },

  text: {
    primary: "#FFFFFF",
    secondary: "#CCCCCC",
    disabled: "#999999",
  },
  divider: "rgba(255, 255, 255, 0.12)",
  error: {
    main: "#FF4B4B",
    dark: "#E63946",
    light: "#FF6B6B",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#FFB74D",
    dark: "#F57C00",
    light: "#FFCC80",
    contrastText: "#000000",
  },
  success: {
    main: "#00C851",
    dark: "#00A544",
    light: "#4CAF50",
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#FF6B35",
    dark: "#E55A2B",
    light: "#FF8A65",
    contrastText: "#FFFFFF",
  },
  grey: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
    A100: "#F5F5F5",
    A200: "#EEEEEE",
    A400: "#BDBDBD",
    A700: "#616161",
  },
  appBar: {
    main: "#1A1A1A",
    contrastText: "#FFFFFF",
  },
  drawer: {
    main: "#2D2D2D",
    contrastText: "#FFFFFF",
  },
};
