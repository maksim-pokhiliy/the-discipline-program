import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { standaloneUrlRowFormSchema, toFormData } from "./standalone-url-row-form";

const issuePaths = (data: unknown): string[] => {
  const result = standaloneUrlRowFormSchema.safeParse(data);

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

const standaloneUrlRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "STANDALONE_URL",
  rowPayload: {
    rowKind: "STANDALONE_URL",
    url: "https://youtu.be/abc123",
    wrapped: false,
    appliesTo: "whole_schema",
  },
};

const restSlotRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
};

describe("standaloneUrlRowFormSchema", () => {
  it("accepts a valid url with a valid appliesTo", () => {
    const result = standaloneUrlRowFormSchema.safeParse({
      url: "https://www.youtube.com/watch?v=abc",
      appliesTo: "whole_schema",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a non-url string at path url", () => {
    expect(issuePaths({ url: "not a url", appliesTo: "previous_exercise_row" })).toContain("url");
  });

  it("rejects an empty url at path url", () => {
    expect(issuePaths({ url: "", appliesTo: "previous_exercise_row" })).toContain("url");
  });

  it("rejects an unknown appliesTo at path appliesTo", () => {
    expect(issuePaths({ url: "https://youtu.be/x", appliesTo: "anywhere" })).toContain("appliesTo");
  });

  it("parses a valid object without a wrapped key — wrapped is not a schema key", () => {
    const result = standaloneUrlRowFormSchema.safeParse({
      url: "https://youtu.be/x",
      appliesTo: "previous_exercise_row",
    });

    expect(result.success).toBe(true);
  });
});

describe("toFormData", () => {
  it("returns an empty url and the default appliesTo in create mode", () => {
    const result = toFormData({
      kind: "create",
      schemaId: baseSchemaRow.schemaId,
      rowKind: "STANDALONE_URL",
    });

    expect(result).toEqual({ url: "", appliesTo: "previous_exercise_row" });
  });

  it("returns the row's url and appliesTo without wrapped when editing a STANDALONE_URL row", () => {
    const result = toFormData({ kind: "edit", row: standaloneUrlRow });

    expect(result).toEqual({ url: "https://youtu.be/abc123", appliesTo: "whole_schema" });
    expect(result).not.toHaveProperty("wrapped");
  });

  it("falls back to the create default when editing a non-STANDALONE_URL row", () => {
    const result = toFormData({ kind: "edit", row: restSlotRow });

    expect(result).toEqual({ url: "", appliesTo: "previous_exercise_row" });
  });
});
