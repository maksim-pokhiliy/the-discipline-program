"use client";

import { useEffect } from "react";

import { useIsMutating } from "@tanstack/react-query";

import { useEditSessionOrchestrator } from "./use-edit-session-orchestrator";

const DIRTY_MESSAGE = "You have unsaved changes. They will be lost if you leave this page.";

export const useBeforeunloadGuard = (): void => {
  const orchestrator = useEditSessionOrchestrator();
  const inFlightMutationCount = useIsMutating();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const dirtyCount = orchestrator?.getDirtySessions().length ?? 0;

      if (dirtyCount === 0 && inFlightMutationCount === 0) {
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
  }, [orchestrator, inFlightMutationCount]);
};
