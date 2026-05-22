import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { restRowFormSchema, toFormData } from "./rest-row-form";

const issuePaths = (data: unknown): string[] => {
  const result = restRowFormSchema.safeParse(data);

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

const editedRestParsed = {
  duration: { value: 3, unit: "min" },
  scope: "between_rounds",
} as const;

const restRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "REST",
  rowPayload: {
    rowKind: "REST",
    raw: "rest 3 min between rounds",
    parsed: editedRestParsed,
  },
};

const restSlotRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
};

describe("restRowFormSchema", () => {
  it("accepts a valid parsed rest spec", () => {
    const result = restRowFormSchema.safeParse({
      parsed: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
    });

    expect(result.success).toBe(true);
  });

  it("rejects a range_* duration with rangeMax <= value at the duration sub-path", () => {
    const paths = issuePaths({
      parsed: {
        duration: { value: 90, unit: "range_sec", rangeMax: 60 },
        scope: "between_sets",
      },
    });

    expect(paths).toContain("parsed.duration.rangeMax");
  });

  it("rejects a range_* duration with no rangeMax at the duration sub-path", () => {
    const paths = issuePaths({
      parsed: { duration: { value: 90, unit: "range_sec" }, scope: "between_sets" },
    });

    expect(paths).toContain("parsed.duration.rangeMax");
  });

  it("rejects a non-positive duration value at path parsed.duration.value", () => {
    const paths = issuePaths({
      parsed: { duration: { value: 0, unit: "sec" }, scope: "between_sets" },
    });

    expect(paths).toContain("parsed.duration.value");
  });
});

describe("toFormData", () => {
  it("returns the default rest spec in create mode", () => {
    const result = toFormData({
      kind: "create",
      schemaId: baseSchemaRow.schemaId,
      rowKind: "REST",
    });

    expect(result.parsed).toEqual({
      duration: { value: 90, unit: "sec" },
      scope: "between_sets",
    });
  });

  it("returns the row's rowPayload parsed when editing a REST row", () => {
    const result = toFormData({ kind: "edit", row: restRow });

    expect(result.parsed).toEqual(editedRestParsed);
  });

  it("falls back to the default rest spec when editing a non-REST row", () => {
    const result = toFormData({ kind: "edit", row: restSlotRow });

    expect(result.parsed).toEqual({
      duration: { value: 90, unit: "sec" },
      scope: "between_sets",
    });
  });
});
