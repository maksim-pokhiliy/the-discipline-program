import type { RowKind } from "@repo/contracts/lms/schema-row";

import {
  assembleRowPayloadAndNotes,
  parseRowPayload,
  validateRowSiblings,
} from "../../components/row-form-utils";
import { asNodeId } from "../../lib/axis-draft-id";
import type { ComposeRow, NodeId } from "../compose-tree.types";

const CUID_BODY_LENGTH = 24;
const CUID_PAD_CHAR = "0";

export const cuidFromSeed = (seed: string): string => {
  const body = seed
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .padEnd(CUID_BODY_LENGTH, CUID_PAD_CHAR)
    .slice(0, CUID_BODY_LENGTH);

  return `c${body}`;
};

export const exerciseCuid = (canonicalName: string): string =>
  cuidFromSeed(`exercise::${canonicalName}`);

const describeErrors = (idSeed: string, rowKind: RowKind, error: unknown): string =>
  `compose seed row "${idSeed}" (${rowKind}) failed to parse: ${JSON.stringify(error)}`;

export const buildSeedRow = (
  idSeed: string,
  rowKind: RowKind,
  editorDraft: unknown,
): ComposeRow => {
  const assembled = assembleRowPayloadAndNotes(rowKind, editorDraft);
  const payload = parseRowPayload(rowKind, assembled.payloadInput);

  if (!payload.ok) {
    throw new Error(describeErrors(idSeed, rowKind, payload.error));
  }

  const siblings = validateRowSiblings(assembled.siblings);

  if (!siblings.ok) {
    throw new Error(describeErrors(idSeed, rowKind, siblings.error));
  }

  return {
    nodeType: "row",
    id: asNodeId(idSeed),
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

export const seedNodeId = (seed: string): NodeId => asNodeId(seed);
