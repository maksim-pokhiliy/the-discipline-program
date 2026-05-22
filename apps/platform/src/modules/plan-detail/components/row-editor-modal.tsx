"use client";

import type { RowEditorMode } from "./row-editor-types";
import { ROW_KIND_FORM_REGISTRY } from "./row-kind-form-registry";

type RowEditorModalProps = {
  open: boolean;
  onClose: () => void;
  mode: RowEditorMode;
  planId: string;
  startDate: string;
};

export const RowEditorModal: React.FC<RowEditorModalProps> = ({
  open,
  onClose,
  mode,
  planId,
  startDate,
}) => {
  if (!open) {
    return null;
  }

  const rowKind = mode.kind === "create" ? mode.rowKind : mode.row.rowKind;
  const RowForm = ROW_KIND_FORM_REGISTRY[rowKind];

  if (RowForm === undefined) {
    return null;
  }

  return <RowForm mode={mode} planId={planId} startDate={startDate} onClose={onClose} />;
};
