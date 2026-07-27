import { type ReactElement, type ReactNode, useState } from "react";

import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render as baseRender,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";

import { theme } from "@repo/mui";

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const Wrapper = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(createTestQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
};

export const render = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult =>
  baseRender(ui, { wrapper: Wrapper, ...options });
