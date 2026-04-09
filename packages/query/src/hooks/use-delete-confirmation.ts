"use client";

import { useCallback, useRef, useState } from "react";

import { type UseMutationResult } from "@tanstack/react-query";

type UseDeleteConfirmationOptions = {
  deleteMutation: UseMutationResult<void, Error, string>;
};

type UseDeleteConfirmationReturn = {
  deleteId: string | null;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
  isDeleting: boolean;
};

export const useDeleteConfirmation = ({
  deleteMutation,
}: UseDeleteConfirmationOptions): UseDeleteConfirmationReturn => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const mutationRef = useRef(deleteMutation);

  mutationRef.current = deleteMutation;

  const requestDelete = useCallback((id: string) => setDeleteId(id), []);
  const cancelDelete = useCallback(() => setDeleteId(null), []);

  const confirmDelete = useCallback(() => {
    if (deleteId) {
      mutationRef.current.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  }, [deleteId]);

  return {
    deleteId,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting: deleteMutation.isPending,
  };
};
