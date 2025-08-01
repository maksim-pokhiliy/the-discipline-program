"use client";

import { Program } from "@repo/api";
import { ConfirmationModal } from "@repo/ui";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  program: Program | null;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  error?: string | null;
}

export const DeleteConfirmationModal = ({
  open,
  onClose,
  program,
  onConfirm,
  isDeleting = false,
  error,
}: DeleteConfirmationModalProps) => {
  if (!program) return null;

  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      title="Delete Program"
      type="danger"
      message={`Are you sure you want to delete "${program.name}"?`}
      details="This action cannot be undone. The program will be permanently removed from the system."
      onConfirm={onConfirm}
      confirmText="Delete Program"
      isConfirming={isDeleting}
      error={error}
    />
  );
};
