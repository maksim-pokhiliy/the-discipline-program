"use client";

import { ConfirmationModal } from "@repo/ui";

export type DiscardConfirmDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const DiscardConfirmDialog: React.FC<DiscardConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
}) => (
  <ConfirmationModal
    open={open}
    title="Discard changes"
    type="warning"
    message="Discard unsaved changes?"
    confirmText="Discard"
    cancelText="Cancel"
    onConfirm={onConfirm}
    onClose={onCancel}
  />
);
