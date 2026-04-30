import { useEffect } from "react";

import { type EditSessionContextValue } from "./types";
import { useEditSessionOrchestrator } from "./use-edit-session-orchestrator";

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
