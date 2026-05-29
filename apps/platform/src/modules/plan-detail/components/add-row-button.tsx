"use client";

import { useMemo, useState } from "react";

import { Button } from "@mui/material";

import type { RowKind } from "@repo/contracts/lms/schema-row";

import { RowEditorModal } from "./row-editor-modal";
import type { RowEditorMode } from "./row-editor-types";
import { RowKindPicker } from "./row-kind-picker";
import { ROW_PAYLOAD_FORM_REGISTRY } from "./row-payload-form-registry";

type AddRowButtonProps = {
  planId: string;
  startDate: string;
  schemaId: string;
};

export const AddRowButton: React.FC<AddRowButtonProps> = ({ planId, startDate, schemaId }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingRowKind, setPendingRowKind] = useState<RowKind | null>(null);

  const handleSelect = (rowKind: RowKind) => {
    setPickerOpen(false);

    if (ROW_PAYLOAD_FORM_REGISTRY[rowKind] === undefined) {
      return;
    }

    setPendingRowKind(rowKind);
  };

  const handleBack = () => {
    setPendingRowKind(null);
    setPickerOpen(true);
  };

  const editorMode = useMemo<RowEditorMode | null>(
    () => (pendingRowKind === null ? null : { kind: "create", schemaId, rowKind: pendingRowKind }),
    [schemaId, pendingRowKind],
  );

  return (
    <>
      <Button
        onClick={() => setPickerOpen(true)}
        size="tiny"
        variant="text"
        sx={{ alignSelf: "flex-start" }}
      >
        + Add row
      </Button>

      <RowKindPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />

      {editorMode !== null && (
        <RowEditorModal
          open
          onClose={() => setPendingRowKind(null)}
          mode={editorMode}
          planId={planId}
          startDate={startDate}
          onBack={handleBack}
        />
      )}
    </>
  );
};
