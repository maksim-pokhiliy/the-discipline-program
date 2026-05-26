"use client";

import { useMemo, useRef, useState } from "react";

import { Button, Menu, MenuItem } from "@mui/material";

import type { RowKind } from "@repo/contracts/lms/schema-row";

import { RowEditorModal } from "./row-editor-modal";
import type { RowEditorMode } from "./row-editor-types";
import { ROW_KIND_FORM_REGISTRY } from "./row-kind-form-registry";

const COACH_ROW_KINDS: RowKind[] = [
  "EXERCISE",
  "REST",
  "FOOTNOTE",
  "STANDALONE_LOAD",
  "STANDALONE_URL",
  "PLACEHOLDER",
  "INNER_LADDER_MARKER",
  "REP_DEFINITION",
];

const ROW_KIND_LABELS: Record<RowKind, string> = {
  EXERCISE: "Exercise",
  REST: "Rest",
  FOOTNOTE: "Footnote",
  STANDALONE_LOAD: "Standalone load",
  STANDALONE_URL: "URL",
  PLACEHOLDER: "Placeholder",
  INNER_LADDER_MARKER: "Inner ladder marker",
  REP_DEFINITION: "Rep definition",
  REST_SLOT: "Rest slot",
};

type AddRowButtonProps = {
  planId: string;
  startDate: string;
  schemaId: string;
};

export const AddRowButton: React.FC<AddRowButtonProps> = ({ planId, startDate, schemaId }) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [pendingRowKind, setPendingRowKind] = useState<RowKind | null>(null);

  const handleSelect = (rowKind: RowKind) => {
    setMenuOpen(false);

    if (ROW_KIND_FORM_REGISTRY[rowKind] === undefined) {
      return;
    }

    setPendingRowKind(rowKind);
  };

  const editorMode = useMemo<RowEditorMode | null>(
    () => (pendingRowKind === null ? null : { kind: "create", schemaId, rowKind: pendingRowKind }),
    [schemaId, pendingRowKind],
  );

  return (
    <>
      <Button
        ref={anchorRef}
        onClick={() => setMenuOpen(true)}
        size="tiny"
        variant="text"
        sx={{ alignSelf: "flex-start" }}
      >
        + Add row
      </Button>

      <Menu anchorEl={anchorRef.current} open={isMenuOpen} onClose={() => setMenuOpen(false)}>
        {COACH_ROW_KINDS.map((rowKind) => (
          <MenuItem key={rowKind} onClick={() => handleSelect(rowKind)}>
            {ROW_KIND_LABELS[rowKind]}
          </MenuItem>
        ))}
      </Menu>

      {editorMode !== null && (
        <RowEditorModal
          open
          onClose={() => setPendingRowKind(null)}
          mode={editorMode}
          planId={planId}
          startDate={startDate}
        />
      )}
    </>
  );
};
