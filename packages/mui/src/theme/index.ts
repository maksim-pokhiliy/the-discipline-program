import { createTheme } from "@mui/material/styles";

import * as components from "./components";
import { layout } from "./layout";
import { palette } from "./palette";
import { typography } from "./typography";

const baseTheme = createTheme({
  layout,
  palette,
});

export const theme = createTheme({
  ...baseTheme,
  components,
  typography: typography(baseTheme),
});
