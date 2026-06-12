"use client";

import { ConfirmationModal } from "@repo/ui";

const TITLE = "Switch repetition kind";
const MESSAGE = "Switching the repetition kind discards the current setup. Continue?";
const CONFIRM_TEXT = "Switch & discard";
const CANCEL_TEXT = "Keep editing";

type KindSwitchConfirmProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const KindSwitchConfirm: React.FC<KindSwitchConfirmProps> = ({
  open,
  onConfirm,
  onCancel,
}) => (
  <ConfirmationModal
    open={open}
    onClose={onCancel}
    title={TITLE}
    type="warning"
    message={MESSAGE}
    confirmText={CONFIRM_TEXT}
    cancelText={CANCEL_TEXT}
    onConfirm={onConfirm}
  />
);
