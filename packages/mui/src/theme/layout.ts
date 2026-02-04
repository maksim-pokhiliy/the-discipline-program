import { LAYOUT } from "@repo/shared";

declare module "@mui/material/styles" {
  interface Theme {
    layout: typeof LAYOUT;
  }

  interface ThemeOptions {
    layout: typeof LAYOUT;
  }
}

export const layout = LAYOUT;
