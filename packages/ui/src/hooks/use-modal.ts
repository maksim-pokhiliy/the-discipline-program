"use client";

import { useState, useCallback } from "react";

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useModal = (initialState = false): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

interface UseModalManagerReturn {
  isOpen: (modalId: string) => boolean;
  open: (modalId: string) => void;
  close: (modalId: string) => void;
  toggle: (modalId: string) => void;
  closeAll: () => void;
}

export const useModalManager = (): UseModalManagerReturn => {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const isOpen = useCallback((modalId: string) => openModals.has(modalId), [openModals]);

  const open = useCallback((modalId: string) => {
    setOpenModals((prev) => new Set([...prev, modalId]));
  }, []);

  const close = useCallback((modalId: string) => {
    setOpenModals((prev) => {
      const newSet = new Set(prev);

      newSet.delete(modalId);

      return newSet;
    });
  }, []);

  const toggle = useCallback(
    (modalId: string) => {
      if (isOpen(modalId)) {
        close(modalId);
      } else {
        open(modalId);
      }
    },
    [isOpen, open, close],
  );

  const closeAll = useCallback(() => {
    setOpenModals(new Set());
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    closeAll,
  };
};
