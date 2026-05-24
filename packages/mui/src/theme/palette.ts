import { type PaletteOptions } from "@mui/material/styles";

type PaletteKind = {
  ex: string;
  rest: string;
  foot: string;
  load: string;
  url: string;
  placeholder: string;
  ladder: string;
};

declare module "@mui/material/styles" {
  interface TypeText {
    muted: string;
    subtle: string;
    faint: string;
  }

  interface TypeBackground {
    recessed: string;
  }

  interface Palette {
    kind: PaletteKind;
    dividerStrong: string;
  }

  interface PaletteOptions {
    kind?: PaletteKind;
    dividerStrong?: string;
  }
}

const PRIMARY_MAIN = "#E07B35";
const INFO_MAIN = "#6CB4EE";
const WARNING_MAIN = "#E8C844";
const TEXT_PRIMARY = "rgba(255, 255, 255, 0.87)";
const TEXT_SECONDARY = "rgba(255, 255, 255, 0.60)";

export const palette: PaletteOptions = {
  mode: "dark",
  primary: {
    main: PRIMARY_MAIN,
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
    recessed: "#232323",
  },
  text: {
    primary: TEXT_PRIMARY,
    secondary: TEXT_SECONDARY,
    muted: "rgba(255, 255, 255, 0.50)",
    subtle: "rgba(255, 255, 255, 0.42)",
    faint: "rgba(255, 255, 255, 0.28)",
    disabled: "rgba(255, 255, 255, 0.38)",
  },
  action: {
    hover: "rgba(255, 255, 255, 0.04)",
    selected: "rgba(255, 255, 255, 0.08)",
    selectedOpacity: 0.08,
  },
  divider: "rgba(255, 255, 255, 0.12)",
  dividerStrong: "rgba(255, 255, 255, 0.18)",
  error: {
    main: "#E85454",
    contrastText: "#1F1F1F",
  },
  warning: {
    main: WARNING_MAIN,
    contrastText: "#1F1F1F",
  },
  success: {
    main: "#4DB76A",
    contrastText: "#1F1F1F",
  },
  info: {
    main: INFO_MAIN,
    contrastText: "#1F1F1F",
  },
  kind: {
    ex: TEXT_PRIMARY,
    rest: INFO_MAIN,
    foot: WARNING_MAIN,
    load: PRIMARY_MAIN,
    url: TEXT_SECONDARY,
    placeholder: TEXT_SECONDARY,
    ladder: TEXT_SECONDARY,
  },
};
