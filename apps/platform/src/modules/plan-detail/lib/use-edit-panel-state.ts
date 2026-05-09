"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { type SaveIndicatorStatus } from "@repo/ui";

export type OpenPanel =
  | { kind: "day"; dayId: string | null; date: Date }
  | { kind: "session"; dayId: string; sessionId: string | null }
  | { kind: "block"; sessionId: string; blockId: string | null };

export type RetryFn = () => void | Promise<void>;
export type LastError = { message: string; retry: RetryFn };
export type SetSaveStatusErrorOptions = { message: string; retry: RetryFn };

export type EditPanelState = {
  open: OpenPanel | null;
  saveStatus: SaveIndicatorStatus;
  lastError: LastError | null;
};

export type EditPanelStateApi = EditPanelState & {
  openPanel: (panel: OpenPanel) => void;
  requestClose: () => void;
  setSaveStatus: (status: SaveIndicatorStatus, errorOptions?: SetSaveStatusErrorOptions) => void;
  retryLast: () => void;
};

const INITIAL_STATUS: SaveIndicatorStatus = "clean";

export const SAVED_FADE_MS = 3000;

export const useEditPanelState = (): EditPanelStateApi => {
  const [open, setOpen] = useState<OpenPanel | null>(null);
  const [saveStatus, setSaveStatusState] = useState<SaveIndicatorStatus>(INITIAL_STATUS);
  const [lastError, setLastError] = useState<LastError | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearFadeTimer, [clearFadeTimer]);

  const openPanel = useCallback(
    (panel: OpenPanel) => {
      clearFadeTimer();
      setOpen(panel);
      setSaveStatusState(INITIAL_STATUS);
      setLastError(null);
    },
    [clearFadeTimer],
  );

  const requestClose = useCallback(() => {
    if (saveStatus === "saving") {
      return;
    }

    clearFadeTimer();
    setOpen(null);
    setSaveStatusState(INITIAL_STATUS);
    setLastError(null);
  }, [saveStatus, clearFadeTimer]);

  const setSaveStatus = useCallback(
    (status: SaveIndicatorStatus, errorOptions?: SetSaveStatusErrorOptions) => {
      clearFadeTimer();
      setSaveStatusState(status);

      if (status === "error") {
        if (errorOptions !== undefined) {
          setLastError({ message: errorOptions.message, retry: errorOptions.retry });
        }

        return;
      }

      setLastError(null);

      if (status === "saved") {
        fadeTimerRef.current = setTimeout(() => {
          fadeTimerRef.current = null;
          setSaveStatusState("clean");
        }, SAVED_FADE_MS);
      }
    },
    [clearFadeTimer],
  );

  const retryLast = useCallback(() => {
    if (lastError === null) {
      return;
    }

    void lastError.retry();
  }, [lastError]);

  return {
    open,
    saveStatus,
    lastError,
    openPanel,
    requestClose,
    setSaveStatus,
    retryLast,
  };
};
