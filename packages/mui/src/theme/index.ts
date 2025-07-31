import { createTheme } from "@mui/material/styles";
import { layout } from "./layout";
import { palette } from "./palette";
import { typography } from "./typography";
import * as components from "./components";

const baseTheme = createTheme({
  layout,
  palette,
});

export const theme = createTheme({
  ...baseTheme,
  components,
  typography: typography(baseTheme),
});
