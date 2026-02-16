"use client";

import { useState } from "react";

import { type UseMutationResult } from "@tanstack/react-query";

interface UseDeleteConfirmationOptions {
  deleteMutation: UseMutationResult<void, Error, string>;
}

interface UseDeleteConfirmationReturn {
  deleteId: string | null;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
  isDeleting: boolean;
}

export const useDeleteConfirmation = ({
  deleteMutation,
}: UseDeleteConfirmationOptions): UseDeleteConfirmationReturn => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const requestDelete = (id: string) => setDeleteId(id);
  const cancelDelete = () => setDeleteId(null);

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  return {
    deleteId,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting: deleteMutation.isPending,
  };
};
