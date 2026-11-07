import { type ReactElement } from "react";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";
import { ConfirmationModal } from "@repo/ui";

import { deleteRefusalOf } from "./delete-refusal";

type DeleteLanguageModalProps = {
  language: AdminLocaleListItem | undefined;
  error: Error | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const DeleteLanguageModal = ({
  language,
  error,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteLanguageModalProps): ReactElement => (
  <ConfirmationModal
    open={language !== undefined}
    title="Delete Language"
    message="Are you sure you want to delete this language?"
    details="This action cannot be undone."
    confirmText="Delete"
    type="danger"
    isConfirming={isDeleting}
    error={(language ? deleteRefusalOf(error, language) : null) ?? error?.message ?? null}
    onConfirm={onConfirm}
    onClose={onClose}
  />
);
