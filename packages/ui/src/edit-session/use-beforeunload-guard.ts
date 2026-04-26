"use client";

import { useEffect } from "react";

import { useEditSessionOrchestrator } from "./use-edit-session-orchestrator";

const DIRTY_MESSAGE = "You have unsaved changes. They will be lost if you leave this page.";

export const useBeforeunloadGuard = (): void => {
  const orchestrator = useEditSessionOrchestrator();

  useEffect(() => {
    if (typeof window === "undefined" || !orchestrator) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const dirty = orchestrator.getDirtySessions();

      if (dirty.length === 0) {
        return undefined;
      }

      event.preventDefault();
      event.returnValue = DIRTY_MESSAGE;

      return DIRTY_MESSAGE;
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [orchestrator]);
};
