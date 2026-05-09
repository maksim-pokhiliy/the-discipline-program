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
  isDirty: boolean;
  saveStatus: SaveIndicatorStatus;
  pendingClose: boolean;
  lastError: LastError | null;
};

export type EditPanelStateApi = EditPanelState & {
  openPanel: (panel: OpenPanel) => void;
  requestClose: () => void;
  confirmDiscard: () => void;
  cancelDiscard: () => void;
  markDirty: (isDirty: boolean) => void;
  setSaveStatus: (status: SaveIndicatorStatus, errorOptions?: SetSaveStatusErrorOptions) => void;
  retryLast: () => void;
};

const INITIAL_STATUS: SaveIndicatorStatus = "clean";

export const SAVED_FADE_MS = 3000;

export const useEditPanelState = (): EditPanelStateApi => {
  const [open, setOpen] = useState<OpenPanel | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [saveStatus, setSaveStatusState] = useState<SaveIndicatorStatus>(INITIAL_STATUS);
  const [pendingClose, setPendingClose] = useState<boolean>(false);
  const [pendingPanel, setPendingPanel] = useState<OpenPanel | null>(null);
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
      if (open !== null && isDirty) {
        setPendingPanel(panel);
        setPendingClose(true);

        return;
      }

      clearFadeTimer();
      setOpen(panel);
      setIsDirty(false);
      setSaveStatusState(INITIAL_STATUS);
      setLastError(null);
    },
    [open, isDirty, clearFadeTimer],
  );

  const requestClose = useCallback(() => {
    if (isDirty) {
      setPendingClose(true);

      return;
    }

    clearFadeTimer();
    setOpen(null);
    setSaveStatusState(INITIAL_STATUS);
    setLastError(null);
  }, [isDirty, clearFadeTimer]);

  const confirmDiscard = useCallback(() => {
    clearFadeTimer();
    setIsDirty(false);
    setPendingClose(false);
    setLastError(null);

    if (pendingPanel !== null) {
      setOpen(pendingPanel);
      setPendingPanel(null);
      setSaveStatusState(INITIAL_STATUS);

      return;
    }

    setOpen(null);
    setSaveStatusState(INITIAL_STATUS);
  }, [pendingPanel, clearFadeTimer]);

  const cancelDiscard = useCallback(() => {
    setPendingClose(false);
    setPendingPanel(null);
  }, []);

  const markDirty = useCallback((next: boolean) => {
    setIsDirty(next);
  }, []);

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
    isDirty,
    saveStatus,
    pendingClose,
    lastError,
    openPanel,
    requestClose,
    confirmDiscard,
    cancelDiscard,
    markDirty,
    setSaveStatus,
    retryLast,
  };
};
