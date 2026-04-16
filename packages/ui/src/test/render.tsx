import { type ReactElement, type ReactNode } from "react";

import { ThemeProvider } from "@mui/material/styles";
import {
  render as baseRender,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";

import { theme } from "@repo/mui";

const Wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

export const render = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult =>
  baseRender(ui, { wrapper: Wrapper, ...options });
