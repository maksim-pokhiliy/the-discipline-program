import type { FieldError } from "react-hook-form";
import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { toInnerLadderMarkerValue } from "./inner-ladder-marker-row-payload-form";
import { parseRowPayload } from "./row-form-utils";

const isFieldError = (node: unknown): node is FieldError =>
  typeof node === "object" && node !== null && "message" in node;

const readMessage = (node: unknown): string | undefined => {
  if (isFieldError(node) && typeof node.message === "string") {
    return node.message;
  }

  return undefined;
};

const readBranch = (node: unknown, key: string): unknown =>
  typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined;

const baseSchemaRow = {
  id: "ckxw5p7gp0000q1mnzv5cuq0a",
  schemaId: "ckxw5p7gp0000q1mnzv5cuq0b",
  order: 1,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  position: null,
  sequence: null,
  intensity: null,
  media: null,
  compoundRep: null,
  notes: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} as const;

const innerLadderMarkerRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "INNER_LADDER_MARKER",
  rowPayload: { rowKind: "INNER_LADDER_MARKER", steps: [36, 28, 20] },
};

const restSlotRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
};

describe("parseRowPayload for INNER_LADDER_MARKER", () => {
  it("accepts a descending ladder", () => {
    const result = parseRowPayload("INNER_LADDER_MARKER", { steps: [21, 15, 9] });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({ rowKind: "INNER_LADDER_MARKER", steps: [21, 15, 9] });
    }
  });

  it("accepts a single-step array", () => {
    expect(parseRowPayload("INNER_LADDER_MARKER", { steps: [21] }).ok).toBe(true);
  });

  it("accepts repeated steps — the vertex-pyramid case, no de-dup", () => {
    expect(parseRowPayload("INNER_LADDER_MARKER", { steps: [11, 9, 7, 9, 11] }).ok).toBe(true);
  });

  it("rejects an empty steps array at the steps root", () => {
    const result = parseRowPayload("INNER_LADDER_MARKER", { steps: [] });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.steps, "root"))).toBeDefined();
    }
  });

  it("rejects a non-integer step", () => {
    expect(parseRowPayload("INNER_LADDER_MARKER", { steps: [21, 15.5, 9] }).ok).toBe(false);
  });

  it("rejects a zero step", () => {
    expect(parseRowPayload("INNER_LADDER_MARKER", { steps: [21, 0, 9] }).ok).toBe(false);
  });

  it("rejects a negative step", () => {
    expect(parseRowPayload("INNER_LADDER_MARKER", { steps: [21, -15, 9] }).ok).toBe(false);
  });
});

describe("toInnerLadderMarkerValue", () => {
  it("returns the default single step in create mode", () => {
    const result = toInnerLadderMarkerValue({
      kind: "create",
      schemaId: baseSchemaRow.schemaId,
      rowKind: "INNER_LADDER_MARKER",
    });

    expect(result.steps).toEqual([21]);
  });

  it("returns the row's steps when editing an INNER_LADDER_MARKER row", () => {
    const result = toInnerLadderMarkerValue({ kind: "edit", row: innerLadderMarkerRow });

    expect(result.steps).toEqual([36, 28, 20]);
  });

  it("falls back to the default step when editing a non-INNER_LADDER_MARKER row", () => {
    const result = toInnerLadderMarkerValue({ kind: "edit", row: restSlotRow });

    expect(result.steps).toEqual([21]);
  });
});
