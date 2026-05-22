import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { innerLadderMarkerRowFormSchema, toFormData } from "./inner-ladder-marker-row-form";

const issuePaths = (data: unknown): string[] => {
  const result = innerLadderMarkerRowFormSchema.safeParse(data);

  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.path.join("."));
};

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

describe("innerLadderMarkerRowFormSchema", () => {
  it("rejects an empty steps array at path steps", () => {
    expect(issuePaths({ steps: [] })).toContain("steps");
  });

  it("accepts a single-step array", () => {
    expect(innerLadderMarkerRowFormSchema.safeParse({ steps: [21] }).success).toBe(true);
  });

  it("rejects a non-integer step", () => {
    expect(innerLadderMarkerRowFormSchema.safeParse({ steps: [21, 15.5, 9] }).success).toBe(false);
  });

  it("rejects a zero step", () => {
    expect(innerLadderMarkerRowFormSchema.safeParse({ steps: [21, 0, 9] }).success).toBe(false);
  });

  it("rejects a negative step", () => {
    expect(innerLadderMarkerRowFormSchema.safeParse({ steps: [21, -15, 9] }).success).toBe(false);
  });

  it("accepts repeated steps — the vertex-pyramid case, no de-dup", () => {
    expect(innerLadderMarkerRowFormSchema.safeParse({ steps: [11, 9, 7, 9, 11] }).success).toBe(
      true,
    );
  });
});

describe("toFormData", () => {
  it("returns the default single step in create mode", () => {
    const result = toFormData({
      kind: "create",
      schemaId: baseSchemaRow.schemaId,
      rowKind: "INNER_LADDER_MARKER",
    });

    expect(result.steps).toEqual([21]);
  });

  it("returns the row's steps when editing an INNER_LADDER_MARKER row", () => {
    const result = toFormData({ kind: "edit", row: innerLadderMarkerRow });

    expect(result.steps).toEqual([36, 28, 20]);
  });

  it("falls back to the default step when editing a non-INNER_LADDER_MARKER row", () => {
    const result = toFormData({ kind: "edit", row: restSlotRow });

    expect(result.steps).toEqual([21]);
  });
});
