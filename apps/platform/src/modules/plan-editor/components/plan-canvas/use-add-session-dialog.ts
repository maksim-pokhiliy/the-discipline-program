"use client";

import { useCallback, useState } from "react";

export type UseAddSessionDialogApi = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useAddSessionDialog = (): UseAddSessionDialogApi => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, open, close };
};
