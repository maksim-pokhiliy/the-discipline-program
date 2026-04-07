import { type Shadows, createTheme } from "@mui/material/styles";

import * as components from "./components";
import { layout } from "./layout";
import { palette } from "./palette";
import { typography } from "./typography";

const shadows = Array(25).fill("none") as Shadows;

const baseTheme = createTheme({
  layout,
  palette,
  shape: { borderRadius: 4 },
  mixins: { toolbar: { height: layout.adminHeaderHeight } },
  shadows,
});

export const theme = createTheme({
  ...baseTheme,
  components,
  typography: typography(baseTheme),
});
