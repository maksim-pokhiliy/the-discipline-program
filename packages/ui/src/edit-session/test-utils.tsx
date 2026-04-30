import { type ReactNode } from "react";

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { EditSessionProvider } from "./edit-session-provider";

export { OrchestratorProbe, type OrchestratorProbeProps } from "./orchestrator-probe";
export { TestCard, type TestCardProps, type TestDraft, testDraftSchema } from "./test-card";

export const buildOrchestratorWrapper = (
  queryClient: QueryClient,
  providerProps: { onConcurrentRouteChangeFlush?: () => void } = {},
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <EditSessionProvider {...providerProps}>{children}</EditSessionProvider>
    </QueryClientProvider>
  );

  Wrapper.displayName = "OrchestratorTestWrapper";

  return Wrapper;
};
