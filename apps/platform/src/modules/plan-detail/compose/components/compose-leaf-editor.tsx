"use client";

import { useState } from "react";

import type { FieldErrors } from "react-hook-form";

import {
  assembleRowPayloadAndNotes,
  parseRowPayload,
  validateRowSiblings,
} from "../../components/row-form-utils";
import { RowPayloadFormDispatch } from "../../components/row-payload-form-dispatch";
import type { ComposeNode, ComposeRow, NodeId } from "../compose-tree.types";

type ComposeLeafEditorProps = {
  row: ComposeRow;
  onUpdateNode: (id: NodeId, patch: (node: ComposeNode) => ComposeNode) => void;
};

const draftPatch =
  (nextDraft: unknown) =>
  (node: ComposeNode): ComposeNode =>
    node.nodeType === "row" ? { ...node, editorDraft: nextDraft } : node;

export const ComposeLeafEditor: React.FC<ComposeLeafEditorProps> = ({ row, onUpdateNode }) => {
  const [error, setError] = useState<FieldErrors | undefined>(undefined);

  const handleChange = (nextDraft: unknown): void => {
    const assembled = assembleRowPayloadAndNotes(row.rowKind, nextDraft);
    const parsed = parseRowPayload(row.rowKind, assembled.payloadInput);

    if (!parsed.ok) {
      setError(parsed.error);
      onUpdateNode(row.id, draftPatch(nextDraft));

      return;
    }

    const siblings = validateRowSiblings(assembled.siblings);

    if (!siblings.ok) {
      setError(siblings.error);
      onUpdateNode(row.id, draftPatch(nextDraft));

      return;
    }

    setError(undefined);
    onUpdateNode(row.id, (node) =>
      node.nodeType === "row"
        ? {
            ...node,
            editorDraft: nextDraft,
            rowPayload: parsed.value,
            reps: siblings.value.reps ?? null,
            load: siblings.value.load ?? null,
            side: siblings.value.side ?? null,
            tempo: siblings.value.tempo ?? null,
            position: siblings.value.position ?? null,
            intensity: siblings.value.intensity ?? null,
            notes: assembled.notes,
          }
        : node,
    );
  };

  return (
    <RowPayloadFormDispatch
      rowKind={row.rowKind}
      value={row.editorDraft}
      onChange={handleChange}
      error={error}
    />
  );
};
