"use client";

import { useCallback, useState } from "react";

import { type SaveIndicatorStatus } from "@repo/ui";

export type OpenPanel =
  | { kind: "day"; dayId: string | null; date: Date }
  | { kind: "session"; dayId: string; sessionId: string | null }
  | { kind: "block"; sessionId: string; blockId: string | null };

export type LastError = { message: string };

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
  setSaveStatus: (status: SaveIndicatorStatus, error?: Error) => void;
  retryLast: () => void;
};

const INITIAL_STATUS: SaveIndicatorStatus = "clean";

export const useEditPanelState = (): EditPanelStateApi => {
  const [open, setOpen] = useState<OpenPanel | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [saveStatus, setSaveStatusState] = useState<SaveIndicatorStatus>(INITIAL_STATUS);
  const [pendingClose, setPendingClose] = useState<boolean>(false);
  const [pendingPanel, setPendingPanel] = useState<OpenPanel | null>(null);
  const [lastError, setLastError] = useState<LastError | null>(null);

  const openPanel = useCallback(
    (panel: OpenPanel) => {
      if (open !== null && isDirty) {
        setPendingPanel(panel);
        setPendingClose(true);

        return;
      }

      setOpen(panel);
      setIsDirty(false);
      setSaveStatusState(INITIAL_STATUS);
      setLastError(null);
    },
    [open, isDirty],
  );

  const requestClose = useCallback(() => {
    if (isDirty) {
      setPendingClose(true);

      return;
    }

    setOpen(null);
    setSaveStatusState(INITIAL_STATUS);
    setLastError(null);
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
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
  }, [pendingPanel]);

  const cancelDiscard = useCallback(() => {
    setPendingClose(false);
    setPendingPanel(null);
  }, []);

  const markDirty = useCallback((next: boolean) => {
    setIsDirty(next);
  }, []);

  const setSaveStatus = useCallback((status: SaveIndicatorStatus, error?: Error) => {
    setSaveStatusState(status);

    if (status === "error" && error !== undefined) {
      setLastError({ message: error.message });

      return;
    }

    if (status !== "error") {
      setLastError(null);
    }
  }, []);

  const retryLast = useCallback(() => {}, []);

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
