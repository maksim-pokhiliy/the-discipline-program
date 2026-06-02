import type { RowKind, SchemaRowPayload } from "@repo/contracts/lms/schema-row";

import {
  assembleRowPayloadAndNotes,
  parseRowPayload,
  validateRowSiblings,
} from "../../components/row-form-utils";
import { ROW_PAYLOAD_FORM_REGISTRY } from "../../components/row-payload-form-registry";
import type { ComposeRow } from "../compose-tree.types";

import { makeNodeId } from "./id-factory";

const UNCOMMITTED_PAYLOAD: SchemaRowPayload = { rowKind: "REST_SLOT" };

const emptyRow = (rowKind: RowKind, editorDraft: unknown): ComposeRow => ({
  nodeType: "row",
  id: makeNodeId(),
  rowKind,
  rowPayload: UNCOMMITTED_PAYLOAD,
  reps: null,
  load: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
  editorDraft,
});

export const isRowCommitted = (row: ComposeRow): boolean => row.rowPayload.rowKind === row.rowKind;

export const makeRow = (rowKind: RowKind): ComposeRow => {
  const entry = ROW_PAYLOAD_FORM_REGISTRY[rowKind];

  if (entry === undefined) {
    return emptyRow(rowKind, null);
  }

  const editorDraft = entry.defaultValue;
  const assembled = assembleRowPayloadAndNotes(rowKind, editorDraft);
  const payload = parseRowPayload(rowKind, assembled.payloadInput);
  const siblings = validateRowSiblings(assembled.siblings);

  if (!payload.ok || !siblings.ok) {
    return emptyRow(rowKind, editorDraft);
  }

  return {
    nodeType: "row",
    id: makeNodeId(),
    rowKind,
    rowPayload: payload.value,
    reps: siblings.value.reps ?? null,
    load: siblings.value.load ?? null,
    side: siblings.value.side ?? null,
    tempo: siblings.value.tempo ?? null,
    position: siblings.value.position ?? null,
    intensity: siblings.value.intensity ?? null,
    notes: assembled.notes,
    editorDraft,
  };
};
