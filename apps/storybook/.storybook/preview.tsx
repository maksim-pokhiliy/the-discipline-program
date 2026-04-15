import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { Preview } from "@storybook/nextjs-vite";

import { theme } from "@repo/mui";

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
