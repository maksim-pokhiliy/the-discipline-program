import { useEffect, useState, type ReactNode } from "react";

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { z } from "zod";

import { EditSessionProvider } from "./edit-session-provider";
import { type EditSessionContextValue } from "./types";
import { useEditSession } from "./use-edit-session";
import { useEditSessionOrchestrator } from "./use-edit-session-orchestrator";

export type TestDraft = { value: string; version?: number };

export const testDraftSchema = z.object({
  value: z.string().min(1),
  version: z.number().optional(),
});

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

export type TestCardProps = {
  sessionId: string;
  initial: TestDraft;
  mutationFn: (draft: TestDraft, version: number) => Promise<TestDraft>;
  expectedVersion?: number;
  label?: string;
  dispatchValue?: string;
  shouldDispatch?: boolean;
};

export const TestCard = ({
  sessionId,
  initial,
  mutationFn,
  expectedVersion = 1,
  label,
  dispatchValue,
  shouldDispatch = false,
}: TestCardProps) => {
  const session = useEditSession<TestDraft>({
    sessionId,
    initial,
    expectedVersion,
    label,
    validate: (draft) => testDraftSchema.safeParse(draft),
    mutationKey: ["card-test", sessionId],
    mutationFn,
  });

  const [didDispatch, setDidDispatch] = useState(false);

  useEffect(() => {
    if (shouldDispatch && !didDispatch) {
      setDidDispatch(true);
      session.dispatch({ value: dispatchValue ?? "" });
    }
  }, [didDispatch, dispatchValue, session, shouldDispatch]);

  return (
    <div>
      <input
        data-testid={`input-${sessionId}`}
        data-edit-session-id={sessionId}
        value={session.draft.value}
        onChange={(event) => session.dispatch({ value: event.target.value })}
      />
      <span data-testid={`status-${sessionId}`}>{session.status}</span>
    </div>
  );
};

export type OrchestratorProbeProps = {
  onReady: (orchestrator: EditSessionContextValue) => void;
};

export const OrchestratorProbe = ({ onReady }: OrchestratorProbeProps) => {
  const orchestrator = useEditSessionOrchestrator();

  useEffect(() => {
    if (orchestrator) {
      onReady(orchestrator);
    }
  }, [onReady, orchestrator]);

  return null;
};
