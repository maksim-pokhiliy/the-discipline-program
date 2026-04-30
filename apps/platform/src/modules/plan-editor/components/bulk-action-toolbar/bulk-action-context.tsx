"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type BulkDialogId =
  | "none"
  | "replace"
  | "suspend"
  | "unsuspend"
  | "delete"
  | "clone-day"
  | "repeat-weeks"
  | "shift-weeks";

export type BulkActionContextValue = {
  dialog: BulkDialogId;
  openDialog: (id: BulkDialogId) => void;
  closeDialog: () => void;
};

const BulkActionContext = createContext<BulkActionContextValue | null>(null);

export type BulkActionProviderProps = {
  children: ReactNode;
};

export const BulkActionProvider = ({ children }: BulkActionProviderProps) => {
  const [dialog, setDialog] = useState<BulkDialogId>("none");

  const openDialog = useCallback((id: BulkDialogId) => {
    setDialog(id);
  }, []);

  const closeDialog = useCallback(() => {
    setDialog("none");
  }, []);

  const value = useMemo<BulkActionContextValue>(
    () => ({ dialog, openDialog, closeDialog }),
    [closeDialog, dialog, openDialog],
  );

  return <BulkActionContext.Provider value={value}>{children}</BulkActionContext.Provider>;
};

export const useBulkActionContext = (): BulkActionContextValue => {
  const ctx = useContext(BulkActionContext);

  if (!ctx) {
    throw new Error("useBulkActionContext must be used inside <BulkActionProvider>");
  }

  return ctx;
};
