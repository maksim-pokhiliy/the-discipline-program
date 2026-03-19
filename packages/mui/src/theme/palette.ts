import { type PaletteOptions } from "@mui/material/styles";

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
    main: "#EB5757",
    dark: "#D44444",
    light: "#F07070",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#E8A838",
    dark: "#D49530",
    light: "#F0BC5E",
    contrastText: "#000000",
  },
  background: {
    default: "#191919",
    paper: "#252525",
  },

  text: {
    primary: "rgba(255, 255, 255, 0.81)",
    secondary: "rgba(255, 255, 255, 0.50)",
    disabled: "rgba(255, 255, 255, 0.28)",
  },
  divider: "rgba(255, 255, 255, 0.08)",
  error: {
    main: "#EB5757",
    dark: "#D44444",
    light: "#F07070",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#F0B449",
    dark: "#D9A03C",
    light: "#F5C76E",
    contrastText: "#000000",
  },
  success: {
    main: "#4DB76A",
    dark: "#3FA058",
    light: "#6CC882",
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#6CB4EE",
    dark: "#529BD6",
    light: "#8CC7F4",
    contrastText: "#000000",
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
    main: "#191919",
    contrastText: "#FFFFFF",
  },
  drawer: {
    main: "#202020",
    contrastText: "#FFFFFF",
  },
};
